import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import './CustomerLoginPage.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons/faEye";
import {faEyeSlash} from "@fortawesome/free-solid-svg-icons/faEyeSlash";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";

const CustomerLoginPage = () => {
  const [form, setForm] = useState({ emailOrPhone: "", customerPassword: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await API.post("/api/customers/customer-login", form);
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customer", JSON.stringify(data.customer));
      navigate("/customer-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container ">
      {/* Left Section - Marketing Content (Same as signup) */}
      <div className="signup-left ">
        <div className="signup-content">
          <h1>
            Get a personalized <br /> experience on CompareProjects
          </h1>

          <ul className="benefits-list ">
            <li>
              <FontAwesomeIcon icon={faCheck} className="check-icon" />
              Exclusive Discounts on Projects
            </li>
            <li>
              <FontAwesomeIcon icon={faCheck} className="check-icon" />
              Zero Brokerage Fees
            </li>
            <li>
              <FontAwesomeIcon icon={faCheck} className="check-icon" />
              Direct Contact with Developers
            </li>
            <li>
              <FontAwesomeIcon icon={faCheck} className="check-icon" />
              Free Guidance for Home Loans
            </li>
          </ul>

          <div className="trusted-by ">
            <p>Trusted By Global Brands</p>
            <div className="brands ">
              <span className="brand">blinkit</span>
              <span className="brand">HAVELLS</span>
              <span className="brand">HERSHEY'S</span>
            </div>
          </div>

          <div className="testimonial ">
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
      <div className="login-right ">
        <div className="login-form-container ">
          <h2>Customer Login</h2>
          <p className="login-subheading">Access your account to continue</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group ">
              <label htmlFor="emailOrPhone">Email or Phone</label>
              <input 
                name="emailOrPhone" 
                id="emailOrPhone"
                placeholder="Email or Phone" 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group ">
              <label htmlFor="customerPassword">Password</label>
              <div className="password-input-wrapper ">
                <input
                  name="customerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.customerPassword}
                  onChange={handleChange}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              <div className="forgot-password">
                <a href="#forgot">Forgot password?</a>
              </div>
            </div>

            <button type="submit" className="login-btn ">Login</button>
            
            {error && <p className="error">{error}</p>}

            <p className="login-redirect ">
              Don't have an account? <span onClick={() => navigate("/customer-signup")}>Signup</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;