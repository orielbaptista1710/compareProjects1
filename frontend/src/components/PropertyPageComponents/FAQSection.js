import React, { useState } from "react";
import './FAQSection.css';

const FAQSection = ({ property }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!property || !property.title) {
    return <p>Loading FAQs...</p>;
  }


  const questionsAndAnswers = [
    {
      question: `What is the pin code of ${property.title}?`,
      answer: property.pincode ? `The pin code is ${property.pincode}.` : "Information not available.",
    },
    {
      question: `What is the price range of ${property.title}?`,
      answer: property.price ? `The price range is ${property.price}.` : "Price details not available.",
    },
    {
      question: `How many units are available in ${property.title}?`,
      answer: property.unitsAvailable ? `There are ${property.unitsAvailable} units available.` : "Units info not available.",
    },
    {
      question: `What is the starting price of ${property.title}?`,
      answer: property.price ? `The starting price is ${property.price}.` : "Starting price not available.",
    },
    {
      question: `How many floors are available in ${property.title}?`,
      answer: property.totalFloors ? `There are ${property.totalFloors} floors.` : "Floor details not available.",
    },
    {
      question: `Where to download ${property.title} brochure?`,
      answer: property.brochure ? (
        <a href={property.brochure} target="_blank" rel="noopener noreferrer">
          Download Brochure
        </a>
      ) : (
        "Brochure not available."
      ),
    },
    // {
    //   question: `What are the other projects done by ${property.firstName} in ${property.locality}?`,
    //   answer: property.firstName && property.locality
    //     ? `Projects by ${property.firstName} in ${property.locality}.`
    //     : "Agent details not available.",
    // },
    {
      question: `Where is ${property.title} located?`,
      answer: property.locality ? `Located in ${property.locality} in ${property.state}.` : "Location details not available.",
    },
    {
      question: `What are the possession status and possession date of ${property.title}?`,
      answer: property.availableFrom && property.possessionStatus
        ? `Possession date: ${property.availableFrom}}. And the status of the Property is ${property.possessionStatus}.`
        : "Possession details not available.",
    },
    {
      question: `What is the age of the ${property.title} property?`,
      answer: property.ageOfProperty ? `The property is ${property.ageOfProperty} years old.` : "Age details not available.",
    },
    {
      question: `Does ${property.title} have a RERA approval?`,
      answer: property.reraApproved ? `The property has a RERA approval with the registration number ${property.rera}.` : "RERA details not available.",
    },
  ];

  if (questionsAndAnswers.length === 0) {
    return <p className="no-faqs">No FAQs available for this property.</p>;
  }

  const visibleQuestions = showAll 
    ? questionsAndAnswers 
    : questionsAndAnswers.slice(0, 5);

  return (
    <div className="faq-container">
      <h2 className="faq-title">Frequently Asked Questions</h2>
      
      <ul className="faq-list">
        {visibleQuestions.map((qa, index) => (
          <li 
            className={`faq-item ${expandedIndex === index ? 'active' : ''}`}
            key={index}
          >
            <div 
              className="faq-question"
              onClick={() => toggleFAQ(index)}
              role="button"
              tabIndex={0}
              aria-expanded={expandedIndex === index}
              onKeyDown={(e) => e.key === 'Enter' && toggleFAQ(index)}
            >
              {qa.question}
              <span className="toggle-icon" aria-hidden="true">
                {expandedIndex === index ? '−' : '+'}
              </span>
            </div>
            
            <div className="faq-answer">
              {qa.answer}
            </div>
          </li>
        ))}
      </ul>

      {questionsAndAnswers.length > 5 && (
        <button 
          className="see-more-btn"
          onClick={() => setShowAll(!showAll)}
          aria-label={showAll ? 'Show fewer questions' : 'Show all questions'}
        >
          {showAll ? 'See Less' : `See All (${questionsAndAnswers.length})`}
        </button>
      )}
    </div>
  );
};

export default FAQSection;