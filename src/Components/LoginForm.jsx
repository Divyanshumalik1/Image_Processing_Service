import React, { useState } from 'react';

export default function LoginForm() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

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