import { useState, useEffect, useRef } from "react";
import "./LegalPage.css";

const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>At CompareProjects, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information when you interact with our website or services. By using our platform, you agree to the terms described below.</p>
        <p>Our commitment to safeguarding your data is rooted in our respect for your trust. We want you to feel confident that your information is handled responsibly and ethically. Please read this policy carefully to understand how we manage your data.</p>
      </>
    ),
  },
  {
    id: "data-collection",
    title: "Data Collection",
    content: (
      <>
        <p>We collect information in the following ways:</p>
        <ol>
          <li>
            <strong>Information You Provide Directly:</strong> When you interact with our website or services, we collect data you voluntarily provide. This includes:
            <ul>
              <li><strong>Contact Information:</strong> When you sign up, subscribe, or contact us, we collect your name, email address, phone number, and any other details you share.</li>
              <li><strong>User-Generated Content:</strong> If you create an account, post reviews, or upload content, we collect that information.</li>
              <li><strong>Preferences:</strong> We gather data about your preferences, such as property types, budget range, and location preferences.</li>
            </ul>
          </li>
          <li>
            <strong>Automatically Collected Information:</strong>
            <ul>
              <li><strong>Cookies and Tracking Technologies:</strong> Our website uses cookies and similar technologies to enhance your experience. These collect data about your browsing behaviour, device type, IP address, and more.</li>
              <li><strong>Log Files:</strong> We automatically log information about your interactions with our site, including pages visited, timestamps, and referral URLs.</li>
              <li><strong>Analytics:</strong> We use analytics tools to understand user behaviour, traffic patterns, and demographics.</li>
            </ul>
          </li>
          <li>
            <strong>Third-Party Sources:</strong>
            <ul>
              <li><strong>Social Media Platforms:</strong> If you connect with us through social media, we may collect information from your profiles.</li>
              <li><strong>Third-Party Services:</strong> We integrate with third-party services such as payment gateways and map providers that may share data with us.</li>
            </ul>
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "types-of-data",
    title: "Types of Data",
    content: (
      <>
        <p>The types of personal data we may collect and process include:</p>
        <ul>
          <li><strong>Identity Data:</strong> Name, username, or similar identifier.</li>
          <li><strong>Contact Data:</strong> Email address, phone number, and billing address.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, time zone, operating system, and platform.</li>
          <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
          <li><strong>Marketing Data:</strong> Your preferences in receiving marketing from us and your communication preferences.</li>
          <li><strong>Property Inquiry Data:</strong> Details of properties you have enquired about, saved, or compared on our platform.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use-of-data",
    title: "Use of Data",
    content: (
      <>
        <p>We use the data we collect for the following purposes:</p>
        <ul>
          <li>To provide, operate, and improve our services and platform.</li>
          <li>To personalise your experience and deliver relevant property recommendations.</li>
          <li>To communicate with you about your enquiries, bookings, and account updates.</li>
          <li>To send marketing communications where you have opted in to receive them.</li>
          <li>To comply with legal obligations and prevent fraud or misuse of our platform.</li>
          <li>To conduct analytics and research to better understand our users and improve our offerings.</li>
          <li>To process transactions and manage payments securely.</li>
        </ul>
        <p>We will only use your personal data for the purposes for which we collected it, unless we reasonably consider that we need to use it for another reason and that reason is compatible with the original purpose.</p>
      </>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    content: (
      <>
        <p>We may share your personal data with third parties in limited circumstances:</p>
        <ul>
          <li><strong>Service Providers:</strong> We engage trusted third-party companies and individuals to facilitate our services, including hosting, analytics, payment processing, and customer support.</li>
          <li><strong>Business Partners:</strong> We may share data with developers, builders, and real estate agents to fulfil your enquiries. These parties are bound by confidentiality agreements.</li>
          <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, court order, or government authority.</li>
          <li><strong>Business Transfers:</strong> If CompareProjects is involved in a merger, acquisition, or asset sale, your data may be transferred as part of that transaction.</li>
        </ul>
        <p>We do not sell, trade, or rent your personal data to third parties for their own marketing purposes.</p>
      </>
    ),
  },
  {
    id: "user-rights",
    title: "User Rights",
    content: (
      <>
        <p>Depending on your location, you may have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data, subject to legal obligations.</li>
          <li><strong>Right to Restriction:</strong> Request that we limit the processing of your personal data.</li>
          <li><strong>Right to Data Portability:</strong> Receive your personal data in a structured, machine-readable format.</li>
          <li><strong>Right to Object:</strong> Object to the processing of your personal data for direct marketing purposes.</li>
        </ul>
        <p>To exercise any of these rights, please contact us at <a href="mailto:info@compareprojects.in">info@compareprojects.in</a>. We will respond to your request within 30 days.</p>
      </>
    ),
  },
  {
    id: "security-measures",
    title: "Security Measures",
    content: (
      <>
        <p>We have implemented appropriate technical and organisational security measures designed to protect your personal data against accidental loss, unauthorised access, use, alteration, and disclosure. These include:</p>
        <ul>
          <li>SSL encryption for all data transmitted between your browser and our servers.</li>
          <li>Secure, access-controlled servers with regular security audits.</li>
          <li>Limited access to personal data on a need-to-know basis.</li>
          <li>Regular staff training on data protection and privacy best practices.</li>
          <li>Incident response procedures in the event of a data breach.</li>
        </ul>
        <p>While we strive to use commercially acceptable means to protect your data, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.</p>
      </>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:info@compareprojects.in">info@compareprojects.in</a></li>
          <li><strong>Address:</strong> Mumbai, Maharashtra, India</li>
          <li><strong>Phone:</strong> <a href="tel:+919999999999">+91 9999 999 999</a></li>
        </ul>
        <p>This Privacy Policy was last updated on <strong>January 2025</strong>. We reserve the right to update this policy at any time. Changes will be posted on this page with an updated revision date.</p>
      </>
    ),
  },
];

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState("introduction");
  const sectionRefs = useRef({});

  // Scroll spy — highlight TOC item based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="legal-page">
      {/* Hero */}
      <div className="legal-hero">
        <div className="legal-hero-overlay" />
        <div className="legal-hero-content">
          <h1>Privacy Policy</h1>
          <p>Your Data, Our Commitment to Transparency and Security</p>
        </div>
      </div>

      <div className="legal-body">
        {/* Sticky sidebar TOC */}
        <aside className="legal-toc">
          <h4>Table of contents</h4>
          <nav>
            {SECTIONS.map(({ id, title }) => (
              <button
                key={id}
                type="button"
                className={`toc-item${activeSection === id ? " toc-item--active" : ""}`}
                onClick={() => scrollToSection(id)}
              >
                {title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="legal-content">
          {SECTIONS.map(({ id, title, content }) => (
            <section key={id} id={id} className="legal-section">
              <h2>{title}</h2>
              {content}
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;