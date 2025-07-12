import axios from "axios";
import { UserContextProvider } from "./UserContext";
import { DarkModeProvider } from "./DarkModeContext"; // ✅ Import the DarkMode context provider
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = 'http://localhost:4040';
  axios.defaults.withCredentials = true;

  return (
    <DarkModeProvider>
      <UserContextProvider>
        <Routes />
      </UserContextProvider>
    </DarkModeProvider>
  );
}

export default App;
