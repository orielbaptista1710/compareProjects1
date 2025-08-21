import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Footer.css';
import banner from '../images/banner.jpg';
import logo from '../images/logo.png';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYoutube, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

const footerTabs = ['RESIDENTIAL', 'INDUSTRIAL', 'COMMERCIAL', 'RETAIL', 'PLOT', 'POPULAR SEARCHES'];

const Footer = () => {
  const [tabData, setTabData] = useState({});
  const [activeTab, setActiveTab] = useState('POPULAR SEARCHES');

  useEffect(() => {
    const fetchTabData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/properties/localities-by-type');
        setTabData(res.data); 
      } catch (err) {
        console.error("Error fetching localities by type", err);
      }
    };
    fetchTabData();
  }, []);

  const renderTabContent = () => {
    if (activeTab === 'POPULAR SEARCHES') {
      return (
        <>
          <h4 className="footer-title">Other property related searches</h4>
          <div className="footer-grid">
             <ul>
              <li>Convert square meter to square feet</li>
              <li>Convert square feet to square meter</li>
              <li>Convert acre to square feet</li>
              <li>Convert square feet to acre</li>
              <li>Convert hectare to acre feet</li>
              <li>Convert hectare to square meter</li>
              <li>Convert acre to hectare</li>
            </ul>
            <ul>
              <li>Mumbai pin code</li>
              <li>Bengaluru pin code</li>
              <li>Hyderabad pin code</li>
              <li>Pune pin code</li>
              <li>Chennai pin code</li>
              <li>Delhi pin code</li>
              <li>Gurgaon pin code</li>
            </ul>
            <ul>
              <li>Noida pin code</li>
              <li>Kolkata pin code</li>
              <li>Ahmedabad pin code</li>
              <li>Thane pin code</li>
              <li>Navi Mumbai pin code</li>
              <li>Faridabad pin code</li>
              <li>Ghaziabad pin code</li>
            </ul>
            <ul>
              <li>List of all residential cities</li>
              <li>List of all cities for rentals</li>
              <li>Explore localities by city</li>
              <li>Explore rental localities by city</li>
              <li>Find projects by city</li>
              <li>Find rental societies by city</li>
            </ul>
            
          </div>
        </>
      );
    }

    const key = activeTab.toLowerCase();
    const localities = tabData[key];

    if (localities && localities.length > 0) {
      return (
        <>
          <h4 className="footer-title">{activeTab} Localities</h4>
          <ul className="property-type-list">
            {localities.map((loc, idx) => (
               <li key={idx}>
                Properties in {loc}
                </li>
            ))}
          </ul>
        </>
      );
    }

    return <p className="tab-placeholder">Loading {activeTab.toLowerCase()} data...</p>;
  };

  return (
    <footer className="footer">
      {/* Logo and Tabs */}
      <div className="footer-top-row">
        <img src={logo} alt="Logo" className="footer-logo" />
        <div className="footer-tabs">
          {footerTabs.map(tab => (
            <div
              key={tab}
              className={`footer-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="footer-searches animate-fade">
         {renderTabContent()}
      </div>

      {/* Bottom Section */}
      <div className="footer-bottom">
        <div className="footer-banner">
          <img src={banner} alt="Great Place to Work" />
        </div>

        <div className="footer-columns">
          <div>
            <h5>COMPANY</h5>
            <ul>
              <li>Properties</li>
              <li>About Us</li>
              <li>Terms</li>
              <li>Compare Projects</li>
              <li>For Developers</li>
              <li>Testimonials</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <h5>EXPLORE</h5>
            <ul>
              <li>News</li>
              <li>Home Loans</li>
              <li>Sitemap</li>
              <li>AI Explorer</li>
            </ul>
          </div>
          <div className="footer-social">
            <h5>FOLLOW</h5>
            <div className="footer-icons">
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faYoutube} size="lg" />
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faLinkedinIn} size="lg" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-copy">©2025 Compare Projects Pvt. Ltd</div>
    </footer>
  );
};

export default Footer;
