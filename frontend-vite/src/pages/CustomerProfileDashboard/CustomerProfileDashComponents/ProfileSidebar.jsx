//src/pages/CustomerProfileDashboard/CustomerProfileDashComponents/ProfileSidebar.jsx
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

const ProfileSidebar = ({ currentUser, collapsed, setCollapsed, activeTab, menuItems, onLogout }) => {
  const initials = currentUser?.customerName
    ? currentUser.customerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
      </button>

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
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </div>
          );
        })}
      </div>

      <div className="sidebar-bottom">
        <div
          className="sidebar-item sidebar-item-logout"
          onClick={onLogout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onLogout();
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
  );
};

export default ProfileSidebar;