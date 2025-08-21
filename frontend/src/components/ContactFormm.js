// import React, { useState } from "react";
import React from "react";

import "./ContactFormm.css"; // Make sure to create and link the CSS file

const ContactFormm = () => {
  // const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="contact-wrapper">
      <div className="contact-container">

        <div className="contact-form-header">
                    <h3>Contact Seller</h3>
                    <p>Get more information about this property</p>
        </div>
        
        <form className="contact-form">
          <label>Name</label>
          <input type="text" placeholder="Enter your name" required />

          <label>Phone</label>
          <div className="phone-input">
            <select>
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
            </select>
            <input type="tel" placeholder="Phone" required />
          </div>

          <label>Email</label>
          <input type="email" placeholder="Enter your email" />


          <div className="contact-options">
            <div className="contact-option">
              <input type="checkbox" id="contact-consent" />
              <label htmlFor="contact-consent">
                I agree to be contacted via WhatsApp, SMS, phone, email etc
              </label>
            </div>
            <div className="contact-option">
              <input type="checkbox" id="loan-interest" />
              <label htmlFor="loan-interest">I am interested in Home Loans</label>
            </div>
          </div>
          <button className="get-details-btn">Contact Us Now</button>
            <p className="shortlist-note">
              Still deciding? Shortlist this property for now & easily come back to it later.
            </p>
        </form>
      </div>
    </div>
  );
};

export default ContactFormm;
