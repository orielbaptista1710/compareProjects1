// src/pages/SupportAndHelp/SupportHelp.jsx
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale, User, House, Building2, Briefcase, ShieldCheck,
  Phone, MessageCircle, Mail, Search, Plus, Minus, ArrowLeft,
} from "lucide-react";
import "./SupportHelp.css";

/* ─── Contact details ────────────────────────────────────────────────────────
   TODO: placeholders — replace with the real support number, WhatsApp number
   and email before launch. */
const CONTACT = {
  phoneDisplay: "+91 99999 99999",
  phoneHref: "tel:+919999999999",
  whatsappDisplay: "+91 99999 99999",
  whatsappHref: "https://wa.me/919999999999",
  email: "support@compareprojects.com",
  hours: "Monday to Saturday, 9 am to 8 pm IST.",
};

/* ─── Topics and FAQs ────────────────────────────────────────────────────────
   Answers must describe what the site does today. Customer, agent and
   developer accounts log in differently — keep those answers separate. */
const TOPICS = [
  { id: "buying",     icon: Scale,       title: "Buying and comparing", desc: "Shortlists, comparisons, RERA, brokerage" },
  { id: "account",    icon: User,        title: "Account and login",    desc: "Logging in, passwords, deleting your account" },
  { id: "loans",      icon: House,       title: "Home loans",           desc: "Avodah Loan offers and eligibility" },
  { id: "developers", icon: Building2,   title: "For developers",       desc: "Getting an account, listing, review" },
  { id: "agents",     icon: Briefcase,   title: "For agents",           desc: "Signing up and approval" },
  { id: "privacy",    icon: ShieldCheck, title: "Privacy and safety",   desc: "Your data and reporting a listing" },
];

const FAQS = [
  // Buying and comparing
  { id: "compare", topic: "buying", q: "How do I compare projects?",
    a: "Tap Add to compare on up to four projects, then open Compare to see them side by side." },
  { id: "shortlist", topic: "buying", q: "How do I shortlist a property?",
    a: "Log in and tap the heart on any property. You'll find everything you've saved under Shortlist in your profile." },
  { id: "brokerage", topic: "buying", q: "Do I pay any brokerage?",
    a: "No. CompareProjects doesn't charge buyers any brokerage. If you deal with an agent, any fee they charge is agreed between you and them." },
  { id: "rera", topic: "buying", q: "How do I check a project's RERA registration?",
    a: "Developer listings show the project's RERA number. Search for that number on your state's RERA website to see the official record." },
  { id: "enquiry", topic: "buying", q: "How do I ask about a property?",
    a: "Open the property and send an enquiry using the form on that page. We'll get back to you about it." },

  // Account and login
  { id: "which-login", topic: "account", q: "Which login page should I use?",
    a: "Buyers log in with their email and password on the customer login page. Agents use the agent login page. Developers log in with the username and password our team gave them, on the developer login page." },
  { id: "forgot-customer", topic: "account", q: "I forgot my password. What should I do?",
    a: "On the customer or agent login page, type your email and click Forgot password? We'll email you a link to set a new one. If it doesn't arrive, check your spam folder." },
  { id: "forgot-developer", topic: "account", q: "I'm a developer and forgot my password. What should I do?",
    a: "Click Forgot password? on the developer login page and send us your username and phone number. Our team will call you to reset it.",
    link: { to: "/login", label: "Go to developer login" } },
  { id: "change-password", topic: "account", q: "How do I change my password?",
    a: "Buyers and agents can change it in their profile, under Settings. Developers should contact us." },
  { id: "delete-account", topic: "account", q: "How do I delete my account and data?",
    a: `Email ${CONTACT.email} from the email address on your account and ask us to delete it. We'll delete your account, your profile and your enquiries.` },

  // Home loans
  { id: "loan-offers", topic: "loans", q: "Where can I see home loan offers?",
    a: "Open Avodah Loan from the menu to see the current offers.",
    link: { to: "/apnaloan", label: "Go to Avodah Loan" } },
  { id: "loan-eligibility", topic: "loans", q: "How do I know if I'm eligible for a loan?",
    a: "Eligibility depends on your income, credit history and the property you're buying. Call or email us and we'll talk you through it." },

  // For developers
  { id: "dev-account", topic: "developers", q: "How do I list my project as a developer?",
    a: "Developer accounts are set up by our team, so there's no public sign-up. Contact us with your company details, project details and RERA certificate. Once your account is ready, you can add listings from your dashboard." },
  { id: "dev-review", topic: "developers", q: "Why isn't my listing live yet?",
    a: "Our team reviews every new listing before it goes live. You can see each listing's status in your dashboard." },

  // For agents
  { id: "agent-signup", topic: "agents", q: "How do I become an agent on CompareProjects?",
    a: "Sign up on the agent sign-up page. Our team reviews your application. You need to verify your email address before we can approve it.",
    link: { to: "/agent-signup", label: "Go to agent sign-up" } },
  { id: "agent-convert", topic: "agents", q: "Can I turn my buyer account into an agent account?",
    a: "No. Agent accounts can only be created through the agent sign-up page, so sign up there with a different email address." },

  // Privacy and safety
  { id: "data-use", topic: "privacy", q: "What do you do with my data?",
    a: "We use your details to run your account and to reply to your enquiries. Our Privacy Policy has the full details.",
    link: { to: "/privacy-policy", label: "Read the Privacy Policy" } },
  { id: "report", topic: "privacy", q: "How do I report a wrong or fake listing?",
    a: `Email the listing's link to ${CONTACT.email} and tell us what's wrong. We'll check it.` },
];

