import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './NavigationBar.css';

const NavigationBar = () => {
  const [propertyTypes, setPropertyTypes] = useState([
    { name: 'Residential', localities: [] },
    { name: 'Industrial', localities: [] },
    { name: 'Commercial', localities: [] },
    { name: 'Plot', localities: [] },
    { name: 'Retail', localities: [] }
  ]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch localities for each property type from MongoDB
  useEffect(() => {
    const fetchLocalities = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/properties/localities-by-type');
        setPropertyTypes(prevTypes => 
          prevTypes.map(type => ({
            ...type,
            localities: response.data[type.name.toLowerCase()] || []
          }))
        );
      } catch (error) {
        console.error('Error fetching localities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocalities();
  }, []);

  const handleMouseEnter = (index) => {
    setActiveDropdown(index);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-centerr">
          <ul className="nav-menu">
            {propertyTypes.map((type, index) => (
              <li 
                key={type.name}
                className="nav-item property-type"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <span className="nav-linkk">
                  {type.name}
                </span>
                
                {activeDropdown === index && (
                  <div className="dropdown-menu">
                    {loading ? (
                      <div className="dropdown-loading">Loading localities...</div>
                    ) : (
                      <>
                        {type.localities.length > 0 ? (
                          type.localities.map(locality => (
                            <Link 
                              key={locality}
                              to={`/properties?type=${type.name.toLowerCase()}&locality=${encodeURIComponent(locality)}`}
                              className="dropdown-item"
                            >
                             Properties in{locality}
                            </Link>
                          ))
                        ) : (
                          <div className="dropdown-empty">No localities found</div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}

            <li className="nav-item">
              <Link to="/advice" className="nav-link">Advice</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;