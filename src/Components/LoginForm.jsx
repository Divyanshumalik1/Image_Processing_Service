import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';

export default function LoginForm() {

    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [JWTToken, setJWTToken] = useState('');

    async function handleSubmit(e) {
      e.preventDefault();

      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      try {
        const data = await response.json();
        setJWTToken(data.token);
        localStorage.setItem("token", data.token);
        if(data) {
          navigate('/services');
        }
        console.log('Response from server:', data);
      } catch (error) {
        console.error('Error parsing JSON response:', error);
      }
    }

    

  return (

    <div className="App">
      <h1>Login Form Page</h1>
      <form action="POST" onSubmit={handleSubmit} >
        <div>
          <input id="username" type="text" placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <input type="submit" value="Submit" />
          <input type='password' id='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </form>


    </div>

  )
}


/*

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRtYWxpazEiLCJ1c2VySWQiOiI2OWJhMjIwMmMwYWIxZmY3MjNkYjliNTEiLCJleHAiOjE3NzM4MDk4NjcsImlhdCI6MTc3MzgwNjI2N30.9_B5uG1FZOZlP8mUaUpGIGg3a1u6VXSRWQxWwJtmAWA

CORRECT 
curl -X POST http://localhost:3000/file/images ^
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRtYWxpazEiLCJ1c2VySWQiOiI2OWJhMjIwMmMwYWIxZmY3MjNkYjliNTEiLCJleHAiOjE3NzM5MDI5NTQsImlhdCI6MTc3Mzg5OTM1NH0.xz97hon6ionCedLCUjQK8el3A0UFaxJO8dNOefq1gvg" ^
-F "file=@C:\Users\HP\Desktop\snapshot111.png"

curl -X POST "http://localhost:3000/file/images" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRtYWxpazEiLCJ1c2VySWQiOiI2OWJiOWRkMWRiMDRkZTBmYTI4YzA2ZjgiLCJleHAiOjE3NzM5MDcwOTcsImlhdCI6MTc3MzkwMzQ5N30.9VvK_Lk0HRI1TUtt9Ywz7V1F5ogseIXVYxbZSZnu_vI" -F "file=@C:\Users\HP\Desktop\snapshot111.png"



INCORRECT 
curl -X POST http://localhost:3000/file/images ^
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cBI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRtYWxpazEiLCJ1c2VySWQiOiI2OWJhMjIwMmMwYWIxZmY3MjNkYjliNTEiLCJleHAiOjE3NzM4MDk4NjcsImlhdCI6MTc3MzgwNjI2N30.9_B5uG1FZOZlP8mUaUpGIGg3a1u6VXSRWQxWwJtmAWA" ^
-F "file=@C:\Users\HP\Desktop\snapshot.png"

*/