const COMMON_IDS = [
  "compare", "brokerage", "rera", "forgot-customer", "dev-account", "delete-account",
];

const faqById = Object.fromEntries(FAQS.map(f => [f.id, f]));

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function SupportHelp() {
  const [activeTopic, setActiveTopic] = useState(null); // null = common questions
  const [openId, setOpenId] = useState(COMMON_IDS[0]);
  const [query, setQuery] = useState("");
  const questionsRef = useRef(null);

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return [];
    return FAQS.filter(f =>
      f.q.toLowerCase().includes(trimmed) || f.a.toLowerCase().includes(trimmed));
  }, [trimmed]);

  const topic = TOPICS.find(t => t.id === activeTopic);
  const faqs = topic
    ? FAQS.filter(f => f.topic === topic.id)
    : COMMON_IDS.map(id => faqById[id]);

  const scrollToQuestions = () =>
    setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const selectTopic = (id) => {
    const next = id === activeTopic ? null : id;
    setActiveTopic(next);
    setOpenId(null);
    if (next) scrollToQuestions();
  };

  const openResult = (faq) => {
    setActiveTopic(faq.topic);
    setOpenId(faq.id);
    setQuery("");
    scrollToQuestions();
  };

  return (
    <div className="hc-page">

      {/* ── Header + search ─────────────────────────────────────────────── */}
      <section className="hc-hero">
        <div className="hc-container hc-hero-inner">
          <h1 className="hc-title">How can we help?</h1>
          <p className="hc-sub">
            Search our answers, or talk to our team. We usually reply within a working day.
          </p>

          <div className="hc-search">
            <Search size={18} className="hc-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="hc-search-input"
              placeholder="Try “RERA”, “brokerage” or “password”"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Escape" && setQuery("")}
              aria-label="Search help articles"
            />
            {trimmed && (
              <div className="hc-search-results">
                <p className="hc-visually-hidden" aria-live="polite">
                  {results.length} {results.length === 1 ? "result" : "results"}
                </p>
                {results.length === 0 ? (
                  <p className="hc-search-empty">
                    No answers match “{query.trim()}”. Try another word, or contact us below.
                  </p>
                ) : (
                  <ul className="hc-search-list">
                    {results.map(f => (
                      <li key={f.id}>
                        <button type="button" className="hc-search-result" onClick={() => openResult(f)}>
                          <span className="hc-result-topic">
                            {TOPICS.find(t => t.id === f.topic)?.title}
                          </span>
                          <span className="hc-result-q">{f.q}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="hc-container hc-body">

        {/* ── Topics ────────────────────────────────────────────────────── */}
        <section aria-labelledby="hc-topics-heading" className="hc-section">
          <h2 id="hc-topics-heading" className="hc-h2">Browse by topic</h2>
          <div className="hc-topics">
            {TOPICS.map(({ id, icon: Icon, title, desc }) => (
              <button
                key={id}
                type="button"
                className={`hc-topic${activeTopic === id ? " is-active" : ""}`}
                aria-pressed={activeTopic === id}
                onClick={() => selectTopic(id)}
              >
                <span className="hc-topic-icon" aria-hidden="true"><Icon size={18} /></span>
                <span className="hc-topic-text">
                  <span className="hc-topic-title">{title}</span>
                  <span className="hc-topic-desc">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Questions ─────────────────────────────────────────────────── */}
        <section aria-labelledby="hc-faq-heading" className="hc-section" ref={questionsRef}>
          <div className="hc-faq-head">
            <h2 id="hc-faq-heading" className="hc-h2">{topic ? topic.title : "Common questions"}</h2>
            {topic && (
              <button type="button" className="hc-back" onClick={() => selectTopic(null)}>
                <ArrowLeft size={15} aria-hidden="true" />
                Common questions
              </button>
            )}
          </div>

          <div className="hc-faqs">
            {faqs.map(f => {
              const open = openId === f.id;
              return (
                <div key={f.id} className="hc-faq">
                  <h3 className="hc-faq-h">
                    <button
                      type="button"
                      className="hc-faq-q"
                      aria-expanded={open}
                      aria-controls={`hc-a-${f.id}`}
                      id={`hc-q-${f.id}`}
                      onClick={() => setOpenId(open ? null : f.id)}
                    >
                      <span>{f.q}</span>
                      {open
                        ? <Minus size={16} className="hc-faq-sign" aria-hidden="true" />
                        : <Plus size={16} className="hc-faq-sign" aria-hidden="true" />}
                    </button>
                  </h3>
                  <div
                    id={`hc-a-${f.id}`}
                    role="region"
                    aria-labelledby={`hc-q-${f.id}`}
                    className="hc-faq-a"
                    hidden={!open}
                  >
                    <p>{f.a}</p>
                    {f.link && <Link to={f.link.to} className="hc-faq-link">{f.link.label}</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Contact ───────────────────────────────────────────────────── */}
        <section aria-labelledby="hc-contact-heading" className="hc-section">
          <h2 id="hc-contact-heading" className="hc-h2">Still need help?</h2>
          <p className="hc-hours">{CONTACT.hours}</p>
          <div className="hc-contacts">
            <a href={CONTACT.phoneHref} className="hc-contact">
              <span className="hc-contact-label"><Phone size={16} aria-hidden="true" />Call us</span>
              <span className="hc-contact-value">{CONTACT.phoneDisplay}</span>
              <span className="hc-contact-note">Fastest for urgent questions</span>
            </a>
            <a href={CONTACT.whatsappHref} className="hc-contact" target="_blank" rel="noopener noreferrer">
              <span className="hc-contact-label"><MessageCircle size={16} aria-hidden="true" />WhatsApp</span>
              <span className="hc-contact-value">{CONTACT.whatsappDisplay}</span>
              <span className="hc-contact-note">Send photos or documents</span>
            </a>
            <a href={`mailto:${CONTACT.email}`} className="hc-contact">
              <span className="hc-contact-label"><Mail size={16} aria-hidden="true" />Email</span>
              <span className="hc-contact-value">{CONTACT.email}</span>
              <span className="hc-contact-note">We reply within a working day</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
