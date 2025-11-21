// src/components/forms/propertySections/PropertyAmenitiesSection.js

import React from "react";
import { useFormContext } from "react-hook-form"; 
import {
  amenitiesList,
  facilitiesList,
  securityList,
} from "../../../../constants/propertyFormConstants"; // adjust path if needed

const PropertyAmenitiesSection = () => {
  const { watch, setValue, getValues } = useFormContext();

  const selectedAmenities = watch("amenities") || [];
  const selectedFacilities = watch("facilities") || [];
  const selectedSecurity = watch("security") || [];

  const handleCheckboxChange = (fieldName, value) => {
    const current = getValues(fieldName) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(fieldName, updated);
  };

  return (
    <section aria-labelledby="amenities-section">
      <h3 id="amenities-section" className="section-title">
        Amenities & Facilities
      </h3>

      {/* Amenities */}
      <div className="form-section">
        <h4 className="section-subtitle">Amenities</h4>
        <fieldset>
          <div className="checkbox-container">
            {amenitiesList.map((amenity) => (
              <label
                key={amenity.name}
                className={`checkbox-label ${
                  selectedAmenities.includes(amenity.name) ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  value={amenity.name}
                  checked={selectedAmenities.includes(amenity.name)}
                  onChange={() => handleCheckboxChange("amenities", amenity.name)}
                />
                {amenity.icon} {amenity.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Facilities */}
      <div className="form-section">
        <h4 className="section-subtitle">Facilities</h4>
        <fieldset>
          <div className="checkbox-container">
            {facilitiesList.map((facility) => (
              <label
                key={facility.name}
                className={`checkbox-label ${
                  selectedFacilities.includes(facility.name) ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  value={facility.name}
                  checked={selectedFacilities.includes(facility.name)}
                  onChange={() =>
                    handleCheckboxChange("facilities", facility.name)
                  }
                />
                {facility.icon} {facility.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Security */}
      <div className="form-section">
        <h4 className="section-subtitle">Security</h4>
        <fieldset>
          <div className="checkbox-container">
            {securityList.map((security) => (
              <label
                key={security.name}
                className={`checkbox-label ${
                  selectedSecurity.includes(security.name) ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  value={security.name}
                  checked={selectedSecurity.includes(security.name)}
                  onChange={() =>
                    handleCheckboxChange("security", security.name)
                  }
                />
                {security.icon} {security.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
};

export default React.memo(PropertyAmenitiesSection);

