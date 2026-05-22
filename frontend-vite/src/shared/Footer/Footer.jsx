import React, { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { POPULAR_SEARCHES } from "../../database/popularSearchFooter";
import "./Footer.css";
import API from "../../api";

// ─── Static data at module level — never recreated on render ──────────────────

const FOOTER_TABS = [
  "RESIDENTIAL",
  "INDUSTRIAL",
  "COMMERCIAL",
  "RETAIL",
  "PLOT",
  "POPULAR SEARCHES",
];

const API_KEY_MAP = {
  RESIDENTIAL: "residential",
  INDUSTRIAL:  "industrial",
  COMMERCIAL:  "commercial",
  RETAIL:      "retail",
  PLOT:        "plot",
};

const COMPANY_LINKS = [
  { label: "Properties",       href: "/properties" },
  { label: "About",            href: "/#about" },
  { label: "Compare Projects", href: "/compare" },
  { label: "For Buyers",       href: "/buyer" },
  { label: "For Developers",   href: "/developer" },
  { label: "Contact",          href: "/#contact" },
];

const EXPLORE_LINKS = [
  { label: "News",            href: "/property-guide" },
  { label: "Home Loans",      href: "/apnaloan" },
  { label: "Home Interior",   href: "/interior" },
  { label: "Sitemap",         href: "/sitemap.xml" },
  { label: "AI Smart Search", href: "/" },
  { label: "Testimonials",    href: "/#testimonials" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use",   href: "/terms" },
  { label: "Disclaimer",     href: "/disclaimer" },
  { label: "Cookie Policy",  href: "/cookie-policy" },
];

// ─── TabContent ───────────────────────────────────────────────────────────────

const TabContent = ({ activeTab, tabData, loading, error }) => {
  if (activeTab === "POPULAR SEARCHES") {
    return (
      <>
        <h4 className="footer-title">Popular Property Searches</h4>
        <ul className="property-type-list">
          {POPULAR_SEARCHES.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (loading) {
    return (
      <ul className="property-type-list property-type-list--skeleton">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}><span className="skeleton-line" /></li>
        ))}
      </ul>
    );
  }

  if (error) {
    return <p className="error-message">Unable to load data right now.</p>;
  }

  const apiKey = API_KEY_MAP[activeTab];
  const values = tabData?.[apiKey];

  if (!values?.length) {
    return (
      <p className="tab-placeholder">
        No {activeTab.toLowerCase()} localities available.
      </p>
    );
  }

  return (
    <>
      <h4 className="footer-title">{activeTab} Localities</h4>
      <ul className="property-type-list">
        {values.map((loc) => (
          <li key={loc}>
            <a
              href={`/properties?locality=${encodeURIComponent(loc)}&type=${API_KEY_MAP[activeTab]}`}
            >
              Properties in {loc}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => {
  const [tabData,   setTabData]   = useState({});
  const [activeTab, setActiveTab] = useState("POPULAR SEARCHES");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [animating, setAnimating] = useState(false);
  const animTimerRef  = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    controllerRef.current = new AbortController();

    const fetchLocalities = async () => {
      try {
        const res = await API.get("/api/discover/localities", {
          signal: controllerRef.current.signal,
        });
        if (res?.data?.success) {
          setTabData(res.data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        if (err?.code !== "ERR_CANCELED" && err?.name !== "AbortError") {
          console.error("Footer API error:", err);
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocalities();

    return () => {
      controllerRef.current?.abort();
      clearTimeout(animTimerRef.current);
    };
  }, []);

  const handleTabClick = useCallback((tab) => {
    if (tab === activeTab) return;
    setAnimating(true);
    setActiveTab(tab);
    clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => setAnimating(false), 350);
  }, [activeTab]);

  return (
    <footer className="footer">

      {/* ── Top row: logo + tabs ── */}
      <div className="footer-top-row">
        <img
          className="logo-img-header"
          src="/logo.webp"
          alt="CompareProjects — Compare Real Estate Projects in India"
          width="160"
          height="40"
          loading="lazy"
        />

        {/*
          FIX: role="tablist" + aria-selected is more semantically correct than
          aria-pressed for a tab strip. Keeping aria-pressed since you're using
          <button> not [role="tab"], but adding aria-label on the nav for screen readers.
        */}
        <nav className="footer-tabs" aria-label="Browse properties by category">
          {FOOTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`footer-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => handleTabClick(tab)}
              aria-pressed={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ── */}
      <div
        className={`footer-searches${animating ? " footer-searches--fade" : ""}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <TabContent
          activeTab={activeTab}
          tabData={tabData}
          loading={loading}
          error={error}
        />
      </div>

      {/* ── Bottom columns ── */}
      <div className="footer-bottom">
        {/*
          FIX: 5 columns total — CSS grid handles them.
          Column order matters for the responsive reflow:
          1. About (wide)  2. Company  3. Explore  4. Contact  5. Social
        */}
        <div className="footer-columns">

          <div className="footer-column">
            <h5>ABOUT US</h5>
            <span>
              CompareProjects is a real estate comparison platform that helps you find
              the best real estate projects in India. We provide detailed information
              about each project, including its location, amenities, and pricing. Our
              platform also allows you to compare different projects side-by-side, so
              you can make an informed decision about which project is right for you.
            </span>
          </div>

          <div className="footer-column">
            <h5>COMPANY</h5>
            <ul>
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h5>EXPLORE</h5>
            <ul>
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h5>CONTACT</h5>
            {/* FIX: class must be on the <ul>, not the <div> */}
            <ul className="footer-contact-list">
              <li>
                <Phone size={15} aria-hidden="true" />
                <a href="tel:+919999999999">+91 9999 999 999</a>
              </li>
              <li>
                <Mail size={15} aria-hidden="true" />
                <a href="mailto:info@compareprojects.in">info@compareprojects.in</a>
              </li>
              <li>
                <MapPin size={15} aria-hidden="true" />
                {/* address is not a link — use <address> semantics */}
                <address style={{ fontStyle: "normal" }}>
                  Mumbai, Maharashtra
                </address>
              </li>
            </ul>
          </div>

          {/* Social is the 5th column — CSS moves it to a full-width row on smaller screens */}
          <div className="footer-column footer-social">
            <h5>FOLLOW US</h5>
            <div className="footer-icons">

              {/*               
                Uncomment when social links are ready.
                Each needs: href, aria-label, and rel="noopener noreferrer".
              */}
              
              {/* <a href="https://youtube.com/@compareprojects" target="_blank" rel="noopener noreferrer" aria-label="CompareProjects on YouTube">
                <Youtube size={20} aria-hidden="true" />
              </a>
              <a href="https://linkedin.com/company/compareprojects" target="_blank" rel="noopener noreferrer" aria-label="CompareProjects on LinkedIn">
                <Linkedin size={20} aria-hidden="true" />
              </a>
              <a href="https://instagram.com/compareprojects" target="_blank" rel="noopener noreferrer" aria-label="CompareProjects on Instagram">
                <Instagram size={20} aria-hidden="true" />
              </a> */}

            </div>
          </div>

        </div>
      </div>

      {/* ── Legal links + copyright ── */}
      <div className="footer-copy">
        <div className="footer-legal-links">
          {LEGAL_LINKS.map((l, i) => (
            <React.Fragment key={l.href}>
              <a href={l.href}>{l.label}</a>
              {i < LEGAL_LINKS.length - 1 && (
                <span aria-hidden="true">·</span>
              )}
            </React.Fragment>
          ))}
        </div>

        <p>© {new Date().getFullYear()} Compare Projects Pvt. Ltd. All rights reserved.</p>
      </div>

    </footer>
  );
};

export default Footer;