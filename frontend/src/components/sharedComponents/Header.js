import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import { Menu, X, Users, ChevronDown, User, LogOut, Plus } from "lucide-react";
import DeveloperPopup from "./DeveloperPopup";
import { AuthContext } from "../../contexts/AuthContext";
import { menuItems } from "../../database/menuData";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [showDeveloperPopup, setShowDeveloperPopup] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Toggle menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Scroll to section handler
  const handleScrollToSection = useCallback((section) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const target = document.getElementById(section);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const target = document.getElementById(section);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setIsMenuOpen(false);
  }, [location.pathname, navigate]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Track window resize
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
        if (window.innerWidth > 1199 && isMenuOpen) {
          setIsMenuOpen(false);
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
    navigate("/");
  }, [logout, navigate]);

  return (
    <>
      <DeveloperPopup 
        isOpen={showDeveloperPopup}
        onClose={() => setShowDeveloperPopup(false)}
      />
      
      <header 
        id="home" 
        className={`header ${isScrolled ? 'scrolled' : ''}`} 
        role="banner"
      >
        <nav className="header-navbar" role="navigation" aria-label="Main navigation">
          {/* Logo */}
          <div className="header-logo">
            <img
              className="logo-img-header"
              src="/imageslcp/logo.webp"
              alt="Company Logo"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onClick={() => handleScrollToSection("homee")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleScrollToSection("homee");
                }
              }}
              role="button"
              tabIndex={0}
            />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            ref={menuButtonRef}
            className="header-menu-icon"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-controls="main-navigation"
            type="button"
          >
            {isMenuOpen ? (
              <X size={24} strokeWidth={2} />
            ) : (
              <Menu size={24} strokeWidth={2} />
            )}
          </button>

        {/* //the menu navigation */}
          {/* Navigation Items */}
          <ul
            ref={menuRef}
            id="main-navigation"
            className={`header-nav-items ${isMenuOpen ? "show-menu" : ""}`}
            role="menu"
          >
            {/* Center Navigation */}
            <div className="header-nav-center">
              <li role="none">
                <button
                  className="header-nav-link"
                  onClick={() => handleScrollToSection("homee")}
                  role="menuitem"
                  type="button"
                >
                  Home
                </button>
              </li>
              <li role="none">
                <Link
                  to="/properties"
                  className="header-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                  role="menuitem"
                >
                  Properties
                </Link>
              </li>
              <li role="none">
                <button
                  className="header-nav-link"
                  onClick={() => handleScrollToSection("contact")}
                  role="menuitem"
                  type="button"
                >
                  Contact
                </button>
              </li>

              {/* Extra links in mobile menu */}
              {isMenuOpen && windowWidth <= 1199 && (
                <>
                  <li className="menu-divider" role="separator" aria-hidden="true"></li>
                  <div className="extra-links">
                    {menuItems.map((item) => (
                      <li key={item.name} role="none">
                        {item.type === "external" ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="header-nav-link"
                            onClick={() => setIsMenuOpen(false)}
                            role="menuitem"
                          >
                            {item.name}
                          </a>
                        ) : (
                          <Link
                            to={item.path}
                            className="header-nav-link"
                            onClick={() => setIsMenuOpen(false)}
                            role="menuitem"
                          >
                            {item.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right Side Navigation */}
            <div className="nav-right">
              {/* Post Property Button */}
              <li role="none">
                <button
                  className="post-property-btn"
                  onClick={() => {
                    setShowDeveloperPopup(true);
                    setIsMenuOpen(false);
                  }}
                  aria-label="Post your property"
                  type="button"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>POST PROPERTY</span>
                </button>
              </li>

              {/* Auth Section */}
              <div className="header-auth-section">
                {loading ? (
                  <li className="loading-text" role="status" aria-live="polite">
                    <span className="sr-only">Loading...</span>
                    <span className="loading-spinner"></span>
                    <span>Loading...</span>
                  </li>
                ) : !currentUser ? (
                  <li role="none">
                    <Link
                      to="/customer-login"
                      className="customer-login-btn"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Customer login"
                    >
                      Login
                    </Link>
                  </li>
                ) : (
                  <li className="profile-dropdown-wrapper" role="none">
                    <button
                      className="profile-trigger-btn"
                      aria-label="User profile menu"
                      aria-haspopup="true"
                      type="button"
                    >
                      <span className="profile-avatar">
                        {currentUser.displayName?.[0]?.toUpperCase() || 
                         currentUser.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                      <span className="profile-name">
                        {currentUser.displayName || 'My Account'}
                      </span>
                      <ChevronDown size={16} className="dropdown-arrow" />
                    </button>
                    <div className="profile-dropdown-menu">
                      <Link
                        to="/customer-profile"
                        className="dropdown-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User size={18} />
                        <span>My Profile</span>
                      </Link>
                      <button
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                        type="button"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </li>
                )}

                {/* Developers Login */}
                <li className="nav-dev-item" role="none">
                  <Link
                    to="/login"
                    className="nav-link-developers"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Developers login"
                  >
                    <Users size={18} strokeWidth={2} />
                    <span>Developers</span>
                  </Link>
                </li>
              </div>
            </div>
          </ul>

          {/* Mobile Overlay */}
          {isMenuOpen && (
            <div
              className="header-menu-overlay"
              onClick={toggleMenu}
              role="presentation"
              aria-hidden="true"
            ></div>
          )}
        </nav>
      </header>
    </>
  );
}

export default Header;