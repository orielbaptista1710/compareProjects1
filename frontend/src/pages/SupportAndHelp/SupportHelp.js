import React, { useState } from "react";
import {
  Home,
  Tag,
  HelpCircle,
  BookOpen,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  MessageCircle,
  Building2,
  ShieldCheck,
  Globe,
} from "lucide-react";
import "./SupportHelp.css";

export default function SupportHelp() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("getting-started");

  /* ------------------------- CATEGORY LIST ------------------------- */
  const categories = [
    { id: "getting-started", icon: <Home size={20} />, title: "Getting Started" },
    { id: "property-management", icon: <Tag size={20} />, title: "Property Management" },
    { id: "for-customers", icon: <HelpCircle size={20} />, title: "For Customers" },
    { id: "support", icon: <BookOpen size={20} />, title: "Support & Assistance" },
    { id: "billing", icon: <Building2 size={20} />, title: "Billing & Pricing" },
    { id: "security", icon: <ShieldCheck size={20} />, title: "Security & Verification" },
    { id: "platform", icon: <Globe size={20} />, title: "Platform Features" },
  ];

  /* ------------------------- FAQ DATA ------------------------- */
  const faqData = {
    "getting-started": [
      {
        question: "How do I create a developer account?",
        answer:
          "Our verification team creates developer accounts after confirming documents and RERA certification. Approval takes 24–48 hours.",
      },
      {
        question: "How long does it take for my property to go live?",
        answer:
          "Listings are reviewed within 12–24 hours. Premium listings go live in under 6 hours.",
      },
      {
        question: "What documents are required?",
        answer: "Company registration, project authorization proof, and RERA certificate.",
      },
      {
        question: "Is onboarding support available?",
        answer:
          "Yes, our team provides full onboarding assistance for developers joining the platform.",
      },
    ],

    "property-management": [
      {
        question: "Is property listing free?",
        answer:
          "Yes, verified developers can post free listings. Premium boosts are optional.",
      },
      {
        question: "Can I edit my property details anytime?",
        answer: "Yes, edit any listing through the developer dashboard.",
      },
      {
        question: "How many photos can I upload?",
        answer:
          "Each listing supports up to 20 images and 5 videos for the best presentation.",
      },
      {
        question: "Can I pause or unpublish listings?",
        answer:
          "Yes, use the Edit Listing panel to temporarily deactivate a property.",
      },
    ],

    "for-customers": [
      {
        question: "How do I compare properties?",
        answer:
          "Click 'Add to Compare' on any card and compare up to 4 projects visually.",
      },
      {
        question: "Can I contact developers directly?",
        answer:
          "Yes, verified developer contact details are visible on each property page.",
      },
      {
        question: "Are the property details verified?",
        answer:
          "Yes, our team manually verifies developer details and listing authenticity.",
      },
    ],

    support: [
      {
        question: "I forgot my login password. What do I do?",
        answer: "Use the password reset tool for instant recovery.",
      },
      {
        question: "How do I reach customer support quickly?",
        answer: "Email support@compareprojects.com for priority response.",
      },
      {
        question: "Do you offer WhatsApp support?",
        answer:
          "Yes, WhatsApp support is available for urgent developer assistance.",
      },
    ],

    billing: [
      {
        question: "Do you offer premium plans?",
        answer:
          "Yes — priority listing, homepage spotlight, and lead-boost packages are available.",
      },
      {
        question: "What payment methods are accepted?",
        answer: "Debit/credit card, UPI, net banking, and PayPal (international).",
      },
      {
        question: "Can I upgrade plans anytime?",
        answer: "Yes, upgrades activate instantly after payment.",
      },
    ],

    security: [
      {
        question: "How does verification work?",
        answer:
          "We verify business documents, GST, RERA certification, and office address.",
      },
      {
        question: "Are customer leads secure?",
        answer:
          "All lead data is encrypted and stored securely with strict privacy controls.",
      },
      {
        question: "Can I report fraudulent activity?",
        answer:
          "Yes, use the Report button or contact our security team directly.",
      },
    ],

    platform: [
      {
        question: "What are the key features of CompareProjects?",
        answer:
          "Advanced filtering, comparison tools, real-time lead alerts, analytics dashboard, and developer CRM.",
      },
      {
        question: "Is there a mobile version?",
        answer:
          "Yes, the platform is fully responsive for mobile, tablet, and desktop.",
      },
    ],
  };

  /* ------------------------- BENEFITS ------------------------- */
  const benefits = [
    "24/7 Customer Support",
    "Verified Property Listings",
    "Free Comparison Tools",
    "Direct Developer Contact",
    "Real-Time Lead Tracking",
    "Comprehensive Documentation",
    "Secure Data Encryption",
    "Instant Notifications",
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="support-wrapper">

      {/* --------------------- HERO SECTION --------------------- */}
      <section className="support-hero">
        <div className="hero-content">
          <p className="hero-path">Home <span>/</span> Support & Help</p>
          <h1>Support & Help Center</h1>
          <p className="hero-sub">
            Find answers, explore documentation, and get assistance anytime.
          </p>
        </div>
      </section>

      {/* --------------------- MAIN GRID --------------------- */}
      <div className="support-container">
        <div className="layout-grid">

          {/* LEFT SIDE */}
          <div className="left-column">

            {/* ABOUT SECTION */}
            <div className="card about-card">
              <h2>About Our Support</h2>
              <p className="desc">
                CompareProjects ensures both developers and customers receive quick,
                transparent, and reliable assistance. Our platform is designed to deliver
                seamless property discovery, developer onboarding, and customer engagement.
              </p>

              <h3>What You Get</h3>
              <div className="benefits-grid">
                {benefits.map((b, i) => (
                  <div className="benefit" key={i}>
                    <CheckCircle size={18} className="benefit-icon" /> {b}
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORY SELECTOR */}
            <h3 className="section-title">Browse by Category</h3>
            <div className="category-grid">
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`category-card ${activeCategory === c.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setExpandedFaq(null);
                  }}
                >
                  <div className="cat-icon">{c.icon}</div>
                  <p>{c.title}</p>
                </button>
              ))}
            </div>

            {/* FAQ CARD */}
            <div className="card faq-card">
              <h2>{categories.find((x) => x.id === activeCategory)?.title}</h2>
              <p className="small-sub">
                {faqData[activeCategory].length} frequently asked questions
              </p>

              <div className="faq-list">
                {faqData[activeCategory].map((faq, index) => (
                  <div className="faq-item" key={index}>
                    <button
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                    >
                      {faq.question}
                      {expandedFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {expandedFaq === index && (
                      <div className="faq-answer">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* EXTRA DOCUMENTATION SECTION */}
            <div className="card">
              <h3>Developer Documentation</h3>
              <p className="desc">
                Learn how to make the most out of the CompareProjects platform. Our detailed
                documentation covers listing uploading, CRM usage, analytics tracking,
                and optimization tips to improve visibility and conversions.
              </p>

              <ul className="feature-list">
                <li><CheckCircle size={15} /> How to optimize listing visibility</li>
                <li><CheckCircle size={15} /> Step-by-step onboarding flow</li>
                <li><CheckCircle size={15} /> Lead management best practices</li>
                <li><CheckCircle size={15} /> Boosting listing engagement</li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE – SIDEBAR */}
          <div className="right-column">

            {/* QUICK HELP */}
            <div className="card sidebar-card">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600"
                className="sidebar-img"
                alt="Support"
              />
              <h3>Need Immediate Help?</h3>
              <p className="side-desc">
                Our support team is available 24/7 for urgent queries.
              </p>
              <button className="sidebar-btn">Contact Support</button>
            </div>

            {/* PLATFORM FEATURES */}
            <div className="card gradient-card">
              <h3>Platform Highlights</h3>
              <ul className="feature-list">
                <li><CheckCircle size={15} /> Unlimited Listings</li>
                <li><CheckCircle size={15} /> Real-time Lead Alerts</li>
                <li><CheckCircle size={15} /> Developer Dashboard</li>
                <li><CheckCircle size={15} /> Mobile Friendly</li>
                <li><CheckCircle size={15} /> Advanced Filters</li>
              </ul>
            </div>

            {/* CONTACT */}
            <div className="card contact-card">
              <h3>Get In Touch</h3>

              <div className="contact-row">
                <div className="icon-badge purple">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="contact-main">+1 (866) 093-449X</p>
                  <p className="contact-sub">Available 24/7</p>
                </div>
              </div>

              <div className="contact-row">
                <div className="icon-badge pink">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="contact-main">support@compareprojects.com</p>
                  <p className="contact-sub">Response within 24 hours</p>
                </div>
              </div>

              <div className="contact-row">
                <div className="icon-badge purple">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <p className="contact-main">Live Chat</p>
                  <p className="contact-sub">Available from dashboard</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
