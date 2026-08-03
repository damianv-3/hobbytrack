import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

function Login()
{
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
  {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) =>
  {
    e.preventDefault();
    setError('');

    try
    {
      const res = await axios.post('http://localhost:5000/auth/login', formData);
      login(res.data.token);
      navigate('/');
    }
    catch (err)
    {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="page" style={{ maxWidth: '420px' }}>
      <div className="card">
        <div className="card-callnumber">SIGN-IN SLIP</div>
        <h2 style={{ textTransform: 'none', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--ink)' }}>Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary">Log in</button>
        </form>
        {error && <p className="error-text" style={{ marginTop: '0.75rem' }}>{error}</p>}
        <hr className="divider" />
        <p style={{ fontSize: '0.9rem' }}>New here? <Link to="/register">Register an account</Link></p>
      </div>
    </div>
  );
}

export default Login;