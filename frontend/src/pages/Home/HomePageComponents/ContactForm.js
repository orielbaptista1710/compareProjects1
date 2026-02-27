




//Home/HomePageComponents/ContactForm.js 
import React, { useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import "./ContactForm.css";

//have to add /api/leads/customer

const CITIES = ["Mumbai"];
const LOCALITIES = {
  Mumbai: [
    "Vasai East", "Vasai West", "Andheri East", "Andheri West",
    "Borivali", "Churchgate", "Bandra", "Dadar", "Prabhadevi",
  ],
};
const PROPERTY_TYPES = [
  "Flats/Apartments", 
    "Villa", 
    "Plot","Shop/Showroom",
    "Industrial Warehouse/Godown",
    "Office Space",
    "Commercial Land",
    "Industrial Building",
];
const BUDGET_RANGES = [
  "Under ₹20L", "₹20L - ₹40L", "₹40L - ₹60L",
  "₹60L - ₹80L", "₹80L - ₹1Cr", "Above ₹1Cr",
];

const ContactForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerContactConsent: true,
  userType: "",
  city: "Mumbai",
  locality: "",
  budget: "",
  propertyType: "",
  requirements: "",
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

  const name = formData.customerName.trim();
  const email = formData.customerEmail.trim();
  const phone = formData.customerPhone.trim();

  if (!name || name.length < 2)
    newErrors.customerName = "Enter valid full name";

  if (!email)
    newErrors.customerEmail = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    newErrors.customerEmail = "Invalid email format";

  if (!phone)
    newErrors.customerPhone = "Phone number is required";
  else if (!/^[6-9]\d{9}$/.test(phone))
    newErrors.customerPhone = "Enter valid 10-digit mobile number";

  if (!formData.userType)
    newErrors.userType = "Please select your type";

  if (!formData.customerContactConsent)
    newErrors.customerContactConsent = "You must agree to be contacted";

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
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/leads/customer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: "home_page_contact",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Submission failed");
    }

    // reset
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerContactConsent: true,
      userType: "",
      city: "Mumbai",
      locality: "",
      budget: "",
      propertyType: "",
      requirements: "",
    });

    setStep(1);
  } catch (err) {
    console.error(err);
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
                      <label htmlFor="customerName">Full Name *</label>
                      <input
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={errors.customerName ? "error" : ""}
                      />
                      {errors.customerName && (
                        <span className="contact-fm-home-error-text">
                          {errors.customerName}
                        </span>
                      )}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="customerEmail">Email Address *</label>
                      <input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={errors.customerEmail ? "error" : ""}
                      />
                      {errors.customerEmail && (
                        <span className="contact-fm-home-error-text">
                          {errors.customerEmail}
                        </span>
                      )}
                    </div>

                    <div className="contact-fm-home-form-group">
                      <label htmlFor="customerPhone">Mobile Number *</label>
                      <input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        className={errors.customerPhone ? "error" : ""}
                      />
                      {errors.customerPhone && (
                        <span className="contact-fm-home-error-text">
                          {errors.customerPhone}
                        </span>
                      )}
                    </div>

                    <div className="contact-fm-home-form-group full-width">
  <label className="contact-fm-home-checkbox">
    <input
      type="checkbox"
      name="customerContactConsent"
      checked={formData.customerContactConsent}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          customerContactConsent: e.target.checked,
        }))
      }
    />
    I agree to be contacted via phone, WhatsApp, SMS or email.
  </label>

  {errors.customerContactConsent && (
    <span className="contact-fm-home-error-text">
      {errors.customerContactConsent}
    </span>
  )}
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


