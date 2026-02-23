//pages/Auth/CustomerAuth/CustomerLoginPage.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react"; 
import { AuthContext } from "../../../contexts/AuthContext";
import API from "../../../api";
import "./CustomerLoginPage.css";

const CustomerLoginPage = () => {
  const [form, setForm] = useState({ emailOrPhone: "", customerPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/api/customers/customer-login", form);
      localStorage.setItem("customerToken", data.token);
      setCurrentUser(data.customer);
      navigate("/customer-profile");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-login-container">
      {/* Left Section - Marketing Content */}
      <div className="signup-left">
        <div className="signup-content">
          <h1>
            Get a personalized <br /> experience on CompareProjects
          </h1>

          <ul className="benefits-list">
            {[
              "Exclusive Discounts on Projects",
              "Zero Brokerage Fees",
              "Direct Contact with Developers",
              "Free Guidance for Home Loans",
            ].map((text, i) => (
              <li key={i}>
                <Check className="check-icon" size={16} color="#28a745" strokeWidth={2.2} /> {text}
              </li>
            ))}
          </ul>

          <div className="trusted-by">
            <p>Trusted By Global Brands</p>
            <div className="brands">
              <span className="brand">blinkit</span>
              <span className="brand">HAVELLS</span>
              <span className="brand">HERSHEY'S</span>
            </div>
          </div>

          <div className="testimonial">
            <p className="quote">
              "CompareProjects helped me find the best property deal with zero brokerage and quick
              developer support."
            </p>
            <p className="author">Satisfied Customer</p>
            <p className="position">Mumbai, India</p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <h2>Customer Login</h2>
          <p className="login-subheading">Access your account to continue</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email or Phone</label>
              <input
                name="emailOrPhone"
                id="emailOrPhone"
                placeholder="Email or Phone"
                value={form.emailOrPhone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  name="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  required
                />
                {showPassword ? (
                  <EyeOff
                    className="toggle-eye"
                    size={18}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                ) : (
                  <Eye
                    className="toggle-eye"
                    size={18}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                )}
              </div>
              <div className="forgot-password">
                <a href="#forgot">Forgot password?</a>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {error && <p className="error">{error}</p>}

            <p className="login-redirect">
              Don't have an account?{" "}
              <span onClick={() => navigate("/customer-signup")}>Signup</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
