//frontend-vite\src\pages\Auth\CustomerAuth\AuthMarketingPanel.jsx
import { Check } from "lucide-react";

const benefits = [
  // "Post one single property for FREE",
  "Set property alerts for your requirement NEED TO DO",
  "Get accessed by over 1 Lakh buyers",
  // "Showcase property as Rental, PG or for Sale",
  "Get instant queries over Phone, Email and SMS",
  "Track responses & views online",
  "Add detailed property info & multiple photos",
];

const AuthMarketingPanel = () => (
  <div className="auth-left">
    <div className="signup-content">

      <h1>
        Get a personalised<br />
        experience on <span>CompareProjects</span>
      </h1>

      <ul className="benefits-list">
        {benefits.map((item, i) => (
          <li key={i}>
            <Check className="check-icon" size={18} strokeWidth={2.5} />
            {item}
          </li>
        ))}
      </ul>

    </div>
  </div>
);

export default AuthMarketingPanel;