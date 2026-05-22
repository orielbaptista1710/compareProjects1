import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
// import "./CustomerSignupPage.css";
import "./authStyles/auth-form.css";
import "./authStyles/auth-layout.css";
import "./authStyles/auth-responsive.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { CustomerAuth } from "../../../config/firebase";

import { Check, X, Eye, EyeOff } from "lucide-react";

// ── Friendly Firebase error messages ──────────────────────────
const FIREBASE_ERRORS = {
  "auth/email-already-in-use": "This email is already registered. Please login.",
  "auth/weak-password":        "Password is too weak. Use at least 6 characters.",
  "auth/invalid-email":        "Invalid email address.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/too-many-requests":    "Too many attempts. Please wait and try again.",
  "auth/operation-not-allowed": "Email signup is not enabled. Contact support.",
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
    // clear only the field error that changed
    if (error[e.target.name]) {
      setError((prev) => { const next = { ...prev }; delete next[e.target.name]; return next; });
    }
  };

  // ── Password strength ────────────────────────────────────────
  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return { score, label: labels[score] ?? "Very Weak" };
  };

  const strength = useMemo(
    () => getPasswordStrength(form.customerPassword),
    [form.customerPassword]
  );

  const passwordRules = [
    { test: (pw) => pw.length >= 8,          label: "At least 8 characters"  },
    { test: (pw) => /[A-Z]/.test(pw),         label: "One uppercase letter"   },
    { test: (pw) => /[0-9]/.test(pw),         label: "One number"             },
    { test: (pw) => /[^A-Za-z0-9]/.test(pw),  label: "One special character"  },
  ];

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (form.customerName.trim().length < 2)
      errs.customerName = "Name must be at least 2 characters";

    if (!/\S+@\S+\.\S+/.test(form.customerEmail))
      errs.customerEmail = "Enter a valid email address";

    if (!/^\d{10}$/.test(form.customerPhone))
      errs.customerPhone = "Enter a valid 10-digit phone number";

    if (strength.score < 3)
      errs.customerPassword = "Password is too weak — meet all 4 requirements";

    if (form.customerPassword !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    return errs;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validate();
  if (Object.keys(validationErrors).length) return setError(validationErrors);

  setSubmitting(true);
  setError({});

  try {
    // 1. Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      CustomerAuth,
      form.customerEmail,
      form.customerPassword
    );

    // 2. Get token explicitly for signup — interceptor handles all other requests
    const idToken = await userCredential.user.getIdToken();

    // 3. Sync to MongoDB
    await API.post("/api/customers/firebase-signup", {
      token: idToken,
      customerName: form.customerName.trim(),
      customerPhone: `+91${form.customerPhone.trim()}`,
    });

    // Firebase SDK holds the session — no token storage needed
    navigate("/customer-profile");

  } catch (err) {
    const message =
      FIREBASE_ERRORS[err.code] ||
      err.response?.data?.message ||
      "Signup failed. Please try again.";

    setError({ global: message });

    // Only clean up Firebase user if the backend 5xx failed
    // Don't delete on 400/409 — backend already handled it (e.g. duplicate email)
    const backendServerError = err.response?.status >= 500;
    if (backendServerError && CustomerAuth.currentUser) {
      try {
        await CustomerAuth.currentUser.delete();
      } catch (cleanupErr) {
        console.error("Firebase cleanup failed:", cleanupErr);
      }
    }
  } finally {
    setSubmitting(false); 
  }
};


  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="auth-page">

      {/* Left — Marketing */}
      <div className="auth-left">
        <div className="signup-content">
          <h1>Get a personalized<br />experience on CompareProjects</h1>
          <ul className="benefits-list ">
            <li><Check className="check-icon" size={16} /> Exclusive Discounts on Projects</li>
            <li><Check className="check-icon" size={16} /> Zero Brokerage Fees</li>
            <li><Check className="check-icon" size={16} /> Direct Contact with Developers</li>
            <li><Check className="check-icon" size={16} /> Free Guidance for Home Loans</li>
          </ul>
          <div className="trusted-by">
            <p>Trusted By Global Brands</p>
            <div className="brands ">
              <span className="brand">blinkit</span>
              <span className="brand">HAVELLS</span>
              <span className="brand">HERSHEY'S</span>
            </div>
          </div> 
          <div className="testimonial">
            <p className="quote">
              "CompareProjects made finding the right property effortless."
            </p>
            <p className="author">Happy Customer</p>
            <p className="position">Mumbai, India</p>
          </div>
        </div>
      </div>

      {/* Right — Signup Form */}
      <div className="auth-right">
        <div className="auth-card">
          <h2>Create new account</h2>
          <p className="subheading">
            Sign up to compare projects, save favorites, and unlock deals.
          </p>

          <form onSubmit={handleSubmit} className="signup-form " noValidate>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="customerName">Full Name</label>
              <input
                name="customerName"
                id="customerName"
                placeholder="Your full name"
                value={form.customerName}
                onChange={handleChange}
                autoComplete="name"
              />
              {error.customerName && <p className="error">{error.customerName}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="customerEmail">Email Address</label>
              <input
                name="customerEmail"
                type="email"
                id="customerEmail"
                placeholder="Your email"
                value={form.customerEmail}
                onChange={handleChange}
                autoComplete="email"
              />
              {error.customerEmail && <p className="error">{error.customerEmail}</p>}
            </div>

            {/* Phone */}
            <div className="form-group ">
              <label htmlFor="customerPhone">Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="country-code">+91</span>
                <input
                  name="customerPhone"
                  id="customerPhone"
                  placeholder="10-digit number"
                  value={form.customerPhone}
                  onChange={handleChange}
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              {error.customerPhone && <p className="error">{error.customerPhone}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="customerPassword">Create a Password</label>
              <div className="password-input-wrapper ">
                <input
                  name="customerPassword"
                  id="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {showPassword
                  ? <EyeOff className="toggle-eye" onClick={() => setShowPassword(false)} />
                  : <Eye    className="toggle-eye" onClick={() => setShowPassword(true)}  />
                }
              </div>

              {/* Strength bar */}
              {form.customerPassword && (
                <div className={`password-strength ${strength.label.toLowerCase().replace(" ", "-")}`}>
                  Password Strength: <strong>{strength.label}</strong>
                </div>
              )}

              {/* Rules checklist */}
              <div className="password-requirements">
                {passwordRules.map((rule, idx) => (
                  <div className="requirement" key={idx}>
                    {rule.test(form.customerPassword)
                      ? <Check className="valid"   size={14} />
                      : <X     className="invalid" size={14} />
                    }
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
              {error.customerPassword && <p className="error">{error.customerPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper ">
                <input
                  name="confirmPassword"
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {showConfirm
                  ? <EyeOff className="toggle-eye" onClick={() => setShowConfirm(false)} />
                  : <Eye    className="toggle-eye" onClick={() => setShowConfirm(true)}  />
                }
              </div>
              {error.confirmPassword && <p className="error">{error.confirmPassword}</p>}
            </div>

            {/* Global error */}
            {error.global && <p className="error global-error">{error.global}</p>}

            <button
              type="submit"
              className="signup-btn"
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "SIGN UP"}
            </button>

            <p className="login-redirect ">
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