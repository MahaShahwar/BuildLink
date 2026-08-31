import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLanding = location.pathname === '/';
  const isLoggedIn = !!user;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isLanding && !isLoggedIn ? 'navbar--transparent' : 'navbar--solid'}`}>
      <div className="navbar__container">
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path d="M8 22V14L16 8L24 14V22H20V17H12V22H8Z" fill="white" fillOpacity="0.95" />
              <path d="M14 22V19H18V22" fill="white" fillOpacity="0.6" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="navbar__logo-text">
            Build<span className="navbar__logo-highlight">Link</span>
          </span>
        </Link>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          {!isLoggedIn ? (
            <>
              <Link to="/" className="navbar__link" onClick={() => setMenuOpen(false)}>Home</Link>
              <a href="/#features" className="navbar__link" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="/#how-it-works" className="navbar__link" onClick={() => setMenuOpen(false)}>How It Works</a>
              <div className="navbar__auth">
                <Link to="/login" className="navbar__btn navbar__btn--ghost" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link to="/signup/engineer" className="navbar__btn navbar__btn--primary" onClick={() => setMenuOpen(false)}>Join as Engineer</Link>
              </div>
            </>
          ) : user.role === 'customer' ? (
            <>
              <Link to="/dashboard" className={`navbar__link ${location.pathname === '/dashboard' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                Dashboard
              </Link>
              <Link to="/projects/new" className={`navbar__link ${location.pathname === '/projects/new' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                New Project
              </Link>
              <Link to="/my-projects" className={`navbar__link ${location.pathname === '/my-projects' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                My Projects
              </Link>
              <Link to="/find-engineers" className={`navbar__link ${location.pathname === '/find-engineers' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Find Engineers
              </Link>
              <Link to="/design" className={`navbar__link ${location.pathname === '/design' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                Floor Plan
              </Link>
              <div className="navbar__user">
                <div className="navbar__user-avatar">{user.firstName?.charAt(0)}</div>
                <span className="navbar__user-name">{user.firstName}</span>
                <button className="navbar__btn navbar__btn--outline" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`navbar__link ${location.pathname === '/dashboard' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                Dashboard
              </Link>
              <Link to="/browse-projects" className={`navbar__link ${location.pathname === '/browse-projects' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Browse Projects
              </Link>
              <Link to="/my-requests" className={`navbar__link ${location.pathname === '/my-requests' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                My Requests
              </Link>
              <Link to="/engineer-profile" className={`navbar__link ${location.pathname === '/engineer-profile' ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
              </Link>
              <div className="navbar__user">
                <div className="navbar__user-avatar">{user.firstName?.charAt(0)}</div>
                <span className="navbar__user-name">{user.firstName}</span>
                <button className="navbar__btn navbar__btn--outline" onClick={handleLogout}>Logout</button>
              </div>
            </>
          )}
        </div>

        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
