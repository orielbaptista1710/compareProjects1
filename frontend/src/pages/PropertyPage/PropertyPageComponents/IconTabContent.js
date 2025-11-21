import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen } from "@fortawesome/free-solid-svg-icons/faDoorOpen";
import { AMENITY_ICONS } from "../../../assests/constants/propertyFormConstants";
import "./IconTabContent.css";

const sections = [
  { key: "amenities", label: "Amenities" },
  { key: "facilities", label: "Facilities" },
  { key: "security", label: "Security" },
];

const IconTabContent = ({ property = {} }) => {
  // Filter sections that have data
  const visibleSections = sections.filter(
    ({ key }) => Array.isArray(property[key]) && property[key].length > 0
  );

  if (!visibleSections.length) {
    return <p className="no-data">No amenities, facilities, or security details available.</p>;
  }

  return (
    <div className="tab-content">
      {visibleSections.map(({ key, label }) => (
        <section key={key} className="grid-wrapper" aria-labelledby={`${key}-label`}>
          <h4 id={`${key}-label`}>{label}</h4>
          <div className="grid-container" role="list">
            {property[key].map((item, index) => (
              <div
                key={`${key}-${index}`}
                className="grid-item"
                role="listitem"
                aria-label={item}
              >
                <FontAwesomeIcon
                  icon={AMENITY_ICONS[item] || faDoorOpen}
                  className="icon"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default memo(IconTabContent);
