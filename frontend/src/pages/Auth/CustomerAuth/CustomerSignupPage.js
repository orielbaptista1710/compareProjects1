//pages/Auth/CustomerAuth/CustomerSignupPage.js
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import "./CustomerSignupPage.css";

// 🆕 Lucide React icons
import { Check, X, Eye, EyeOff } from "lucide-react";

const CustomerSignupPage = () => {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError({});
  };

  // Password strength + validation
  const getPasswordStrength = (customerPassword) => {
    let score = 0;
    if (customerPassword.length >= 8) score++;
    if (/[A-Z]/.test(customerPassword)) score++;
    if (/[0-9]/.test(customerPassword)) score++;
    if (/[^A-Za-z0-9]/.test(customerPassword)) score++;

    let label = "Very Weak";
    if (score === 1) label = "Weak";
    else if (score === 2) label = "Fair";
    else if (score === 3) label = "Good";
    else if (score === 4) label = "Strong";

    return { score, label };
  };

  const strength = useMemo(
    () => getPasswordStrength(form.customerPassword),
    [form.customerPassword]
  );

  // Password rules for checklist
  const passwordRules = [
    { test: (pw) => pw.length >= 8, label: "At least 8 characters" },
    { test: (pw) => /[A-Z]/.test(pw), label: "One uppercase letter" },
    { test: (pw) => /[0-9]/.test(pw), label: "One number" },
    { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: "One special character" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (form.customerName.length < 2) newErrors.customerName = "Name must be at least 2 characters";
    if (!/\S+@\S+\.\S+/.test(form.customerEmail)) newErrors.customerEmail = "Invalid email";
    if (!/^\d{10,15}$/.test(form.customerPhone)) newErrors.customerPhone = "Invalid phone number";
    if (form.customerPassword !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length) return setError(newErrors);

    try {
      const { customerName, customerEmail, customerPhone, customerPassword } = form;
      const { data } = await API.post("/api/customers/customer-signup", {
        customerName,
        customerEmail,
        customerPhone,
        customerPassword,
      });
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customer", JSON.stringify(data.customer));
      alert("Signup successful! Redirecting...");
      navigate("/customer-profile");
    } catch (err) {
      setError({ global: err.response?.data?.message || "Signup failed" });
    }
  };

  return (
    <div className="signup-container compact">
      {/* Left Section - Marketing Content */}
      <div className="signup-left compact">
        <div className="signup-content">
          <h1>Get a personalized<br />experience on ComparProjects</h1>
          
          <ul className="benefits-list compact">
            <li><Check className="check-icon" size={16} /> Exclusive Discounts on Projects</li>
            <li><Check className="check-icon" size={16} /> Zero Brokerage Fees</li>
            <li><Check className="check-icon" size={16} /> Direct Contact with Developers</li>
            <li><Check className="check-icon" size={16} /> Free Guidance for Home Loans</li>
          </ul>
          
          <div className="trusted-by compact">
            <p>Trusted By Global Brands</p>
            <div className="brands compact">
              <span className="brand">blinkit</span>
              <span className="brand">HAVELLS</span>
              <span className="brand">HERSHEY'S</span>
            </div>
          </div>
          
          <div className="testimonial compact">
            <p className="quote">
              "I think Procol is the best product on the market. We evaluated a few solutions but liked that it was the fastest and cost-efficient to set up across all our geographies."
            </p>
            <p className="author">Nisheeth Jain</p>
            <p className="position">Finance Team, More Retail Limited</p>
          </div>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className="signup-right compact">
        <div className="signup-form-container compact">
          <h2>Create new account</h2>
          <p className="subheading">Sign up to compare projects, save favorites, and unlock deals.</p>

          <form onSubmit={handleSubmit} className="signup-form compact">
            <div className="form-group compact">
              <label htmlFor="customerName">Full Name</label>
              <input
                name="customerName"
                id="customerName"
                placeholder="Your full name"
                value={form.customerName}
                onChange={handleChange}
              />
              {error.customerName && <p className="error">{error.customerName}</p>}
            </div>

            <div className="form-group compact">
              <label htmlFor="customerEmail">Email Address</label>
              <input
                name="customerEmail"
                type="email"
                id="customerEmail"
                placeholder="Your email"
                value={form.customerEmail}
                onChange={handleChange}
              />
              {error.customerEmail && <p className="error">{error.customerEmail}</p>}
            </div>

            <div className="form-group compact">
              <label htmlFor="customerPhone">Phone Number</label>
              <input
                name="customerPhone"
                id="customerPhone"
                placeholder="Your phone number"
                value={form.customerPhone}
                onChange={handleChange}
              />
              {error.customerPhone && <p className="error">{error.customerPhone}</p>}
            </div>

            <div className="form-group compact">
              <label htmlFor="customerPassword">Create a password</label>
              <div className="password-input-wrapper compact">
                <input
                  name="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  required
                />
                {showPassword ? (
                  <EyeOff className="toggle-eye" onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <Eye className="toggle-eye" onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>

              {/* Password strength indicator */}
              {form.customerPassword && (
                <div className={`password-strength ${strength.label.toLowerCase()}`}>
                  Password Strength: <strong>{strength.label}</strong>
                </div>
              )}

              {/* Password requirements */}
              <div className="password-requirements compact">
                {passwordRules.map((rule, idx) => (
                  <div className="requirement" key={idx}>
                    {rule.test(form.customerPassword) ? (
                      <Check className="valid" size={14} />
                    ) : (
                      <X className="invalid" size={14} />
                    )}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group compact">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper compact">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {showConfirm ? (
                  <EyeOff className="toggle-eye" onClick={() => setShowConfirm(!showConfirm)} />
                ) : (
                  <Eye className="toggle-eye" onClick={() => setShowConfirm(!showConfirm)} />
                )}
              </div>
              {error.confirmPassword && <p className="error">{error.confirmPassword}</p>}
            </div>

            <button type="submit" className="signup-btn compact">SIGN UP</button>
            {error.global && <p className="error">{error.global}</p>}
            <p className="login-redirect compact">
              Already have an account? <span onClick={() => navigate("/customer-login")}>Login</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignupPage;
