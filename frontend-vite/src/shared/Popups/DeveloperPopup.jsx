 //frontend-vite/src/shared/Popups/DeveloperPopup.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "./DeveloperPopup.css";

const BENEFITS = [
  "Quick Sellouts of Projects",
  "Bulk Order Advantages",
  "Strong Branding & Visibility",
  "Direct Customer Reach",
  "Digital Marketing Support",
];

const INITIAL_FORM = {
  developerFullName: "",
  developerEmail: "",
  developerPhone: "",
  developerContactConsent: false,
};

const DeveloperPopup = ({ isOpen, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const panelRef = useRef(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
      setPrevIsOpen(isOpen);
      if (!isOpen) {
        setFormData(INITIAL_FORM);
        setErrorMsg("");
      }
  }

  // Close on outside click
  useOutsideClick(isOpen, [panelRef], ()=>{
    setFormData(INITIAL_FORM);
  });

  // Close on Escape
  useEscapeKey(isOpen, onClose);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);


  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name === "developerPhone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, developerPhone: digitsOnly }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.developerFullName.trim() || !formData.developerEmail.trim() || !formData.developerPhone.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.developerPhone)) {
      setErrorMsg("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!formData.developerContactConsent) {
      setErrorMsg("Please consent to being contacted.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leads/developer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: "developer_popup",
        }),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      setTimeout(onClose, 1500);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dp-overlay" role="dialog" aria-modal="true" aria-label="Post your property">
      <div className="dp-container" ref={panelRef}>

        {/* ── Left panel ── */}
        <div className="dp-left" aria-hidden="true">
          <div className="dp-left-content">
            <p className="dp-left-eyebrow">For Developers</p>
            <h2 className="dp-left-heading">
              Post your properties with confidence
            </h2>

            <ul className="dp-benefits">
              {BENEFITS.map((b) => (
                <li key={b} className="dp-benefit">
                  <span className="dp-benefit-icon"><Check size={13} strokeWidth={2.5} /></span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="dp-right">
          <button
            className="dp-close"
            onClick={onClose}
            aria-label="Close popup"
          >
            <X size={18} strokeWidth={1.5} />
          </button>

          <div className="dp-form-header">
            <h2 className="dp-form-title">List your property</h2>
            <p className="dp-form-subtitle">We'll get back to you within 24 hours</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="dp-fields">
              <div className="dp-field">
                <label htmlFor="developerFullName">Full Name</label>
                <input
                  id="developerFullName"
                  type="text"
                  name="developerFullName"
                  placeholder="Your name"
                  value={formData.developerFullName}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="dp-field">
                <label htmlFor="developerEmail">Email</label>
                <input
                  id="developerEmail"
                  type="email"
                  name="developerEmail"
                  placeholder="you@example.com"
                  value={formData.developerEmail}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="dp-field">
                <label htmlFor="developerPhone">Phone</label>
                <input
                  id="developerPhone"
                  type="tel"
                  name="developerPhone"
                  placeholder="10-digit mobile number"
                  value={formData.developerPhone}
                  onChange={handleChange}
                  autoComplete="tel-national"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <label className="dp-consent">
              <input
                type="checkbox"
                name="developerContactConsent"
                checked={formData.developerContactConsent}
                onChange={handleChange}
              />
              <span className="dp-consent-box" aria-hidden="true" />
              I consent to being contacted using the details above
            </label>

            {errorMsg && <p className="dp-error-text">{errorMsg}</p>}

            <button
              type="submit"
              className="dp-submit"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Get Started"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default DeveloperPopup;







