import { Link } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";
import "./HeaderAuthSection.css";
import { ReactComponent as ProfileIcon } from "../../../assests/icons/profile-circle.svg";

export function HeaderAuthSection({
  currentUser,
  loading,
  onLogout,
  closeMenu,
}) {
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

  return (
    <div className="profile-dropdown-wrapper">
      <button
        className="profile-trigger-btn"
        type="button"
        aria-haspopup="menu"
        aria-expanded="false"
      >
        <span className="profile-avatar">
          {currentUser.customerName?.[0] ||
            currentUser.customerEmail?.[0] ||
            "U"}
        </span>

        <span className="profile-name">
          {currentUser.displayName || "My Account"}
        </span>

        <ChevronDown size={16} />
      </button>

      <div className="profile-dropdown-menu" role="menu">
        <Link to="/customer-profile" onClick={closeMenu} role="menuitem">
          <User size={18} /> My Profile
        </Link>

        <button onClick={onLogout} role="menuitem">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}