import { createContext, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({children}){
    const[username, setUsername] = useState(null);
    const[id, setId] = useState(null);
   return (
    <userContext.Provider value={{username, setUsername, id, setId}}>{children}</userContext.Provider>
   )
}