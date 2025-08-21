import React, { useState, useEffect } from 'react';
import './DeveloperPopup.css';

const DeveloperPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Name: ${name}, Email: ${email}, Mobile: ${mobile}`);
    setShowPopup(false);
  };

  return (
    showPopup && (
      <div className="popup-overlay">
        <div className="popup-container">
          <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
          <h3 className="popup-title">Developers Can Post Properties!</h3>
          <p className="popup-description">Contact us to get started by providing your details.</p>
          <form className="popup-form" onSubmit={handleSubmit}>
            <input
              className="popup-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="popup-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="popup-input"
              type="tel"
              placeholder="Mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
            <button className="popup-submit" type="submit">Submit</button>
          </form>
        </div>
      </div>
    )
  );
};

export default DeveloperPopup;
