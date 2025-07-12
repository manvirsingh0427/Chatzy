export default function Logo() {
  return (
    <div className="text-blue-600 dark:text-blue-400 font-bold flex gap-2 p-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 01-5.197-1.464l-4.345 1.126a.75.75 0 01-.91-.91l1.126-4.345A9.96 9.96 0 012 12zm7-1a1 1 0 100 2h6a1 1 0 100-2H9z" />
      </svg>
      Chatzy
    </div>
  );
}
