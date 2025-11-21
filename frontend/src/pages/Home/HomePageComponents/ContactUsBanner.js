import React from 'react';
import './PostPropertyBanner.css';

const ContactUsBanner = () => {

  const handleScrollToContact = () => {
    const section = document.getElementById('contact-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="contactus-banner-container">
      <h2 className="banner-title">Need Help Finding the Right Property?</h2>
      <p className="banner-subtitle">
        Our team is here to guide you. Get expert assistance tailored to your needs.
      </p>

      <button className="banner-button" onClick={handleScrollToContact}>
        Contact Us
      </button>
    </div>
  );
};

export default ContactUsBanner;
