import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App()
{
  const [isRegistering, setIsRegistering] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) =>
  {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) =>
  {
    e.preventDefault();
    setMessage('');

    try
    {
      if (isRegistering)
      {
        const res = await axios.post('http://localhost:5000/auth/register', formData);
        setMessage(`Success! User created with ID ${res.data.userId}`);
      }
      else
      {
        const res = await axios.post('http://localhost:5000/auth/login',
        {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        setMessage('Login successful! Token saved.');
      }
    }
    catch (err)
    {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>HobbyTrack</h1>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>

      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div>
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>

      <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', color: 'blue' }}>
        {isRegistering ? 'Already have an account? Login' : "Need an account? Register"}
      </p>

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;