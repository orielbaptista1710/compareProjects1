import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import "./authStyles/auth-form.css";
import "./authStyles/auth-layout.css";
import "./authStyles/auth-responsive.css";

import AuthMarketingPanel from "./AuthMarketingPanel";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { CustomerAuth } from "../../../config/firebase";

import { Check, X, Eye, EyeOff } from "lucide-react";

const FIREBASE_ERRORS = {
  "auth/email-already-in-use":    "This email is already registered. Please login.",
  "auth/weak-password":           "Password is too weak. Use at least 6 characters.",
  "auth/invalid-email":           "Invalid email address.",
  "auth/network-request-failed":  "Network error. Check your connection and try again.",
  "auth/too-many-requests":       "Too many attempts. Please wait and try again.",
  "auth/operation-not-allowed":   "Email signup is not enabled. Contact support.",
};

const CustomerSignupPage = () => {
  const [form, setForm] = useState({
    customerName:     "",
    customerEmail:    "",
    customerPhone:    "",
    customerPassword: "",
    confirmPassword:  "",
  });
  const [error, setError]               = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const navigate = useNavigate();

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
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) return setError(validationErrors);

    setSubmitting(true);
    setError({});

    try {
      const userCredential = await createUserWithEmailAndPassword(
        CustomerAuth, form.customerEmail, form.customerPassword
      );
      const idToken = await userCredential.user.getIdToken();
      await API.post("/api/customers/firebase-signup", {
        token: idToken,
        customerName:  form.customerName.trim(),
        customerPhone: `+91${form.customerPhone.trim()}`,
      });
      navigate("/customer-profile");
    } catch (err) {
      const message =
        FIREBASE_ERRORS[err.code] ||
        err.response?.data?.message ||
        "Signup failed. Please try again.";
      setError({ global: message });

      const backendServerError = err.response?.status >= 500;
      if (backendServerError && CustomerAuth.currentUser) {
        try { await CustomerAuth.currentUser.delete(); } catch (e) { console.error(e); }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthMarketingPanel />

      <div className="auth-right">
        <div className="auth-card">
          <h2>Create new account</h2>
          <p className="subheading">
            Sign up to compare projects, save favorites, and unlock deals.
          </p>

          <form onSubmit={handleSubmit} className="signup-form" noValidate>

            {/* Row 1: Name + Email */}
            <div className="form-group">
              <label htmlFor="customerName">Full Name</label>
              <input
                name="customerName" id="customerName"
                placeholder="Your full name"
                value={form.customerName}
                onChange={handleChange}
                autoComplete="name"
              />
              {error.customerName && <p className="error">{error.customerName}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="customerEmail">Email Address</label>
              <input
                name="customerEmail" id="customerEmail" type="email"
                placeholder="Your email"
                value={form.customerEmail}
                onChange={handleChange}
                autoComplete="email"
              />
              {error.customerEmail && <p className="error">{error.customerEmail}</p>}
            </div>

            {/* Row 2: Phone (full width) */}
            <div className="form-group full">
              <label htmlFor="customerPhone">Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="country-code">+91</span>
                <input
                  name="customerPhone" id="customerPhone"
                  placeholder="10-digit number"
                  value={form.customerPhone}
                  onChange={handleChange}
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              {error.customerPhone && <p className="error">{error.customerPhone}</p>}
            </div>

            {/* Row 3: Password + Confirm side by side */}
            <div className="form-group">
              <label htmlFor="customerPassword">Password</label>
              <div className="password-input-wrapper">
                <input
                  name="customerPassword" id="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {showPassword
                  ? <EyeOff className="toggle-eye" size={18} onClick={() => setShowPassword(false)} />
                  : <Eye    className="toggle-eye" size={18} onClick={() => setShowPassword(true)}  />
                }
              </div>
              {error.customerPassword && <p className="error">{error.customerPassword}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  name="confirmPassword" id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {showConfirm
                  ? <EyeOff className="toggle-eye" size={18} onClick={() => setShowConfirm(false)} />
                  : <Eye    className="toggle-eye" size={18} onClick={() => setShowConfirm(true)}  />
                }
              </div>
              {error.confirmPassword && <p className="error">{error.confirmPassword}</p>}
            </div>

            {/* Password rules — full width, below both password fields */}
            <div className="form-group password-group">
              {form.customerPassword && (
                <div className={`password-strength ${strength.label.toLowerCase().replace(" ", "-")}`}>
                  Strength: <strong>{strength.label}</strong>
                </div>
              )}
              <div className="password-requirements">
                {passwordRules.map((rule, idx) => (
                  <div className="requirement" key={idx}>
                    {rule.test(form.customerPassword)
                      ? <Check className="valid"   size={13} />
                      : <X     className="invalid" size={13} />
                    }
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {error.global && <p className="error global-error">{error.global}</p>}

            <button type="submit" className="signup-btn" disabled={submitting}>
              {submitting ? "Creating account..." : "SIGN UP"}
            </button>

            <p className="login-redirect">
              Already have an account?{" "}
              <span onClick={() => navigate("/customer-login")}>Login</span>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignupPage;