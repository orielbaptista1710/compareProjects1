// DeveloperDashboardComponents/DeveloperSupport.jsx
import React, { useState } from "react";
import {
  BookOpen, Bug, HelpCircle, Mail, Zap,
  MessageSquare, CheckCircle2, AlertCircle,
  Users, FileText, Loader2, Search, ArrowRight,
  Phone, Clock,
} from "lucide-react";
import "./DeveloperSupport.css";

// ── FAQ data ──────────────────────────────────────────────────
const FAQS = [
  {
    q: "How do I log into the developer dashboard?",
    a: "Your login credentials (username and password) are provided by the CompareProjects admin team when your account is set up. If you haven't received them, contact support below.",
  },
  {
    q: "How do I submit a new property listing?",
    a: "Go to the 'Sell Property' tab in your dashboard and complete the property form. Once submitted, it will be reviewed by our admin team before going live.",
  },
  {
    q: "How long does property approval take?",
    a: "Listings are typically reviewed within 1–2 business days. You'll be notified via email once your property is approved or if any changes are required.",
  },
  {
    q: "Why was my listing rejected?",
    a: "If your listing was rejected, you'll receive a reason from our team. Common issues include incomplete details, missing RERA information, or images that don't meet our quality standards.",
  },
  {
    q: "Can I edit a property after submitting it?",
    a: "Yes. Go to 'My Properties', find the listing, and click Edit. Any changes will require re-approval before the listing is updated publicly.",
  },
  {
    q: "How do I reset my password?",
    a: "Password resets are handled by the admin team. Please email dev@compareprojects.com with your registered username and we'll get it sorted within 24 hours.",
  },
];

// ── Topic cards data ───────────────────────────────────────────
const TOPICS = [
  {
    Icon: Zap,
    title: "Getting Started",
    desc: "Understand how to log in, navigate the dashboard, and submit your first property.",
  },
  {
    Icon: FileText,
    title: "Listings & Approval",
    desc: "Everything about submitting, editing, and getting properties approved.",
  },
  {
    Icon: HelpCircle,
    title: "Account & Access",
    desc: "Login help, credential issues, and dashboard access questions.",
  },
];

// ── FAQ accordion item ─────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ds-faq-item${open ? " ds-faq-item--open" : ""}`}>
      <button className="ds-faq-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="ds-faq-btn__text">{q}</span>
        <span className="ds-faq-btn__icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="ds-faq-answer">{a}</p>}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────
