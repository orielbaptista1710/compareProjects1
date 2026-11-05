// src/pages/<CustomerFolder>/CustomerProfilePage/tabs/ProfileTab.jsx
import { useContext, useState } from "react";
import { CheckCircle2, Heart, Shield, AlertCircle, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import { sendEmailVerification } from "firebase/auth";
import { AuthContext } from "../../../../contexts/AuthContext";
import { AGENT_STATUS } from "../../../../constants/roles";
import { CUSTOMER_LISTINGS_ENABLED } from "../../../../config/features";
// CustomerAuth is the raw Firebase Auth SDK instance — imported directly
// (not through AuthContext) because AuthContext only exposes the *backend*
// Customer document as `currentUser`, not the live Firebase user object that
// sendEmailVerification() needs. AuthContext.jsx's own refreshUser() uses
// this exact same pattern (CustomerAuth.currentUser) for the same reason.
import { CustomerAuth } from "../../../../config/firebase";

// Only the Firebase error codes worth a specific message for this action —
// everything else falls back to a generic "couldn't send" toast.
const VERIFICATION_ERROR_MESSAGES = {
  "auth/too-many-requests": "Too many attempts — please wait a bit before trying again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

// What the "Account Type" card says for each Customer.agent.status.
const ACCOUNT_TYPE = {
  [AGENT_STATUS.NONE]: {
    title: "Customer",
    text: CUSTOMER_LISTINGS_ENABLED
      ? "Browse, shortlist and post your own property"
      : "Browse and shortlist properties. Posting your own property opens soon.",
  },
  [AGENT_STATUS.PENDING]: { title: "Agent — pending approval", text: "We're verifying your RERA registration. Verify your email if you haven't — you can post listings once you're approved." },
  [AGENT_STATUS.APPROVED]: { title: "Agent", text: "Your listings are shown as posted by an agent" },
  [AGENT_STATUS.REJECTED]: { title: "Agent application not approved", text: null },
  [AGENT_STATUS.SUSPENDED]: { title: "Agent account suspended", text: "Contact support to restore agent access" },
};

const ProfileTab = () => {
  const { currentUser } = useContext(AuthContext);
  // Tracks the in-flight resend request so the button can disable itself and
  // avoid the user firing off several requests while one is already pending.
  const [resendingVerification, setResendingVerification] = useState(false);

  const initials = currentUser?.customerName
    ? currentUser.customerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleResendVerification = async () => {
    // Guards against a stale click racing a logout, and against double-firing
    // while a previous request is still in flight.
    if (!CustomerAuth.currentUser || resendingVerification) return;

    setResendingVerification(true);
    try {
      await sendEmailVerification(CustomerAuth.currentUser);
      toast.success("Verification email sent — check your inbox!");
    } catch (err) {
      console.error("Resend verification email error:", err);
      toast.error(
        VERIFICATION_ERROR_MESSAGES[err.code] || "Couldn't send the email. Please try again."
      );
    } finally {
      setResendingVerification(false);
    }
  };

  const accountType = ACCOUNT_TYPE[currentUser?.agent?.status] ?? ACCOUNT_TYPE[AGENT_STATUS.NONE];

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
          {currentUser?.emailVerified ? (
            <span className="badge badge-verified">
              <CheckCircle2 size={12} />
              Verified Account
            </span>
          ) : (
            <div className="unverified-notice">
              <span className="badge badge-unverified">
                <AlertCircle size={12} />
                Email not verified
              </span>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleResendVerification}
                disabled={resendingVerification}
              >
                {resendingVerification ? "Sending…" : "Resend verification email"}
              </button>
            </div>
          )}
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
              <Briefcase size={18} />
              <div>
                <strong>{accountType.title}</strong>
                <p>{accountType.text ?? currentUser?.agent?.rejectionReason ?? "Contact support for details"}</p>
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