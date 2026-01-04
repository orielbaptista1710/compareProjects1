import { Link } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";
import "./HeaderAuthSection.css";

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
      <Link to="/customer-login" onClick={closeMenu}>
        Login
      </Link>
    );
  }

  return (
    <div className="profile-dropdown-wrapper">
      <button className="profile-trigger-btn">
        <span className="profile-avatar">
          {currentUser.displayName?.[0] ||
            currentUser.email?.[0] ||
            "U"}
        </span>
        <span className="profile-name">
          {currentUser.displayName || "My Account"}
        </span>
        <ChevronDown size={16} />
      </button>

      <div className="profile-dropdown-menu">
        <Link to="/customer-profile" onClick={closeMenu}>
          <User size={18} /> My Profile
        </Link>
        <button onClick={onLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
