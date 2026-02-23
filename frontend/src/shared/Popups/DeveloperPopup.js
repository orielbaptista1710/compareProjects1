// DeveloperPopup.js
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
  devfullName: "",
  devEmail: "",
  devPhone: "",
  contactConsent: false,
};

const DeveloperPopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useOutsideClick(isOpen, [panelRef], onClose);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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

    if (!formData.devfullName.trim() || !formData.devEmail.trim() || !formData.devPhone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!formData.contactConsent) {
      toast.error("Please consent to being contacted.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: replace with real API call
      // await API.post("/api/developer-enquiry", formData);
      await new Promise((r) => setTimeout(r, 800)); // simulate latency

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
                <label htmlFor="devfullName">Full Name</label>
                <input
                  id="devfullName"
                  type="text"
                  name="devfullName"
                  placeholder="Your name"
                  value={formData.devfullName}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="dp-field">
                <label htmlFor="devEmail">Email</label>
                <input
                  id="devEmail"
                  type="email"
                  name="devEmail"
                  placeholder="you@example.com"
                  value={formData.devEmail}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="dp-field">
                <label htmlFor="devPhone">Phone</label>
                <input
                  id="devPhone"
                  type="tel"
                  name="devPhone"
                  placeholder="+91 98765 43210"
                  value={formData.devPhone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <label className="dp-consent">
              <input
                type="checkbox"
                name="contactConsent"
                checked={formData.contactConsent}
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