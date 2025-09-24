import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './NavigationBar.css';
import { menuItems } from "../database/menuData";

const NavigationBar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleMouseEnter = (index) => setActiveDropdown(index);
  const handleMouseLeave = () => setActiveDropdown(null);

  const handleExternalLink = (url) => {
    window.open(url, '_blank');
  };

  const handleNavigation = (path) => {
    if (path.includes('#')) {
      const [route, anchor] = path.split('#');

      if (location.pathname === route) {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(route, { state: { scrollTo: anchor } });
      }
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.replaceState({}, document.title); // clears scroll state
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
