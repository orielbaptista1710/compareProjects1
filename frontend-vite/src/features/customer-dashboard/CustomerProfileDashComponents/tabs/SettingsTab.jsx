// src/pages/<CustomerFolder>/CustomerProfilePage/tabs/SettingsTab.jsx
import { useContext, useState } from "react";
import { User, Bell, Lock, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { AuthContext } from "../../../../contexts/AuthContext";
import { CustomerAuth } from "../../../../config/firebase";

const SETTINGS_TABS = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Lock },
];

const PASSWORD_ERRORS = {
  "auth/invalid-credential": "Current password is incorrect.",
  "auth/wrong-password": "Current password is incorrect.",
  "auth/weak-password": "New password is too weak.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

const SettingsTab = () => {
  const { currentUser } = useContext(AuthContext);
  const [settingsTab, setSettingsTab] = useState("account");

  const [accountForm, setAccountForm] = useState({
    customerName: currentUser?.customerName || "",
    customerPhone: currentUser?.customerPhone || "",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    newListings: true,
    priceDrops: true,
    savedSearchAlerts: false,
    newsletter: false,
    smsAlerts: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingPassword, setSavingPassword] = useState(false);

  // Profile and notification saving need backend endpoints that don't exist
  // yet, so those buttons are disabled instead of showing a fake success.

  // Firebase only lets a signed-in user change their password right after
  // proving they know the current one, so re-authenticate first.
  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Enter your current password.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    const user = CustomerAuth.currentUser;
    if (!user?.email) {
      toast.error("Please log in again to change your password.");
      return;
    }

    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.newPassword);
      toast.success("Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(PASSWORD_ERRORS[err.code] || "Couldn't update your password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
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
                    onChange={(e) => setAccountForm((p) => ({ ...p, customerName: e.target.value }))}
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
                    onChange={(e) => setAccountForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-primary" disabled title="Coming soon">
                <Save size={15} />
                Save Changes (coming soon)
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
                        onChange={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
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
                      onChange={() => setNotifPrefs((p) => ({ ...p, smsAlerts: !p.smsAlerts }))}
                    />
                    <span className="toggle-track" />
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-primary" disabled title="Coming soon">
                <Save size={15} />
                Save Preferences (coming soon)
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
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="form-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
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
              <button className="btn-primary" onClick={handlePasswordSave} disabled={savingPassword}>
                <Save size={15} />
                {savingPassword ? "Updating..." : "Update Password"}
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

        <div className="settings-panel">{renderSettingsBody()}</div>
      </div>
    </div>
  );
};

export default SettingsTab;