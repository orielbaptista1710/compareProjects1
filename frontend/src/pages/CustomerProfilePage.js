// src/pages/CustomerProfilePage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons/faHouse";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faBalanceScale } from "@fortawesome/free-solid-svg-icons/faBalanceScale";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { faGift } from "@fortawesome/free-solid-svg-icons/faGift";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons/faRightFromBracket";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons/faAnglesLeft";
import { faAnglesRight } from "@fortawesome/free-solid-svg-icons/faAnglesRight";

import API from "../api";
import "./CustomerProfilePage.css";

const CustomerProfilePage = () => {
  const [customer, setCustomer] = useState(() => {
    const raw = localStorage.getItem("customerData");
    return raw ? JSON.parse(raw) : null;
  });
  const [activeTab, setActiveTab] = useState("profile");
  const [collapsed, setCollapsed] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("customerToken");
        if (!token) return;
        const { data } = await API.get("/api/customers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomer(data.customer);
        localStorage.setItem("customerData", JSON.stringify(data.customer));
      } catch (err) {
        console.warn("Cannot refresh customer data", err);
      }
    };
    fetchMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerData");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="profile-content">
            <h2>My Profile</h2>
            {customer ? (
              <div className="profile-details">
                <p><strong>Name:</strong> {customer.customerName}</p>
                <p><strong>Email:</strong> {customer.customerEmail}</p>
                <p><strong>Phone:</strong> {customer.customerPhone}</p>
              </div>
            ) : (
              <p>Loading your profile...</p>
            )}
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
    { key: "home", label: "Home", icon: <FontAwesomeIcon icon={faHouse} />, action: () => navigate("/") },
    { key: "profile", label: "Profile", icon: <FontAwesomeIcon icon={faUser} />, action: () => setActiveTab("profile") },
    { key: "shortlist", label: "Shortlist", icon: <FontAwesomeIcon icon={faStar} />, action: () => setActiveTab("shortlist") },
    { key: "compare", label: "Compare", icon: <FontAwesomeIcon icon={faBalanceScale} />, action: () => setActiveTab("compare") },
    { key: "saved", label: "Saved", icon: <FontAwesomeIcon icon={faMagnifyingGlass} />, action: () => setActiveTab("saved") },
    { key: "offers", label: "Offers", icon: <FontAwesomeIcon icon={faGift} />, action: () => setActiveTab("offers") },
  ];

  return (
    <div className="customer-profile-page">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Toggle Button */}
        <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <FontAwesomeIcon icon={faAnglesRight} /> : <FontAwesomeIcon icon={faAnglesLeft} />}
        </div>

        <div className="sidebar-top">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`sidebar-item ${activeTab === item.key ? "active" : ""}`}
              onClick={item.action}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-item">
            <FontAwesomeIcon icon={faCog} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">Settings</span>}
          </div>
          <div className="sidebar-item" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} className="sidebar-icon" />
            {!collapsed && <span className="sidebar-label">Logout</span>}
          </div>

          {customer && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {customer.customerName ? customer.customerName[0].toUpperCase() : "?"}
              </div>
              {!collapsed && (
                <div className="user-info">
                  <p className="user-name">{customer.customerName}</p>
                  <p className="user-email">{customer.customerEmail}</p>
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
