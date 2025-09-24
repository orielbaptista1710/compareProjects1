import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen } from "@fortawesome/free-solid-svg-icons/faDoorOpen";
import { AMENITY_ICONS } from  "../../constants/propertyFormConstants";
import "./IconTabContent.css";

const sections = [
  { key: "amenities", label: "Amenities" },
  { key: "facilities", label: "Facilities" },
  { key: "security", label: "Security" },
];

const IconTabContent = ({ property }) => {
  return (
    <div className="tab-content">
      {sections.map(({ key, label }) =>
        property[key]?.length > 0 ? (
          <section key={key} className="grid-wrapper">
            <h4>{label}</h4>
            <div className="grid-container" role="list">
              {property[key].map((item, index) => (
                <div key={`${key}-${index}`} className="grid-item" role="listitem">
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
        ) : null
      )}
    </div>
  );
};

export default memo(IconTabContent);
