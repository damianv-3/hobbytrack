import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './App.css';

function App()
{
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () =>
  {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav style={{ padding: '15px', borderBottom: '1px solid #ccc', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/">HobbyTrack</Link>
        {user
          ? (
            <>
              <span>Hi, {user.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )
          : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;