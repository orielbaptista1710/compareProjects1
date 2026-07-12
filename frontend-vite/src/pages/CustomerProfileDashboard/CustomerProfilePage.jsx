// src/pages/CustomerProfilePage.js
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Heart,
  Scale,
  Gift,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Handshake,
  BadgePercent,
  Phone,
  Banknote,
  Clock,
  Home as HomeIcon,
  Bell,
  Lock,
  Shield,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import "./CustomerProfilePage.css";
import { CustomerActivityContext } from "../../contexts/CustomerActivityContext";
import PropertyCard from "../Properties/PropertiesPageComponets/PropertyCard";
import { useCompare } from "../../contexts/CompareContext";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────
   SETTINGS SUB-TABS CONFIG
───────────────────────────────────────────── */
const SETTINGS_TABS = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Lock },
];

/* ─────────────────────────────────────────────
   PROFILE TAB CONTENT
───────────────────────────────────────────── */
const ProfileContent = ({ currentUser }) => {
  const initials = currentUser?.customerName
    ? currentUser.customerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>My Profile</h2>
        <p className="panel-subtitle">Your personal information and account details</p>
      </div>

      {/* Avatar card */}
      <div className="profile-avatar-card">
        <div className="avatar-circle large">
          {initials}
        </div>
        <div className="avatar-meta">
          <h3>{currentUser?.customerName || "Customer"}</h3>
          <p>{currentUser?.customerEmail || "No email"}</p>
          <span className="badge badge-verified">
            <CheckCircle2 size={12} />
            Verified Account
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="info-grid">
        <div className="info-section">
          <h4 className="section-label">Personal Details</h4>
          <div className="info-fields">
            <div className="info-field">
              <span className="field-label">Full Name</span>
              <span className="field-value">{currentUser?.customerName || "—"}</span>
            </div>
            <div className="info-field">
              <span className="field-label">Email Address</span>
              <span className="field-value">{currentUser?.customerEmail || "—"}</span>
            </div>
            <div className="info-field">
              <span className="field-label">Phone Number</span>
              <span className="field-value">{currentUser?.customerPhone || "—"}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h4 className="section-label">Account Status</h4>
          <div className="status-cards">
            <div className="status-card status-active">
              <Shield size={18} />
              <div>
                <strong>Account Active</strong>
                <p>Your account is in good standing</p>
              </div>
            </div>
            <div className="status-card">
              <Heart size={18} />
              <div>
                <strong>Member Since</strong>
                <p>
                  {currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SHORTLIST TAB CONTENT
───────────────────────────────────────────── */
const ShortlistContent = ({ heartProperties, activityLoading }) => {
  if (activityLoading) {
    return (
      <div className="tab-panel">
        <div className="panel-header">
          <h2>Shortlisted Properties</h2>
        </div>
        <div className="empty-state">
          <div className="shimmer-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Shortlisted Properties</h2>
        <p className="panel-subtitle">
          {heartProperties.length > 0
            ? `${heartProperties.length} propert${heartProperties.length === 1 ? "y" : "ies"} saved`
            : "Properties you've saved for later"}
        </p>
      </div>

      {heartProperties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Heart size={40} strokeWidth={1.5} />
          </div>
          <h3>No saved properties yet</h3>
          <p>Properties you heart will appear here for easy access</p>
       //i want to add button here to take to /properties page 

        </div>
      ) : (
        <div className="property-list-grid">
          {heartProperties.map((p) => (
            <PropertyCard key={p._id} property={p} showCompareBtn={false} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   COMPARE TAB CONTENT
───────────────────────────────────────────── */
const CompareContent = ({ compareList, navigate }) => (
  <div className="tab-panel">
    <div className="panel-header">
      <h2>Compare Properties</h2>
      <p className="panel-subtitle">
        {compareList.length > 0
          ? `${compareList.length} of 4 properties added`
          : "Add properties to compare them side by side"}
      </p>
    </div>

    {compareList.length === 0 ? (
      <div className="empty-state">
        <div className="empty-icon">
          <Scale size={40} strokeWidth={1.5} />
        </div>
        <h3>Nothing to compare yet</h3>
        <p>Browse properties and add up to 4 to compare</p>
      </div>
    ) : (
      <>
        <div className="compare-progress">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(compareList.length / 4) * 100}%` }}
            />
          </div>
          <span className="progress-label">{compareList.length}/4 selected</span>
        </div>

        <div className="property-list-grid">
          {compareList.slice(0, 4).map((p) => (
            <PropertyCard key={p._id} property={p} showCompareBtn={false} />
          ))}
        </div>

        <div className="panel-cta">
          <button className="btn-primary" onClick={() => navigate("/compare")}>
            View Full Comparison
          </button>
        </div>
      </>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   OFFERS TAB CONTENT
───────────────────────────────────────────── */
const OFFERS = [
  { icon: Gift, title: "Exclusive Discounts", desc: "Save on select projects and launches" },
  { icon: Handshake, title: "Bulk Booking Benefits", desc: "Special pricing when booking multiple units" },
  { icon: BadgePercent, title: "Zero Brokerage", desc: "No brokerage fees on any transaction" },
  { icon: Phone, title: "Direct Developer Access", desc: "Speak directly with project developers" },
  { icon: Banknote, title: "Free Loan Guidance", desc: "Expert home loan assistance at no cost" },
  { icon: Clock, title: "Early Bird Offers", desc: "Access to pre-launch pricing windows" },
  { icon: HomeIcon, title: "Interior & Fitout Services", desc: "Exclusive rates on home interiors" },
];

const OffersContent = () => (
  <div className="tab-panel">
    <div className="panel-header">
      <h2>Exclusive Benefits</h2>
      <p className="panel-subtitle">Member-only perks available to you</p>
    </div>

    <div className="offers-grid">
      {OFFERS.map(({ icon: Icon, title, desc }) => (
        <div className="offer-card" key={title}>
          <div className="offer-icon">
            <Icon size={22} strokeWidth={1.75} />
          </div>
          <div className="offer-text">
            <strong>{title}</strong>
            <span>{desc}</span>
          </div>
          <div className="offer-arrow">›</div>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   SETTINGS TAB CONTENT
───────────────────────────────────────────── */
const SettingsContent = ({ currentUser }) => {
  const [settingsTab, setSettingsTab] = useState("account");

  // Account form state
  const [accountForm, setAccountForm] = useState({
    customerName: currentUser?.customerName || "",
    customerPhone: currentUser?.customerPhone || "",
  });

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    newListings: true,
    priceDrops: true,
    savedSearchAlerts: false,
    newsletter: false,
    smsAlerts: false,
  });

  // Security state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleAccountSave = () => {
    // TODO: wire to Firebase updateProfile / MongoDB PATCH
    toast.success("Profile updated successfully!");
  };

  const handlePasswordSave = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    // TODO: wire to Firebase reauthenticateWithCredential + updatePassword
    toast.success("Password updated successfully!");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const renderSettingsBody = () => {
    switch (settingsTab) {
      case "account":
        return (
          <div className="settings-body">
            <div className="settings-section">
              <h4>Display Name</h4>
              <p>This is how your name appears across the platform.</p>
              <div className="form-row">
                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={accountForm.customerName}
                    onChange={(e) =>
                      setAccountForm((p) => ({ ...p, customerName: e.target.value }))
                    }
                    placeholder="Your full name"
                  />
                </div>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-section">
              <h4>Contact Information</h4>
              <p>Used to send you property updates and alerts.</p>
              <div className="form-row">
                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={currentUser?.customerEmail || ""}
                    disabled
                    className="input-disabled"
                  />
                  <span className="field-hint">
                    <AlertCircle size={12} />
                    Email changes require re-verification
                  </span>
                </div>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={accountForm.customerPhone}
                    onChange={(e) =>
                      setAccountForm((p) => ({ ...p, customerPhone: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-primary" onClick={handleAccountSave}>
                <Save size={15} />
                Save Changes
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-body">
            <div className="settings-section">
              <h4>Email Notifications</h4>
              <p>Choose which updates you'd like to receive by email.</p>
              <div className="toggle-list">
                {[
                  { key: "newListings", label: "New listings in saved searches", desc: "Get notified when new properties match your criteria" },
                  { key: "priceDrops", label: "Price drop alerts", desc: "Know when shortlisted properties reduce in price" },
                  { key: "savedSearchAlerts", label: "Saved search digest", desc: "Weekly summary of your saved searches" },
                  { key: "newsletter", label: "Market newsletter", desc: "Monthly real estate insights and trends" },
                ].map(({ key, label, desc }) => (
                  <div className="toggle-row" key={key}>
                    <div className="toggle-text">
                      <strong>{label}</strong>
                      <span>{desc}</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifPrefs[key]}
                        onChange={() =>
                          setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))
                        }
                      />
                      <span className="toggle-track" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-section">
              <h4>SMS Notifications</h4>
              <p>Only sent for high-priority updates.</p>
              <div className="toggle-list">
                <div className="toggle-row">
                  <div className="toggle-text">
                    <strong>SMS Alerts</strong>
                    <span>Critical updates via text message</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.smsAlerts}
                      onChange={() =>
                        setNotifPrefs((p) => ({ ...p, smsAlerts: !p.smsAlerts }))
                      }
                    />
                    <span className="toggle-track" />
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="btn-primary"
                onClick={() => toast.success("Notification preferences saved!")}
              >
                <Save size={15} />
                Save Preferences
              </button>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="settings-body">
            <div className="settings-section">
              <h4>Change Password</h4>
              <p>Use a strong password with at least 8 characters.</p>
              <div className="form-row form-col">
                <div className="form-field">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="form-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-section danger-zone">
              <h4 className="danger-title">Danger Zone</h4>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button
                className="btn-danger"
                onClick={() => toast.error("Please contact support to delete your account.")}
              >
                Delete My Account
              </button>
            </div>

            <div className="settings-actions">
              <button className="btn-primary" onClick={handlePasswordSave}>
                <Save size={15} />
                Update Password
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Settings</h2>
        <p className="panel-subtitle">Manage your account, notifications, and security</p>
      </div>

      <div className="settings-layout">
        {/* Settings sub-nav */}
        <nav className="settings-subnav">
          {SETTINGS_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`subnav-item ${settingsTab === key ? "active" : ""}`}
              onClick={() => setSettingsTab(key)}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>

        {/* Settings body */}
        <div className="settings-panel">{renderSettingsBody()}</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const CustomerProfilePage = () => {
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const { heartProperties, loading: activityLoading } = useContext(CustomerActivityContext);
  const { compareList } = useCompare();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const menuItems = [
    { key: "home", label: "Home", icon: Home, action: () => navigate("/") },
    { key: "profile", label: "Profile", icon: User, action: () => setActiveTab("profile") },
    { key: "shortlist", label: "Shortlist", icon: Heart, action: () => setActiveTab("shortlist") },
    {
      key: "compare",
      label: `Compare`,
      badge: compareList.length > 0 ? compareList.length : null,
      icon: Scale,
      action: () => setActiveTab("compare"),
    },
    { key: "offers", label: "Offers", icon: Gift, action: () => setActiveTab("offers") },
    { key: "settings", label: "Settings", icon: Settings, action: () => setActiveTab("settings") },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileContent currentUser={currentUser} />;
      case "shortlist":
        return (
          <ShortlistContent
            heartProperties={heartProperties}
            activityLoading={activityLoading}
          />
        );
      case "compare":
        return <CompareContent compareList={compareList} navigate={navigate} />;
      case "offers":
        return <OffersContent />;
      case "settings":
        return <SettingsContent currentUser={currentUser} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (!currentUser) return null;

  const initials = currentUser.customerName
    ? currentUser.customerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="customer-profile-page">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={16} strokeWidth={2.5} />
          )}
        </button>

        {/* Brand mark */}
        {!collapsed && (
          <div className="sidebar-brand">
            
            <span className="brand-name">Dashboard</span>
          </div>
        )}

        <div className="sidebar-top">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <div
                key={item.key}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={item.action}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    item.action();
                  }
                }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="sidebar-icon">
                  <Icon size={20} strokeWidth={1.75} />
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </span>
                {!collapsed && (
                  <span className="sidebar-label">{item.label}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div
            className="sidebar-item sidebar-item-logout"
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleLogout();
              }
            }}
          >
            <span className="sidebar-icon">
              <LogOut size={20} strokeWidth={1.75} />
            </span>
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </div>

          {currentUser && (
            <div className="sidebar-user">
              <div className="user-avatar">{initials}</div>
              {!collapsed && (
                <div className="user-info">
                  <p className="user-name">{currentUser.customerName}</p>
                  <p className="user-email">{currentUser.customerEmail}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="profile-main">{renderContent()}</main>
    </div>
  );
};

export default CustomerProfilePage;