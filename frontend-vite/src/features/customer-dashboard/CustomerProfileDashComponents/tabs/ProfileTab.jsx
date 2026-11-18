// src/features/customer-dashboard/CustomerProfileDashComponents/tabs/ProfileTab.jsx
//
// One layout for both kinds of customer account:
//   owner (agent.status "none") — "Ready to post" checklist + contact details
//   agent                       — approval checklist / status card,
//                                 "How buyers see you" preview + contact details
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Ban, Check } from "lucide-react";
import toast from "react-hot-toast";
import { sendEmailVerification } from "firebase/auth";
import API from "../../../../api/api";
import { AuthContext } from "../../../../contexts/AuthContext";
import { AGENT_STATUS } from "../../../../constants/roles";
import { CUSTOMER_LISTINGS_ENABLED } from "../../../../config/features";
import { CUSTOMER_LISTING_ENDPOINTS } from "../../../listings/hooks/useMyListings";
// CustomerAuth is the raw Firebase Auth SDK instance — imported directly
// (not through AuthContext) because AuthContext only exposes the *backend*
// Customer document as `currentUser`, not the live Firebase user object that
// sendEmailVerification() needs. AuthContext.jsx's own refreshUser() uses
// this exact same pattern (CustomerAuth.currentUser) for the same reason.
import { CustomerAuth } from "../../../../config/firebase";
import {
  AGENT_STATUS_LABELS,
  agentStatusOf,
  agentSteps,
  initialsOf,
  maskEmail,
  maskPhone,
  memberSince,
  ownerSteps,
} from "./profileHelpers";

