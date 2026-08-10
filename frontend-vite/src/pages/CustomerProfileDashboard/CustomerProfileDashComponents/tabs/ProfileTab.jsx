// src/pages/<CustomerFolder>/CustomerProfilePage/tabs/ProfileTab.jsx
import { useContext } from "react";
import { CheckCircle2, Heart, Shield } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";

const ProfileTab = () => {
  const { currentUser } = useContext(AuthContext);

  const initials = currentUser?.customerName
    ? currentUser.customerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>My Profile</h2>
        <p className="panel-subtitle">Your personal information and account details</p>
      </div>

      <div className="profile-avatar-card">
        <div className="avatar-circle large">{initials}</div>
        <div className="avatar-meta">
          <h3>{currentUser?.customerName || "Customer"}</h3>
          <p>{currentUser?.customerEmail || "No email"}</p>
          <span className="badge badge-verified">
            <CheckCircle2 size={12} />
            Verified Account
          </span>
        </div>
      </div>

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

export default ProfileTab;