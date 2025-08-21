import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoo from '../images/logo.png';
import './Header.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("User from localStorage:", parsedUser);
        // No need to set `user` anymore
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
      <nav className="header-navbar">
        <div className="header-logo">
          <img className="logo-img-header" src={logoo} alt="Logo" onClick={() => handleScrollToSection('homee')} loading="lazy"/>
        </div>

        <div className="header-menu-icon" onClick={toggleMenu}>&#9776;</div>

        <ul className={`header-nav-items ${isMenuOpen ? 'show-menu' : ''}`}>
          <div className="header-nav-center">
  <li>
    <button className="header-nav-link nav-hover" onClick={() => handleScrollToSection('homee')}>
      Home
    </button>
  </li>
  <li>
    <Link to="/properties" className="header-nav-link nav-hover">
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
            <li><Link to="/compare" className="compare-btn">Compare</Link></li>
            <li className="nav-dev-item">
              <Link to="/login" className="nav-link-deveopers">
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
