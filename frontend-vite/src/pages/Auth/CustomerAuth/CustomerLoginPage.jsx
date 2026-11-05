//frontend/src/pages/Auth/CustomerAuth/CustomerLoginPage.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../../../api/api";
import { AuthContext } from "../../../contexts/AuthContext";

import "./authStyles/auth-form.css";
import "./authStyles/auth-layout.css";
import "./authStyles/auth-responsive.css";

import AuthMarketingPanel from "./AuthMarketingPanel";

import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { CustomerAuth } from "../../../config/firebase";

// ── Friendly Firebase error messages ──────────────────────────
const FIREBASE_ERRORS = {
  "auth/invalid-credential":      "Invalid email or password.",
  "auth/user-not-found":          "No account found with this email. Please sign up.",
  "auth/wrong-password":          "Incorrect password. Please try again.",
  "auth/invalid-email":           "Invalid email address.",
  "auth/user-disabled":           "This account has been disabled. Contact support.",
  "auth/too-many-requests":       "Too many attempts. Please wait and try again.",
  "auth/network-request-failed":  "Network error. Check your connection and try again.",
};

// isAgent: the /agent-login variant — same Firebase login (agents are customer
// accounts with an approved agent application); only the wording and the
// signup link differ.
const CustomerLoginPage = ({ isAgent = false }) => {
  const [form, setForm] = useState({
    emailOrPhone:     "",
    customerPassword: "",
  });
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  // Optional: the page is also rendered without the provider in tests.
  const auth = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // ── Login ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  if (!form.emailOrPhone.trim() || !form.customerPassword) {
    return setError("Please fill in both fields.");
  }

  setLoading(true);
 
  try {
    // 1. Firebase login
    const userCredential = await signInWithEmailAndPassword(
      CustomerAuth,
      form.emailOrPhone.trim(),
      form.customerPassword
    );

    // 2. Get token to verify account exists in MongoDB
    const idToken = await userCredential.user.getIdToken();
    await API.post("/api/customers/firebase-login", { token: idToken });

    // AuthContext's own /me check can run before firebase-login has created
    // the Mongo record and come back 401; load the profile again now, before
    // the profile page reads it. No token to store — the interceptor handles it.
    await auth?.refreshUser?.();
    navigate("/customer-profile");

  } catch (err) {
    // Code/status only: the axios error's config holds the Firebase ID token.
    console.error("Login error:", err.code || err.response?.status || err.message);

    // Firebase accepted the password but our backend refused (e.g. account
    // suspended): show its reason and don't leave them half signed in.
    if (err.response) {
      try { await signOut(CustomerAuth); } catch { /* already signed out */ }
      setError(
        (err.response.status < 500 && err.response.data?.message) ||
        "Login failed. Please try again."
      );
      return;
    }

    setError(FIREBASE_ERRORS[err.code] || "Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // ── Password Reset ───────────────────────────────────────────
  const handleForgotPassword = async () => {
    const email = form.emailOrPhone.trim();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return setError("Enter your email address above, then click Forgot Password.");
    }

    setResetLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(CustomerAuth, email);
      setResetSent(true);
    } catch (err) {
      console.error("Reset error:", err);
      // Don't reveal whether email exists — generic message always
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="auth-page">

      {/* Left — Marketing */}
      <AuthMarketingPanel />

      {/* Right — Login Form */}
      <div className="auth-right">

        <div className="auth-card">
          <h2 className="auth-title">{isAgent ? "Agent Login" : "Customer Login"}</h2>
          <p className="auth-subtitle">Access your account to continue</p>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="emailOrPhone">Email Address</label>
              <input
                name="emailOrPhone"
                id="emailOrPhone"
                type="email"
                placeholder="Your email"
                value={form.emailOrPhone}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="customerPassword">Password</label>
              <div className="password-input-wrapper">
                <input
                  name="customerPassword"
                  id="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                {showPassword
                  ? <EyeOff className="toggle-eye" size={18} onClick={() => setShowPassword(false)} />
                  : <Eye    className="toggle-eye" size={18} onClick={() => setShowPassword(true)}  />
                }
              </div>

              {/* Forgot password */}
              <div className="forgot-password">
                {resetSent ? (
                  <span className="reset-sent">
                     Reset email sent — check your inbox
                  </span>
                ) : (
                  <span
                    onClick={handleForgotPassword}
                    className="forgot-link"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                  >
                    {resetLoading ? "Sending..." : "Forgot password?"}
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            {error && <p className="error">{error}</p>}

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="auth-redirect">
              Don't have an account?{" "}
              <span onClick={() => navigate(isAgent ? "/agent-signup" : "/customer-signup")}>Sign up</span>
            </p>

          </form>
        </div>

      </div>

    
    </div>
  );
};

export default CustomerLoginPage;