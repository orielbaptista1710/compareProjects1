//frontend-vite\src\components\DevDashboardPageComponents\SellPropertyFormComponents\property-form\SellProLocationSection.jsx
// Google Maps autocomplete + map click + cascading state/city/locality dropdowns.
// Geocoding is done via backend proxy — never calls Google directly from client.

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import locationData from "../../../../database/locationData";

const MAP_CONTAINER_STYLE = {
  height: "300px",
  width: "100%",
  borderRadius: "8px",
};

const SellProLocationSection = ({
  isMapsLoaded,
  mapsLoadError,
  autocompleteRef,
  coordinates,
  onPlaceChanged,
  onMapClick,
  isGeocoding,
  geocodeError,
}) => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  // Watch state & city for cascading dropdowns
  const selectedState = useWatch({ control, name: "state" });
  const selectedCity  = useWatch({ control, name: "city" });

  // Reset dependent fields when parent selection changes
  const handleStateChange = (e) => {
    setValue("state", e.target.value, { shouldValidate: true });
    setValue("city", "", { shouldValidate: false });
    setValue("locality", "", { shouldValidate: false });
  };

  const handleCityChange = (e) => {
    setValue("city", e.target.value, { shouldValidate: true });
    setValue("locality", "", { shouldValidate: false });
  };

  const states    = Object.keys(locationData);
  const cities    = selectedState ? Object.keys(locationData[selectedState] || {}) : [];
  const localities = selectedState && selectedCity
    ? locationData[selectedState]?.[selectedCity] || []
    : [];

  return (
    <section aria-labelledby="location-section-title" className="form-section">
      <h3 id="location-section-title" className="section-title">
        Location
      </h3>

      {/* Maps Autocomplete Search */}
      {mapsLoadError && (
        <div className="alert alert--error" role="alert">
          Google Maps failed to load. Fill address fields manually.
        </div>
      )}

      {isMapsLoaded && !mapsLoadError && (
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="maps-search">
              Search on Map{" "}
              <span className="optional">(auto-fills fields below)</span>
            </label>
            <Autocomplete
              onLoad={(ref) => (autocompleteRef.current = ref)}
              onPlaceChanged={onPlaceChanged}
              // Restrict to India — adjust as needed
              options={{ componentRestrictions: { country: "in" } }}
            >
              <input
                id="maps-search"
                type="search"
                placeholder="Type project address or locality…"
                className="maps-search-input"
                autoComplete="off"
              />
            </Autocomplete>
          </div>
        </div>
      )}

      {/* Map */}
      {isMapsLoaded && !mapsLoadError && (
        <div className="map-wrapper">
          {isGeocoding && (
            <div className="map-overlay" aria-live="polite">
              Looking up address…
            </div>
          )}
          <GoogleMap
            center={coordinates || { lat: 20.5937, lng: 78.9629 }} // India centroid fallback
            zoom={coordinates ? 15 : 5}
            onClick={onMapClick}
            mapContainerStyle={MAP_CONTAINER_STYLE}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {coordinates && <Marker position={coordinates} />}
          </GoogleMap>
          {geocodeError && (
            <span className="field-error" role="alert">
              {geocodeError}
            </span>
          )}
          {!coordinates && (
            <p className="map-hint">
              Click the map or search above to pin the property location.
            </p>
          )}
        </div>
      )}

      {/* Hidden coordinate fields — written by map handlers */}
      <input type="hidden" {...register("lat")} />
      <input type="hidden" {...register("lng")} />

      {/* Cascading Dropdowns */}
      <div className="form-row form-row--3col">
        <div className="form-col">
          <label htmlFor="state">
            State <span className="required">*</span>
          </label>
          <select
            id="state"
            {...register("state")}
            onChange={handleStateChange}
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && (
            <span className="field-error" role="alert">{errors.state.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="city">
            City <span className="required">*</span>
          </label>
          <select
            id="city"
            {...register("city")}
            onChange={handleCityChange}
            disabled={!selectedState}
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.city && (
            <span className="field-error" role="alert">{errors.city.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="locality">
            Locality <span className="required">*</span>
          </label>
          <select
            id="locality"
            {...register("locality")}
            disabled={!selectedCity}
          >
            <option value="">Select Locality</option>
            {localities.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.locality && (
            <span className="field-error" role="alert">{errors.locality.message}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col form-col--narrow">
          <label htmlFor="pincode">
            Pincode <span className="required">*</span>
          </label>
          <input
            id="pincode"
            {...register("pincode")}
            placeholder="6-digit pincode"
            inputMode="numeric"
            maxLength={6}
          />
          {errors.pincode && (
            <span className="field-error" role="alert">{errors.pincode.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="mapLink">
            Google Maps Link <span className="optional">(optional)</span>
          </label>
          <input
            id="mapLink"
            {...register("mapLink")}
            type="url"
            placeholder="https://maps.google.com/…"
          />
          {errors.mapLink && (
            <span className="field-error" role="alert">{errors.mapLink.message}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="address">
            Full Address <span className="required">*</span>
          </label>
          <textarea
            id="address"
            {...register("address")}
            placeholder="Auto-filled by map search, or type manually"
            rows={3}
          />
          {errors.address && (
            <span className="field-error" role="alert">{errors.address.message}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(SellProLocationSection);