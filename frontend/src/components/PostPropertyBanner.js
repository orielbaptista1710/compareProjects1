import React from 'react';
import './PostPropertyBanner.css';
import { useNavigate } from 'react-router-dom';

const PostPropertyBanner = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/popup-dev');
  };

  return (
    <div className="banner-container">
      <h2 className="banner-title">Looking to Post Your Property?</h2>
      <p className="banner-subtitle">Join our network of trusted developers and reach thousands of buyers.</p>
      <button className="banner-button" onClick={handleClick}>Contact Us Now</button>
    </div>
  );
};

export default PostPropertyBanner;
