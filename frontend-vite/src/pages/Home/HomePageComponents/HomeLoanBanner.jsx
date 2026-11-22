//frontend-vite\src\pages\Home\HomePageComponents\HomeLoanBanner.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./HomeLoanBanner.css";

// Home-page promo that sends buyers to the loan/EMI tools on /apnaloan.
const HomeLoanBanner = () => (
  <section className="home-loan-banner" aria-labelledby="home-loan-heading">
    <div className="home-loan-banner__text">
      <h2 id="home-loan-heading" className="home-loan-banner__title">
        Get Your
        <span className="home-loan-banner__title-accent">Home Loan Easily</span>
      </h2>
      <p className="home-loan-banner__subtitle">
        Estimate your EMI and how much you could borrow — in seconds.
      </p>
    </div>

    <div className="home-loan-banner__action">
      <p className="home-loan-banner__chip">
        <span className="home-loan-banner__chip-label">Free estimate</span>
        <strong className="home-loan-banner__chip-strong">No sign-up</strong>
      </p>

      <Link to="/apnaloan" className="home-loan-banner__cta">
        Check Eligibility
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  </section>
);

export default React.memo(HomeLoanBanner);
