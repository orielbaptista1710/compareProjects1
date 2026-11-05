// sections/SellProLocationSection.jsx
// Google Maps autocomplete + map pin + cascading state/city/locality dropdowns.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import locationData from "../../../../database/locationData";

// Must be module-level — a new array each render makes the SDK re-initialise
const MAPS_LIBRARIES = ["places"];

const MAP_CONTAINER_STYLE = {
  height: "300px",
  width: "100%",
  borderRadius: "8px",
};

// Stable references — inline objects make GoogleMap re-centre / call
// setOptions on every re-render, which snaps the map back while panning.
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};
const AUTOCOMPLETE_OPTIONS = { componentRestrictions: { country: "in" } };
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

// Start loading the Maps SDK when the section is this close to the viewport,
// so it's ready by the time the developer scrolls to it.
const PRELOAD_MARGIN = "600px 0px";

// Places autofill can set a city/locality that isn't in the static list;
// keep it selectable so the <select> doesn't show "Select …" with a value set.
const withCurrent = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

// Only mounted once the section is near the viewport, so the Maps script
// (several hundred KB) isn't downloaded on every dashboard visit.
const MapPicker = ({ autocompleteRef, coordinates, onPlaceChanged, onMapClick }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const center = useMemo(() => coordinates || INDIA_CENTER, [coordinates]);

  if (loadError) {
    return (
      <div className="alert alert--error" role="alert">
        Google Maps failed to load. Fill address fields manually.
      </div>
    );
  }

  if (!isLoaded) {
    return <p className="map-hint">Loading map…</p>;
  }

  return (
    <>
      <div className="form-row">
        <div className="form-col">
          <label htmlFor="maps-search">
            Search on Map{" "}
            <span className="optional">(auto-fills fields below)</span>
          </label>
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={onPlaceChanged}
            options={AUTOCOMPLETE_OPTIONS}
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

      <div className="map-wrapper">
        <GoogleMap
          center={center}
          zoom={coordinates ? 15 : 5}
          onClick={onMapClick}
          mapContainerStyle={MAP_CONTAINER_STYLE}
          options={MAP_OPTIONS}
        >
          {coordinates && <Marker position={coordinates} />}
        </GoogleMap>
      </div>
      <p className="map-hint">
        {coordinates
          ? "Click the map to move the pin."
          : "Search above to auto-fill the address, or click the map to pin the location."}
      </p>
    </>
  );
};

const SellProLocationSection = ({
  autocompleteRef,
  coordinates,
  onPlaceChanged,
  onMapClick,
}) => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  // ── Defer the Maps SDK until the section is near the viewport ──────────────
  const sectionRef = useRef(null);
  const [showMap, setShowMap] = useState(
    () => typeof IntersectionObserver === "undefined"
  );
  useEffect(() => {
    if (showMap || !sectionRef.current) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShowMap(true);
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [showMap]);

  // Watch state, city & locality for cascading dropdowns
  const selectedState    = useWatch({ control, name: "state" });
  const selectedCity     = useWatch({ control, name: "city" });
  const selectedLocality = useWatch({ control, name: "locality" });

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

  const states = withCurrent(Object.keys(locationData), selectedState);
  const cities = withCurrent(
    selectedState ? Object.keys(locationData[selectedState] || {}) : [],
    selectedCity
  );
  const localities = withCurrent(
    selectedState && selectedCity ? locationData[selectedState]?.[selectedCity] || [] : [],
    selectedLocality
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="location-section-title"
      className="form-section"
    >
      <h3 id="location-section-title" className="section-title">
        Location
      </h3>

      {showMap ? (
        <MapPicker
          autocompleteRef={autocompleteRef}
          coordinates={coordinates}
          onPlaceChanged={onPlaceChanged}
          onMapClick={onMapClick}
        />
      ) : (
        <p className="map-hint">Map loads as you scroll here…</p>
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
            type="text"
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
