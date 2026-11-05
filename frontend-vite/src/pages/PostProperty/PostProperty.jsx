// src/pages/PostProperty/PostProperty.jsx
//
// "Let's get you started" — the one entry for posting (header POST PROPERTY,
// home banner). Owners and agents use the Firebase customer account (one login
// for browsing and posting); agents need their own /agent-signup account.
// Developers don't sign up: they send the partner enquiry, or log in at /login
// with the account our team created.
import { lazy, Suspense, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { AGENT_STATUS, LISTED_BY, LISTED_BY_LABELS } from "../../constants/roles";
import { CUSTOMER_LISTINGS_ENABLED } from "../../config/features";
import "./PostProperty.css";

const DeveloperPopup = lazy(() => import("../../shared/Popups/DeveloperPopup"));

const ROLES = [LISTED_BY.OWNER, LISTED_BY.AGENT, LISTED_BY.DEVELOPER];

// What the card says and does for each role, given who (if anyone) is logged in.
// Returns { hint, action: { label, to } | { label, popup: true }, login?: { label, to } }.
const getStep = (role, currentUser) => {
  if (role === LISTED_BY.DEVELOPER) {
    return {
      hint: "Developer accounts are set up by our team. Tell us about your projects and we'll get in touch.",
      action: { label: "Partner with us", popup: true },
      login: { text: "Already have an account?", label: "Developer login", to: "/login" },
    };
  }

  const isAgentAccount = (currentUser?.agent?.status ?? AGENT_STATUS.NONE) !== AGENT_STATUS.NONE;
  const profile = { label: "Go to my profile", to: "/customer-profile" };

  if (role === LISTED_BY.AGENT) {
    if (!currentUser) {
      return {
        hint: "Post listings for your clients. Sign up with your agency details — we verify your RERA registration before you can post.",
        action: { label: "Start now", to: "/agent-signup" },
        login: { text: "Already have an account?", label: "Log in", to: "/agent-login" },
      };
    }
    if (isAgentAccount) {
      return { hint: "Your agent status and listings are on your profile.", action: profile };
    }
    return {
      hint: "You're signed in with a customer account. Agent accounts need their own sign-up with a different email.",
      action: { label: "Sign up as an agent", to: "/agent-signup" },
    };
  }

  // Owner
  if (!currentUser) {
    return {
      hint: "Sell your own property. Sign up free with your customer account — the same one you use to shortlist and compare.",
      action: { label: "Start now", to: "/customer-signup" },
      login: { text: "Already have an account?", label: "Log in", to: "/customer-login" },
    };
  }
  if (isAgentAccount) {
    return {
      hint: "You're signed in as an agent. To sell your own home as an owner, use a separate customer account.",
      action: profile,
    };
  }
  return {
    hint: CUSTOMER_LISTINGS_ENABLED
      ? "Post and manage your listings from your profile."
      : "Posting your own property opens soon. Your account is ready — we'll let you know.",
    action: profile,
  };
};

const PostProperty = () => {
  const { currentUser } = useContext(AuthContext);
  const [role, setRole] = useState(LISTED_BY.OWNER);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const navigate = useNavigate();

  const step = getStep(role, currentUser);

  const handleAction = () => {
    if (step.action.popup) return setShowPartnerForm(true);
    navigate(step.action.to);
  };

  return (
    <main className="pp-page">
      <section className="pp-card" aria-labelledby="pp-title">
        <h1 id="pp-title" className="pp-title">Let&apos;s get you started</h1>
        <p className="pp-subtitle">Tell us who you are and we&apos;ll take you to the right place.</p>

        <p className="pp-label" id="pp-roles-label">You are:</p>
        <div className="pp-roles" role="radiogroup" aria-labelledby="pp-roles-label">
          {ROLES.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={role === key}
              className={`pp-role ${role === key ? "pp-role--active" : ""}`}
              onClick={() => setRole(key)}
            >
              {LISTED_BY_LABELS[key]}
            </button>
          ))}
        </div>

        <p className="pp-hint" aria-live="polite">{step.hint}</p>

        <button type="button" className="pp-start" onClick={handleAction}>
          {step.action.label}
        </button>

        {step.login && (
          <p className="pp-login">
            {step.login.text} <Link to={step.login.to}>{step.login.label}</Link>
          </p>
        )}
      </section>

      <Suspense fallback={null}>
        {showPartnerForm && (
          <DeveloperPopup isOpen={showPartnerForm} onClose={() => setShowPartnerForm(false)} />
        )}
      </Suspense>
    </main>
  );
};

export default PostProperty;
