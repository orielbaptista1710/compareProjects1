import { useState, useEffect, useRef } from "react";
import "./LegalPage.css";

const SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>Welcome to CompareProjects. By accessing or using our website and services, you agree to be bound by these Terms of Use. Please read them carefully before using our platform.</p>
        <p>These terms apply to all visitors, users, developers, and others who access or use our service. If you disagree with any part of these terms, you may not access the service.</p>
      </>
    ),
  },
  {
    id: "use-of-platform",
    title: "Use of Platform",
    content: (
      <>
        <p>CompareProjects provides a real estate discovery and comparison platform. You agree to use our services only for lawful purposes and in a way that does not infringe the rights of others. You must not:</p>
        <ul>
          <li>Use the platform for any fraudulent or misleading activity.</li>
          <li>Attempt to gain unauthorised access to any part of the platform or its related systems.</li>
          <li>Reproduce, duplicate, copy, or resell any part of our service without express written permission.</li>
          <li>Upload or transmit any viruses, malware, or other harmful code.</li>
          <li>Use automated tools (bots, scrapers) to access or collect data from our platform without prior written consent.</li>
        </ul>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    content: (
      <>
        <p>When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:</p>
        <ul>
          <li>Maintaining the confidentiality of your account credentials.</li>
          <li>All activities that occur under your account.</li>
          <li>Notifying us immediately of any unauthorised use of your account.</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or remain inactive for an extended period.</p>
      </>
    ),
  },
  {
    id: "property-listings",
    title: "Property Listings",
    content: (
      <>
        <p>Property listings on CompareProjects are provided for informational purposes only. We do not warrant the accuracy, completeness, or fitness for any particular purpose of any listing. Specifically:</p>
        <ul>
          <li>All property information, pricing, and availability are subject to change without notice.</li>
          <li>Listings are contributed by developers and third parties. CompareProjects is not responsible for errors or omissions in listing content.</li>
          <li>RERA registration details, possession dates, and approval statuses should be independently verified by visiting the relevant state RERA portal.</li>
          <li>Any investment decisions should be made after independent due diligence and, where appropriate, professional legal and financial advice.</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: (
      <>
        <p>The CompareProjects platform, including its content, features, and functionality, is owned by Compare Projects Pvt. Ltd. and is protected by applicable intellectual property laws. This includes:</p>
        <ul>
          <li>All text, graphics, logos, images, and software on the platform.</li>
          <li>The CompareProjects brand name, trademarks, and service marks.</li>
          <li>Proprietary data, algorithms, and methodologies used in our comparison tools.</li>
        </ul>
        <p>You may not use, reproduce, or distribute any content from our platform without our prior written permission, except as permitted by applicable law.</p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: (
      <>
        <p>To the maximum extent permitted by applicable law, CompareProjects shall not be liable for:</p>
        <ul>
          <li>Any indirect, incidental, special, or consequential damages arising from your use of our platform.</li>
          <li>Loss of profits, data, goodwill, or other intangible losses.</li>
          <li>Any errors, inaccuracies, or omissions in property listings or associated content.</li>
          <li>Any unauthorised access to or use of our servers or any personal information stored therein.</li>
          <li>Any bugs, viruses, or other harmful code that may be transmitted through our services.</li>
        </ul>
        <p>Our total liability for any claims arising from these terms or your use of the platform shall not exceed the amount paid by you, if any, to CompareProjects in the twelve months preceding the claim.</p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: (
      <>
        <p>These Terms of Use shall be governed by and construed in accordance with the laws of India. Any disputes arising from or relating to these terms or your use of the platform shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.</p>
        <p>If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining terms shall otherwise remain in full force and effect.</p>
      </>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to Terms",
    content: (
      <>
        <p>We reserve the right to modify or replace these Terms of Use at any time. We will provide notice of significant changes by updating the date at the bottom of this page. Your continued use of the platform after any changes constitutes your acceptance of the new terms.</p>
        <p>These Terms of Use were last updated on <strong>January 2025</strong>. For any questions about these terms, please contact us at <a href="mailto:info@compareprojects.in">info@compareprojects.in</a>.</p>
      </>
    ),
  },
];

const Terms = () => {
  const [activeSection, setActiveSection] = useState("introduction");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
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
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="legal-hero-overlay" />
        <div className="legal-hero-content">
          <h1>Terms of Use</h1>
          <p>Please read these terms carefully before using our platform</p>
        </div>
      </div>

      <div className="legal-body">
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

export default Terms;