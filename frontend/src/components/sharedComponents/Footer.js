import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import "./Footer.css";
import API from "../../api";

const footerTabs = [
  "RESIDENTIAL",
  "INDUSTRIAL",
  "COMMERCIAL",
  "RETAIL",
  "PLOT",
  "POPULAR SEARCHES",
];

const apiKeyMap = {
  RESIDENTIAL: "residential",
  INDUSTRIAL: "industrial",
  COMMERCIAL: "commercial",
  RETAIL: "retail",
  PLOT: "plot",
  "POPULAR SEARCHES": "popular",
};


const Footer = () => {
  const [tabData, setTabData] = useState({});
  const [activeTab, setActiveTab] = useState("POPULAR SEARCHES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch once on mount
  useEffect(() => {
    const fetchLocalities = async () => {
      try {
        const res = await API.get("/api/discover");
        if (res?.data && typeof res.data === "object") {
          setTabData(res.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching localities:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLocalities();
  }, []);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const tabContent = useMemo(() => {
    const apiKey = apiKeyMap[activeTab];

    // Popular Searches is static
    if (activeTab === "POPULAR SEARCHES") {
      return (
        <>
          <h4 className="footer-title">Other property related searches</h4>
          <div className="footer-grid">
            {/* 4 columns */}
            {[
              [
                "Convert square meter to square feet",
                "Convert square feet to square meter",
                "Convert acre to square feet",
                "Convert square feet to acre",
                "Convert hectare to acre feet",
                "Convert hectare to square meter",
                "Convert acre to hectare",
              ],
              [
                "Mumbai pin code",
                "Bengaluru pin code",
                "Hyderabad pin code",
                "Pune pin code",
                "Chennai pin code",
                "Delhi pin code",
                "Gurgaon pin code",
              ],
              [
                "Noida pin code",
                "Kolkata pin code",
                "Ahmedabad pin code",
                "Thane pin code",
                "Navi Mumbai pin code",
                "Faridabad pin code",
                "Ghaziabad pin code",
              ],
              [
                "List of all residential cities",
                "List of all cities for rentals",
                "Explore localities by city",
                "Explore rental localities by city",
                "Find projects by city",
                "Find rental societies by city",
              ],
            ].map((col, i) => (
              <ul key={i}>
                {col.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ))}
          </div>
        </>
      );
    }

    // Error UI
    if (error) {
      return (
        <p className="error-message">
          Unable to load data at the moment. Please try again later.
        </p>
      );
    }

    // Loading UI
    if (loading) {
      return (
        <p className="tab-placeholder">
          Loading {activeTab.toLowerCase()} data...
        </p>
      );
    }

    const values = tabData[apiKey];

    if (!values?.length) {
      return (
        <p className="tab-placeholder">
          No {activeTab.toLowerCase()} data available at the moment.
        </p>
      );
    }

    return (
      <>
        <h4 className="footer-title">{activeTab} Localities</h4>
        <ul className="property-type-list">
          {values.map((loc, i) => (
            <li key={i}>Properties in {loc}</li>
          ))}
        </ul>
      </>
    );
  }, [activeTab, tabData, loading, error]);

  return (
    <footer className="footer">
      <div className="footer-top-row">
        <img
          className="footer-logo"
          src="/images/logo.webp"
          alt="Compare Projects Logo"
        />

        <div className="footer-tabs">
          {footerTabs.map((tab) => (
            <div
              key={tab}
              className={`footer-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-searches animate-fade">{tabContent}</div>

      {/* Bottom Section */}
      <div className="footer-bottom">
        <div className="footer-columns">
          {/* Company column */}
          <div className="footer-column">
            <h5>COMPANY</h5>
            <ul>
              <li><a href="/properties">Properties</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/terms">Terms & Conditions</a></li>
              <li><a href="/compare">Compare Projects</a></li>
              <li><a href="/developers">For Developers</a></li>
              <li><a href="/testimonials">Testimonials</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

          {/* Explore */}
          <div className="footer-column">
            <h5>EXPLORE</h5>
            <ul>
              <li><a href="/news">News</a></li>
              <li><a href="/home-loans">Home Loans</a></li>
              <li><a href="/sitemap">Sitemap</a></li>
              <li><a href="/ai-explorer">AI Explorer</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-column">
            <h5>CONTACT</h5>
            <ul className="footer-contact-list">
              <li>
                <Phone size={16} /> <a href="tel:+919999999999">+91 9999 999 999</a>
              </li>
              <li>
                <Mail size={16} /> <a href="mailto:info@compareprojects.com">info@compareprojects.com</a>
              </li>
              <li>
                <MapPin size={16} /> <span>Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="footer-column footer-social">
            <h5>FOLLOW US</h5>
            <div className="footer-icons">
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                <Youtube size={24} />
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-copy">
        <p>© {new Date().getFullYear()} Compare Projects Pvt. Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
