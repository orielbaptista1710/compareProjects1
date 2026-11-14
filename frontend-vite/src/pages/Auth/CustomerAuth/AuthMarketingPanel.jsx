// frontend-vite/src/pages/Auth/CustomerAuth/AuthMarketingPanel.jsx
// Left half of the customer/agent login and signup pages: a photo with a
// dark card listing what posting on CompareProjects gives you. Text only.
import { Check } from "lucide-react";

const COPY = {
  owner: {
    eyebrow: "For owners",
    title: "List your home and hear from buyers directly",
    points: [
      "Listing is free",
      "Buyers contact you on WhatsApp, with no broker in between",
      "See views and enquiries for each listing",
      "Every listing is reviewed before it goes live",
    ],
  },
  agent: {
    eyebrow: "For agents",
    title: "List your clients' homes and reach serious buyers",
    points: [
      "Our team verifies your RERA registration",
      "Buyers contact you on WhatsApp",
      "See views and enquiries for each listing",
      "Every listing is reviewed before it goes live",
    ],
  },
};

const AuthMarketingPanel = ({ isAgent = false }) => {
  const copy = isAgent ? COPY.agent : COPY.owner;

  return (
    <aside className="cauth-panel" aria-labelledby="cauth-panel-title">
      <div className="cauth-panel-card">
        <p className="cauth-panel-eyebrow">{copy.eyebrow}</p>
        <h2 id="cauth-panel-title" className="cauth-panel-title">{copy.title}</h2>
        <ul className="cauth-panel-list">
          {copy.points.map((point) => (
            <li key={point}>
              <Check className="cauth-panel-check" size={18} strokeWidth={2.5} aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default AuthMarketingPanel;
