import React, { useState } from "react";
import "./AnnouncementStrip.css";
import { useCity } from "../../../contexts/CityContext";

const AnnouncementStrip = () => {
  const { city } = useCity();
  const [isPaused, setIsPaused] = useState(false);

  // Fallback city if context fails
  const displayCity = city || "your area";

  // Pause/resume handlers
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setIsPaused(!isPaused);
    }
  };

  const announcementText = `We've got you covered in ${displayCity} — Verified Properties • Home Loans • Interiors • Legal Support`;

  return (
    <aside
      className={`announcement-strip ${isPaused ? "paused" : ""}`}
      role="complementary"
      aria-label="Services announcement banner"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      title="Hover or press space to pause"
    >
      {/* Scrolling content (hidden from screen readers) */}
      <div className="announcement-track" aria-hidden="true">
        <span>
          We've got you covered in <strong>{displayCity}</strong> — Verified
          Properties • Home Loans • Interiors • Legal Support
        </span>
        <span>
          We've got you covered in <strong>{displayCity}</strong> — Verified
          Properties • Home Loans • Interiors • Legal Support
        </span>
        <span>
          We've got you covered in <strong>{displayCity}</strong> — Verified
          Properties • Home Loans • Interiors • Legal Support
        </span>
      </div>

      {/* Screen reader accessible text */}
      <span className="sr-only">{announcementText}</span>
    </aside>
  );
};

export default React.memo(AnnouncementStrip);