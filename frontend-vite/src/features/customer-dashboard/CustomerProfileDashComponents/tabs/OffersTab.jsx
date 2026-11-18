// src/features/customer-dashboard/CustomerProfileDashComponents/tabs/OffersTab.jsx
import { Link } from "react-router-dom";
import { Heart, Phone, Scale, Home as HomeIcon, Pencil, MessageSquare, Gift } from "lucide-react";

const BENEFITS = [
  {
    icon: Heart,
    title: "Zero brokerage",
    desc: "You never pay us a fee to buy a home. You deal with the developer directly.",
    cta: "How it works",
    to: "/property-guide",
  },
  {
    icon: Phone,
    title: "Direct developer access",
    desc: "Call or message the developer’s sales team from any project page.",
    cta: "Browse projects",
    to: "/properties",
  },
  {
    icon: Scale,
    title: "Compare before you visit",
    desc: "Put up to 4 projects side by side: price per sq ft, area, possession.",
    cta: "Open compare",
    to: "/compare",
  },
  {
    icon: HomeIcon,
    title: "Free home loan help",
    desc: "Eligibility check and paperwork help with Avodah Loan.",
    cta: "Check eligibility",
    to: "/apnaloan",
  },
  {
    icon: Pencil,
    title: "Home interiors",
    desc: "Design and fit-out for your new home, from one team.",
    cta: "See our work",
    to: "/interior",
  },
  {
    icon: MessageSquare,
    title: "Free expert advice",
    desc: "An advisor helps you shortlist by budget, commute and possession.",
    cta: "Talk to an advisor",
    to: "/supportHelp",
  },
];

// onNavigateTab(tab, section?) switches the dashboard tab (the dashboard is
// state-driven, not route-driven, so a <Link> can't reach another tab).
const OffersTab = ({ onNavigateTab }) => (
  <div className="tab-panel">
    <div className="panel-header">
      <h2>Member benefits</h2>
      <p className="panel-subtitle">What you get with your CompareProjects account.</p>
    </div>

    <div className="offers-grid">
      {BENEFITS.map(({ icon: Icon, title, desc, cta, to }) => (
        <article className="offer-card" key={title}>
          <div className="offer-icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <h3 className="offer-title">{title}</h3>
          <p className="offer-desc">{desc}</p>
          <Link className="offer-link" to={to}>
            {cta} <span aria-hidden="true">&rarr;</span>
          </Link>
        </article>
      ))}
    </div>

    <aside className="offer-notice">
      <div className="offer-icon" aria-hidden="true">
        <Gift size={18} strokeWidth={1.75} />
      </div>
      <div className="offer-notice-text">
        <strong>Project offers are on the way</strong>
        <p>We&rsquo;re working with developers on member prices. We&rsquo;ll let you know when the first ones are ready.</p>
      </div>
      <button
        type="button"
        className="offer-notice-link"
        onClick={() => onNavigateTab?.("settings", "notifications")}
      >
        Notification settings <span aria-hidden="true">&rarr;</span>
      </button>
    </aside>
  </div>
);

export default OffersTab;
