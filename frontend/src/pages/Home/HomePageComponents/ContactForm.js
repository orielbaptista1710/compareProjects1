import React, { useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import "./ContactForm.css";

const CITIES = ["Mumbai"];
const LOCALITIES = {
  Mumbai: [
    "Vasai East", "Vasai West", "Andheri East", "Andheri West",
    "Borivali", "Churchgate", "Bandra", "Dadar", "Prabhadevi",
  ],
};
const PROPERTY_TYPES = [
  "Apartment/Flat", "Villa", "Bungalow", "Plot", "Office Spaces", "Warehouse", "Shops/Showrooms",
];
const BUDGET_RANGES = [
  "Under ₹20L", "₹20L - ₹40L", "₹40L - ₹60L",
  "₹60L - ₹80L", "₹80L - ₹1Cr", "Above ₹1Cr",
];

const ContactForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", userType: "",
    city: "Mumbai", locality: "", budget: "",
    propertyType: "", requirements: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^(\+?\d{1,3}[- ]?)?\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone number must be 10 digits";
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

  const handleNext = () => validateStep1() && setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Submitted:", formData);
      setFormData({
        name: "", email: "", phone: "", userType: "",
        city: "Mumbai", locality: "", budget: "",
        propertyType: "", requirements: "",
      });
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-fm-home-form-section">
      <div className="contact-fm-home-container">
        {/* Sidebar Info */}
        <div className="contact-fm-home-info">
          <h2>Get in touch</h2>
          <p className="contact-fm-home-sidebar-description">
            Sociosqu viverra lectus placerat sem efficitur molestie vehicula cubilia leo etiam nam.
          </p>
          <div className="contact-fm-home-details">
            <div className="contact-fm-home-item">
              <MapPin className="contact-fm-home-icon" />
              <div>
                <strong>Head Office</strong>
                <div>Jalan Cempaka Wangi No 22, Jakarta - Indonesia</div>
              </div>
            </div>
            <div className="contact-fm-home-item">
              <Mail className="contact-fm-home-icon" />
              <div>
                <strong>Email Us</strong>
                <div>support@yourdomain.tld</div>
                <div>hello@yourdomain.tld</div>
              </div>
            </div>
            <div className="contact-fm-home-item">
              <Phone className="contact-fm-home-icon" />
              <div>
                <strong>Call Us</strong>
                <div>Phone: +6221.2002.2012</div>
                <div>Fax: +6221.2002.2013</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="contact-fm-home-form-container">
          <div className="contact-fm-home-form-header">
            <div className="contact-fm-home-form-progress">
              <div className={`contact-fm-home-progress-step ${step >= 1 ? "active" : ""}`}>
                <div className="contact-fm-home-progress-indicator"><span>1</span></div>
                <p>Personal Info</p>
              </div>
              <div className={`contact-fm-home-progress-line ${step === 2 ? "active-line" : ""}`}></div>
              <div className={`contact-fm-home-progress-step ${step === 2 ? "active" : ""}`}>
                <div className="contact-fm-home-progress-indicator"><span>2</span></div>
                <p>Property Details</p>
              </div>
            </div>
          </div>

          <div className="contact-fm-home-form-content">
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="contact-fm-home-form-step">
                  <h3>Tell us about yourself</h3>
                  <p className="contact-fm-home-step-description">We'll use this to connect with you</p>

                  <div className="contact-fm-home-form-grid">
                    <div className="contact-fm-home-form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input id="name" name="name" value={formData.name}
                        onChange={handleChange} placeholder="Enter your full name"
                        className={errors.name ? "error" : ""} />
                      {errors.name && <span className="contact-fm-home-error-text">{errors.name}</span>}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input id="email" name="email" type="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="Enter your email" className={errors.email ? "error" : ""} />
                      {errors.email && <span className="contact-fm-home-error-text">{errors.email}</span>}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input id="phone" name="phone" type="tel"
                        value={formData.phone} onChange={handleChange}
                        placeholder="10-digit number" className={errors.phone ? "error" : ""} />
                      {errors.phone && <span className="contact-fm-home-error-text">{errors.phone}</span>}
                    </div>

                    <div className="contact-fm-home-form-group full-width">
                      <label>I am a *</label>
                      <div className="contact-fm-home-radio-group">
                        {["buyer", "investor"].map((type) => (
                          <label key={type} className={`contact-fm-home-radio-option ${formData.userType === type ? "selected" : ""}`}>
                            <input type="radio" name="userType" value={type}
                              checked={formData.userType === type} onChange={handleChange} />
                            <div>
                              <div className="contact-fm-home-radio-label">{type === "buyer" ? "Buyer" : "Investor"}</div>
                              <div className="contact-fm-home-radio-description">
                                {type === "buyer"
                                  ? "Looking to purchase a property"
                                  : "Interested in investment opportunities"}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.userType && <span className="contact-fm-home-error-text">{errors.userType}</span>}
                    </div>
                  </div>

                  <button type="button" className="contact-fm-home-btn contact-fm-home-btn-primary" onClick={handleNext}>
                    Continue to Property Details →
                  </button>
                </div>
              ) : (
                <div className="contact-fm-home-form-step">
                  <h3>What are you looking for?</h3>
                  <p className="contact-fm-home-step-description">Help us find the perfect match</p>

                  <div className="contact-fm-home-form-grid">
                    <div className="contact-fm-home-form-group">
                      <label htmlFor="city">City *</label>
                      <select id="city" name="city" value={formData.city} onChange={handleChange}
                        className={errors.city ? "error" : ""}>
                        <option value="">Select your city</option>
                        {CITIES.map((city) => <option key={city}>{city}</option>)}
                      </select>
                      {errors.city && <span className="contact-fm-home-error-text">{errors.city}</span>}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="locality">Preferred Locality *</label>
                      <select id="locality" name="locality" value={formData.locality} onChange={handleChange}
                        className={errors.locality ? "error" : ""}>
                        <option value="">Select locality</option>
                        {LOCALITIES[formData.city]?.map((loc) => <option key={loc}>{loc}</option>)}
                      </select>
                      {errors.locality && <span className="contact-fm-home-error-text">{errors.locality}</span>}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="budget">Budget Range *</label>
                      <select id="budget" name="budget" value={formData.budget} onChange={handleChange}
                        className={errors.budget ? "error" : ""}>
                        <option value="">Select budget range</option>
                        {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
                      </select>
                      {errors.budget && <span className="contact-fm-home-error-text">{errors.budget}</span>}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="propertyType">Property Type *</label>
                      <select id="propertyType" name="propertyType" value={formData.propertyType}
                        onChange={handleChange} className={errors.propertyType ? "error" : ""}>
                        <option value="">Select property type</option>
                        {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      {errors.propertyType && <span className="contact-fm-home-error-text">{errors.propertyType}</span>}
                    </div>

                    <div className="contact-fm-home-form-group full-width">
                      <label htmlFor="requirements">Additional Requirements</label>
                      <textarea id="requirements" name="requirements" value={formData.requirements}
                        onChange={handleChange} placeholder="Any specific needs? (e.g., 2BHK, amenities, etc.)" rows="4" />
                    </div>
                  </div>

                  <div className="contact-fm-home-form-actions">
                    <button type="button" className="contact-fm-home-btn contact-fm-home-btn-secondary" onClick={handleBack}>← Back</button>
                    <button type="submit" className="contact-fm-home-btn contact-fm-home-btn-primary" disabled={isSubmitting}>
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