const DeveloperSupport = () => {
  const [form, setForm] = useState({ name: "", email: "", type: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Required";
    if (!form.email.trim())   e.email   = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.message.trim()) e.message = "Required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStatus("loading");
    await new Promise(r => setTimeout(r, 1200));
    setStatus("success");
    setForm({ name: "", email: "", type: "", message: "" });
    setTimeout(() => setStatus("idle"), 5000);
  };

  const inputClass = (id) => 
    `ds-input${errors[id] ? " ds-input--error" : ""}`;

  return (
    <div className="ds-root">

      {/* ── Hero ── */}
      <div className="ds-hero">
        <h1 className="ds-hero__title">How Can We Help?</h1>
        <p className="ds-hero__sub">
          Find answers, submit listings, or reach our team directly.
        </p>
        <div className="ds-hero__search" role="search">
          <Search className="ds-hero__search-icon" size={16} aria-hidden="true" />
          <input
            className="ds-hero__search-input"
            type="search"
            placeholder="Search for answers…"
            aria-label="Search help articles"
          />
          <button className="ds-hero__search-btn" type="button">Search</button>
        </div>
      </div>

      <div className="ds-page">

        {/* ── Bug / urgent banner ── */}
        <div className="ds-section" style={{ paddingTop: 20 }}>
          <div className="ds-bug-banner">
            <div className="ds-bug-banner__icon">
              <Bug size={18} strokeWidth={1.8} />
            </div>
            <div className="ds-bug-banner__text">
              <p className="ds-bug-banner__title">Found a bug or dashboard issue?</p>
              <p className="ds-bug-banner__desc">
                Report upload failures, listing errors, or login problems to our team.
              </p>
            </div>
            <div className="ds-bug-banner__actions">
              <button className="ds-btn ds-btn--primary" type="button"
                style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13 }}>
                Contact Us
              </button>
              
            </div>
          </div>
        </div>

        {/* ── Browse topics ── */}
        <div className="ds-section">
          <p className="ds-section-label">Browse topics</p>
          <h2 className="ds-section-title">Browse All Topics</h2>
          <p className="ds-section-sub">
            Quick answers to the most common developer questions.
          </p>
          <div className="ds-topics">
            {TOPICS.map(({ Icon, title, desc }) => (
              <div className="ds-topic-card" key={title} role="button" tabIndex={0}>
                <div className="ds-topic-card__icon">
                  <Icon size={22} strokeWidth={1.6} />
                </div>
                <p className="ds-topic-card__title">{title}</p>
                <p className="ds-topic-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="ds-divider" style={{ marginTop: 48 }} />

        {/* ── FAQ ── */}
        <div className="ds-section">
          <p className="ds-section-label">FAQs</p>
          <h2 className="ds-section-title">Frequently Asked Questions</h2>
          <p className="ds-section-sub">
            Everything you need to know about managing your listings on CompareProjects.
          </p>
          <div className="ds-faq-grid">
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        <hr className="ds-divider" style={{ marginTop: 48 }} />

        {/* ── Contact ── */}
        <div className="ds-section">
          <div className="ds-contact-layout">

            {/* left: info */}
            <div>
              <span className="ds-contact-info__eyebrow">We're here to help</span>
              <h2 className="ds-contact-info__heading">
                Talk to our <em>support team</em>
              </h2>
              <p className="ds-contact-info__desc">
                Reach out for help with your listings, dashboard access, or any questions
                about your account on CompareProjects.
              </p>

              <div className="ds-contact-channels">
                <div className="ds-channel">
                  <div className="ds-channel__icon">
                    <Mail size={18} strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="ds-channel__label">Email</p>
                    <p className="ds-channel__value">dev@compareprojects.com</p>
                  </div>
                </div>

                <div className="ds-channel">
                  <div className="ds-channel__icon">
                    <Clock size={18} strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="ds-channel__label">Response time</p>
                    <p className="ds-channel__value">Within 1 business day</p>
                  </div>
                </div>

                <div className="ds-channel">
                  <div className="ds-channel__icon">
                    <MessageSquare size={18} strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="ds-channel__label">Live chat</p>
                    <p className="ds-channel__value">Mon – Fri, 9am – 6pm IST</p>
                  </div>
                </div>

                <div className="ds-channel">
                  <div className="ds-channel__icon">
                    <Users size={18} strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="ds-channel__label">Security issues</p>
                    <p className="ds-channel__value">security@compareprojects.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* right: form card */}
            <div className="ds-contact-form-card">
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ds-ink)", marginBottom: 4 }}>
                Send us a message
              </p>
              <p style={{ fontSize: 13, color: "var(--ds-muted)", marginBottom: 22, lineHeight: 1.5 }}>
                We read every submission and reply when it's actionable.
              </p>

              {status === "success" ? (
                <div className="ds-success">
                  <CheckCircle2 size={16} strokeWidth={2} />
                  Message received — we'll get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="ds-form-2col">
                    <div className="ds-form-group">
                      <label className="ds-form-label" htmlFor="c-name">Full name</label>
                      <input
                        id="c-name" type="text" className={inputClass("name")}
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      />
                      {errors.name && (
                        <span className="ds-field-error">
                          <AlertCircle size={11} /> {errors.name}
                        </span>
                      )}
                    </div>

                    <div className="ds-form-group">
                      <label className="ds-form-label" htmlFor="c-email">Email address</label>
                      <input
                        id="c-email" type="email" className={inputClass("email")}
                        placeholder="jane@company.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      />
                      {errors.email && (
                        <span className="ds-field-error">
                          <AlertCircle size={11} /> {errors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-form-label" htmlFor="c-type">Category</label>
                    <select
                      id="c-type" className="ds-input"
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      style={{ color: form.type ? "var(--ds-ink)" : "var(--ds-hint)" }}
                    >
                      <option value="" disabled>Select a category</option>
                      <option value="listing">Property listing</option>
                      <option value="approval">Approval query</option>
                      <option value="account">Account / login</option>
                      <option value="bug">Bug report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="ds-form-group">
                    <label className="ds-form-label" htmlFor="c-message">Message</label>
                    <textarea
                      id="c-message" className={inputClass("message")}
                      placeholder="Describe your issue or question…"
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    />
                    {errors.message && (
                      <span className="ds-field-error">
                        <AlertCircle size={11} /> {errors.message}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="ds-btn ds-btn--primary"
                    disabled={status === "loading"}
                    style={{ width: "100%", marginTop: 6 }}
                  >
                    {status === "loading" && <Loader2 size={15} className="ds-spin" />}
                    {status === "loading" ? "Sending…" : (
                      <>Send Message <ArrowRight size={15} /></>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DeveloperSupport;