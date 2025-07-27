const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');

dotenv.config();

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();

// Helmet with relaxed Content-Security-Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'", process.env.CLIENT_URL],
        "img-src": ["'self'", "http://localhost:4040", "data:", "blob:"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'", "ws://localhost:4040", "http://localhost:4040"],
        "media-src": ["'self'", "http://localhost:4040"],
      },
    },
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/favicon.ico', (req, res) => res.status(204));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) return reject(err);
        resolve(userData);
      });
    } else {
      reject('No token');
    }
  });
}

// Routes
app.get('/test', (req, res) => res.json('test ok'));

app.get('/people', async (req, res) => {
  const users = await User.find({}, { '_id': 1, username: 1 });
  res.json(users);
});

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json('no token');
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({ username, password: hashedPassword });
    jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, {
        sameSite: 'none',
        secure: true,
      }).status(201).json({ id: createdUser._id });
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
        res.cookie('token', token, {
          sameSite: 'none',
          secure: true,
        }).json({ id: foundUser._id });
      });
    } else {
      res.status(401).json('Invalid credentials');
    }
  } else {
    res.status(404).json('User not found');
  }
});

app.post('/logout', (req, res) => {
  res.cookie('token', '', {
    sameSite: 'none',
    secure: true,
  }).json('ok');
});

const server = app.listen(4040, () => {
  console.log('✅ Server running on http://localhost:4040');
});

// WebSocket Setup
const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({
          userId: c.userId,
          username: c.username,
        })),
      }));
    });
  }

  connection.isAlive = true;
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
    }, 1000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookie = cookies.split(';').find(str => str.startsWith('token='));
    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on('message', async (message) => {
  let messageData;
  try {
    messageData = JSON.parse(message.toString());
  } catch (err) {
    console.error('❌ Invalid JSON:', message.toString());
    return;
  }

  const { recipient, text, file, type, isTyping, to, from, username } = messageData;

  // ✅ Handle typing event
  if (type === 'typing' && to) {
    [...wss.clients]
      .filter(c => c.userId === to)
      .forEach(c =>
        c.send(JSON.stringify({
          type: 'typing',
          from,
          username,
        }))
      );
    return;
  }

  // ✅ Handle stop-typing event
  if (type === 'stop-typing' && to) {
    [...wss.clients]
      .filter(c => c.userId === to)
      .forEach(c =>
        c.send(JSON.stringify({
          type: 'stop-typing',
          from,
        }))
      );
    return;
  }

  // ✅ File saving logic
  let filename = null;
  if (file?.data && file?.name) {
    try {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.' + ext;
      const filePath = path.join(__dirname, 'uploads', filename);
      const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
      fs.writeFile(filePath, bufferData, () => {
        console.log('📁 File saved:', filePath);
      });
    } catch (err) {
      console.error('❌ File saving error:', err);
    }
  }

  // ✅ Save and send chat message
  if (recipient && (text || file)) {
    try {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });

      [...wss.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          type: 'message',
          text,
          sender: connection.userId,
          recipient,
          file: file ? filename : null,
          _id: messageDoc._id,
        })));
    } catch (err) {
      console.error('❌ Message DB error:', err);
    }
  }

  });

  notifyAboutOnlinePeople();
});
