import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ContactFormm.css";

const ContactFormm = ({ property }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    contactConsent: true,
    loanInterest: false,
    countryCode: "+91",
  });

  const [errors, setErrors] = useState({});

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Basic Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Enter a valid 10-digit phone number";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email address";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    // ✅ Call API here (fetch/axios)
    console.log("Form submitted", formData);
  };

  return (
    <div className="contact-wrapper">
      <div className="page-contact-container" role="form" aria-labelledby="contact-title">
        {/* Header */}
        <header className="contact-form-header">
          <h3 id="contact-title">Contact Sellers in</h3>
          <div className="seller-info">
            <div className="seller-initial" aria-hidden="true">
              {property?.developerName ? property.developerName.charAt(0) : "A"}
            </div>
            <div className="seller-name">
              {property?.developerName || "Developer Name"}
            </div>
          </div>
        </header>

        <hr className="contact-divider" />

        <p className="contact-instruction">
          <strong>Please share your contact</strong>
        </p>

        {/* Form */}
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-field">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "error-name" : undefined}
            />
            {errors.name && <span className="error-msg" id="error-name">{errors.name}</span>}
          </div>

          {/* Phone */}
          <div className="form-field phone-field">
            <label htmlFor="contact-phone">Phone</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              required
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "error-phone" : undefined}
            />
            {errors.phone && <span className="error-msg" id="error-phone">{errors.phone}</span>}
          </div>

          {/* Email */}
          <div className="form-field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "error-email" : undefined}
            />
            {errors.email && <span className="error-msg" id="error-email">{errors.email}</span>}
          </div>

          {/* Message */}
          <div className="form-field agent-field">
            <label htmlFor="contact-message">Message (optional)</label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <hr className="contact-divider" />

          {/* Consent */}
          <fieldset className="consent-section">
            <legend className="sr-only">Consent Options</legend>
            <div className="consent-option">
              <input
                type="checkbox"
                id="contact-consent"
                name="contactConsent"
                checked={formData.contactConsent}
                onChange={handleChange}
              />
              <label htmlFor="contact-consent">
                I agree to be contacted via WhatsApp, SMS, phone, email etc
              </label>
            </div>
            <div className="consent-option">
              <input
                type="checkbox"
                id="loan-interest"
                name="loanInterest"
                checked={formData.loanInterest}
                onChange={handleChange}
              />
              <label htmlFor="loan-interest">
                I am interested in <Link to="/apnaloan">Home Loans</Link>
              </label>
            </div>
          </fieldset>

          {/* Submit */}
          <button type="submit" className="get-details-btn" aria-label="Submit contact form">
            Get Contact Details
          </button>

          {/* Shortlist */}
          <div className="shortlist-note" role="note">
            <strong>Still deciding?</strong>
            <p>Shortlist this property and easily come back later.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactFormm;
