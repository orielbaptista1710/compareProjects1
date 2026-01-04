import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import { Menu, X, Users, Plus } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { menuItems } from "../../database/menuData";
import {HeaderAuthSection} from "../Header/Headercomponents/HeaderAuthSection"

import CitySelector from "./Headercomponents/CitySelector";

import { useHeaderMenu } from "../Header/hooks/useHeaderMenu";
import { useHeaderScroll } from "./hooks/useHeaderScroll";
import { useHeaderResize } from "./hooks/useHeaderResize";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const DeveloperPopup = lazy(() =>import("../Popups/DeveloperPopup"));


function Header() {
  const { isMenuOpen, toggleMenu, closeMenu, setIsMenuOpen } = useHeaderMenu();
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [showDeveloperPopup, setShowDeveloperPopup] = useState(false);
  const windowWidth = useHeaderResize(1199, closeMenu);
  const isScrolled = useHeaderScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useOutsideClick(isMenuOpen, [menuRef, menuButtonRef], closeMenu);

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


  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);


  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
    navigate("/");
  }, [logout, navigate]);

  return (
    <>

    
      <Suspense fallback={null}>
        <DeveloperPopup
          isOpen={showDeveloperPopup}
          onClose={() => setShowDeveloperPopup(false)}
        />
      </Suspense>

      
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
            <CitySelector />
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

        <ul
  ref={menuRef}
  id="main-navigation"
  className={`header-nav-items ${isMenuOpen ? "show-menu" : ""}`}
>
  <li className="header-nav-center">
    <ul className="nav-group">
      <li>
        <button className="header-nav-link" onClick={() => handleScrollToSection("homee")}>
          Home
        </button>
      </li>
      <li>
        <Link to="/properties" className="header-nav-link">
          Properties
        </Link>
      </li>
      <li>
        <button className="header-nav-link" onClick={() => handleScrollToSection("contact")}>
          Contact
        </button>
      </li>
    </ul>
  </li>

  <li className="nav-right">
    <ul className="nav-group">
      <li>
        <button className="post-property-btn" onClick={() => setShowDeveloperPopup(true)}>
          <Plus size={18} />
          POST PROPERTY
        </button>
      </li>

      <li className="header-auth-section">
        <HeaderAuthSection
          currentUser={currentUser}
          loading={loading}
          onLogout={handleLogout}
          closeMenu={closeMenu}
        />
      </li>

      <li className="nav-dev-item">
        <Link to="/login" className="nav-link-developers">
          <Users size={18} />
          Developers
        </Link>
      </li>
    </ul>
  </li>
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