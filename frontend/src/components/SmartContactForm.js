// SmartContactForm.js
import React, { useState, useRef, useEffect } from "react";
import "./SmartContactForm.css";

const steps = [
  { key: "budget", question: "What's your budget range?", options: ["< ₹25k", "₹25k–₹50k", "₹50k–₹1L", "> ₹1L"] },
  { key: "propertyType", question: "What type of property do you want?", options: ["Apartment", "Villa", "Plot", "Office"] },
  { key: "locality", question: "Which locality are you interested in?", input: true, type: "text" },
  { key: "name", question: "What's your name?", input: true, type: "text" },
  { key: "email", question: "Your email?", input: true, type: "email" },
  { key: "phone", question: "Your phone number?", input: true, type: "tel" },
];

const validators = {
  text: (val) => val.trim().length > 0,
  email: (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  tel: (val) =>
    /^\+?[0-9]{7,15}$/.test(val.trim()), // simple phone regex
};

const SmartContactForm = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const currentStep = steps[step];

  // Focus input automatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setError("");
  }, [step]);

  const handleNext = (value) => {
    if (currentStep.input) {
      const type = currentStep.type || "text";
      if (!validators[type]?.(value)) {
        setError(
          type === "email"
            ? "Please enter a valid email address."
            : type === "tel"
            ? "Please enter a valid phone number."
            : "This field is required."
        );
        return;
      }
    }

    const newFormData = { ...formData, [currentStep.key]: value.trim() };
    setFormData(newFormData);
    setError("");

    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      console.log("✅ Final Data Submitted:", newFormData);
      setIsSubmitted(true);
      // TODO: Send newFormData to backend API
    }
  };

  if (isSubmitted) {
    return (
      <div className="smart-form-container" role="status">
        <div className="smart-form-card success-state">
          <div className="success-icon" aria-hidden="true">✅</div>
          <h3>Thank You!</h3>
          <p>We've received your information and will contact you shortly with personalized property recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-form-container">
      <div className="smart-form-card">
        {/* Progress indicator */}
        <nav className="progress-indicator" aria-label="Form progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index <= step ? "active" : ""}`}
              aria-current={index === step ? "step" : undefined}
            />
          ))}
        </nav>

        <h2 id={`question-${step}`}>{currentStep.question}</h2>

        {/* Options as buttons */}
        {currentStep.options && (
          <div className="options" role="group" aria-labelledby={`question-${step}`}>
            {currentStep.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleNext(opt)}
                className="option-btn"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input fields */}
        {currentStep.input && (
          <form
            className="input-section"
            onSubmit={(e) => {
              e.preventDefault();
              handleNext(inputRef.current?.value);
              if (inputRef.current) inputRef.current.value = "";
            }}
            noValidate
          >
            <label htmlFor={`input-${currentStep.key}`} className="sr-only">
              {currentStep.question}
            </label>
            <input
              id={`input-${currentStep.key}`}
              type={currentStep.type || "text"}
              placeholder="Type your answer..."
              ref={inputRef}
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
            />
            {error && (
              <span className="error-message" role="alert" style={{color:'#D92228', fontSize:'0.85rem'}}>
                {error}
              </span>
            )}
            <button type="submit" className="next-btn">
              Next →
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SmartContactForm;
