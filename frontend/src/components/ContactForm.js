
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import locationData from '../database/locationData';
import './ContactForm.css';
import  API from '../api';

const ContactForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyType: '',
    budget: '',
    state: '',
    city: '',
    locality: '',
    message: '',
    isBuyer: false,
    isInvestor: false
  });

  const [cities, setCities] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const states = Object.keys(locationData);

  useEffect(() => {
    if (formData.state) {
      const stateCities = Object.keys(locationData[formData.state]);
      setCities(stateCities);
      setFormData(prev => ({ ...prev, city: '', locality: '' }));
    } else {
      setCities([]);
      setLocalities([]);
    }
  }, [formData.state]);

  useEffect(() => {
    if (formData.state && formData.city) {
      const cityLocalities = locationData[formData.state][formData.city];
      setLocalities(cityLocalities);
      setFormData(prev => ({ ...prev, locality: '' }));
    } else {
      setLocalities([]);
    }
  }, [formData.city, formData.state]);

  const handleBlur = (e) => {
    setTouchedFields(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeCheck = (e) => {
    const { name, checked } = e.target;
    if (name === 'isBuyer') {
      setFormData(prev => ({
        ...prev,
        isBuyer: checked,
        isInvestor: checked ? false : prev.isInvestor
      }));
    } else if (name === 'isInvestor') {
      setFormData(prev => ({
        ...prev,
        isInvestor: checked,
        isBuyer: checked ? false : prev.isBuyer
      }));
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');

    const phoneRegex = /^[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.push('Enter a valid 10-digit phone number starting with 6-9');
    }

    const hasPropertyCriteria = [
      formData.propertyType,
      formData.budget,
      formData.state,
      formData.city,
      formData.locality
    ].some(field => field !== '');

    if (!hasPropertyCriteria) {
      errors.push('Please fill in at least one property criteria');
    }

    if (!formData.isBuyer && !formData.isInvestor) {
      errors.push('Please select either Buyer or Investor');
    }

    setFormError(errors.join('. '));
    return errors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitSuccess(false);

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const res = await API.post("/api/contact", {
        ...formData,
        role: [
          ...(formData.isBuyer ? ['buyer'] : []),
          ...(formData.isInvestor ? ['investor'] : [])
        ]
      });

      if (res.status === 200) {
        setSubmitSuccess(true);
        setTimeout(() => {
          const query = new URLSearchParams();
          if (formData.propertyType) query.append('type', formData.propertyType);
          if (formData.budget) query.append('budget', formData.budget);
          if (formData.city) query.append('city', formData.city);
          if (formData.locality) query.append('locality', formData.locality);
          navigate(`/properties?${query.toString()}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError(error.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="contact-form-section">
      <div className="containerie">
        <div className="contact-form-wrapper">
          <div className="form-header">
            <h2>Find Your Dream Property</h2>
            <p>Fill the form for a personalized property search</p>
          </div>

          {submitSuccess ? (
            <div className="success-message">
              <h3>Thank you for your inquiry!</h3>
              <p>We're redirecting you to matching properties...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="property-contact-form">
              {formError && (
                <div className="error-message">
                  {formError.split('. ').map((msg, idx) => (
                    <p key={idx}>{msg}</p>
                  ))}
                </div>
              )}

              <div className="contact-form-row role-selection">
                <label className={`checkbox-label ${formData.isBuyer ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="isBuyer"
                    checked={formData.isBuyer}
                    onChange={handleChangeCheck}
                    onBlur={handleBlur}
                    className="hidden-checkbox"
                  />
                  <span className="custom-checkbox"></span>
                  Buyer
                </label>

                <label className={`checkbox-label ${formData.isInvestor ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    name="isInvestor"
                    checked={formData.isInvestor}
                    onChange={handleChangeCheck}
                    onBlur={handleBlur}
                    className="hidden-checkbox"
                  />
                  <span className="custom-checkbox"></span>
                  Investor
                </label>
              </div>

              <div className="form-split-layout">
                <div className="form-column left-column">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${touchedFields.name && !formData.name ? 'error' : ''}`}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${touchedFields.email && !formData.email ? 'error' : ''}`}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-input ${touchedFields.phone && !formData.phone ? 'error' : ''}`}
                    />
                    {touchedFields.phone && formData.phone && !/^[6-9]\d{9}$/.test(formData.phone) && (
                      <span className="field-error">Invalid phone number</span>
                    )}
                  </div>

                  <div className="form-row triple-row">
                    <div className="form-group">
                      <label>State</label>
                      <select 
                        name="state" 
                        value={formData.state} 
                        onChange={handleChange}
                        className="form-select"
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>City</label>
                      <select 
                        name="city" 
                        value={formData.city} 
                        onChange={handleChange} 
                        disabled={!formData.state}
                        className="form-select"
                      >
                        <option value="">Select City</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Locality</label>
                      <select 
                        name="locality" 
                        value={formData.locality} 
                        onChange={handleChange} 
                        disabled={!formData.city}
                        className="form-select"
                      >
                        <option value="">Select Locality</option>
                        {localities.map(locality => (
                          <option key={locality} value={locality}>{locality}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-column right-column">
                  <div className="form-group">
                    <label>Property Type</label>
                    <select 
                      name="propertyType" 
                      value={formData.propertyType} 
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Type</option>
                      <option value="Residential">Residential</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Retail">Retail</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Plot">Plot</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Budget (₹)</label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      min="0"
                      placeholder="e.g. 10000000"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Requirements</label>
                    <textarea
                      name="message"
                      rows="6"
                      placeholder="Tell us more about what you're looking for..."
                      value={formData.message}
                      onChange={handleChange}
                      className="form-textarea"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="form-note">
                <p>* Required fields. Please provide at least one property criteria.</p>
                <p>* Permission to contact via provided details.</p>
              </div>

              <button className="submit-btn" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactForm;