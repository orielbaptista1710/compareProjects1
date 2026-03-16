import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import "./Footer.css";
import API from '../../api';

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
};

const Footer = () => {
  const [tabData, setTabData] = useState({});
  const [activeTab, setActiveTab] = useState("POPULAR SEARCHES");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
  const fetchLocalities = async () => {
    try {

      const res = await API.get("/api/discover/localities");

      console.log("Footer API response:", res.data);

      if (res?.data?.success) {
        setTabData(res.data.data);
      } else {
        setError(true);
      }

    } catch (err) {
      console.error("Footer API error:", err);
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
    if (activeTab === "POPULAR SEARCHES") {
      return (
        <>
          <h4 className="footer-title">Popular Property Searches</h4>

          <ul className="property-type-list">
            {[
              "2 BHK Flats in Mumbai",
              "3 BHK Flats in Thane",
              "Luxury Apartments in Navi Mumbai",
              "Office Spaces in Andheri",
              "Plots in Panvel",
              "Flats in Mira Road",
            ].map((item, i) => (
              <li key={i}>
                <a href="/properties">{item}</a>
              </li>
            ))}
          </ul>
        </>
      );
    }

    if (error) {
      return (
        <p className="error-message">
          Unable to load data right now.
        </p>
      );
    }

    if (loading) {
      return (
        <p className="tab-placeholder">
          Loading {activeTab.toLowerCase()} data...
        </p>
      );
    }

    const apiKey = apiKeyMap[activeTab];
    const values = tabData[apiKey];

    if (!values?.length) {
      return (
        <p className="tab-placeholder">
          No {activeTab.toLowerCase()} data available.
        </p>
      );
    }

    return (
      <>
        <h4 className="footer-title">{activeTab} Localities</h4>

        <ul className="property-type-list">
          {values.map((loc, i) => (
            <li key={i}>
  <a href={`/properties?locality=${encodeURIComponent(loc)}`}>
    Properties in {loc}
  </a>
</li>
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
          alt="Compare Projects"
        />

        <div className="footer-tabs">
          {footerTabs.map((tab) => (
            <div
              key={tab}
              className={`footer-tab ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-searches animate-fade">
        {tabContent}
      </div>

      <div className="footer-bottom">
        <div className="footer-columns">
          <div className="footer-column">
            <h5>COMPANY</h5>
            <ul>
              <li><a href="/properties">Properties</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/compare">Compare Projects</a></li>
              <li><a href="/developers">For Developers</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>EXPLORE</h5>
            <ul>
              <li><a href="/news">News</a></li>
              <li><a href="/home-loans">Home Loans</a></li>
              <li><a href="/sitemap.xml">Sitemap</a></li>
              <li><a href="/ai-explorer">AI Explorer</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>CONTACT</h5>

            <ul className="footer-contact-list">
              <li>
                <Phone size={16} />
                <a href="tel:+919999999999">
                  +91 9999 999 999
                </a>
              </li>

              <li>
                <Mail size={16} />
                <a href="mailto:info@compareprojects.com">
                  info@compareprojects.com
                </a>
              </li>

              <li>
                <MapPin size={16} />
                <span>Mumbai, Maharashtra</span>
              </li>
            </ul>
          </div>

          <div className="footer-column footer-social">
            <h5>FOLLOW US</h5>

            <div className="footer-icons">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube size={24} />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-copy">
        <p>
          © {new Date().getFullYear()} Compare Projects Pvt.
          Ltd.
        </p>
      </div>
    </footer>
  );
};

export default Footer;