// Only the Firebase error codes worth a specific message for this action —
// everything else falls back to a generic "couldn't send" toast.
const VERIFICATION_ERROR_MESSAGES = {
  "auth/too-many-requests": "Too many attempts — please wait a bit before trying again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

// Left-hand card for an approved agent.
const APPROVED_CARD = {
  title: "You're an approved agent",
  text: "Your listings are shown as posted by an agent.",
};

// Alert card for agents who are blocked. The impact lines mirror what the
// backend actually enforces (customerCanPost + hidden listings on suspend).
const AGENT_ALERTS = {
  [AGENT_STATUS.SUSPENDED]: {
    icon: Ban,
    title: "Agent account suspended",
    impact: [
      "Your listings are hidden from buyers",
      "You can't post or edit listings",
      "You can still browse, shortlist and compare",
    ],
  },
  [AGENT_STATUS.REJECTED]: {
    icon: AlertCircle,
    title: "Agent application not approved",
    impact: ["You can't post listings as an agent", "You can still browse, shortlist and compare"],
  },
};

const AgentAlert = ({ alert, reason }) => {
  const Icon = alert.icon;
  return (
    <section className="ptab-card ptab-alert" role="alert" aria-labelledby="ptab-alert-title">
      <div className="ptab-alert-head">
        <span className="ptab-alert-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={2} />
        </span>
        <h3 id="ptab-alert-title">{alert.title}</h3>
      </div>

      {reason && (
        <blockquote className="ptab-alert-reason">
          <span>Reason from our team</span>
          <p>{reason}</p>
        </blockquote>
      )}

      <h4 className="ptab-alert-subhead">What this means</h4>
      <ul className="ptab-alert-list">
        {alert.impact.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <Link to="/supportHelp" className="ptab-btn ptab-btn-primary">
        Contact support
      </Link>
    </section>
  );
};

// Shares the cache entry with useMyListings, so the count stays in sync after
// a listing is posted. Only needs the number, so no mutations are pulled in.
const useListingCount = (enabled) => {
  const { data, isSuccess } = useQuery({
    queryKey: CUSTOMER_LISTING_ENDPOINTS.queryKey,
    queryFn: async () => (await API.get(CUSTOMER_LISTING_ENDPOINTS.list)).data,
    enabled,
  });
  return isSuccess && Array.isArray(data) ? data.length : null;
};

const Pill = ({ tone = "neutral", children }) => <span className={`ptab-pill ptab-pill-${tone}`}>{children}</span>;

const StepIcon = ({ state }) => (
  <span className={`ptab-step-icon is-${state}`} aria-hidden="true">
    {state === "done" ? <Check size={14} strokeWidth={3} /> : state === "action" ? "!" : null}
  </span>
);

const Checklist = ({ title, steps, renderAction }) => {
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <section className="ptab-card" aria-labelledby="ptab-checklist-title">
      <div className="ptab-card-head">
        <h3 id="ptab-checklist-title">{title}</h3>
        <Pill tone="brand">
          {done} of {steps.length} done
        </Pill>
      </div>
      <div
        className="ptab-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        aria-label={`${done} of ${steps.length} steps done`}
      >
        <div className="ptab-progress-fill" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="ptab-steps">
        {steps.map((step) => (
          <li key={step.id} className={`ptab-step is-${step.state}`}>
            <StepIcon state={step.state} />
            <div className="ptab-step-text">
              <strong>
                {step.title}
                <span className="ptab-sr-only">{step.state === "done" ? " (done)" : step.state === "action" ? " (to do now)" : " (later)"}</span>
              </strong>
              {step.detail && <p>{step.detail}</p>}
            </div>
            {renderAction?.(step)}
          </li>
        ))}
      </ol>
    </section>
  );
};

const ProfileTab = ({ onNavigateTab }) => {
  const { currentUser } = useContext(AuthContext);
  // Tracks the in-flight resend request so the button can disable itself and
  // avoid the user firing off several requests while one is already pending.
  const [resendingVerification, setResendingVerification] = useState(false);

  const status = agentStatusOf(currentUser);
  const isAgent = status !== AGENT_STATUS.NONE;
  const verified = Boolean(currentUser?.emailVerified);
  const listingCount = useListingCount(CUSTOMER_LISTINGS_ENABLED && Boolean(currentUser));
  const name = currentUser?.customerName || (isAgent ? "Agent" : "Customer");
  const { agencyName, reraAgentId, rejectionReason } = currentUser?.agent ?? {};

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
      toast.error(VERIFICATION_ERROR_MESSAGES[err.code] || "Couldn't send the email. Please try again.");
    } finally {
      setResendingVerification(false);
    }
  };

  const resendButton = (
    <button
      type="button"
      className="ptab-btn ptab-btn-outline"
      onClick={handleResendVerification}
      disabled={resendingVerification}
    >
      {resendingVerification ? "Sending…" : "Resend email"}
    </button>
  );

  const renderStepAction = (step) => {
    if (step.id === "email" && step.state === "action") return resendButton;
    if (step.id === "post" && step.state === "action") {
      return (
        <Link to="/post-property" className="ptab-btn ptab-btn-outline">
          Post property
        </Link>
      );
    }
    return null;
  };

  // Top banner: only when something is waiting on the user or on our team.
  let banner = null;
  if (status === AGENT_STATUS.PENDING) {
    banner = {
      title: "Approval pending",
      text: verified
        ? "Our team is reviewing your details. Your profile goes public once you're approved."
        : "Verify your email so our team can approve you. Your profile goes public once you're approved.",
    };
  } else if (!verified) {
    banner = {
      title: "Email not verified",
      text: isAgent ? "Verify your email to keep your account secure." : "Verify your email so you can post a property.",
    };
  }

  const agentAlert = AGENT_ALERTS[status];
  const showBuyerPreview = status === AGENT_STATUS.PENDING || status === AGENT_STATUS.APPROVED;

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>My profile</h2>
        <p className="panel-subtitle">
          {isAgent
            ? "Your account status, contact details and how buyers see you."
            : "Your account status and contact details."}
        </p>
      </div>

      {banner && (
        <div className="ptab-banner" role="status">
          <p>
            <strong>{banner.title}</strong> {banner.text}
          </p>
          {!verified && resendButton}
        </div>
      )}

      <section className="ptab-card ptab-identity" aria-label="Account summary">
        <div className="ptab-avatar ptab-avatar-lg" aria-hidden="true">
          {initialsOf(currentUser?.customerName)}
        </div>
        <div className="ptab-identity-text">
          <h3>{name}</h3>
          <div className="ptab-identity-meta">
            <Pill tone="brand">{isAgent ? "Agent" : "Owner"}</Pill>
            {isAgent && <Pill>{AGENT_STATUS_LABELS[status]}</Pill>}
            <span>Member since {memberSince(currentUser?.createdAt)}</span>
          </div>
        </div>
      </section>

      <div className="ptab-grid">
        <div className="ptab-col">
          {!isAgent && (
            <Checklist
              title="Ready to post your property"
              steps={ownerSteps(currentUser, { listingsEnabled: CUSTOMER_LISTINGS_ENABLED, listingCount })}
              renderAction={renderStepAction}
            />
          )}

          {status === AGENT_STATUS.PENDING && (
            <Checklist title="Getting approved as an agent" steps={agentSteps(currentUser)} renderAction={renderStepAction} />
          )}

          {status === AGENT_STATUS.APPROVED && (
            <section className="ptab-card" aria-labelledby="ptab-status-title">
              <h3 id="ptab-status-title">{APPROVED_CARD.title}</h3>
              <p className="ptab-muted">{APPROVED_CARD.text}</p>
              {CUSTOMER_LISTINGS_ENABLED && (
                <Link to="/post-property" className="ptab-link">
                  Post a property <span aria-hidden="true">&rarr;</span>
                </Link>
              )}
            </section>
          )}

          {agentAlert && (
            <AgentAlert alert={agentAlert} reason={status === AGENT_STATUS.REJECTED ? rejectionReason : null} />
          )}
        </div>

        <div className="ptab-col">
          {showBuyerPreview && (
            <section className="ptab-card ptab-preview" aria-labelledby="ptab-preview-title">
              <h3 id="ptab-preview-title" className="ptab-preview-label">
                How buyers see you
              </h3>
              <div className="ptab-preview-body">
                <div className="ptab-preview-who">
                  <div className="ptab-avatar" aria-hidden="true">
                    {initialsOf(currentUser?.customerName)}
                  </div>
                  <div>
                    <strong className="ptab-preview-name">{name}</strong>
                    {agencyName && <p className="ptab-muted">{agencyName}</p>}
                    <div className="ptab-identity-meta">
                      {status === AGENT_STATUS.APPROVED ? (
                        <Pill tone="success">RERA agent</Pill>
                      ) : (
                        <Pill>Not public yet</Pill>
                      )}
                    </div>
                  </div>
                </div>
                {CUSTOMER_LISTINGS_ENABLED && (
                  <div className="ptab-stats">
                    <div className="ptab-stat">
                      <strong>{listingCount ?? "—"}</strong>
                      <span>Listings</span>
                    </div>
                  </div>
                )}
                {reraAgentId && <p className="ptab-preview-foot">RERA {reraAgentId}</p>}
              </div>
            </section>
          )}

          <section className="ptab-card" aria-labelledby="ptab-contact-title">
            <div className="ptab-card-head">
              <h3 id="ptab-contact-title">Contact details</h3>
              {onNavigateTab && (
                <button type="button" className="ptab-text-btn" onClick={() => onNavigateTab("settings", "account")}>
                  Edit in Settings
                </button>
              )}
            </div>
            <dl className="ptab-fields">
              <div className="ptab-field">
                <dt>Mobile</dt>
                <dd>{maskPhone(currentUser?.customerPhone) || "—"}</dd>
              </div>
              <div className="ptab-field">
                <dt>Email</dt>
                <dd>
                  <span className="ptab-break">{maskEmail(currentUser?.customerEmail) || "—"}</span>
                  {verified ? <Pill tone="success">Verified</Pill> : <Pill>Not verified</Pill>}
                </dd>
              </div>
              <div className="ptab-field">
                <dt>Account type</dt>
                <dd>{isAgent ? "Agent" : "Owner"}</dd>
              </div>
              <div className="ptab-field">
                <dt>Member since</dt>
                <dd>{memberSince(currentUser?.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
