import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoo from '../images/logo.png';
import './Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faTimes, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
// import CustomerSignupPage from '../pages/CustomerSignupPage';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("User from localStorage:", parsedUser);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.error('Invalid user in localStorage:', err.message);
        localStorage.removeItem('user');
      }
    }
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleScrollToSection = (section) => {
    navigate('/');
    setIsMenuOpen(false);
    setTimeout(() => {
      const target = document.getElementById(section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/');
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.header-nav-items') && 
          !event.target.closest('.header-menu-icon')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header id='home' className="header">
      <nav className="header-navbar">
        <div className="header-logo">
          <img className="logo-img-header" src={logoo} alt="Logo" onClick={() => handleScrollToSection('homee')} loading="lazy"/>
        </div>

        <div className="header-menu-icon" onClick={toggleMenu}>
          {isMenuOpen ? <FontAwesomeIcon icon={faTimes} /> : '☰'}
        </div>

        <ul className={`header-nav-items ${isMenuOpen ? 'show-menu' : ''}`}>
          <div className="header-nav-center">
            <li>
              <button className="header-nav-link nav-hover" onClick={() => handleScrollToSection('homee')}>
                Home
              </button>
            </li>
            <li>
              <Link to="/properties" className="header-nav-link nav-hover" onClick={() => setIsMenuOpen(false)}>
                Properties
              </Link>
            </li>
            <li>
              <button className="header-nav-link nav-hover" onClick={() => handleScrollToSection('contact')}>
                Contact
              </button>
            </li>
          </div>

          <div className="nav-right">
  <li><Link to="/compare" className="compare-btn" onClick={() => setIsMenuOpen(false)}>Compare</Link></li>
  
  {!currentUser ? (
    <li><Link to="/customer-signup" className='signup-btn' onClick={() => setIsMenuOpen(false)}>Sign up</Link></li>
  ) : (
    <li>
      <button className="signup-btn" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
      </button>
    </li>
  )}

  <li className="nav-dev-item">
    <Link to="/login" className="nav-link-deveopers" onClick={() => setIsMenuOpen(false)}>
      <span className="header-nav-icon">
        <FontAwesomeIcon icon={faUsers} />
      </span>
      <span className="popup-text">Developers</span>
    </Link>
  </li>
</div>

        </ul>
      </nav>
    </header>
  );
}

export default Header;