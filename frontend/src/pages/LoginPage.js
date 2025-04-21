import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logoo from '../images/logo.png';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    // Basic client-side validation
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }
  
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', 
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('Login response:', res.data); // Add this
  
      if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Navigate based on role
        navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError('Invalid response from server');
      }
  
    } catch (err) {
      console.error('Full login error:', err); // Enhanced logging
      
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Error response data:', err.response.data);
        console.error('Error status:', err.response.status);
        
        setError(err.response.data.message || 
                `Login failed (${err.response.status})`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('Server is not responding. Please try again later.');
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', err.message);
        setError('Error setting up login request: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="login-container">
      <h1 className="login-title">
        <img className='logo-img' src={logoo} alt="Logo" />
      </h1>

      <form className="login-form-wrapper" onSubmit={handleSubmit}>
        <div className="login-form-group">
          <label className="login-label">Username</label>
          <input
            className="login-input"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="login-form-group">
          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="login-options">
          <label className="login-remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="login-checkbox"
            />
            Remember me
          </label>
          <a href="#" className="login-forgot-password">Forgot password?</a>
        </div>

        <button 
          className="login-button" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
};

export default LoginPage;