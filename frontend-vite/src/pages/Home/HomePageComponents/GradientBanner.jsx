import React from "react";
import "./GradientBanner.css";

const GradientBanner = ({
  id,
  title,
  subtitle,
  buttonText,
  onButtonClick,
  backgroundImage,
  ariaLabelledBy,
}) => {
  const sectionStyle = backgroundImage
    ? {
        background: `
          linear-gradient(
            rgba(88, 0, 135, 0.65),
            rgba(45, 0, 80, 0.75)
          ),
          url(${backgroundImage})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <section
      id={id}
      className={`gradient-banner ${backgroundImage ? "has-bg-image" : ""}`}
      style={sectionStyle}
      aria-labelledby={ariaLabelledBy}
    >
      <div className="gradient-banner-content">
        <h2 id={ariaLabelledBy} className="gradient-banner-title">
          {title}
        </h2>

        <p className="gradient-banner-subtitle">{subtitle}</p>

        <button
          type="button"
          className="gradient-banner-button"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
};

export default React.memo(GradientBanner);
