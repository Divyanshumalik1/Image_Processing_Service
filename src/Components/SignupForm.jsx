import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupForm() {

  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [Name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [JWTToken, setJWTToken] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, Name, email, phone, confirmPassword })
    })

    try {
      const data = await response.json();
      setJWTToken(data.token);
      localStorage.setItem("token", data.token);
      if (data) {
        navigate('/login');
      }

      console.log('Response from server:', data);

    } catch {
      console.error('Error parsing JSON response');
    }


  }



  return (
    <div>
      <h1>Signup Form Page</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <input placeholder="Name" value={Name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <div>
          <input type="submit" value="Submit" />
        </div>
      </form>
    </div>

  )
}