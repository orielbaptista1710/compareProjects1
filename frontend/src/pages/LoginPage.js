// LoginPage for Developers and Admin Staff
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import API from '../api';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons/faEye";
import {faEyeSlash} from "@fortawesome/free-solid-svg-icons/faEyeSlash";
import DeveloperPopup from '../components/DeveloperPopup';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeveloperPopup, setShowDeveloperPopup] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.post(
        '/api/auth/login',
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError('Unexpected server response. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.message ||
        (err.response ? `Login failed (${err.response.status})` :
         err.request ? 'No response from server' :
         'Error setting up request');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <DeveloperPopup
        isOpen={showDeveloperPopup}
        onClose={() => setShowDeveloperPopup(false)}
      />
      
      <div className="login-box">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-heading">Welcome Back Developer</h2>

          <label className="login-label">
            Username
            <input
              type="text"
              name="username"
              className="login-input"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>

          <label className="login-label password-label">
            Password
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="login-input"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </label>

          <div className="login-extra">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              Remember me
            </label>
            
            <button
              type="button"
              className="forgot-password"
              onClick={async () => {
                const username = formData.username;
                if (!username) return alert('Please enter your username first');
                try {
                  const { data } = await API.post('/api/devlog/developer-forgot-password', { username });
                  alert(data.message);
                } catch (err) {
                  alert(err.response?.data?.message || 'Error sending temporary password');
                }
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {error && <div className="login-error">{error}</div>}

          <p style={{ textAlign: "center", marginTop: "1rem", color: "#666" }}>
            Don't have an account yet?{" "}
            <span 
              className="auth-link" 
              onClick={() => setShowDeveloperPopup(true)}
              style={{ color: "#7e5bd6", cursor: "pointer", fontWeight: "500" }}
            >  
              Contact Us
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;