import React, { memo, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { AMENITY_ICONS } from "../../../assests/constants/propertyFormConstants";
import "./IconTabContent.css";

const SECTIONS = [
  { key: "amenities", label: "Amenities" },
  { key: "facilities", label: "Facilities" },
  { key: "security", label: "Security" },
];

const IconTabContent = ({ property }) => {
  /**
   * Memoize visible sections
   * Prevent unnecessary recalculations
   */
  const visibleSections = useMemo(() => {
    if (!property || typeof property !== "object") return [];

    return SECTIONS.filter(({ key }) => {
      const value = property[key];
      return Array.isArray(value) && value.length > 0;
    });
  }, [property]);

  if (visibleSections.length === 0) {
    return (
      <p className="no-data">
        No amenities, facilities, or security details available.
      </p>
    );
  }

  return (
    <div className="icon-tab-pp-tab-content">
      {visibleSections.map(({ key, label }) => {
        const items = property[key];

        return (
          <section
            key={key}
            className="icon-tab-pp-grid-wrapper"
            aria-labelledby={`${key}-label`}
          >
            <h4
              id={`${key}-label`}
              className="icon-tab-pp-heading"
            >
              {label}
            </h4>

            <div
              className="icon-tab-pp-grid-container"
              role="list"
            >
              {items.map((item) => {
                const icon = AMENITY_ICONS[item] || faStar;

                return (
                  <div
                    key={`${key}-${item}`}
                    className="icon-tab-pp-grid-item"
                    role="listitem"
                    aria-label={item}
                  >
                    <FontAwesomeIcon
                      icon={icon}
                      className="icon-tab-pp-icon"
                      aria-hidden="true"
                    />
                    <span className="icon-tab-pp-label">
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default memo(IconTabContent);
