import { useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../../api/api";
import "./Footer.css";

// ─── Static data ──────────────────────────────────────────────────────────────

// Display order of the "Popular searches" tabs. `key` matches the
// GET /api/discover/localities response; a tab only shows when its list has links.
const POPULAR_SEARCH_TABS = [
  { key: "residential", label: "Residential" },
  { key: "commercial",  label: "Commercial" },
  { key: "retail",      label: "Retail" },
  { key: "industrial",  label: "Industrial" },
  { key: "plot",        label: "Plots" },
];

const COMPANY_LINKS = [
  { label: "About us",         href: "/#about" },
  { label: "Properties",       href: "/properties" },
  { label: "Compare projects", href: "/compare" },
  { label: "For buyers",       href: "/buyer" },
  { label: "For developers",   href: "/developer" },
  { label: "Developer login",  href: "/login" },
];

const EXPLORE_LINKS = [
  { label: "News",            href: "/property-guide" },
  { label: "Avodah Loan",     href: "/apnaloan" },
  { label: "Home Interiors",  href: "/interior" },
  { label: "Smart search", href: "/" },
  { label: "Testimonials",    href: "/#testimonials" },
  { label: "Sitemap",         href: "/sitemap.xml" },
];

const CONTACT_LINKS = [
  { label: "+91 99999 99999",         href: "tel:+919999999999" },
  { label: "info@compareprojects.in", href: "mailto:info@compareprojects.in" },
  { label: "Mumbai, Maharashtra" },
  { label: "Support & Help",          href: "/#contact" },
];

// Only links with a confirmed `href` render. Fill these in once the company's
// real profiles exist — until then the row is hidden rather than pointing at
// accounts we may not own.
const SOCIAL_LINKS = [
  { label: "Instagram", href: null },
  { label: "LinkedIn",  href: null },
  { label: "YouTube",   href: null },
  { label: "Facebook",  href: null },
].filter((s) => s.href);

const LEGAL_LINKS = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms of use",   href: "/terms" },
  { label: "Disclaimer",     href: "/disclaimer" },
  { label: "Cookie policy",  href: "/cookie-policy" },
];

// ─── Data ─────────────────────────────────────────────────────────────────────

const isLink = (l) => typeof l?.label === "string" && l.params && typeof l.params === "object";

// Keeps only well-formed { label, params } links, so an older backend that still
// sends plain locality strings (frontend and backend deploy separately) just
// hides the section instead of rendering broken links.
const fetchPopularSearches = async () => {
  const res = await API.get("/api/discover/localities");
  if (!res?.data?.success) throw new Error("Footer popular searches unavailable");
  const raw = res.data.data ?? {};
  return Object.fromEntries(
    POPULAR_SEARCH_TABS.map(({ key }) => [key, (Array.isArray(raw[key]) ? raw[key] : []).filter(isLink)])
  );
};

// Array values become repeated keys (?propertyType=A&propertyType=B), which is
// what /api/properties and filters.schema.js (getAll) read. URLSearchParams on
// a plain object would join them as "A,B" instead.
const toHref = (params) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of [].concat(value)) qs.append(key, String(item));
  }
  return `/properties?${qs}`;
};

// ─── Popular searches ─────────────────────────────────────────────────────────

const PopularSearches = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ["footer-popular-searches"],
    queryFn: fetchPopularSearches,
    staleTime: 5 * 60_000, // matches the server-side cache TTL
  });

  const [selected, setSelected] = useState(null);
  const tabRefs = useRef({});
  const baseId = useId();

  if (isPending) {
    return (
      <section className="site-footer__searches" aria-busy="true" aria-label="Popular searches">
        <div className="site-footer__searches-head">
          <span className="site-footer__skeleton site-footer__skeleton--title" />
        </div>
        <ul className="site-footer__search-grid" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}><span className="site-footer__skeleton" /></li>
          ))}
        </ul>
      </section>
    );
  }

  // Show only categories that currently have listings; hide the whole block otherwise.
  const tabs = isError ? [] : POPULAR_SEARCH_TABS.filter((t) => data?.[t.key]?.length);
  if (!tabs.length) return null;

  const active = tabs.find((t) => t.key === selected) ?? tabs[0];
  const links = data[active.key];
  const tabId = (key) => `${baseId}-tab-${key}`;
  const panelId = `${baseId}-panel`;

  // WAI-ARIA tabs: arrows move between tabs, Home/End jump to the ends.
  const handleKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.key === active.key);
    const next = {
      ArrowRight: tabs[(i + 1) % tabs.length],
      ArrowLeft:  tabs[(i - 1 + tabs.length) % tabs.length],
      Home:       tabs[0],
      End:        tabs[tabs.length - 1],
    }[e.key];
    if (!next) return;
    e.preventDefault();
    setSelected(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <section className="site-footer__searches" aria-labelledby={`${baseId}-title`}>
      <div className="site-footer__searches-head">
        <h2 id={`${baseId}-title`} className="site-footer__searches-title">
          Popular searches
        </h2>

        <div
          className="site-footer__tabs"
          role="tablist"
          aria-label="Property category"
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab) => {
            const isActive = tab.key === active.key;
            return (
              <button
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                id={tabId(tab.key)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                className={`site-footer__tab${isActive ? " site-footer__tab--active" : ""}`}
                onClick={() => setSelected(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={tabId(active.key)}>
        {/* key replays the fade-in each time the tab changes */}
        <ul key={active.key} className="site-footer__search-grid site-footer__search-grid--enter">
          {links.map((link) => (
            <li key={link.label}>
              <a href={toHref(link.params)}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────

const LinkColumn = ({ title, links }) => (
  <div className="site-footer__col">
    <h2 className="site-footer__col-title">{title}</h2>
    <ul className="site-footer__col-list">
      {links.map((l) => (
        <li key={l.label}>
          {l.href ? <a href={l.href}>{l.label}</a> : <span>{l.label}</span>}
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <PopularSearches />

      <div className="site-footer__main">
        <div className="site-footer__brand">
          <a href="/" className="site-footer__logo-link" aria-label="CompareProjects home">
            <img
              className="site-footer__logo"
              src="/logo.webp"
              alt="CompareProjects"
              width="160"
              height="40"
              loading="lazy"
              decoding="async"
            />
          </a>
          <p className="site-footer__tagline">
            Compare RERA-registered new projects side by side, then talk to
            developers directly. No brokerage.
          </p>
          {SOCIAL_LINKS.length > 0 && (
            <ul className="site-footer__social" aria-label="CompareProjects on social media">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="site-footer__cols" aria-label="Footer">
          <LinkColumn title="Company" links={COMPANY_LINKS} />
          <LinkColumn title="Explore" links={EXPLORE_LINKS} />
          <LinkColumn title="Contact" links={CONTACT_LINKS} />
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__copy">
          © {new Date().getFullYear()} CompareProjects Pvt. Ltd. All rights reserved.
        </p>
        <ul className="site-footer__legal" aria-label="Legal">
          {LEGAL_LINKS.map((l) => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
