import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import { Menu, X, Users, Plus, ChevronRight, Scale } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { menuItems } from "../../database/menuData";
import {HeaderAuthSection} from "./Headercomponents/HeaderAuthSection"

import CitySelector from "./Headercomponents/CitySelector";

import { useHeaderMenu } from "./hooks/useHeaderMenu";
import { useHeaderScroll } from "./hooks/useHeaderScroll";
import { useOutsideClick } from "../../hooks/useOutsideClick";

import { useCompare } from "../../contexts/CompareContext";

import CompareBar from "../../pages/Home/HomePageComponents/CompareBar";
const DeveloperPopup = lazy(() =>import("../Popups/DeveloperPopup"));

function Header() { 
  const { isMenuOpen, toggleMenu, closeMenu, setIsMenuOpen } = useHeaderMenu();
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [showDeveloperPopup, setShowDeveloperPopup] = useState(false);
  const [showCompareBar, setShowCompareBar] = useState(false);
  const isScrolled = useHeaderScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const { compareList, removeFromCompare, setCompareList } = useCompare();
  const prevCompareLengthRef = useRef(compareList.length);

  useOutsideClick(isMenuOpen, [menuRef, menuButtonRef], closeMenu);

  useEffect(() => {
  if (compareList.length > prevCompareLengthRef.current) {
    setShowCompareBar(true);
  }
  prevCompareLengthRef.current = compareList.length;
}, [compareList.length]);

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
  }, [location.pathname, navigate, setIsMenuOpen]);

  // Handle navigation for menu items
  const handleNavigation = useCallback((path) => {
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
    setIsMenuOpen(false);
  }, [location.pathname, navigate, setIsMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, setIsMenuOpen]);


  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
    navigate("/");
  }, [logout, navigate, setIsMenuOpen]);

  return (
    <>

    
      <Suspense fallback={null}>
        <DeveloperPopup
          isOpen={showDeveloperPopup}
          onClose={() => setShowDeveloperPopup(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CompareBar
          compareList={compareList}
          removeFromCompare={removeFromCompare}
          setCompareList={setCompareList}
          isOpen={showCompareBar}
          onClose={() => setShowCompareBar(false)}
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
              src="/logo.webp"
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
  {/* Main Navigation Links - Desktop & Mobile */}
  <li className="header-nav-center">
    <ul className="nav-group">
      <li>
        <button className="header-nav-link" onClick={() => handleScrollToSection("homee")}>
          Home
        </button>
      </li>
      <li>
        <Link to="/properties" className="header-nav-link" onClick={closeMenu}>
          Properties
        </Link>
      </li>
      <li>
        <button className="header-nav-link" onClick={() => handleScrollToSection("contact")}>
          Contact
        </button>

        <button className="header-nav-link" onClick={() => handleScrollToSection("contact")}>
          Compare Rentals
        </button>
      </li>
    </ul>
  </li>

  {/* Mobile-only Menu Items Section */}
  <li className="mobile-navbar-items">
    <div className="mobile-section-divider">
      <span>Quick Links</span>
    </div>
    <ul className="nav-group">
      {menuItems.map((item) => (
        <li key={item.name} className="mobile-nav-item">
          <button 
            className="header-nav-link mobile-nav-link"
            onClick={() => handleNavigation(item.path)}
          >
            <span>{item.name}</span>
            <ChevronRight size={16} className="mobile-nav-arrow" />
          </button>
        </li>
      ))}
    </ul>
  </li>

  {/* Right Nav - Actions */}
  <li className="nav-right">
    <ul className="nav-group">
      <li>
        <button
          className="compare-popup-btn"
          onClick={() => setShowCompareBar((prev) => !prev)}
          aria-label={`Compare properties (${compareList.length} selected)`}
        >
          {compareList.length > 0 && (
            <span className="compare-count-bubble">{compareList.length}</span>
          )}
          <Scale size={23} />
        </button>
      </li>
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
        <Link to="/login" className="nav-link-developers" onClick={closeMenu}>
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