import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const menuItems = [
    { name: 'ApnaLoan', type: 'external', url: 'https://www.google.com' },
    { name: 'EMI Calculator', type: 'external', url: 'https://www.emicalculator.net' },
    { name: 'Compare Now', type: 'internal', path: '/compare' },
    { name: 'Support & Help', type: 'internal', path: '/supportHelp' }
  ];

  const handleMouseEnter = (index) => setActiveDropdown(index);
  const handleMouseLeave = () => setActiveDropdown(null);

  const handleExternalLink = (url) => {
    window.open(url, '_blank');
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-centerr">
          <ul className="nav-menu">
            {menuItems.map((item, index) => (
              <li 
                key={item.name}
                className="nav-bar-item"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                {item.type === 'external' ? (
                  <span 
                    className="nav-linkk external-link"
                    onClick={() => handleExternalLink(item.url)}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link to={item.path} className="nav-linkk">
                    {item.name}
                  </Link>
                )}

                {activeDropdown === index && item.items && (
                  <div className="dropdown-menu">
                    {item.items.map((subItem) => (
                      <Link 
                        key={subItem.path}
                        to={subItem.path}
                        className="dropdown-item"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
