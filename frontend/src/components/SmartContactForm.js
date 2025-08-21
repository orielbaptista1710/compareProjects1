import React, { useState } from "react";
import "./SmartContactForm.css";

const steps = [
  { key: "purpose", question: "👋 Hi there! Are you looking to Rent or Buy?", options: ["Rent", "Buy"] },
  { key: "budget", question: "💰 What's your budget range?", options: ["< ₹25k", "₹25k–₹50k", "₹50k–₹1L", "> ₹1L"] },
  { key: "propertyType", question: "🏠 What type of property do you want?", options: ["Apartment", "Villa", "Plot", "Office"] },
  { key: "locality", question: "📍 Which locality are you interested in?", input: true },
  { key: "name", question: "😊 What's your name?", input: true },
  { key: "email", question: "📧 Your email?", input: true },
  { key: "phone", question: "📱 Your phone number?", input: true },
];

const SmartContactForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = (value) => {
    const newFormData = { ...formData, [steps[step].key]: value };
    setFormData(newFormData);
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      console.log("Final Data Submitted ✅", newFormData);
      setIsSubmitted(true);
      // Here you would typically send the data to your backend
    }
  };

  if (isSubmitted) {
    return (
      <div className="smart-form-container">
        <div className="smart-form-card">
          <div className="success-state">
            <div className="success-icon">✅</div>
            <h3>Thank You!</h3>
            <p>We've received your information and will contact you shortly with personalized property recommendations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-form-container">
      <div className="smart-form-card">
        {/* Progress indicator */}
        <div className="progress-indicator">
          {steps.map((_, index) => (
            <div 
              key={index} 
              className={`progress-dot ${index <= step ? 'active' : ''}`}
            />
          ))}
        </div>
        
        <h2>{steps[step].question}</h2>

        {/* Options as buttons */}
        {steps[step].options && (
          <div className="options">
            {steps[step].options.map((opt, i) => (
              <button key={i} onClick={() => handleNext(opt)} className="option-btn">
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input fields */}
        {steps[step].input && (
          <div className="input-section">
            <input
              type="text"
              placeholder="Type your answer..."
              onKeyDown={(e) => e.key === "Enter" && handleNext(e.target.value)}
            />
            <button onClick={() => {
              const inputElement = document.querySelector(".input-section input");
              const value = inputElement.value;
              if (value) {
                handleNext(value);
                inputElement.value = ""; // Clear input after submission
              }
            }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartContactForm;