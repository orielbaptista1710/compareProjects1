
// DeveloperPopup.js
//frontend/src/shared/Popups/DeveloperPopup.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { lazy, Suspense } from "react";
import { toast } from "react-toastify";
import { useOutsideClick } from "../../hooks/useOutsideClick";
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
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useOutsideClick(isOpen, [panelRef], onClose);

  // Close on Escape
  // useEffect(() => {
  //   if (!isOpen) return;
  //   const handler = (e) => { if (e.key === "Escape") onClose(); };
  //   document.addEventListener("keydown", handler);
  //   return () => document.removeEventListener("keydown", handler);
  // }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) setFormData(INITIAL_FORM);
  }, [isOpen]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.developerFullName.trim() || !formData.developerEmail.trim() || !formData.developerPhone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!formData.developerContactConsent) {
      toast.error("Please consent to being contacted.");
      return;
    }

    setSubmitting(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/leads/developer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: "developer_popup",
        }),
      });

      toast.success("Thanks! We'll reach out to you shortly.");
      setTimeout(onClose, 1500);
    } catch {
      toast.error("Something went wrong. Please try again.");
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
                  placeholder="+91 98765 43210"
                  value={formData.developerPhone}
                  onChange={handleChange}
                  autoComplete="tel"
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







