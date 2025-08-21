import React, { useState } from 'react';
import './DisclaimerPopup.css';

const DisclaimerPopup = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="disclaimer-popup-top">
      <div className="disclaimer-content">
        <h3>Important Disclaimer</h3>
        <div className="disclaimer-text">
          <p>
            Housing.com only acts as a medium for advertisement/information content. 
            We do not facilitate transactions between sellers/developers and users. 
            The details displayed are for information purposes only.
          </p>
          <p>
            Information regarding real estate projects are either third-party content 
            or sourced from public sources. Nothing contained herein shall be deemed 
            to constitute legal advice, solicitation, or offer of sale.
          </p>
        </div>
        <button className="close-button" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default DisclaimerPopup;