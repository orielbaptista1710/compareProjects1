import { useState, useEffect } from "react";
import "./Disclaimer.css";

const STORAGE_KEY = "cp_disclaimer_dismissed";

const Disclaimer = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't dismissed it before
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="disclaimer-banner" role="dialog" aria-label="Site disclaimer">
      {/* Top accent line — matches brand purple */}
      <div className="disclaimer-accent" />

      <div className="disclaimer-inner">
        <p className="disclaimer-text">
          The data available on this website has been made available for informational purposes only and no representation or warranty is expressly or impliedly given as to its accuracy. Any investment decisions you take should not be based solely on the information available on compareprojects.in. Nothing contained herein shall be deemed to constitute legal advice, solicitation, or invitation to acquire by the developer/builder or any other entity. You are advised to visit the relevant{" "}
          <a href="https://rera.maharashtra.gov.in" target="_blank" rel="noopener noreferrer">
            RERA website
          </a>{" "}
          and contact builders/advertisers directly before making any decision. Trademarks belong to their respective owners.
        </p>

        <button
          type="button"
          className="disclaimer-btn"
          onClick={handleDismiss}
          aria-label="Dismiss disclaimer"
        >
          OK, Got it
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;