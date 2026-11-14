import { useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import { AuthContext } from "../../../contexts/AuthContext";
import "./authStyles/auth-form.css";
import "./authStyles/auth-layout.css";
import "./authStyles/auth-responsive.css";

import AuthMarketingPanel from "./AuthMarketingPanel";

import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { CustomerAuth } from "../../../config/firebase";
import toast from "react-hot-toast";

import { Check, Eye, EyeOff } from "lucide-react";

const FIREBASE_ERRORS = {
  "auth/email-already-in-use":    "This email is already registered. Please login.",
  "auth/weak-password":           "Password is too weak. Use at least 6 characters.",
  "auth/invalid-email":           "Invalid email address.",
  "auth/network-request-failed":  "Network error. Check your connection and try again.",
  "auth/too-many-requests":       "Too many attempts. Please wait and try again.",
  "auth/operation-not-allowed":   "Email signup is not enabled. Contact support.",
};

// isAgent: the /agent-signup variant. Same Firebase account as a customer
// (agents browse with it too), plus an agent application that an admin
// approves before the agent can post as 'agent'.
const CustomerSignupPage = ({ isAgent = false }) => {
  const [form, setForm] = useState({
    customerName:     "",
    customerEmail:    "",
    customerPhone:    "",
    customerPassword: "",
    confirmPassword:  "",
    agencyName:       "",
    reraAgentId:      "",
  });
  const [error, setError]               = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  // Which account type the user ticked "yes, that's me" for. Stored as the role
  // (not true/false) so switching Owner <-> Agent un-ticks it automatically —
  // the choice can't be undone after signup, so it must be confirmed for the
  // page they're actually on.
  const [confirmedAs, setConfirmedAs]   = useState(null);
  const role = isAgent ? "agent" : "owner";
  const confirmedRole = confirmedAs === role;
  const navigate = useNavigate();
  // Optional: the page is also rendered without the provider in tests.
  const auth = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error[e.target.name]) {
      setError((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
    }
  };

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return { score, label: labels[score] ?? "Very Weak" };
  };

  const strength = useMemo(() => getPasswordStrength(form.customerPassword), [form.customerPassword]);

  const passwordRules = [
    { test: (pw) => pw.length >= 8,         label: "At least 8 characters" },
    { test: (pw) => /[A-Z]/.test(pw),        label: "One uppercase letter"  },
    { test: (pw) => /[0-9]/.test(pw),        label: "One number"            },
    { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: "One special character" },
  ];

  const validate = () => {
    const errs = {};
    if (form.customerName.trim().length < 2)
      errs.customerName = "At least 2 characters";
    if (!/\S+@\S+\.\S+/.test(form.customerEmail))
      errs.customerEmail = "Enter a valid email";
    if (!/^\d{10}$/.test(form.customerPhone))
      errs.customerPhone = "Enter 10-digit number";
    if (strength.score < 3)
      errs.customerPassword = "Password too weak";
    if (form.customerPassword !== form.confirmPassword)
      errs.confirmPassword = "Passwords don't match";
    if (isAgent && form.agencyName.trim().length < 2)
      errs.agencyName = "Enter your agency name";
    if (isAgent && form.reraAgentId.trim().length < 3)
      errs.reraAgentId = "Enter your RERA agent registration number";
    if (!confirmedRole)
      errs.confirmedRole = isAgent
        ? "Please confirm you're a RERA-registered agent"
        : "Please confirm you're the owner";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) return setError(validationErrors);

    setSubmitting(true);
    setError({});

    let createdUser = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        CustomerAuth, form.customerEmail, form.customerPassword
      );
      createdUser = userCredential.user;
      const idToken = await userCredential.user.getIdToken();
      // Agent status can only be set here, as the account is created — the
      // backend never turns an existing customer account into an agent.
      await API.post("/api/customers/firebase-signup", {
        token: idToken,
        customerName:  form.customerName.trim(),
        customerPhone: `+91${form.customerPhone.trim()}`,
        ...(isAgent && {
          agentApplication: {
            agencyName:  form.agencyName.trim(),
            reraAgentId: form.reraAgentId.trim(),
          },
        }),
      });

      if (isAgent) {
        toast.success("Agent application submitted — verify your email so our team can approve it.");
      }

      // Sent only after the backend record is confirmed created — if the
      // backend call above had failed instead, the catch block below deletes
      // the freshly-created Firebase account, and we don't want to have
      // emailed a verification link for an account that no longer exists.
      // Deliberately non-blocking: a failure here (network blip, Firebase
      // rate limit) shouldn't stop the user from reaching their new account —
      // they can resend it later from the Profile tab.
      try {
        await sendEmailVerification(userCredential.user);
        toast.success("Verification email sent — check your inbox!");
      } catch (verificationErr) {
        console.error("Failed to send verification email:", verificationErr);
      }

      // Load the just-created profile (and agent status) before the profile
      // page's route guard checks it.
      await auth?.refreshUser?.();
      navigate("/customer-profile");
    } catch (err) {
      const message =
        FIREBASE_ERRORS[err.code] ||
        err.response?.data?.message ||
        "Signup failed. Please try again.";
      setError({ global: message });

      // The backend refused the signup (any status): remove the Firebase login
      // created moments ago, so the same email can simply try again. Kept, it
      // would block a retry ("email already in use") and a later login would
      // make it a plain customer that can never become an agent.
      if (err.response && createdUser) {
        try { await createdUser.delete(); } catch (e) { console.error(e); }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cauth-page">
      <AuthMarketingPanel isAgent={isAgent} />

      <main className="cauth-main">
        <div className="cauth-card">
          <h1 className="cauth-title">
            {isAgent ? "Sign up as an agent" : "Sign up as an owner"}
          </h1>
          <p className="cauth-subtitle">
            {isAgent
              ? "Sign up as a real estate agent. Our team verifies your RERA registration before you can post listings as an agent."
              : "Browse, compare and save properties, and list your own whenever you're ready."}
          </p>

          {/* Look like tabs/toggle; each one just opens the matching existing page. */}
          <nav className="cauth-tabs" aria-label="Account">
            <button type="button" className="cauth-tab is-active" aria-current="page">
              Create account
            </button>
            <button
              type="button"
              className="cauth-tab"
              onClick={() => navigate(isAgent ? "/agent-login" : "/customer-login")}
            >
              Log in
            </button>
          </nav>

          <div className="cauth-toggle" role="group" aria-label="I am an">
            <button
              type="button"
              className={`cauth-toggle-btn ${!isAgent ? "is-active" : ""}`}
              aria-pressed={!isAgent}
              onClick={() => navigate("/customer-signup")}
            >
              Owner
            </button>
            <button
              type="button"
              className={`cauth-toggle-btn ${isAgent ? "is-active" : ""}`}
              aria-pressed={isAgent}
              onClick={() => navigate("/agent-signup")}
            >
              Agent
            </button>
          </div>

          <form onSubmit={handleSubmit} className="cauth-form cauth-form--signup" noValidate>

            <div className="cauth-field">
              <label htmlFor="customerName">Full Name</label>
              <input
                className="cauth-input"
                name="customerName" id="customerName"
                placeholder="Your full name"
                value={form.customerName}
                onChange={handleChange}
                autoComplete="name"
              />
              {error.customerName && <p className="cauth-error">{error.customerName}</p>}
            </div>

            <div className="cauth-field">
              <label htmlFor="customerEmail">Email Address</label>
              <input
                className="cauth-input"
                name="customerEmail" id="customerEmail" type="email"
                placeholder="Your email"
                value={form.customerEmail}
                onChange={handleChange}
                autoComplete="email"
              />
              {error.customerEmail && <p className="cauth-error">{error.customerEmail}</p>}
            </div>

            <div className="cauth-field cauth-field--full">
              <label htmlFor="customerPhone">WhatsApp Number</label>
              <div className="cauth-phone">
                <span className="cauth-phone-code">+91</span>
                <input
                  className="cauth-input"
                  name="customerPhone" id="customerPhone"
                  placeholder="10-digit number"
                  value={form.customerPhone}
                  onChange={handleChange}
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-describedby="customerPhone-hint"
                />
              </div>
              {error.customerPhone
                ? <p className="cauth-error">{error.customerPhone}</p>
                : <p className="cauth-hint" id="customerPhone-hint">Buyers will contact you on this number.</p>}
            </div>

            {isAgent && (
              <>
                <div className="cauth-field">
                  <label htmlFor="agencyName">Agency Name</label>
                  <input
                    className="cauth-input"
                    name="agencyName" id="agencyName"
                    placeholder="Your agency or firm"
                    value={form.agencyName}
                    onChange={handleChange}
                    autoComplete="organization"
                  />
                  {error.agencyName && <p className="cauth-error">{error.agencyName}</p>}
                </div>

                <div className="cauth-field">
                  <label htmlFor="reraAgentId">RERA Agent Registration No.</label>
                  <input
                    className="cauth-input"
                    name="reraAgentId" id="reraAgentId"
                    placeholder="e.g. A51800012345"
                    value={form.reraAgentId}
                    onChange={handleChange}
                  />
                  {error.reraAgentId && <p className="cauth-error">{error.reraAgentId}</p>}
                </div>
              </>
            )}

            <div className="cauth-field">
              <label htmlFor="customerPassword">Password</label>
              <div className="cauth-password">
                <input
                  className="cauth-input"
                  name="customerPassword" id="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="cauth-show"
                  aria-label="Show password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff size={18} aria-hidden="true" />
                    : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {error.customerPassword && <p className="cauth-error">{error.customerPassword}</p>}
            </div>

            <div className="cauth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="cauth-password">
                <input
                  className="cauth-input"
                  name="confirmPassword" id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat the password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="cauth-show"
                  aria-label="Show confirm password"
                  aria-pressed={showConfirm}
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm
                    ? <EyeOff size={18} aria-hidden="true" />
                    : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {error.confirmPassword && <p className="cauth-error">{error.confirmPassword}</p>}
            </div>

            {/* Rules show only while the password is too weak for validate() (score < 3). */}
            <div className="cauth-field cauth-field--full">
              {form.customerPassword && strength.score < 3 && (
              <ul className="cauth-rules">
                {passwordRules.map((rule, idx) => {
                  const met = rule.test(form.customerPassword);
                  return (
                    <li className={`cauth-rule ${met ? "is-met" : ""}`} key={idx}>
                      {met
                        ? <Check className="cauth-rule-mark" size={13} strokeWidth={3} aria-hidden="true" />
                        : <span className="cauth-rule-dot" aria-hidden="true" />}
                      <span>{rule.label}</span>
                    </li>
                  );
                })}
              </ul>
              )}
              {form.customerPassword && (
                <p className={`cauth-strength cauth-strength--${strength.label.toLowerCase().replace(" ", "-")}`}>
                  Strength: <strong>{strength.label}</strong>
                </p>
              )}
            </div>

            <div className="cauth-confirm">
              <input
                type="checkbox"
                id="confirmedRole"
                checked={confirmedRole}
                onChange={(e) => {
                  setConfirmedAs(e.target.checked ? role : null);
                  if (error.confirmedRole) {
                    setError((prev) => { const next = { ...prev }; delete next.confirmedRole; return next; });
                  }
                }}
                aria-describedby="confirmedRole-note"
              />
              <div>
                <label htmlFor="confirmedRole">
                  {isAgent
                    ? "I'm a RERA-registered real estate agent listing properties for clients."
                    : "I'm an individual property owner — I'm not an agent or broker."}
                </label>
                <p className="cauth-hint" id="confirmedRole-note">This can't be changed later.</p>
                {error.confirmedRole && <p className="cauth-error">{error.confirmedRole}</p>}
              </div>
            </div>

            <p className="cauth-terms">
              By creating an account you agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer">terms</a> and{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a>,
              and to buyers contacting you on WhatsApp about your listings.
            </p>

            {error.global && <p className="cauth-error cauth-error--global" role="alert">{error.global}</p>}

            <button type="submit" className="cauth-submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </button>

            <p className="cauth-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate(isAgent ? "/agent-login" : "/customer-login")}>Login</button>
            </p>

          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomerSignupPage;