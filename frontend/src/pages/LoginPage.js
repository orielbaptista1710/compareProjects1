import { useState } from 'react';
// import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import API from '../api';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      <div className="login-box">
        {/* <img src={logoo} alt="Logo" className="login-logo" /> */}

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-heading">Welcome Back</h2>

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

          <label className="login-label">
            Password
            <input
              type="password"
              name="password"
              className="login-input"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
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
              onClick={() => alert('Reset link coming soon!')}
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
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
