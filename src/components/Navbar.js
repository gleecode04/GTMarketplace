import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase'; // Import Firebase auth
import './Navbar.css';

function Navbar({ navigateToLogin, navigateToRegister, user }) {
  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/signOut', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'error signing out');
      }
      user = null;
      // await auth.signOut();
       console.log('User logged out successfully');
      // Optionally, you can navigate to the home page or login page after logout
      navigateToLogin();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          GT Marketplace
        </Link>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <NavLink exact to="/" activeClassName="active" className="navbar-link">
              Home
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/about-us" activeClassName="active" className="navbar-link">
              About Us
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/feedback" activeClassName="active" className="navbar-link">
              Feedback
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/contact" activeClassName="active" className="navbar-link">
              Contact
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/chat" activeClassName="active" className="navbar-link">
              Chat
            </NavLink>
          </li>
        </ul>
        <div className="navbar-buttons">
          {user ? (
            <>
              <span className="navbar-welcome" style={{ color: 'white' }}>Welcome, {user.email}!</span>
              <button
                onClick={handleLogout}
                className="navbar-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={navigateToLogin}
                className="navbar-button"
              >
                Login
              </button>
              <button
                onClick={navigateToRegister}
                className="navbar-button"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;