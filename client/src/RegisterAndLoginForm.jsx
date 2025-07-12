import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');

  // Load dark mode from localStorage on first load
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? 'register' : 'login';
    const { data } = await axios.post(url, { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }

  return (
    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-800 dark:to-gray-900 h-screen flex items-center justify-center relative">
      
      {/* 🌙 Dark mode toggle button */}
      <div className="absolute top-5 right-5">
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md shadow hover:shadow-md transition"
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-80 transition-shadow hover:shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-blue-700 dark:text-blue-300">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </h2>
        
        <input
          value={username}
          onChange={ev => setUsername(ev.target.value)}
          type="text"
          placeholder="Username"
          className="block w-full rounded-md p-2 mb-4 border focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        
        <input
          value={password}
          onChange={ev => setPassword(ev.target.value)}
          type="password"
          placeholder="Password"
          className="block w-full rounded-md p-2 mb-6 border focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 w-full rounded-md shadow-md hover:shadow-lg transition-all"
        >
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>

        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">
          {isLoginOrRegister === 'register' ? (
            <div>
              Already a member?
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                onClick={() => setIsLoginOrRegister('login')}
              >
                Login here
              </button>
            </div>
          ) : (
            <div>
              Don't have an account?
              <button
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                onClick={() => setIsLoginOrRegister('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
