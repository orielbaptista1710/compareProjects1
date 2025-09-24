import React, { useState } from "react";
import "./ContactForm.css";

const ContactForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    city: "Mumbai",
    locality: "",
    budget: "",
    propertyType: "",
    requirements: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // These will be used in Step 2
  const cities = ["Mumbai"];
  const localities = {
    Mumbai: [
      "Vasai East", 
      "Vasai West", 
      "Andheri East", 
      "Andheri West", 
      "Borivali", 
      "Churchgate", 
      "Bandra", 
      "Dadar", 
      "Prabhadevi"
    ]
  };

  const propertyTypes = ["Apartment/Flat", "Villa", "Bungalow", "Plot", "Office Spaces", "Warehouse", "Shops/Showrooms"];
  const budgetRanges = [
    "Under ₹20L",
    "₹20L - ₹40L",
    "₹40L - ₹60L",
    "₹60L - ₹80L",
    "₹80L - ₹1Cr",
    "Above ₹1Cr",
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? value : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+?\d{1,3}[- ]?)?\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!formData.userType) newErrors.userType = "Please select your type";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.locality) newErrors.locality = "Locality is required";
    if (!formData.budget) newErrors.budget = "Budget is required";
    if (!formData.propertyType) newErrors.propertyType = "Property type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      // window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep(1);
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep2()) {
      setIsSubmitting(true);
      try {
        // Replace this with your real API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Form submitted:", formData);
        alert("Thank you for your inquiry! We will contact you soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          userType: "",
          city: "",
          locality: "",
          budget: "",
          propertyType: "",
          requirements: "",
        });
        setStep(1);
      } catch (err) {
        alert("Something went wrong. Please try again later.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section className="contact-form-section">
      <div className="contact-container">
        <div className="contact-info">
          <div className="contact-info-content">
            <h2>Contact us</h2>
            <h3>Send Us A Message</h3>

            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-text">470-601-1911</div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-text">Pagedone1234@gmail.com</div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-text">654 Sycamore Avenue, Meadowville, WA 76543</div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-container-enhanced">
          <div className="form-header">
            <div className="form-progress">
              <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
                <div className="progress-indicator">
                  <span>1</span>
                </div>
                <p>Personal Info</p>
              </div>
              <div className={`progress-line ${step === 2 ? "active-line" : ""}`}></div>
              <div className={`progress-step ${step === 2 ? "active" : ""}`}>
                <div className="progress-indicator">
                  <span>2</span>
                </div>
                <p>Property Details</p>
              </div>
            </div>
          </div>

          <div className="form-content">
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="form-step animated-step">
                  <h3>Tell us about yourself</h3>
                  <p className="step-description">We'll use this information to connect with you</p>

                  <div className="form-grid">
                    {/* Name */}
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? "error" : ""}
                        aria-invalid={errors.name ? "true" : "false"}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? "error" : ""}
                        aria-invalid={errors.email ? "true" : "false"}
                        placeholder="Enter your email address"
                      />
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={errors.phone ? "error" : ""}
                        aria-invalid={errors.phone ? "true" : "false"}
                        placeholder="Enter your 10-digit phone number"
                      />
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    {/* User Type */}
                    {/* User Type - Simplified Version */}
<div className="form-group full-width">
  <label>I am a *</label>
  <div className="radio-group">
    <label className={`radio-option ${formData.userType === 'buyer' ? 'selected' : ''}`}>
      <input
        type="radio"
        name="userType"
        value="buyer"
        checked={formData.userType === 'buyer'}
        onChange={handleChange}
      />
      <div>
        <div className="radio-label">Buyer</div>
        <div className="radio-description">Looking to purchase a property</div>
      </div>
    </label>
    <label className={`radio-option ${formData.userType === 'investor' ? 'selected' : ''}`}>
      <input
        type="radio"
        name="userType"
        value="investor"
        checked={formData.userType === 'investor'}
        onChange={handleChange}
      />
      <div>
        <div className="radio-label">Investor</div>
        <div className="radio-description">Interested in investment opportunities</div>
      </div>
    </label>
  </div>
  {errors.userType && <span className="error-text">{errors.userType}</span>}
</div>   


                  </div>

                  <button type="button" className="btn btn-primary btn-next" onClick={handleNext} disabled={isSubmitting}>
                    Continue to Property Details <span className="btn-arrow">→</span>
                  </button>
                </div>
              ) : (
                <div className="form-step animated-step">
                  <h3>What are you looking for?</h3>
                  <p className="step-description">Help us find the perfect property for your needs</p>

                  <div className="form-grid">
                    {/* City */}
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <select
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={errors.city ? "error" : ""}
                      >
                        <option value="">Select your city</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      {errors.city && <span className="error-text">{errors.city}</span>}
                    </div>

                    {/* Locality */}
                    <div className="form-group">
                      <label htmlFor="locality">Preferred Locality *</label>
                      <select
                        id="locality"
                        name="locality"
                        value={formData.locality}
                        onChange={handleChange}
                        className={errors.locality ? "error" : ""}
                        disabled={!formData.city}
                      >
                        <option value="">Select locality</option>
                        {formData.city && localities[formData.city]?.map((locality) => (
                          <option key={locality} value={locality}>
                            {locality}
                          </option>
                        ))}
                      </select>
                      {errors.locality && <span className="error-text">{errors.locality}</span>}
                    </div>

                    {/* Budget */}
                    <div className="form-group">
                      <label htmlFor="budget">Budget Range *</label>
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className={errors.budget ? "error" : ""}
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                      {errors.budget && <span className="error-text">{errors.budget}</span>}
                    </div>

                    {/* Property Type */}
                    <div className="form-group">
                      <label htmlFor="propertyType">Property Type *</label>
                      <select
                        id="propertyType"
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                        className={errors.propertyType ? "error" : ""}
                      >
                        <option value="">Select property type</option>
                        {propertyTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors.propertyType && <span className="error-text">{errors.propertyType}</span>}
                    </div>

                    {/* Requirements */}
                    <div className="form-group full-width">
                      <label htmlFor="requirements">Additional Requirements</label>
                      <textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        placeholder="Tell us about any specific requirements (e.g., number of bedrooms, amenities, etc.)"
                        rows="4"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={isSubmitting}>
                      ← Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;