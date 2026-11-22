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
        backgroundImage: `
          linear-gradient(
            color-mix(in srgb, var(--color-primary) 65%, transparent),
            color-mix(in srgb, var(--color-primary-deep) 75%, transparent)
          ),
          url(${backgroundImage})
        `,
      }
    : undefined;

  return (
    <section
      id={id}
      className="gradient-banner"
      style={sectionStyle}
      aria-labelledby={ariaLabelledBy}
    >
      <div className="gradient-banner-content">
        <h2
          id={ariaLabelledBy}
          className="gradient-banner-title"
        >
          {title}
        </h2>

        <p className="gradient-banner-subtitle">
          {subtitle}
        </p>

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