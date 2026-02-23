//CHECK THIS -- ON REFREST LOSE LOGIN- IF I USE CLERK WILL I LOSE MY CSS???/
// HeaderAuthSection.js
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import "./HeaderAuthSection.css";
import { ReactComponent as ProfileIcon } from "../../../assests/icons/profile-circle.svg";

export function HeaderAuthSection({ currentUser, loading, onLogout, closeMenu }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click — uses your existing hook
  useOutsideClick(dropdownOpen, [wrapperRef], () => setDropdownOpen(false));

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout();
  };

  const handleClose = () => {
    setDropdownOpen(false);
    closeMenu();
  };

  if (loading) {
    return <span className="loading-text">Loading...</span>;
  }

  if (!currentUser) {
    return (
      <Link
        to="/customer-login"
        onClick={closeMenu}
        className="profile-icon-link"
        aria-label="Login or Sign up"
      >
        <span className="profile-icon-wrapper">
          <ProfileIcon className="profile-svg-icon" />
        </span>
      </Link>
    );
  }

  const initials =
    currentUser.customerName?.[0] ||
    currentUser.customerEmail?.[0] ||
    "U";

  const displayName = currentUser.displayName || "My Account";

  return (
    <div className="profile-dropdown-wrapper" ref={wrapperRef}>
      <button
        className="profile-trigger-btn"
        type="button"
        onClick={() => setDropdownOpen((p) => !p)}
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        aria-label="Account menu"
      >
        <span className="profile-avatar" aria-hidden="true">
          {initials.toUpperCase()}
        </span>
        <span className="profile-name">{displayName}</span>
        <ChevronDown
          size={16}
          className={`profile-chevron ${dropdownOpen ? "profile-chevron--open" : ""}`}
        />
      </button>

      {dropdownOpen && (
        <div className="profile-dropdown-menu" role="menu">
          <div className="profile-dropdown-header">
            <span className="profile-dropdown-name">{displayName}</span>
            <span className="profile-dropdown-email">
              {currentUser.customerEmail || ""}
            </span>
          </div>

          <div className="profile-dropdown-items">
            <Link
              to="/customer-profile"
              onClick={handleClose}
              role="menuitem"
              className="profile-dropdown-item"
            >
              <User size={16} strokeWidth={1.5} />
              My Profile
            </Link>

            <button
              onClick={handleLogout}
              role="menuitem"
              className="profile-dropdown-item profile-dropdown-item--danger"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}