import React, { useState } from "react";
import { useWatch } from "react-hook-form";
import locationData from "../../../../database/locationData";

const LocationDetailsSection = ({ register, control, errors }) => {
  const selectedState = useWatch({ control, name: "state" });
  const selectedCity = useWatch({ control, name: "city" });
  const [pincodeError, setPincodeError] = useState("");

  const handlePincodeValidation = (e) => {
    const value = e.target.value;
    if (!/^\d{0,6}$/.test(value)) {
      setPincodeError("Pincode must be numeric and up to 6 digits.");
    } else {
      setPincodeError("");
    }
  };

  return (
    <section aria-labelledby="location-section">
      <h3 id="location-section" className="section-title">
        Location Details
      </h3>
      <div className="location-details">
        {/* State + City */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="state">State</label>
            <select
              id="state"
              className="form-input"
              {...register("state", { required: "State is required" })}
            >
              <option value="">Select State</option>
              {Object.keys(locationData).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && <span className="error">{errors.state.message}</span>}
          </div>

          <div className="form-col">
            <label htmlFor="city">City</label>
            <select
              id="city"
              className="form-input"
              {...register("city", { required: "City is required" })}
              disabled={!selectedState}
            >
              <option value="">Select City</option>
              {selectedState &&
                Object.keys(locationData[selectedState] || {}).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
            {errors.city && <span className="error">{errors.city.message}</span>}
          </div>
        </div>

        {/* Locality + Pincode */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="locality">Locality</label>
            <select
              id="locality"
              className="form-input"
              {...register("locality", { required: "Locality is required" })}
              disabled={!selectedCity}
            >
              <option value="">Select Locality</option>
              {selectedState &&
                selectedCity &&
                (locationData[selectedState]?.[selectedCity] || []).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
            {errors.locality && <span className="error">{errors.locality.message}</span>}
          </div>

          <div className="form-col">
            <label htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              className="form-input"
              type="text"
              placeholder="Pincode"
              {...register("pincode", {
                required: "Pincode is required",
                pattern: { value: /^\d{6}$/, message: "Pincode must be 6 digits" },
              })}
              onInput={handlePincodeValidation}
            />
            {(errors.pincode && (
              <span className="error">{errors.pincode.message}</span>
            )) ||
              (pincodeError && <span className="error">{pincodeError}</span>)}
          </div>
        </div>

        {/* Address */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="address">Full Address</label>
            <textarea
              id="address"
              className="form-input"
              placeholder="Complete property address"
              rows={4}
              {...register("address", { required: "Address is required" })}
            />
            {errors.address && <span className="error">{errors.address.message}</span>}
          </div>
        </div>

        {/* Google Maps Link */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="mapLink">Google Maps Link</label>
            <input
              id="mapLink"
              className="form-input"
              type="url"
              placeholder="https://maps.google.com/..."
              {...register("mapLink", {
                pattern: {
                  value: /^https:\/\/(www\.)?google\.com\/maps/,
                  message: "Enter a valid Google Maps URL",
                },
              })}
            />
            <small className="form-text">
              Paste the full Google Maps URL for this property
            </small>
            {errors.mapLink && <span className="error">{errors.mapLink.message}</span>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationDetailsSection;
