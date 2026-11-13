// src/pages/PostProperty/PostProperty.jsx
//
// "Post a property" — the one entry for posting (header POST PROPERTY, home
// banner). Owners and agents use the Firebase customer account (one login for
// browsing and posting); agents need their own /agent-signup account.
// Developers don't sign up: they send the partner enquiry, or log in at /login
// with the account our team created.
//
// Layout: ROLE_CARDS is static copy only; getStep() alone decides where the
// main button goes. To add phone OTP later, change getStep's actions — the
// layout doesn't need to change.
import { lazy, Suspense, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { AGENT_STATUS, LISTED_BY, LISTED_BY_LABELS } from "../../constants/roles";
import { CUSTOMER_LISTINGS_ENABLED } from "../../config/features";
import "./PostProperty.css";

const DeveloperPopup = lazy(() => import("../../shared/Popups/DeveloperPopup"));

const ROLES = [LISTED_BY.OWNER, LISTED_BY.AGENT, LISTED_BY.DEVELOPER];

// What each card says. Copy only — no routing here.
const ROLE_CARDS = {
  [LISTED_BY.OWNER]: {
    title: "Sell or rent your own home",
    description: "You own the property and want to list it yourself.",
    needs: ["An email address", "Your mobile (WhatsApp) number", "The property address", "A few clear photos"],
    note: "Our team checks every listing before it goes live.",
  },
  [LISTED_BY.AGENT]: {
    title: "List properties for your clients",
    description: "You're a registered real estate agent or broker.",
    needs: ["Your mobile number", "Your RERA agent registration number", "Your agency name"],
    note: "We verify your RERA number before your first listing goes live.",
  },
  [LISTED_BY.DEVELOPER]: {
    title: "List your projects",
    description: "You build and sell new projects.",
    needs: ["Your company details", "RERA numbers for your projects", "An email address for your team"],
    note: "We confirm your company and RERA registrations, then send your login.",
  },
};

// What the bottom bar says and does for each role, given who (if anyone) is logged in.
// Returns { hint, action: { label, to } | { label, popup: true }, login?: { text, label, to } }.
const getStep = (role, currentUser) => {
  if (role === LISTED_BY.DEVELOPER) {
    return {
      hint: "Developer accounts are set up by our team. Tell us about your projects and we'll get in touch.",
      action: { label: "Partner with us", popup: true },
      login: { text: "Already have a developer account?", label: "Login", to: "/login" },
    };
  }

  const isAgentAccount = (currentUser?.agent?.status ?? AGENT_STATUS.NONE) !== AGENT_STATUS.NONE;
  const profile = { label: "Go to my profile", to: "/customer-profile" };

  if (role === LISTED_BY.AGENT) {
    if (!currentUser) {
      return {
        hint: "Sign up with your agency details. We verify your RERA registration before you can post.",
        action: { label: "Start now", to: "/agent-signup" },
        login: { text: "Already have an agent account?", label: "Login as an agent", to: "/agent-login" },
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
      hint: "Sign up free. It's the same account you use to shortlist and compare.",
      action: { label: "Start now", to: "/customer-signup" },
      login: { text: "Already have an account?", label: "Login as an owner", to: "/customer-login" },
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

const TickIcon = () => (
  <svg className="pp-tick" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
      <div className="pp-container">
        <header className="pp-intro">
          <h1 id="pp-title" className="pp-title">Post a property on CompareProjects</h1>
          <p className="pp-subtitle">
            Listing is free. Choose the option that describes you, and we&apos;ll take you to the right <span className="pp-nowrap">sign-in</span>.
          </p>
        </header>

        <p id="pp-roles-label" className="pp-visually-hidden">I am</p>
        <div className="pp-roles" role="radiogroup" aria-labelledby="pp-roles-label">
          {ROLES.map((key) => {
            const card = ROLE_CARDS[key];
            const selected = role === key;
            const id = `pp-role-${key}`;
            return (
              // The radio button is the keyboard/screen-reader control; clicking
              // anywhere else on the card is a mouse/touch shortcut for it.
              <div
                key={key}
                className={`pp-option ${selected ? "pp-option--active" : ""}`}
                onClick={() => setRole(key)}
              >
                <div className="pp-option-top">
                  <span id={id} className="pp-eyebrow">{LISTED_BY_LABELS[key]}</span>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-labelledby={id}
                    aria-describedby={`${id}-title ${id}-desc`}
                    className="pp-radio"
                    onClick={() => setRole(key)}
                  />
                </div>

                <h2 id={`${id}-title`} className="pp-option-title">{card.title}</h2>
                <p id={`${id}-desc`} className="pp-option-desc">{card.description}</p>

                <hr className="pp-divider" />

                <h3 className="pp-needs-title">You&apos;ll need</h3>
                <ul className="pp-needs">
                  {card.needs.map((item) => (
                    <li key={item}>
                      <TickIcon />
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="pp-note">{card.note}</p>
              </div>
            );
          })}
        </div>

        <div className="pp-bar">
          <p className="pp-hint" aria-live="polite">{step.hint}</p>
          <button type="button" className="pp-start" onClick={handleAction}>
            {step.action.label}
          </button>
        </div>

        {step.login && (
          <p className="pp-login">
            {step.login.text} <Link to={step.login.to}>{step.login.label}</Link>
          </p>
        )}
      </div>

      <Suspense fallback={null}>
        {showPartnerForm && (
          <DeveloperPopup isOpen={showPartnerForm} onClose={() => setShowPartnerForm(false)} />
        )}
      </Suspense>
    </main>
  );
};

export default PostProperty;
