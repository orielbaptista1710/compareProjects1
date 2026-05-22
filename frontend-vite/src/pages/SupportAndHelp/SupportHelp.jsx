import React, { useState, useRef, useEffect } from "react";
import {
  Home, Tag, HelpCircle, BookOpen, Phone, Mail,
  ChevronDown, ChevronUp, CheckCircle, MessageCircle,
  Building2, ShieldCheck, Globe, Search, ArrowRight,
  Zap, Users, Lock, BarChart2, Star, Clock, ExternalLink,
  AlertCircle, FileText, Headphones, Send,
} from "lucide-react";
import "./SupportHelp.css";

/* ─── Static data ─────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: "getting-started",    icon: Home,        title: "Getting Started",       count: 4 },
  { id: "property-management",icon: Tag,         title: "Property Management",   count: 4 },
  { id: "for-customers",      icon: Users,       title: "For Customers",         count: 3 },
  { id: "support",            icon: Headphones,  title: "Support & Assistance",  count: 3 },
  // { id: "billing",            icon: Building2,   title: "Billing & Pricing",     count: 3 },
  { id: "security",           icon: ShieldCheck, title: "Security & Verification",count: 3},
  { id: "platform",           icon: Globe,       title: "Platform Features",     count: 2 },
];

const FAQ_DATA = {
  "getting-started": [
    { q: "How do I create a developer account?", a: "Our verification team creates developer accounts after confirming documents and RERA certification. Approval takes 24–48 hours. You'll receive a confirmation email with login credentials once approved." },
    { q: "How long does it take for my property to go live?", a: "Listings are reviewed within 12–24 hours. Premium listings go live in under 6 hours. We verify all details before publishing to ensure quality." },
    { q: "What documents are required for registration?", a: "You'll need company registration proof, project authorization documents, and a valid RERA certificate. All documents must be current and in PDF format." },
    { q: "Is onboarding support available?", a: "Yes, our dedicated onboarding team provides full assistance including a walkthrough call, documentation review, and first listing setup support for all new developers." },
  ],
  "property-management": [
    { q: "Is property listing free?", a: "Yes, all verified developers can post free listings. Premium boosts like homepage spotlights and priority placement are optional paid upgrades." },
    { q: "Can I edit my property details anytime?", a: "Yes, you can update any field — photos, pricing, amenities, or description — directly from your developer dashboard. Changes reflect within minutes." },
    { q: "How many photos and videos can I upload?", a: "Each listing supports up to 20 high-resolution images and 5 videos. We recommend a virtual tour video for significantly higher lead conversion." },
    { q: "Can I pause or unpublish a listing?", a: "Yes, use the Edit Listing panel to temporarily deactivate a property without losing any data. Reactivation is instant." },
  ],
  "for-customers": [
    { q: "How do I compare properties?", a: "Click 'Add to Compare' on any property card. You can compare up to 4 projects side-by-side across price, location, amenities, carpet area, and developer rating." },
    { q: "Can I contact developers directly?", a: "Yes, CHECK THIS WHAT TO SO" },
    { q: "Are property listings verified?", a: "Absolutely. Our team manually verifies developer credentials, RERA registration, and listing authenticity before any property goes live on the platform." },
  ],
  // CHECK THIS -- what to change here-- have to get the forgot pwd n details sorted out
  support: [
    { q: "I forgot my login password. What do I do?", a: "Use the 'Forgot Password' link on the login page. You'll receive a reset link via email within 2 minutes. For account lockouts, contact support directly." },
    { q: "How do I reach customer support quickly?", a: "Email support@compareprojects.com for priority response within 4 hours. For urgent issues, use the Live Chat option available from your dashboard." },
    { q: "Do you offer WhatsApp support?", a: "Yes, WhatsApp support is available for developers with active listings. The number is shared in your welcome email upon account activation." },
  ],
  // billing: [
  //   { q: "Do you offer premium listing plans?", a: "Yes — we offer Priority Listing, Homepage Spotlight, and Lead Boost packages. Visit the Pricing page from your dashboard for current rates and bundle offers." },
  //   { q: "What payment methods are accepted?", a: "We accept all major debit/credit cards, UPI, net banking, and PayPal for international developers. GST invoices are generated automatically." },
  //   { q: "Can I upgrade or downgrade plans anytime?", a: "Yes, plan changes activate instantly after payment. Downgrades take effect at the end of your current billing cycle with no penalty." },
  // ],
  security: [
    { q: "How does developer verification work?", a: "We verify business registration documents, GST number, RERA certification, and office address through a combination of automated checks and manual review." },
    { q: "Are customer leads and data secure?", a: "All lead data is AES-256 encrypted at rest and in transit. We comply with Indian data protection regulations. No data is sold or shared with third parties.  CHECK THIS ABOUT THE SECURITY" },
    { q: "Can I report fraudulent activity?", a: "Yes, use the Report button on any listing or contact our security team at security@compareprojects.com. We investigate all reports within 24 hours.????????? WHAT TO DO WITH THIS MAN" },
  ],
  platform: [
    //CHECK THIS MAN IF IS ALL FEATURES N ACCOUNTED FOR 
    { q: "What are the core features of CompareProjects?", a: "Key features include advanced property filtering, side-by-side comparison for up to 4 projects, real-time lead alerts, developer analytics dashboard, CRM integrations, and AI-powered search." },
    { q: "Is there a mobile-friendly version?", a: "Yes, the platform is fully responsive and optimized for mobile, tablet, and desktop. A dedicated iOS and Android app is currently in development." },
  ],
};

const STATS = [
  { icon: Users,    value: "50,000+", label: "Happy Customers"   },
  { icon: Building2,value: "12,000+", label: "Verified Listings" },
  { icon: Star,     value: "4.8/5",   label: "Platform Rating"   },
];

const QUICK_LINKS = [
  { icon: FileText,    label: "Listing Guidelines",     href: "/docs/listings"  },
  { icon: BarChart2,   label: "Developer Dashboard",    href: "/dashboard"      },
  { icon: Lock,        label: "Privacy & Data Policy",  href: "/privacy-policy" },
  { icon: ExternalLink,label: "RERA Verification Guide",href: "/docs/rera"      },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function SupportHelp() {
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [expandedFaq, setExpandedFaq]       = useState(null);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [showSearch, setShowSearch]         = useState(false);
  const searchRef = useRef(null);

  /* search across all FAQs */
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const q = searchQuery.toLowerCase();
    const results = [];
    for (const [catId, items] of Object.entries(FAQ_DATA)) {
      const cat = CATEGORIES.find(c => c.id === catId);
      items.forEach((faq, idx) => {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          results.push({ catId, catTitle: cat?.title, faq, idx });
        }
      });
    }
    setSearchResults(results);
    setShowSearch(true);
  }, [searchQuery]);

  const handleCategoryClick = (id) => {
    setActiveCategory(id);
    setExpandedFaq(null);
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleSearchResult = (catId, idx) => {
    setActiveCategory(catId);
    setExpandedFaq(idx);
    setSearchQuery("");
    setShowSearch(false);
    setTimeout(() => searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const faqs      = FAQ_DATA[activeCategory] || [];

  return (
    <div className="sp-wrapper">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="sp-hero">
        <div className="sp-hero-inner">
          <div className="sp-hero-badge">
            <HelpCircle size={14} aria-hidden="true" />
            Support Center
          </div>
          <h1 className="sp-hero-title">How can we help you?</h1>
          <p className="sp-hero-sub">
            Answers, docs, and support for developers and home buyers.
          </p>

          {/* Search bar */}
          <div className="sp-search-wrap">
            <Search size={18} className="sp-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="sp-search-input"
              placeholder="Search FAQs — try 'listing', 'payment', 'RERA'…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search frequently asked questions"
            />
            {showSearch && (
              <div className="sp-search-dropdown" role="listbox" aria-label="Search results">
                {searchResults.length === 0 ? (
                  <div className="sp-search-empty">
                    <AlertCircle size={16} aria-hidden="true" />
                    No results for "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      className="sp-search-result"
                      onClick={() => handleSearchResult(r.catId, r.idx)}
                      role="option"
                    >
                      <span className="sp-result-cat">{r.catTitle}</span>
                      <span className="sp-result-q">{r.faq.q}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Stats strip */}
          <div className="sp-stats">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div className="sp-stat" key={label}>
                <Icon size={18} aria-hidden="true" className="sp-stat-icon" />
                <span className="sp-stat-value">{value}</span>
                <span className="sp-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* decorative blobs */}
        <div className="sp-hero-blob sp-hero-blob--1" aria-hidden="true" />
        <div className="sp-hero-blob sp-hero-blob--2" aria-hidden="true" />
      </section>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="sp-body">

        {/* ── CATEGORY TABS ──────────────────────────────────────────────── */}
        <nav className="sp-cat-nav" aria-label="FAQ categories">
          {CATEGORIES.map(({ id, icon: Icon, title, count }) => (
            <button
              key={id}
              className={`sp-cat-btn${activeCategory === id ? " active" : ""}`}
              onClick={() => handleCategoryClick(id)}
              aria-pressed={activeCategory === id}
            >
              <span className="sp-cat-icon-wrap" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="sp-cat-text">
                <span className="sp-cat-title">{title}</span>
                <span className="sp-cat-count">{count} FAQs</span>
              </span>
            </button>
          ))}
        </nav>

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="sp-main-grid">

          {/* LEFT — FAQ panel */}
          <main className="sp-faq-panel" ref={searchRef}>
            <div className="sp-faq-header">
              <div className="sp-faq-header-left">
                {activeCat && <activeCat.icon size={22} className="sp-faq-cat-icon" aria-hidden="true" />}
                <div>
                  <h2 className="sp-faq-title">{activeCat?.title}</h2>
                  <p className="sp-faq-sub">{faqs.length} frequently asked questions</p>
                </div>
              </div>
            </div>

            <div className="sp-faq-list" role="list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`sp-faq-item${expandedFaq === i ? " open" : ""}`}
                  role="listitem"
                >
                  <button
                    className="sp-faq-q"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    aria-expanded={expandedFaq === i}
                  >
                    <span className="sp-faq-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span className="sp-faq-q-text">{faq.q}</span>
                    <span className="sp-faq-chevron" aria-hidden="true">
                      {expandedFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {expandedFaq === i && (
                    <div className="sp-faq-a" role="region">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sp-still-stuck">
              <div className="sp-stuck-left">
                <Zap size={20} className="sp-stuck-icon" aria-hidden="true" />
                <div>
                  <p className="sp-stuck-title">Still can't find your answer?</p>
                  <p className="sp-stuck-sub">Our team typically responds within 4 hours.</p>
                </div>
              </div>
              <a href="mailto:support@compareprojects.com" className="sp-stuck-btn">
                Contact Support <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </main>

          {/* RIGHT — Sidebar */}
          <aside className="sp-sidebar">

            {/* Contact card */}
            <div className="sp-card sp-contact-card">
              <h3 className="sp-card-title">Get In Touch</h3>
              <div className="sp-contact-list">
                <a href="tel:+919999999999" className="sp-contact-row">
                  <span className="sp-contact-badge sp-contact-badge--purple">
                    <Phone size={16} aria-hidden="true" />
                  </span>
                  <div className="sp-contact-info">
                    <span className="sp-contact-main">+91 9999 999 999</span>
                    <span className="sp-contact-sub">Mon – Sat, 9am – 8pm IST</span>
                  </div>
                  <ArrowRight size={14} className="sp-contact-arrow" aria-hidden="true" />
                </a>
                <a href="mailto:support@compareprojects.com" className="sp-contact-row">
                  <span className="sp-contact-badge sp-contact-badge--amber">
                    <Mail size={16} aria-hidden="true" />
                  </span>
                  <div className="sp-contact-info">
                    <span className="sp-contact-main">support@compareprojects.com</span>
                    <span className="sp-contact-sub">Response within 4 hours</span>
                  </div>
                  <ArrowRight size={14} className="sp-contact-arrow" aria-hidden="true" />
                </a>
                <div className="sp-contact-row sp-contact-row--chat">
                  <span className="sp-contact-badge sp-contact-badge--red">
                    <MessageCircle size={16} aria-hidden="true" />
                  </span>

                  {/* //CHECK THIS WHAT BOUT THE  LIVE CHAT MAN -- ADD A LIVE CHAT PROVIDER OR CHAT BOT PROVIDER*/}
                  {/* <div className="sp-contact-info">
                    <span className="sp-contact-main">Live Chat</span>
                    <span className="sp-contact-sub">Available from your dashboard</span>
                  </div> */}

                  <span className="sp-live-dot" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="sp-card">
              <h3 className="sp-card-title">Quick Links</h3>
              <ul className="sp-quick-links">
                {QUICK_LINKS.map(({ icon: Icon, label, href }) => (
                  <li key={label}>
                    <a href={href} className="sp-quick-link">
                      <Icon size={16} aria-hidden="true" className="sp-quick-icon" />
                      <span>{label}</span>
                      <ArrowRight size={13} aria-hidden="true" className="sp-quick-arrow" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform highlights */}
            <div className="sp-card sp-highlights-card">
              <h3 className="sp-card-title">Platform Highlights</h3>
              <ul className="sp-highlights">
                {[
                  "24/7 Customer Support",
                  "Real-Time Lead Tracking",
                  "Free Comparison Tools",
                  "Developer CRM Dashboard",
                  "Verified Property Listings",
                  "Direct Developer Contact",
                  "Advanced Property Filters",
                  "Comprehensive Documentation",
                  "Secure Data Encryption",
                ].map(item => (
                  <li key={item} className="sp-highlight-item">
                    <CheckCircle size={15} className="sp-hl-check" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Urgent help CTA */}
            <div className="sp-card sp-urgent-card">
              <div className="sp-urgent-icon-wrap" aria-hidden="true">
                <Send size={24} />
              </div>
              <h3 className="sp-urgent-title">Need urgent help?</h3>
              <p className="sp-urgent-sub">
                For listing emergencies or account issues, reach our priority queue directly.
              </p>
              <a href="mailto:priority@compareprojects.com" className="sp-urgent-btn">
                Priority Support
              </a>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}