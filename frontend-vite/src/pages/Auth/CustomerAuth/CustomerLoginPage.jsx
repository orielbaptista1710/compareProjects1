//frontend/src/pages/Auth/CustomerAuth/CustomerLoginPage.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; 
import { AuthContext } from "../../../contexts/AuthContext";
import API from "../../../api";

import "./authStyles/auth-form.css";
import "./authStyles/auth-layout.css";
import "./authStyles/auth-responsive.css";

import AuthMarketingPanel from "./AuthMarketingPanel";

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
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

const CustomerLoginPage = () => {
  const [form, setForm] = useState({
    emailOrPhone:     "",
    customerPassword: "",
  });
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // const { setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();

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

    // No token to store — interceptor handles everything from here
    navigate("/customer-profile");

  } catch (err) {
    console.error("Login error:", err);
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
          <h2 className="auth-title">Customer Login</h2>
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
              <span onClick={() => navigate("/customer-signup")}>Sign up</span>
            </p>

          </form>
        </div>

      </div>

    
    </div>
  );
};

export default CustomerLoginPage;