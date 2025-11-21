// src/pages/CustomerProfilePage.js
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Star,
  Scale,
  Search,
  Gift,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import "./CustomerProfilePage.css";

const CustomerProfilePage = () => {
  const { currentUser, loading, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/customer-login");
    }
  }, [loading, currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return <p className="loading-screen">Loading your profile...</p>;
  }

  if (!currentUser) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="profile-content">
            <h2>My Profile</h2>
            <div className="profile-details">
              <p>
                <strong>Name:</strong> {currentUser.customerName}
              </p>
              <p>
                <strong>Email:</strong> {currentUser.customerEmail}
              </p>
              <p>
                <strong>Phone:</strong> {currentUser.customerPhone}
              </p>
            </div>
          </div>
        );
      case "shortlist":
        return <div className="profile-content">Your Shortlisted Projects</div>;
      case "compare":
        return <div className="profile-content">Your Compared Projects</div>;
      case "saved":
        return <div className="profile-content">Your Saved Searches</div>;
      case "offers":
        return (
          <div className="profile-content">
            <h2>Exclusive Benefits</h2>
            <ul>
              <li>🎁 Exclusive Discounts on Projects</li>
              <li>🤝 Bulk Booking Benefits</li>
              <li>💸 Zero Brokerage Fees</li>
              <li>📞 Direct Contact with Developers</li>
              <li>🏦 Free Guidance for Home Loans</li>
              <li>⏳ Short Booking Offers</li>
              <li>🏠 Home Interiors & Commercial Fitouts</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { key: "home", label: "Home", icon: Home, action: () => navigate("/") },
    {
      key: "profile",
      label: "Profile",
      icon: User,
      action: () => setActiveTab("profile"),
    },
    {
      key: "shortlist",
      label: "Shortlist",
      icon: Star,
      action: () => setActiveTab("shortlist"),
    },
    {
      key: "compare",
      label: "Compare",
      icon: Scale,
      action: () => setActiveTab("compare"),
    },
    {
      key: "saved",
      label: "Saved",
      icon: Search,
      action: () => setActiveTab("saved"),
    },
    {
      key: "offers",
      label: "Offers",
      icon: Gift,
      action: () => setActiveTab("offers"),
    },
  ];

  return (
    <div className="customer-profile-page">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Toggle Button */}
        <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </div>

        <div className="sidebar-top">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`sidebar-item ${
                  activeTab === item.key ? "active" : ""
                }`}
                onClick={item.action}
              >
                <span className="sidebar-icon">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                {!collapsed && (
                  <span className="sidebar-label">{item.label}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-item">
            <Settings size={18} strokeWidth={1.75} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">Settings</span>}
          </div>
          <div className="sidebar-item" onClick={handleLogout}>
            <LogOut size={18} strokeWidth={1.75} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </div>

          {currentUser && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {currentUser.customerName
                  ? currentUser.customerName[0].toUpperCase()
                  : "?"}
              </div>
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

      {/* Main Content */}
      <main className="profile-main">{renderContent()}</main>
    </div>
  );
};

export default CustomerProfilePage;
