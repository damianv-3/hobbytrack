import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Browse from './pages/Browse.jsx';
import MediaDetail from './pages/MediaDetail.jsx';
import Profile from './pages/Profile.jsx';
import Clubs from './pages/Clubs.jsx';
import ClubDetail from './pages/ClubDetail.jsx';
import './App.css';

function App()
{
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () =>
  {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const goToProfile = () =>
  {
    setDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="brand-mark">HobbyTrack</Link>

        <div className="navbar-links">
          <Link to="/browse" className="tab-link">Browse</Link>
          <Link to="/clubs" className="tab-link">Clubs</Link>
        </div>

        <div className="navbar-spacer">
          {user
            ? (
              <div className="user-menu">
                <button className="user-menu-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  {user.username} {dropdownOpen ? '▲' : '▼'}
                </button>
                {dropdownOpen && (
                  <div className="user-menu-dropdown">
                    <button className="user-menu-item" onClick={goToProfile}>Profile</button>
                    <button className="user-menu-item" onClick={handleLogout}>Log out</button>
                  </div>
                )}
              </div>
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
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:id" element={<ClubDetail />} />
      </Routes>
    </div>
  );
}

export default App;