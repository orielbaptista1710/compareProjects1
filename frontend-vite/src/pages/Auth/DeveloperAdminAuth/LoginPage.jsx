// LoginPage for Developers and Admin Staff
//frontend/src/pages/Auth/DeveloperAdminAuth/LoginPage.js
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import './LoginPage.css';
import API from '../../../api/api';
import { Building2, ClipboardCheck, Eye, EyeOff, LifeBuoy } from 'lucide-react';
import DeveloperPopup from '../../../shared/Popups/DeveloperPopup';
import ForgotPasswordPopup from '../../../shared/Popups/ForgotPasswordPopup';
// import MascotGuide from '../../../components/DevDashboardPageComponents/Mascot/MascotGuide'
// import Seo from '../constants/Seo';
import toast from 'react-hot-toast';
import { USER_ROLES } from '../../../constants/roles';

 
const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  // const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
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

        // Wipe the whole cache, not just current-user — otherwise switching
        // accounts without logging out first can leave a previous session's
        // cached data (e.g. my-properties, adminProperties) showing under the
        // new account until it happens to go stale on its own.
        queryClient.clear();
        navigate(data.user.role === USER_ROLES.ADMIN ? '/admin' : '/dashboard');
        toast.success(`Welcome back, ${data.user.displayName}!`);
      
        
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      const msg =
      status === 403 ? 'Your account has been deactivated. Contact admin.' :
      status === 429 ? 'Too many attempts. Try again in 15 minutes.' :
      status === 401 ? 'Invalid username or password.' :
      !err.response   ? 'Server unreachable. It may be waking up — try again in 30 seconds.' :
      serverMsg       || 'Login failed. Please try again.';

      // Shown once, in the inline alert under the fields (no toast too —
      // screen readers would announce the same error twice).
      setError(msg);
    } finally {
          setLoading(false);
        }
      };

  // Layout: the sign-in card comes first in the DOM (first thing a keyboard or
  // screen-reader user reaches); on wide screens CSS places the info panel on the left.
  return (
    <main className="devlogin-page">
      {/* <Seo
       title="Login | CompareProjects"
       description="Customers can access your CompareProjects account to manage properties, track inquiries, and explore personalized property recommendations."
      /> */}

      <DeveloperPopup
        isOpen={showDeveloperPopup}
        onClose={() => setShowDeveloperPopup(false)}
      />

      <div className="devlogin-split">
        <section className="devlogin-main" aria-labelledby="devlogin-title">
          <div className="devlogin-card">
            <span className="devlogin-pill">For developers</span>
            <h1 id="devlogin-title" className="devlogin-title">Developer sign in</h1>

            <form className="devlogin-form" onSubmit={handleSubmit}>
              <div className="devlogin-field">
                <label htmlFor="devlogin-username" className="devlogin-label">Username</label>
                <input
                  id="devlogin-username"
                  type="text"
                  name="username"
                  className="devlogin-input"
                  placeholder="Enter username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="devlogin-field">
                <div className="devlogin-label-row">
                  <label htmlFor="devlogin-password" className="devlogin-label">Password</label>
                  <button
                    type="button"
                    className="devlogin-textlink"
                    onClick={() => setShowForgotPasswordPopup(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="devlogin-password">
                  <input
                    id="devlogin-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="devlogin-input devlogin-input--password"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="devlogin-show"
                    aria-label="Show password"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && <div className="devlogin-error" role="alert">{error}</div>}

              <button
                type="submit"
                className="devlogin-submit"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="devlogin-help">
                Too many wrong attempts will pause sign-in for 15 minutes.
              </p>
            </form>

            <div className="devlogin-others">
              <p>
                Selling or renting your own home?{" "}
                <Link to="/customer-login" className="devlogin-link">Owner sign in</Link>
              </p>
              <p>
                Registered agent or broker?{" "}
                <Link to="/agent-login" className="devlogin-link">Agent sign in</Link>
              </p>
            </div>
          </div>
        </section>

        <aside className="devlogin-panel" aria-labelledby="devlogin-panel-title">
          <div className="devlogin-panel-inner">
            <p className="devlogin-eyebrow">Developer workspace</p>
            <h2 id="devlogin-panel-title" className="devlogin-panel-title">
              Your projects on CompareProjects, in one place
            </h2>

            <ul className="devlogin-features">
              <li>
                <span className="devlogin-feature-icon" aria-hidden="true"><Building2 size={18} /></span>
                <div>
                  <h3>List and update your projects</h3>
                  <p>Prices, configurations, photos and RERA details, all from your dashboard.</p>
                </div>
              </li>
              <li>
                <span className="devlogin-feature-icon" aria-hidden="true"><ClipboardCheck size={18} /></span>
                <div>
                  <h3>Track every listing&apos;s review</h3>
                  <p>See which listings are live and which are still with our team for review.</p>
                </div>
              </li>
              <li>
                <span className="devlogin-feature-icon" aria-hidden="true"><LifeBuoy size={18} /></span>
                <div>
                  <h3>Help when you need it</h3>
                  <p>Reach our support team straight from your dashboard.</p>
                </div>
              </li>
            </ul>

            <div className="devlogin-access">
              <h3>Don&apos;t have an account?</h3>
              <p>
                Developer accounts are set up by our team after we verify your company
                and RERA registrations.
              </p>
              <button
                type="button"
                className="devlogin-access-btn"
                onClick={() => setShowDeveloperPopup(true)}
              >
                Request access
              </button>
            </div>
          </div>
        </aside>
      </div>

      <ForgotPasswordPopup
        isOpen={showForgotPasswordPopup}
        onClose={() => setShowForgotPasswordPopup(false)}
      />

      {/* <MascotGuide
              steps={[
                "Welcome Developer!.",
                "If want to join our community please contact us",
              ]}
            />   */}

    </main>
  );
};

export default LoginPage;

