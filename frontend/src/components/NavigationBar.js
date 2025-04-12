import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NavigationBar.css";

const NavigationBar = () => {
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("Residential");
  const [hoveredTab, setHoveredTab] = useState(null);
  const navigate = useNavigate();

  // Fetch properties from MongoDB
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/properties");
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchProperties();
  }, []);

  // Extract unique property types
  const tabs = [...new Set(properties.map((property) => property.type))];

  // Function to get localities for a specific property type
  const getLocalities = (tab) => {
    return [
      ...new Set(
        properties
          .filter((property) => property.type === tab)
          .map((property) => property.locality)
      ),
    ];
  };

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/properties?type=${tab}`);
  };

  // Handle locality click
  const handleLocalityClick = (tab, locality) => {
    navigate(`/properties?type=${tab}&locality=${locality}`);
  };

  return (
    <div className="navigation-bar">
      <div className="tab-container">
        {tabs.map((tab) => {
          const localities = getLocalities(tab);

          return (
            <div
              key={tab}
              className="tab-wrapper"
              onMouseEnter={() => setHoveredTab(tab)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                className={`tab-button ${activeTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>

              {/* Smooth dropdown animation */}
              <div className={`dropdown ${hoveredTab === tab ? "show" : ""}`}>
                {localities.map((locality) => (
                  <div
                    key={locality}
                    className="dropdown-item"
                    onClick={() => handleLocalityClick(tab, locality)}
                  >
                    Properties in {locality}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationBar;
