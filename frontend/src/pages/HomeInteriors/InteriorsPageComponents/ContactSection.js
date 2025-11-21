import React from "react";
// import "./ContactUsInfo.css";
import "./ContactSection.css"
const ContactUsInfo = () => {
  return (
    <section className="interiors-contact-info">
      <div className="interiors-contact-container">
        <h2>Contact Us</h2>
        <div className="interiors-contact-grid">
          <div className="interiors-contact-item">
            <h3>Email</h3>
            <a href="mailto:info@compareprojects.com">info@compareprojects.com</a>
          </div>
          <div className="interiors-contact-item">
            <h3>Phone</h3>
            <a href="tel:+919876543210">+91 98765 43210</a>
          </div>
          <div className="interiors-contact-item">
            <h3>Location</h3>
            <p>Mumbai, Maharashtra, India</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUsInfo;