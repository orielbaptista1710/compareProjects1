// DeveloperDashboardComponents/DashboardNav.jsx
import React, { useState, useCallback } from "react";
import {
  AddCircleOutlined as AddCircleIcon,
  ListAlt as ListAltIcon,
  HeadsetMic as HeadsetIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import "./DashboardNav.css";

const NAV_ITEMS = [
  { id: "sell",       label: "Sell Property",  Icon: AddCircleIcon },
  { id: "properties", label: "My Properties",  Icon: ListAltIcon   },
  { id: "support",    label: "Support / Help", Icon: HeadsetIcon   },
];

const DashboardNav = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = useCallback((id) => {
    setActiveTab(id);
    setMobileOpen(false);
  }, [setActiveTab]);

  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "D";

  const NavContent = (
    <div className="dnav__inner">

      <div className="dnav__header">
        <span className="dnav__portal-label">Developer Portal</span>
        <div className="dnav__avatar">{initials}</div>
        <p className="dnav__name">{user?.displayName || "Developer"}</p>
        <p className="dnav__role">CompareProjects Partner</p>
      </div>

      <nav className="dnav__body">
        <span className="dnav__group-label">Navigation</span>
        <ul className="dnav__list">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <li key={id}>
              <button
                className={`dnav__item${activeTab === id ? " dnav__item--active" : ""}`}
                onClick={() => handleNav(id)}
              >
                <span className="dnav__item-indicator" aria-hidden="true" />
                <Icon className="dnav__item-icon" fontSize="small" />
                <span className="dnav__item-label">{label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="dnav__divider" />

        <ul className="dnav__list">
          <li>
            <button
              className="dnav__item dnav__item--logout"
              onClick={handleLogout}
            >
              <span className="dnav__item-indicator" aria-hidden="true" />
              <LogoutIcon className="dnav__item-icon" fontSize="small" />
              <span className="dnav__item-label">Log Out</span>
            </button>
          </li>
        </ul>
      </nav>

    </div>
  );

  return (
    <>
      {/* Always rendered — CSS shows/hides it via media query */}
      <button
        className="dnav__hamburger"
        onClick={() => setMobileOpen(o => !o)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Backdrop — conditionally add visible class */}
      <div
        className={`dnav__backdrop${mobileOpen ? " dnav__backdrop--visible" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`dnav__sidebar${mobileOpen ? " dnav__sidebar--open" : ""}`}>
        {NavContent}
      </aside>
    </>
  );
};

export default React.memo(DashboardNav);