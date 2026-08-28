import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth.js';

function Register()
{
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    }
    catch (err)
    {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="page" style={{ maxWidth: '420px' }}>
      <div className="card">
        <div className="card-callnumber">MEMBER APPLICATION</div>
        <h2 style={{ textTransform: 'none', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--ink)' }}>Open a catalog</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary">Create account</button>
        </form>
        {error && <p className="error-text" style={{ marginTop: '0.75rem' }}>{error}</p>}
        {success && <p className="success-text" style={{ marginTop: '0.75rem' }}>Card filed. Redirecting to login...</p>}
        <hr className="divider" />
        <p style={{ fontSize: '0.9rem' }}>Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}

export default Register;