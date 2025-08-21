// src/pages/SupportHelp.js
import React, { useState } from "react";
import "./SupportHelp.css";

const faqData = {
  "Getting Started": [
    {
      question: "How do I create a developer account?",
      answer: "Our team provides a private username and password after verifying your identity to ensure authenticity.",
    },
    {
      question: "How long does it take for my property to go live?",
      answer: "Once you submit property details, our administrators review them within 12–24 hours before publishing.",
    },
  ],
  "Property Management": [
    {
      question: "Is property listing free?",
      answer: "Yes, developers can list properties for free on our platform once verified.",
    },
    {
      question: "Can I edit or update my property details later?",
      answer: "Yes, you can edit property details such as pricing, amenities, or descriptions at any time from your dashboard.",
    },
    {
      question: "Can I upload or change property photos?",
      answer: "Absolutely. You can upload, update, or remove property photos through your property management dashboard.",
    },
    {
      question: "How do I update the locality information of my property?",
      answer: "Log in to your dashboard, open your property listing, and edit the locality/location details as needed.",
    },
  ],
  "For Customers": [
    {
      question: "How do I compare properties?",
      answer: "Simply click the ‘Add to Compare’ button on a property. You can compare up to 4 properties side by side.",
    },
    {
      question: "Can I contact a developer directly?",
      answer: "Yes, once you select a property, you’ll see the developer’s verified contact details to reach out securely.",
    },
  ],
  "Support & Assistance": [
    {
      question: "I forgot my login details. What should I do?",
      answer: "Use the 'Forgot Password' option on the login page or contact support to reset your credentials.",
    },
    {
      question: "How do I get faster support?",
      answer: "You can reach us via email at support@compareprojects.com. Emails are prioritized for faster response.",
    },
  ],
};

const SupportHelp = () => {
  const [activeTab, setActiveTab] = useState("Getting Started");
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="support-container">
      {/* Tabs */}
      <div className="support-tabs">
        {Object.keys(faqData).map((tab) => (
          <button
            key={tab}
            className={`support-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setOpenIndex(null);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Title */}
      <h2 className="support-title">{activeTab}</h2>
      <p className="support-subtitle">
        Need help with property listings, updates, or customer support? Browse our FAQs below.  
        Our team ensures verified developers and a secure experience for customers.
      </p>

      {/* FAQ List */}
      <div className="faq-list">
        {faqData[activeTab].map((faq, index) => (
          <div
            className={`faq-item ${openIndex === index ? "active" : ""}`}
            key={index}
          >
            <button className="faq-question" onClick={() => toggleFAQ(index)}>
              {faq.question}
              <span className="faq-icon">{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && (
              <div className="faq-answer">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="support-footer">
        <h3>You still have a question?</h3>
        <p>
          If you cannot find an answer in our FAQ, please contact us. We’ll
          respond within 24 hours.
        </p>
        <div className="support-contact">
          <div className="support-box">
            <span className="support-icon">📞</span>
            <p>+ (856X) 093-6-49X</p>
            <small>We are always happy to help</small>
          </div>
          <div className="support-box">
            <span className="support-icon">📧</span>
            <p>support@compareprojects.com</p>
            <small>The best way to get faster support</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportHelp;
