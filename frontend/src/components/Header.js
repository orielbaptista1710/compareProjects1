import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoo from '../images/logo.png';
import './Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
        } else {
          throw new Error('Invalid format');
        }
      } catch (err) {
        console.error('Invalid user in localStorage:', err.message);
        localStorage.removeItem('user'); // Optional: Clean it if corrupted
      }
    }
  }, []);
  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleScrollToSection = (section) => {
    navigate('/');
    setTimeout(() => {
      const target = document.getElementById(section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header id='home' className="header">
      <nav className="navbar">
        <div className="logo">
          <img className="logo-img" src={logoo} alt="Logo" onClick={() => handleScrollToSection('home')} />
        </div>

        <div className="menu-icon" onClick={toggleMenu}>&#9776;</div>

        <ul className={`nav-items ${isMenuOpen ? 'show-menu' : ''}`}>
          <div className="nav-center">
            <li><button className="nav-link" onClick={() => handleScrollToSection('home')}>Home</button></li>
            <li><Link to="/properties" className="nav-link">Properties</Link></li>
            <li><button className="nav-link" onClick={() => handleScrollToSection('contact')}>Contact</button></li>
          </div>

          <div className="nav-right">
            <li><Link to="/compare" className="compare-btn">Compare</Link></li>
            <li className="nav-dev-item">
              <Link to="/login" className="nav-link-deveopers">
                <span className="nav-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <span className="popup-text">Developers</span>
              </Link>
            </li>

            {/* Show Admin Link if user is admin */}
            {user && user.role === 'admin' && (
              <li>
                <Link to="/admin" className="nav-link">Admin</Link>
              </li>
            )}
          </div>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
