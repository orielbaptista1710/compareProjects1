import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers  } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";
import DeveloperPopup from "../components/DeveloperPopup";
import { AuthContext } from "../contexts/AuthContext";
import { menuItems } from "../database/menuData";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, loading } = useContext(AuthContext);
  const [showDeveloperPopup, setShowDeveloperPopup] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleScrollToSection = (section) => {
    navigate("/");
    setIsMenuOpen(false);
    setTimeout(() => {
      const target = document.getElementById(section);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        !event.target.closest(".header-nav-items") &&
        !event.target.closest(".header-menu-icon")
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header id="home" className="header">
      {/* DeveloperPopup */}
      <DeveloperPopup
        isOpen={showDeveloperPopup}
        onClose={() => setShowDeveloperPopup(false)}
      />

      <nav className="header-navbar">
        {/* Logo */}
        <div className="header-logo">
          <img
            className="logo-img-header"
            src="/imageslcp/logo.webp"
            alt="Logo"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            onClick={() => handleScrollToSection("homee")}
          />

        </div>

        {/* Mobile Menu Icon */}
        <div
          className="header-menu-icon"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <FontAwesomeIcon icon={faTimes} /> : "☰"}
        </div>

        {/* Nav Items */}
        <ul className={`header-nav-items ${isMenuOpen ? "show-menu" : ""}`}>
          <div className="header-nav-center">
            {/* Always visible links */}
            <li>
              <button
                className="header-nav-link nav-hover"
                onClick={() => handleScrollToSection("homee")}
              >
                Home
              </button>
            </li>
            <li>
              <Link
                to="/properties"
                className="header-nav-link nav-hover"
                onClick={() => setIsMenuOpen(false)}
              >
                Properties
              </Link>
            </li>
            <li>
              <button
                className="header-nav-link nav-hover"
                onClick={() => handleScrollToSection("contact")}
              >
                Contact
              </button>
            </li>

            {/* Extra items only in responsive menu (≤ 992px) */}
            {/* Extra items (only visible on mobile/tablet) */}
{isMenuOpen && windowWidth <= 992 && (
  <ul className="extra-links">
    {menuItems.map((item) => (
      <li key={item.name}>
        {item.type === "external" ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="header-nav-link nav-hover"
            onClick={() => setIsMenuOpen(false)}
          >
            {item.name}
          </a>
        ) : (
          <Link
            to={item.path}
            className="header-nav-link nav-hover"
            onClick={() => setIsMenuOpen(false)}
          >
            {item.name}
          </Link>
        )}
      </li>
    ))}
  </ul>
)}

          </div>

          <div className="nav-right">
            {/* POST PROPERTY BUTTON */}
            <button
              className="post-property-btn"
              onClick={() => setShowDeveloperPopup(true)}
            >
              POST PROPERTY?
            </button>

            {loading ? (
              <li className="loading-text">Loading...</li>
            ) : !currentUser ? (
              <li>
                <Link
                  to="/customer-login"
                  className="customer-login-btn"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  to="/customer-dashboard"
                  className="signup-btn"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
              </li>
            )}

            {/* Developer Login */}
            <li className="nav-dev-item">
              <Link
                to="/login"
                className="nav-link-deveopers"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="header-nav-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                <span className="popup-text">Developers Login</span>
              </Link>
            </li>
          </div>
        </ul>

        {/* Overlay for mobile menu */}
        {isMenuOpen && (
          <div
            className="header-menu-overlay-bg"
            onClick={toggleMenu}
          ></div>
        )}
      </nav>
    </header>
  );
}

export default Header;
