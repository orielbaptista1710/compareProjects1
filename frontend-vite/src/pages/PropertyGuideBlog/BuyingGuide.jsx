import { useState } from "react";
import "./BuyingGuide.css";

const buyingGuideSteps = [
  {
    step: "Step 1",
    title: "Set Your Budget",
    description: "Know how much you can afford before starting your property search.",
    detail: `Start by calculating your net monthly income and subtracting all fixed expenses. A safe rule of thumb: your EMI shouldn't exceed 40% of your take-home pay.\n\n• Factor in down payment (typically 10–20% of property value)\n• Account for registration, stamp duty, and brokerage charges\n• Keep a 6-month emergency fund untouched\n• Use our EMI calculator to simulate different loan scenarios`,
  },
  {
    step: "Step 2",
    title: "Research Localities",
    description: "Check connectivity, safety, and growth potential of neighborhoods.",
    detail: `Location is the single biggest driver of long-term property value. Visit the area at different times of the day.\n\n• Check proximity to metro/train stations, schools, and hospitals\n• Look up upcoming infrastructure projects (metro lines, highways)\n• Review crime statistics on local police station websites\n• Talk to existing residents — they reveal what listings won't`,
  },
  {
    step: "Step 3",
    title: "Evaluate Builders",
    description: "Look into the builder's reputation, past projects, and delivery track record.",
    detail: `A reputed builder reduces your risk significantly. Due diligence here can save years of legal headache.\n\n• Search the builder's name on RERA portal — check complaints filed\n• Visit completed projects and speak to residents about quality and after-sales service\n• Check if the builder has ever defaulted on delivery timelines\n• Review their financials if publicly listed`,
  },
  {
    step: "Step 4",
    title: "Check Legal Documents",
    description: "Verify title deeds, approvals, and RERA registration.",
    detail: `Never skip a lawyer's opinion on property documents. Even reputed builders can have encumbrances.\n\n• Verify title deed is clear and free from disputes\n• Check RERA registration number on the official state portal\n• Confirm building plan approval from the local municipal authority\n• Ensure Occupation Certificate (OC) / Completion Certificate (CC) exists for ready properties`,
  },
  {
    step: "Step 5",
    title: "Financing & Loans",
    description: "Compare bank loan offers, interest rates, and EMI flexibility.",
    detail: `Getting the best home loan is as important as picking the right property. A 0.5% difference in rate can save lakhs over a 20-year tenure.\n\n• Compare at least 3–4 lenders (PSU banks often have lower rates)\n• Opt for floating rate only if you expect rates to fall\n• Check for prepayment penalty clauses\n• Maintain a CIBIL score above 750 for best offers`,
  },
  {
    step: "Step 6",
    title: "Registration & Handover",
    description: "Complete stamp duty, registration, and property possession formalities.",
    detail: `The final stretch — don't rush it. A thorough snagging inspection at handover can save costly post-possession repairs.\n\n• Pay stamp duty and registration fees at the sub-registrar's office\n• Conduct a snagging inspection with a checklist (walls, plumbing, electricals, fittings)\n• Collect all original documents: sale deed, possession letter, NOC\n• Apply for mutation / Khata transfer in your name`,
  },
];

// ─── StepCard ─────────────────────────────────────────────────────────────────
const StepCard = ({ step }) => {
  const [open, setOpen] = useState(false);

  const blocks = step.detail
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div
      className={`guide-step-card${open ? " guide-step-card--open" : ""}`}
      onClick={() => setOpen((o) => !o)}
      role="button"
      aria-expanded={open}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)}
    >
      {/* Purple bold uppercase label — exactly as in the image */}
      <div className="step-number">{step.step.toUpperCase()}</div>

      <h3 className="step-card-title">{step.title}</h3>
      <p className="step-card-desc">{step.description}</p>

      {/* Expandable detail panel */}
      <div className={`step-detail${open ? " step-detail--visible" : ""}`}>
        <div className="step-detail-inner">
          {blocks.map((block, i) =>
            block.startsWith("•") ? (
              <ul key={i}>
                {block
                  .split("\n")
                  .filter(Boolean)
                  .map((line, j) => (
                    <li key={j}>{line.replace(/^•\s*/, "").trim()}</li>
                  ))}
              </ul>
            ) : (
              <p key={i}>{block}</p>
            )
          )}
        </div>
      </div>

      {/* Amber "Learn More →" — matches the image exactly */}
      <span className="step-learn-more">
        {open ? "Show less ↑" : "Learn More →"}
      </span>
    </div>
  );
};

// ─── BuyingGuide ──────────────────────────────────────────────────────────────
const BuyingGuide = () => {
  return (
    <div className="buying-guide-section">
      <div className="container">
        <div className="guide-section-header">
          <h2>
            Step-by-Step <span className="underline-text">Buying Guide</span>
          </h2>
          <p className="section-description">
            A complete roadmap to help you confidently navigate the property
            buying process — from budgeting to registration.
          </p>
        </div>

        <div className="guide-steps-grid">
          {buyingGuideSteps.map((step, idx) => (
            <StepCard key={idx} step={step} />
          ))}
        </div>

        {/* Download strip */}
        <div className="guide-download-strip">
          <div className="guide-download-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <polyline points="9 14 12 17 15 14" />
            </svg>
          </div>

          <div className="guide-download-text">
            <strong>Complete Property Buying Guide — PDF</strong>
            <span>All 6 steps with checklists, legal tips, and loan calculators in one document.</span>
            <div className="guide-download-meta">
              <span className="dl-pill">12 pages</span>
              <span className="dl-pill">Free download</span>
              <span className="dl-pill">Updated 2025</span>
            </div>
          </div>

          <div className="guide-download-actions">
            <a
              href="/files/property-buying-guide.pdf"
              className="dl-btn dl-btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3v13M5 14l7 7 7-7" />
                <path d="M3 21h18" />
              </svg>
              Download PDF
            </a>
            <a href="/email-guide" className="dl-btn dl-btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Email me
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyingGuide;