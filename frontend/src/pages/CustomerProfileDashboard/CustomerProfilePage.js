// src/pages/CustomerProfilePage.js
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Heart,
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

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="profile-content">
            <h2>My Profile</h2>
            <div className="profile-details">
              <p>
                <strong>Name:</strong> 
                <span>{currentUser.customerName || "Not provided"}</span>
              </p>
              <p>
                <strong>Email:</strong> 
                <span>{currentUser.customerEmail || "Not provided"}</span>
              </p>
              <p>
                <strong>Phone:</strong> 
                <span>{currentUser.customerPhone || "Not provided"}</span>
              </p>
            </div>
          </div>
        );
      case "shortlist":
        return (
          <div className="profile-content">
            <h2>Shortlisted Properties</h2>
            <p>Your shortlisted properties will appear here.</p>
          </div>
        );
      case "compare":
        return (
          <div className="profile-content">
            <h2>Compared Properties</h2>
            <p>Properties you've compared will appear here.</p>
          </div>
        );
      case "saved":
        return (
          <div className="profile-content">
            <h2>Saved Searches</h2>
            <p>Your saved searches will appear here.</p>
          </div>
        );
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
    { 
      key: "home", 
      label: "Home", 
      icon: Home, 
      action: () => navigate("/") 
    },
    {
      key: "profile",
      label: "Profile",
      icon: User,
      action: () => setActiveTab("profile"),
    },
    {
      key: "shortlist",
      label: "Shortlist",
      icon: Heart,
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

  if (loading) {
    return <p className="loading-screen">Loading your profile...</p>;
  }

  if (!currentUser) return null;

  return (
    <div className="customer-profile-page">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Toggle Button */}
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

        <div className="sidebar-top">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key || (item.key === "home" && activeTab === "home");
            
            return (
              <div
                key={item.key}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={item.action}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.action();
                  }
                }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="sidebar-icon">
                  <Icon size={20} strokeWidth={1.75} />
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
            className="sidebar-item"
            onClick={() => setActiveTab("settings")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab("settings");
              }
            }}
          >
            <span className="sidebar-icon">
              <Settings size={20} strokeWidth={1.75} />
            </span>
            {!collapsed && <span className="sidebar-label">Settings</span>}
          </div>
          
          <div 
            className="sidebar-item" 
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
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