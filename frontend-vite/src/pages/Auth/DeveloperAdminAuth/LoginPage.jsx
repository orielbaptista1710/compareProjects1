// LoginPage for Developers and Admin Staff
//frontend/src/pages/Auth/DeveloperAdminAuth/LoginPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import './LoginPage.css';
import API from '../../../api'; 
import { Eye, EyeOff } from 'lucide-react'; 
import DeveloperPopup from '../../../shared/Popups/DeveloperPopup';
// import MascotGuide from '../../../components/DevDashboardPageComponents/Mascot/MascotGuide'
// import Seo from '../constants/Seo';
import toast from 'react-hot-toast';


const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  // const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeveloperPopup, setShowDeveloperPopup] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      const { data } = await API.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true, 
      });

      if (data.user || data.user.isActive=='true') {
        await queryClient.invalidateQueries(['current-user']);
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
        toast.success(`Welcome back, ${data.user.displayName}!`);


      }
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      const msg =
      status === 403 ? 'Your account has been deactivated. Contact admin.' :
      status === 429 ? 'Too many attempts. Try again in 15 minutes.' :
      status === 401 ? 'Invalid username or password.' :
      !err.response   ? 'Server unreachable. It may be waking up — try again in 30 seconds.' :
      serverMsg       || 'Login failed. Please try again.';
  
      toast.error(msg);
      setError(msg); 
    } finally {
          setLoading(false);
        }
      };

  return (
    <div className="login-container">
      {/* <Seo 
       title="Login | CompareProjects" 
       description="Customers can access your CompareProjects account to manage properties, track inquiries, and explore personalized property recommendations." 
      /> */}

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
              {showPassword ? (
                <EyeOff
                  size={20}
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <Eye
                  size={20}
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                />
              )}
            </div>
          </label>

          <div className="login-extra">
            
            <button
              type="button"
              className="dev-forgot-password"
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

      {/* <MascotGuide
              steps={[
                "Welcome Developer!.",
                "If want to join our community please contact us",
              ]}
            />   */}

    </div>
  );
};

export default LoginPage;

