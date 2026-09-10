import { useState } from 'react';
import API from '../../api';
import toast from 'react-hot-toast';
import './ForgotPasswordPopup.css';

const COMPANY_CONTACT_NUMBER = '+91-XXXXXXXXXX'; // replace with your real support number

const ForgotPasswordPopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ username: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.phone) {
      toast.error('Please enter your username and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/api/password-reset-requests', formData);
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong — please call us directly instead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>×</button>

        {submitted ? (
          <div>
            <h3>Request received</h3>
            <p>We'll contact you shortly to help reset your password.</p>
            <p>Need it urgently? Call us at <strong>{COMPANY_CONTACT_NUMBER}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3>Forgot your password?</h3>
            <p>Enter your details and our team will reach out to reset it.</p>

            <label>
              Username
              <input type="text" name="username" value={formData.username} onChange={handleChange} required />
            </label>

            <label>
              Phone number
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            </label>

            <label>
              Note (optional)
              <textarea name="note" value={formData.note} onChange={handleChange} maxLength={500} />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send request'}
            </button>

            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Prefer to talk to someone right away? Call us at <strong>{COMPANY_CONTACT_NUMBER}</strong>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;