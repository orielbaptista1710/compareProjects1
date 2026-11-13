// DeveloperDashboardComponents/DashboardNav.jsx
// Dashboard sidebar: logo, the three real dashboard views, and the account
// block. Below 768px it collapses into a top menu bar with a Menu button.
// Sign out calls the handleLogout passed in by Dashboard, unchanged.
import React, { useState, useCallback } from "react";
import { House, List, SquarePlus, LifeBuoy, LogOut, Menu, X } from "lucide-react";
import "./DashboardNav.css";

const NAV_ITEMS = [
  { id: "properties", label: "Listings",    Icon: List },
  { id: "sell",       label: "New listing", Icon: SquarePlus },
  { id: "support",    label: "Support",     Icon: LifeBuoy },
];

const ICON_PROPS = { size: 18, strokeWidth: 1.5, "aria-hidden": true };

const DashboardNav = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = useCallback((id) => {
    setActiveTab(id);
    setMenuOpen(false);
  }, [setActiveTab]);

  const name = user?.displayName || "Developer";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const current = NAV_ITEMS.find((i) => i.id === activeTab)?.label;

  return (
    <aside className="dnav" aria-label="Dashboard">
      <div className="dnav__top">
        <div className="dnav__brand">
          <span className="dnav__logo" aria-hidden="true">
            <House size={17} strokeWidth={2} color="#fff" />
          </span>
          <span className="dnav__brand-name">CompareProjects</span>
        </div>

        <button
          type="button"
          className="dnav__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="dnav-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X {...ICON_PROPS} /> : <Menu {...ICON_PROPS} />}
          <span>{menuOpen ? "Close" : current || "Menu"}</span>
        </button>
      </div>

      <div id="dnav-menu" className={`dnav__menu${menuOpen ? " is-open" : ""}`}>
        <nav aria-label="Dashboard sections">
          <ul className="dnav__list">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`dnav__item${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => handleNav(id)}
                  >
                    <Icon {...ICON_PROPS} />
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="dnav__account">
          <span className="dnav__avatar" aria-hidden="true">{initials || "D"}</span>
          <div className="dnav__who">
            <p className="dnav__name">{name}</p>
            <p className="dnav__role">Developer account</p>
          </div>
          <button type="button" className="dnav__signout" onClick={handleLogout}>
            <LogOut {...ICON_PROPS} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default React.memo(DashboardNav);
