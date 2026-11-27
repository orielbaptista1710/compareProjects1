// sections/SellProLocationSection.jsx
// Google Maps autocomplete + map pin + cascading state/city/locality dropdowns.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import locationData from "../../../../database/locationData";
import { placePicksLeft, spendPlacePick, takeMapLoad } from "./mapsBudget";

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
  // Clicking a landmark icon opens Google's place card, which is a billed
  // Place Details lookup. Clicks should only move our pin.
  clickableIcons: false,
};
// `fields` is the cost control: without it Google bills every data category
// (contact, reviews, photos…) for each place picked. We only read these three.
const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: "in" },
  fields: ["address_components", "geometry", "formatted_address"],
};
const SEARCH_MAX_LENGTH = 120;
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

  // Address searches are billed per pick; after the tab's allowance the box
  // is replaced by a plain note and the address fields below still work.
  const [searchOpen, setSearchOpen] = useState(() => placePicksLeft() > 0);
  const handlePlaceChanged = () => {
    onPlaceChanged();
    // Only a pick that produced a place counts (a bare Enter does not)
    if (autocompleteRef.current?.getPlace?.()?.geometry && spendPlacePick() <= 0) setSearchOpen(false);
  };

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
          {searchOpen ? (
            <Autocomplete
              onLoad={(ref) => (autocompleteRef.current = ref)}
              onPlaceChanged={handlePlaceChanged}
              options={AUTOCOMPLETE_OPTIONS}
            >
              <input
                id="maps-search"
                type="search"
                placeholder="Type the address, project or locality…"
                className="maps-search-input"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
                // Enter must not submit the whole listing form from this box
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </Autocomplete>
          ) : (
            <p className="map-hint" id="maps-search">
              Address search is paused for now. Fill in the fields below, or click the map to pin
              the location.
            </p>
          )}
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
  lockedFields = [], // approved listing: the filled-in state/city/locality/pincode/address/pin can't change (the API refuses it too)
  mapOnClick = false, // editing: the map (billed) loads only when the lister asks for it
}) => {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  // ── Defer the Maps SDK until the section is near the viewport ──────────────
  // "waiting" → "show" (the map is on screen and counted) or "limited" (this
  // tab used up its map allowance, see mapsBudget.js). A locked listing never
  // needs the map, so it is never loaded or billed.
  // A map search rewrites state, city, locality and pincode together, so the
  // map is off as soon as any of the fields is locked.
  const locked = lockedFields.length > 0;
  const isLocked = (name) => lockedFields.includes(name);
  const sectionRef = useRef(null);
  const [mapState, setMapState] = useState(() =>
    typeof IntersectionObserver === "undefined" && !mapOnClick
      ? (takeMapLoad() ? "show" : "limited")
      : "waiting"
  );
  // The map is counted when it is shown, never just for opening the card
  const showMap = () => setMapState(takeMapLoad() ? "show" : "limited");
  useEffect(() => {
    if (locked || mapOnClick || mapState !== "waiting" || !sectionRef.current) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMapState(takeMapLoad() ? "show" : "limited");
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [locked, mapOnClick, mapState]);

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

  // readOnly (not disabled): a disabled input can drop out of the submitted values
  const lockedInput = (name) => (
    <input id={name} {...register(name)} type="text" readOnly aria-readonly="true" {...invalid(name)} />
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

      {locked ? (
        <p className="map-hint">
          The location and address are fixed once a listing is approved, so the map is not shown.
          Fields that were left empty can still be filled in. For a different property, post a
          new listing.
        </p>
      ) : mapState === "show" ? (
        <MapPicker
          autocompleteRef={autocompleteRef}
          coordinates={coordinates}
          onPlaceChanged={onPlaceChanged}
          onMapClick={onMapClick}
          onRemovePin={onRemovePin}
        />
      ) : mapState === "limited" ? (
        <p className="map-hint">
          The map has been opened several times in this session. Reload the page to use it again,
          or fill in the address fields below.
        </p>
      ) : mapOnClick ? (
        <div className="map-hint">
          <p>Your saved pin is kept. Open the map only if you need to move it.</p>
          <button type="button" className="spf-btn" onClick={showMap}>Show map</button>
        </div>
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
          {isLocked("state") ? (
            lockedInput("state")
          ) : (
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
          )}
          {errors.state && (
            <span id="state-error" className="field-error" role="alert">{errors.state.message}</span>
          )}
        </div>

        <div className="form-col">
          <label htmlFor="city">
            City <span className="required">*</span>
          </label>
          {isLocked("city") ? (
            lockedInput("city")
          ) : typeCity ? (
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
          {isLocked("locality") ? (
            lockedInput("locality")
          ) : typeLocality ? (
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
            readOnly={isLocked("pincode")}
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
            readOnly={isLocked("address")}
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
