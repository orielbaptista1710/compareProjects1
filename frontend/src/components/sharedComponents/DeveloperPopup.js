import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './DeveloperPopup.css'; 

const DeveloperPopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    devfullName: '',
    devEmail: '',
    devPhone: '',
    contactConsent: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.devfullName || !formData.devEmail || !formData.devPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.contactConsent) {
      toast.error('Please consent to being contacted');
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    
    // Show success toast
    toast.success('Thank you for your interest! We will contact you soon.');
    
    // Close popup after a short delay
    setTimeout(() => {
      onClose();
    }, 2000);
  };
 
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content-container" onClick={(e) => e.stopPropagation()}>
        <div className="popup-illustration">
          <div className="illustration-content">
            <h2>Get a personalized</h2>
            <h3>experience to post yr properties professeional</h3>
            <div className="illustration-points">
              <div className="point">
                <div className="point-icon">✓</div>
                <p>Quick Sellouts of Projects</p>
              </div>
              <div className="point">
                <div className="point-icon">✓</div>
                <p>Bulk Order Advantages</p>
              </div>
              <div className="point">
                <div className="point-icon">✓</div>
                <p>Strong Branding & Visibility</p>
              </div>
              <div className="point">
                <div className="point-icon">✓</div>
                <p>Direct Customer Reach</p>
              </div>
              <div className="point">
                <div className="point-icon">✓</div>
                <p>Digital Marketing Support</p>
              </div>
            </div>
            <div className="brand-logos">
              <div className="brand-logo">blinkit</div>
              <div className="brand-logo">HAMELLS</div>
            </div>
          </div>
        </div>

        <div className="popup-form-section">
          <button className="close-btn" onClick={onClose}>×</button>
          
          <h2>Wanna Post your properties?</h2>
          <p className="subtitle">Let's start journey with us</p>
          
          <form onSubmit={handleSubmit}>
            
            <div className="form-group">
              <input
                type="text"
                name="devfullName"
                placeholder="Full name"
                value={formData.devfullName}
                onChange={handleChange}
                required
              />
              
              <input
                type="email"
                name="devEmail"
                placeholder="Email"
                value={formData.devEmail}
                onChange={handleChange}
                required
              />
              
              <input
                type="tel"
                name="devPhone"
                placeholder="Phone number"
                value={formData.devPhone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="checkbox-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="contactConsent"
                  checked={formData.contactConsent}
                  onChange={handleChange}
                />
                <span className="checkbox-checkmark"></span>
                I consent to being contacted using my contact information
              </label>
            </div>
            
            <button type="submit" className="schedule-btn">Let's get Started</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPopup;