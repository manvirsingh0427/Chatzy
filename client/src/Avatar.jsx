export default function Avatar({ userId, username, online }) {
  const colors = [
    'bg-teal-200', 'bg-red-200',
    'bg-green-200', 'bg-purple-200',
    'bg-blue-200', 'bg-yellow-200',
    'bg-orange-200', 'bg-pink-200',
    'bg-fuchsia-200', 'bg-rose-200'
  ];

  const darkColors = [
    'dark:bg-teal-600', 'dark:bg-red-600',
    'dark:bg-green-600', 'dark:bg-purple-600',
    'dark:bg-blue-600', 'dark:bg-yellow-600',
    'dark:bg-orange-600', 'dark:bg-pink-600',
    'dark:bg-fuchsia-600', 'dark:bg-rose-600'
  ];

  const userIdBase10 = parseInt(userId.substring(10), 16);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];
  const darkColor = darkColors[colorIndex];

  return (
    <div className={`w-8 h-8 relative rounded-full flex items-center justify-center ${color} ${darkColor}`}>
      <div className="text-center w-full opacity-70 dark:text-white">
        {username[0]}
      </div>
      <div
        className={`absolute w-3 h-3 bottom-0 right-0 rounded-full border border-white ${
          online ? 'bg-green-400' : 'bg-gray-400'
        } dark:border-gray-800`}
      />
    </div>
  );
}
