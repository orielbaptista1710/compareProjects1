import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
// import logoo from '../images/logo.png';
import './Footer.css';
import { Link, useNavigate } from 'react-router-dom';

function Footer() {

    //add additional code for funtionallity here
  const [email, setEmail] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    if (!email) {
      alert('Please enter your email address.');
      e.preventDefault();
    } else {
      // handle subscription logic here
      alert('Subscribed successfully!');
    }
  };

  // Function to handle scrolling to sections
  const navigate = useNavigate();
  const handleScrollToSection = (section) => {
    navigate('/'); // Navigate to the homepage first
    setTimeout(() => {
      document.getElementById(section).scrollIntoView({ behavior: 'smooth' });
    }, 100); // Slight delay to ensure navigation happens first
  };

  return (
    <footer className="footer">
      <div className="row">
        <div className="col">
          {/* <img src={logoo} alt="logo" className="footer-logo" /> */}
          <p>Skateboard +1 ksnvdl slkvdn lskdv lskdn mustache fixie paleo lumbersexual.</p>
        </div>
        <div className="col">
          <h3>Office</h3>
          <p>Lorem ipsum,</p>
          <p>Hic nam maiores,</p>
          <p>Mumbai, PIN 560066, India</p>
        </div>
        <div className="col">
          <h3>Links</h3>
          <ul>

          <li><button className="nav-link" onClick={() => handleScrollToSection('home')}>Home</button></li>
          <li><button className="nav-link" onClick={() => handleScrollToSection('about')}>About</button></li>
          <li><Link to="/properties" className="nav-link">Property</Link></li>{/* Use Link for Property and Compare pages */}
          <li><button className="nav-link" onClick={() => handleScrollToSection('contact')}>Contact</button></li>
          <li><Link to="/compare" className="nav-link">Compare</Link></li>

          {/* header and footer had aactiveclassName for active link */}
          </ul>
        </div>
        <div className="col">
          <h3 className="newsletter">Newsletter</h3>
          <form className="news-form" onSubmit={handleSubmit}>
            <FontAwesomeIcon icon={faEnvelope} />
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={handleEmailChange} 
              required 
            />
            <button className="newsletter-btn" type="submit">
              <FontAwesomeIcon icon={faArrowRight} /> Subscribe
            </button>
          </form>

          <div className="social-icons">
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
    <FontAwesomeIcon icon={faFacebook} />
  </a>
  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
    <FontAwesomeIcon icon={faTwitter} />
  </a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
    <FontAwesomeIcon icon={faInstagram} />
  </a>
  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
    <FontAwesomeIcon icon={faLinkedin} />
  </a>
</div>
          

        </div>
      </div>
    </footer>
  );
}

export default Footer;
