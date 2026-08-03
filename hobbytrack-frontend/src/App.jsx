import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Browse from './pages/Browse.jsx';
import MediaDetail from './pages/MediaDetail.jsx';
import Profile from './pages/Profile.jsx';
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
      <nav className="navbar">
        <Link to="/" className="brand-mark">Ledgible</Link>
        <Link to="/browse" className="tab-link">Browse</Link>
        {user && <Link to="/profile" className="tab-link">My Shelf</Link>}

        <div className="navbar-spacer">
          {user
            ? (
              <>
                <span className="navbar-user">{user.username}</span>
                <button className="btn btn-small" onClick={handleLogout}>Log out</button>
              </>
            )
            : (
              <>
                <Link to="/login" className="tab-link">Login</Link>
                <Link to="/register" className="tab-link">Register</Link>
              </>
            )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/media/:id" element={<MediaDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;