import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './NavigationBar.css';

const NavigationBar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Apna Loan', type: 'internal', path: '/apnaloan' },
    { name: 'EMI Calculator', type: 'internal', path: '/apnaloan#calculator' },
    { name: 'Compare Now', type: 'internal', path: '/compare' },
    { name: 'Home Interiors', type: 'internal', path: '/interior'},
    { name: 'Property Guide', type: 'external', url: 'https://www.google.com'},
    { name: 'Support & Help', type: 'internal', path: '/supportHelp' }
  ];

  const handleMouseEnter = (index) => setActiveDropdown(index);
  const handleMouseLeave = () => setActiveDropdown(null);

  const handleExternalLink = (url) => {
    window.open(url, '_blank');
  };

  // Function to handle navigation with anchor links
  const handleNavigation = (path) => {
    // Check if the path contains an anchor link
    if (path.includes('#')) {
      const [route, anchor] = path.split('#');
      
      // If we're already on the same page, just scroll to the anchor
      if (location.pathname === route) {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to the page first, then scroll to the anchor
        navigate(route, { state: { scrollTo: anchor } });
      }
    } else {
      // Regular navigation
      navigate(path);
    }
  };

  // Function to check if we need to scroll to an anchor after navigation
  React.useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          // Clear the state to prevent scrolling on every render
          window.history.replaceState({}, document.title);
        }, 100);
      }
    }
  }, [location]);

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
                  <span 
                    className="nav-linkk"
                    onClick={() => handleNavigation(item.path)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.name}
                  </span>
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