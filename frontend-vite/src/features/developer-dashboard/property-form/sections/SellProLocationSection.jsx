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

// Places autofill can set a state or city that isn't in the static list;
// keep it selectable so the <select> doesn't show "Select …" with a value set.
const withCurrent = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

// Only mounted once the section is near the viewport, so the Maps script
// (several hundred KB) isn't downloaded on every dashboard visit.
const MapPicker = ({ autocompleteRef, coordinates, onPlaceChanged, onMapClick, onRemovePin }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const center = useMemo(() => coordinates || INDIA_CENTER, [coordinates]);

  if (loadError) {
    return (
      <div className="alert alert--error" role="alert">
        The map could not be loaded. You can still fill in the address fields below.
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
            Search on the map{" "}
            <span className="optional">(fills in the fields below)</span>
          </label>
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={onPlaceChanged}
            options={AUTOCOMPLETE_OPTIONS}
          >
            <input
              id="maps-search"
              type="search"
              placeholder="Type the address, project or locality…"
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
          {coordinates && (
            <Marker position={coordinates} draggable onDragEnd={onMapClick} title="Property location" />
          )}
        </GoogleMap>
      </div>
      <p className="map-hint">
        {coordinates
          ? "Drag the pin or click the map to move it."
          : "Search above to fill in the address, or click the map to pin the location."}
        {coordinates && onRemovePin && (
          <>
            {" "}
            <button type="button" className="map-pin-remove" onClick={onRemovePin}>
              Remove pin
            </button>
          </>
        )}
      </p>
    </>
  );
};

const SellProLocationSection = ({
  autocompleteRef,
  coordinates,
  onPlaceChanged,
  onMapClick,
  onRemovePin,
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
    setValue("state", e.target.value, { shouldValidate: true, shouldDirty: true });
    setValue("city", "", { shouldDirty: true });
    setValue("locality", "", { shouldDirty: true });
  };

  const handleCityChange = (e) => {
    setValue("city", e.target.value, { shouldValidate: true, shouldDirty: true });
    setValue("locality", "", { shouldDirty: true });
  };

  const states = withCurrent(Object.keys(locationData), selectedState);
  // A city or locality we have no list for (the map search can return any
  // place in India) is typed instead of picked, so the poster is never left
  // with an empty dropdown on a required field.
  const listedCities = selectedState ? Object.keys(locationData[selectedState] || {}) : [];
  const listedLocalities =
    selectedState && selectedCity ? locationData[selectedState]?.[selectedCity] || [] : [];
  const cities = withCurrent(listedCities, selectedCity);
  const localities = withCurrent(listedLocalities, selectedLocality);
  const typeCity = Boolean(selectedState) && listedCities.length === 0;
  const typeLocality = Boolean(selectedCity) && listedLocalities.length === 0;

  // The three dropdowns take their value from the form (value=…) instead of
  // being left to the browser: a map search can set a place whose <option>
  // only exists after the next render, and an uncontrolled <select> would
  // keep showing "Select …" for it.
  const invalid = (name) => ({
    "aria-invalid": errors[name] ? "true" : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

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
          onRemovePin={onRemovePin}
        />
      ) : (
        <p className="map-hint">Map loads as you scroll here…</p>
      )}

      {/* Hidden coordinate fields — written by map handlers */}
      <input type="hidden" {...register("lat")} />
      <input type="hidden" {...register("lng")} />
      {/* e.g. the API's "Place the pin inside India" (FORM-10) */}
      {(errors.lat || errors.lng) && (
        <span id="lat-error" className="field-error" role="alert">
          {(errors.lat ?? errors.lng).message}
        </span>
      )}

      {/* Cascading Dropdowns */}
      <div className="form-row form-row--3col">
        <div className="form-col">
          <label htmlFor="state">
            State <span className="required">*</span>
          </label>
          <select
            id="state"
            {...register("state")}
            value={selectedState || ""}
            onChange={handleStateChange}
            {...invalid("state")}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && (
            <span id="state-error" className="field-error" role="alert">{errors.state.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="city">
            City <span className="required">*</span>
          </label>
          {typeCity ? (
            <input
              id="city"
              {...register("city")}
              type="text"
              placeholder="City or town"
              maxLength={100}
              autoComplete="address-level2"
              {...invalid("city")}
            />
          ) : (
            <select
              id="city"
              {...register("city")}
              value={selectedCity || ""}
              onChange={handleCityChange}
              disabled={!selectedState}
              {...invalid("city")}
            >
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {errors.city && (
            <span id="city-error" className="field-error" role="alert">{errors.city.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="locality">
            Locality <span className="required">*</span>
          </label>
          {typeLocality ? (
            <input
              id="locality"
              {...register("locality")}
              type="text"
              placeholder="Area or neighbourhood"
              maxLength={100}
              autoComplete="address-level3"
              {...invalid("locality")}
            />
          ) : (
            <select
              id="locality"
              {...register("locality")}
              value={selectedLocality || ""}
              disabled={!selectedCity}
              {...invalid("locality")}
            >
              <option value="">Select locality</option>
              {localities.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}
          {errors.locality && (
            <span id="locality-error" className="field-error" role="alert">{errors.locality.message}</span>
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
            autoComplete="postal-code"
            {...invalid("pincode")}
          />
          {errors.pincode && (
            <span id="pincode-error" className="field-error" role="alert">{errors.pincode.message}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="address">
            Full address <span className="required">*</span>
          </label>
          <textarea
            id="address"
            {...register("address")}
            placeholder="Filled in by the map search, or type it yourself"
            rows={3}
            maxLength={300}
            autoComplete="street-address"
            {...invalid("address")}
          />
          {errors.address && (
            <span id="address-error" className="field-error" role="alert">{errors.address.message}</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default React.memo(SellProLocationSection);
