import React, { useState } from "react";
import {
  FiHelpCircle,
  FiHome,
  FiUsers,
  FiTool,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiChevronDown,
} from "react-icons/fi";
import "./SupportHelp.css";
// import RelatedArticles from "../components/RelatedArticles";

const faqData = {
  "Getting Started": [
    { question: "How do I create a developer account?", answer: "Our team provides a private username and password after verifying your identity to ensure authenticity." },
    { question: "How long does it take for my property to go live?", answer: "Once you submit property details, our administrators review them within 12–24 hours before publishing." },
  ],
  "Property Management": [
    { question: "Is property listing free?", answer: "Yes, developers can list properties for free on our platform once verified." },
    { question: "Can I edit or update my property details later?", answer: "Yes, you can edit property details such as pricing, amenities, or descriptions at any time from your dashboard." },
    { question: "Can I upload or change property photos?", answer: "Absolutely. You can upload, update, or remove property photos through your property management dashboard." },
    { question: "How do I update the locality information of my property?", answer: "Log in to your dashboard, open your property listing, and edit the locality/location details as needed." },
  ],
  "For Customers": [
    { question: "How do I compare properties?", answer: "Simply click the ‘Add to Compare’ button on a property. You can compare up to 4 properties side by side." },
    { question: "Can I contact a developer directly?", answer: "Yes, once you select a property, you’ll see the developer’s verified contact details to reach out securely." },
  ],
  "Support & Assistance": [
    { question: "I forgot my login details. What should I do?", answer: "Use the 'Forgot Password' option on the login page or contact support to reset your credentials." },
    { question: "How do I get faster support?", answer: "You can reach us via email at support@compareprojects.com. Emails are prioritized for faster response." },
  ],
};

const tipsData = [
  {
    title: "How Do I Begin My Home Search?",
    points: [
      "Use online realty portals—ET Realty features top market trends.",
      "Explore pre-booking offers ahead of the festive period in Pune.",
      "Read expert tips from homebuyers trying properties via 'sleepovers'."
    ],
    links: [
      "https://realty.economictimes.indiatimes.com",
      "https://timesofindia.indiatimes.com/city/pune/pre-bookings-for-real-estate-kick-off-ahead-of-festive-period/articleshow/123511897.cms",
      "https://nypost.com/2025/08/25/real-estate/homebuyers-are-trying-out-properties-with-sleepovers/"
    ]
  },
  {
    title: "Choosing A Location",
    points: [
      "Watch Dwarka Expressway prices skyrocket—connectivity drives value.",
      "Digitisation of land records is enhancing transparency nationwide."
    ],
    links: [
      "https://timesofindia.indiatimes.com/city/gurgaon/connectivity-drives-demand-property-prices-along-dwarka-expressway-double-in-4-yrs/articleshow/123351200.cms",
      "https://economictimes.indiatimes.com/industry/services/property-/-cstruction/full-land-digitisation-to-spur-fdi-in-realty/articleshow/123530211.cms"
    ]
  },
  {
    title: "Smart Buying Tips",
    points: [
      "Learn agent-like negotiation tactics from industry experts.",
      "Avoid common first-time buying mistakes highlighted by pros."
    ],
    links: [
      "https://www.ft.com/content/df4dcf03-5880-4e1b-b178-6300e86e6241",
      "https://www.realsimple.com/homebuying-mistakes-8683504"
    ]
  }
];

const checklistItems = [
  "Check for cracks, leaks, plumbing; inspect wiring and lifts.",
  "Verify emergency power backup, water supply, signal strengths.",
  "Assess safety, flood risk, and timing (e.g., light and noise later in the day).",
  "Hire a structural engineer before finalizing big investments."
];

const tabIcons = {
  "Getting Started": <FiHome />,
  "Property Management": <FiTool />,
  "For Customers": <FiUsers />,
  "Support & Assistance": <FiHelpCircle />,
};



const SupportHelp = () => {
  const [activeTab, setActiveTab] = useState("Getting Started");
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // filter FAQs by search
  const filteredFaqs = faqData[activeTab].filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="support-container">
      <div className="support-layout">
        {/* LEFT: Tips & Checklist */}
        <div className="support-left">
          <h2 className="section-title">Support & Help</h2>
          {tipsData.map((tip, i) => (
            <div key={i} className="tip-card">
              <h3>{tip.title}</h3>
              <ul>
                {tip.points.map((pt, idx) => (
                  <li key={idx}>
                    {pt}{" "}
                    <a href={tip.links[idx]} target="_blank" rel="noopener noreferrer" className="tip-link">
                      Read more →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="checklist-card">
            <h3>Property Visit Checklist</h3>
            <ul>
              {checklistItems.map((item, idx) => (
                <li key={idx}><FiCheckCircle className="list-icon" /> {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT: FAQ Section */}
        <div className="support-right">
          {/* Search Bar */}
          {/* <div className="faq-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}

          {/* Tabs */}
          <div className="support-tabs">
            {Object.keys(faqData).map((tab) => (
              <button
                key={tab}
                className={`support-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  setOpenIndex(null);
                  setSearchQuery("");
                }}
              >
                {tabIcons[tab]} {tab}
              </button>
            ))}
          </div>

          <h2 className="support-title">{activeTab}</h2>
          <div className="faq-list">
            {filteredFaqs.map((faq, index) => (
              <div
                className={`faq-item ${openIndex === index ? "active" : ""}`}
                key={index}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.question}
                  <FiChevronDown className={`chevron ${openIndex === index ? "open" : ""}`} />
                </button>
                {openIndex === index && (
                  <div className="faq-answer">{faq.answer}</div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="no-results">No FAQs match your search.</p>
            )}
          </div>
        </div>
      </div>

      {/* <RelatedArticles /> */}

      {/* Footer */}
      <div className="support-footer">
        <h3>Still have a question?</h3>
        <p>
          If you cannot find an answer in our FAQ, please contact us. We’ll
          respond within 24 hours.
        </p>
        <div className="support-contact">
          <div className="support-box">
            <FiPhone className="support-icon" />
            <p>+ (856X) 093-6-49X</p>
            <small>We are always happy to help</small>
          </div>
          <div className="support-box">
            <FiMail className="support-icon" />
            <p>support@compareprojects.com</p>
            <small>The best way to get faster support</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportHelp;
