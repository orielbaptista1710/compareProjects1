import { Check } from "lucide-react";

const benefits = [
  "Exclusive Discounts on Projects",
  "Zero Brokerage Fees",
  "Direct Contact with Developers",
  "Free Guidance for Home Loans",
];

const AuthMarketingPanel = () => {
  return (
    <div className="auth-left">
      <div className="auth-left-content">

        <h1>
          Get a personalized <br />
          experience on CompareProjects
        </h1>

        <ul className="benefits-list">
          {benefits.map((item, index) => (
            <li key={index}>
              <Check
                className="check-icon"
                size={16}
                strokeWidth={2.4}
              />
              {item}
            </li>
          ))}
        </ul>

        <div className="trusted-by">
          <p>Trusted By Global Brands</p>

          <div className="brands">
            <span className="brand">blinkit</span>
            <span className="brand">HAVELLS</span>
            <span className="brand">HERSHEY'S</span>
          </div>
        </div>

        <div className="testimonial">
          <p className="quote">
            "CompareProjects helped me find the best property deal with zero brokerage."
          </p>

          <p className="author">
            Satisfied Customer
          </p>

          <p className="position">
            Mumbai, India
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthMarketingPanel;