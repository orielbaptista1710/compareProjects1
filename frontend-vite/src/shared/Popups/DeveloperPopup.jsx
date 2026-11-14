// frontend-vite/src/shared/Popups/DeveloperPopup.jsx
// "Request a developer account" popup, opened from Post Property and the
// developer login page. Sends a lead to POST /api/leads/developer.
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, CircleCheck } from "lucide-react";
import API from "../../api/api";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "./DeveloperPopup.css";

// TODO(confirm before release): placeholder copy, pending sign-off from
// management. Every promise below (response time, free listing, analytics)
// must be confirmed true before this ships to production.
const RESPONSE_TIME = "within one working day";
const BENEFITS = [
  {
    title: "Reach buyers who are already comparing",
    text: "Your project appears next to nearby projects buyers are weighing up.",
  },
  {
    title: "Enquiries come straight to you",
    text: "Buyer name, number and the project they asked about, with no broker in between.",
  },
  {
    title: "See how buyers compare you",
    text: "Views, enquiries and which projects you're compared with most.",
  },
  {
    title: "Listing is free",
    text: "We verify your RERA details before your projects go live.",
  },
];

const INITIAL_FORM = {
  developerFullName: "",
  companyName: "",
  developerEmail: "",
  developerPhone: "",
  developerContactConsent: false,
};

const isFormEmpty = (f) =>
  !f.developerFullName && !f.companyName && !f.developerEmail && !f.developerPhone;

const DeveloperPopup = ({ isOpen, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  // null | "created" | "duplicate"
  const [result, setResult] = useState(null);
  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Reset everything when the popup closes.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setErrorMsg("");
      setResult(null);
    }
  }

  // Outside click closes only when nothing would be lost, so a stray tap
  // doesn't wipe a half-filled form.
  const handleOutsideClick = useCallback(() => {
    if (result || isFormEmpty(formData)) onClose();
  }, [result, formData, onClose]);
  useOutsideClick(isOpen, [panelRef], handleOutsideClick);

  useEscapeKey(isOpen, onClose);

  // Lock body scroll and focus the first field.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
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

    const name = formData.developerFullName.trim();
    const company = formData.companyName.trim();
    const email = formData.developerEmail.trim();

    if (!name || !company || !email || !formData.developerPhone) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (name.length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg("Enter a valid email address.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.developerPhone)) {
      setErrorMsg("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.developerContactConsent) {
      setErrorMsg("Please agree to be contacted so our team can call you.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post("/api/leads/developer", {
        developerFullName: name,
        companyName: company,
        developerEmail: email,
        developerPhone: formData.developerPhone,
        developerContactConsent: true,
        source: "developer_popup",
      });
      // 200 = same email/phone already sent a request in the last 24h.
      setResult(res.status === 200 ? "duplicate" : "created");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dp-overlay">
      <div
        className="dp-container"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
      >
        {/* ── Left panel (decorative, hidden on mobile) ── */}
        <div className="dp-left">
          <div className="dp-left-content">
            <h2 className="dp-left-heading">List your projects on CompareProjects</h2>
            <ul className="dp-benefits">
              {BENEFITS.map((b) => (
                <li key={b.title} className="dp-benefit">
                  <span className="dp-benefit-icon" aria-hidden="true">
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className="dp-benefit-title">{b.title}</p>
                    <p className="dp-benefit-text">{b.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="dp-right">
          <button type="button" className="dp-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>

          {result ? (
            <div className="dp-success" role="status">
              <span className="dp-success-icon" aria-hidden="true">
                <CircleCheck size={40} strokeWidth={1.75} />
              </span>
              <h2 id="dp-title" className="dp-form-title">
                {result === "duplicate" ? "We already have your request" : "Request received"}
              </h2>
              <p className="dp-success-text">
                {result === "duplicate"
                  ? `You sent a request recently. Our team will call you ${RESPONSE_TIME}, so there's no need to send another.`
                  : `Thanks, ${formData.developerFullName.trim().split(" ")[0]}. Our team will call you on +91 ${formData.developerPhone} ${RESPONSE_TIME} to set up your developer account.`}
              </p>
              <button type="button" className="dp-submit" onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="dp-form-header">
                <h2 id="dp-title" className="dp-form-title">Request a developer account</h2>
                <p className="dp-form-subtitle">Our team calls you {RESPONSE_TIME}.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="dp-fields">
                  <div className="dp-field">
                    <label htmlFor="developerFullName">Your name</label>
                    <input
                      ref={firstFieldRef}
                      id="developerFullName"
                      type="text"
                      name="developerFullName"
                      value={formData.developerFullName}
                      onChange={handleChange}
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="dp-field">
                    <label htmlFor="companyName">Company name</label>
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      autoComplete="organization"
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="dp-field">
                    <label htmlFor="developerEmail">Work email</label>
                    <input
                      id="developerEmail"
                      type="email"
                      name="developerEmail"
                      placeholder="you@yourcompany.com"
                      value={formData.developerEmail}
                      onChange={handleChange}
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </div>

                  <div className="dp-field">
                    <label htmlFor="developerPhone">Mobile number</label>
                    <div className="dp-phone">
                      <span className="dp-phone-prefix" aria-hidden="true">+91</span>
                      <input
                        id="developerPhone"
                        type="tel"
                        name="developerPhone"
                        placeholder="10-digit number"
                        value={formData.developerPhone}
                        onChange={handleChange}
                        autoComplete="tel-national"
                        inputMode="numeric"
                        maxLength={10}
                        required
                      />
                    </div>
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
                  <span>
                    I agree to be contacted about listing my projects, and to the{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">terms</a> and{" "}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
                  </span>
                </label>

                {errorMsg && <p className="dp-error-text" role="alert">{errorMsg}</p>}

                <button type="submit" className="dp-submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Send request"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperPopup;
