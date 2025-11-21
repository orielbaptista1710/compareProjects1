import React, { useState } from 'react';
import './PostPropertyBanner.css';
import DeveloperPopup from '../../../components/sharedComponents/DeveloperPopup';

const PostPropertyBanner = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="postproperty-banner-container">
      <h2 className="banner-title">Looking to Post Your Property?</h2>
      <p className="banner-subtitle">Join our network of trusted developers and reach thousands of buyers.</p>
      <button className="banner-button" onClick={() => setShowPopup(true)}>
        Contact Us
      </button>
      
      <DeveloperPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
    </div>
  );
};

export default PostPropertyBanner;