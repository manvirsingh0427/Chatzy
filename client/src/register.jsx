import { useContext, useState } from "react";
import axios from "axios";
import { userContext } from "../userContext";
export default function Register() {
    const [username, setusername] = useState('')
    const [password, setpassword] = useState('')

    const {setUsername:setLoggedInUsername, setId} =  useContext(userContext);
   async function register(ev){
    ev.preventDefault()
    const {data} = await axios.post('/register', {username, password});
    setLoggedInUsername(username)
    setId(data.id)
    }
  return (
    <div className="bg-blue-50 h-screen flex items-center justify-center">
      <form className="w-64 bg-white p-6 rounded shadow-md mb-12" onSubmit ={register} >
        <input
        value = {username} onChange={ev=>setusername(ev.target.value)}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border border-gray-300"
        />
        <input
        value = {password} onChange={ev=>setpassword(ev.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border border-gray-300"
        />
        <button className="bg-blue-500 hover:bg-blue-600 text-white block w-full rounded-sm p-2">
          Register
        </button>
      </form>
    </div>
  );
}
