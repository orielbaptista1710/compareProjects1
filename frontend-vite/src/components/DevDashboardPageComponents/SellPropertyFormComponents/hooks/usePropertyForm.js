// hooks/usePropertyForm.js
import { useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useJsApiLoader } from "@react-google-maps/api";
import { propertySchema, defaultPropertyValues } from "../propertySchema";

// Must be outside the hook — stable reference prevents Maps SDK re-init on every render
const MAPS_LIBRARIES = ["places"];

export const usePropertyForm = ({ formData = {}, onSubmit }) => {
  const autocompleteRef = useRef(null);

  // Initialise map pin from edit-mode data if available
  const [coordinates, setCoordinates] = useState(
    formData.coordinates
      ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng }
      : null
  );
  const [geocodeError, setGeocodeError] = useState(null);
  const [isGeocoding,  setIsGeocoding]  = useState(false);

  // ── Form init ──────────────────────────────────────────────────────────────
  // defaultValues merges our baseline + any edit-mode data from Dashboard.
  // IMPORTANT: formData comes from normalizePropertyData() which uses initialFormData
  // as its base — both use nested area: { value, unit } shape.
  const methods = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: { ...defaultPropertyValues, ...formData },
    mode: "onTouched", // validate on blur, not every keystroke
  });

  const { setValue, handleSubmit } = methods;

  // ── Maps SDK ───────────────────────────────────────────────────────────────
  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });

  // ── Coordinate sync: state + RHF ──────────────────────────────────────────
  const applyCoordinates = useCallback(
    (lat, lng) => {
      setCoordinates({ lat, lng });
      setValue("lat", lat, { shouldValidate: false });
      setValue("lng", lng, { shouldValidate: false });
    },
    [setValue]
  );

  // ── Address autofill from Google Places result ────────────────────────────
  const applyAddressComponents = useCallback(
    (place) => {
      if (place.formatted_address) {
        setValue("address", place.formatted_address, { shouldValidate: true });
      }
      for (const c of place.address_components || []) {
        if (c.types.includes("locality"))
          setValue("city", c.long_name, { shouldValidate: true });
        if (c.types.includes("administrative_area_level_1"))
          setValue("state", c.long_name, { shouldValidate: true });
        if (c.types.includes("postal_code"))
          setValue("pincode", c.long_name, { shouldValidate: true });
        if (
          c.types.includes("sublocality_level_1") ||
          c.types.includes("sublocality") ||
          c.types.includes("neighborhood")
        )
          setValue("locality", c.long_name, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) {
      console.warn("[Maps] No geometry for selected place");
      return;
    }
    applyCoordinates(place.geometry.location.lat(), place.geometry.location.lng());
    applyAddressComponents(place);
  }, [applyCoordinates, applyAddressComponents]);

  // ── Map click → reverse geocode via backend proxy ─────────────────────────
  // Backend route needed: GET /api/geocode/reverse?lat=XX&lng=YY
  // Returns: { place: { formatted_address, address_components } }
  const handleMapClick = useCallback(
    async (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      applyCoordinates(lat, lng);
      setIsGeocoding(true);
      setGeocodeError(null);
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Geocode request failed");
        const data = await res.json();
        if (data.place) applyAddressComponents(data.place);
      } catch (err) {
        console.error("[Geocode]", err);
        setGeocodeError("Could not auto-fill address. Please fill manually.");
      } finally {
        setIsGeocoding(false);
      }
    },
    [applyCoordinates, applyAddressComponents]
  );


  const parseCount = (val) => {
          if (val == null || val === '') return undefined;
          const n = parseInt(val, 10);  // parseInt("5+") → 5, parseInt("1") → 1
          return isNaN(n) ? undefined : n;
        };

  

  // ── Submit: valid path ─────────────────────────────────────────────────────
  // Only runs when ALL Zod validations pass.
  // Transforms the Zod-validated data into the exact shape the backend expects.
  const onFormSubmit = useCallback(
    (data) => {
      if (import.meta.env.DEV) {
        console.log("[Form] Yass Zod passed — raw validated data:", data);
      }
 
      const payload = {
        ...data,

        // ── Type normalisations ──────────────────────────────────
        pincode:   String(data.pincode).trim(),
        price:     Number(data.price),
        emiStarts: data.emiStarts ? Number(data.emiStarts) : undefined,

        // ── Area: already nested from form, just clean the value ──
        // area.value "" → undefined so Mongoose skips it cleanly
        area: data.area?.value
          ? { value: Number(data.area.value), unit: data.area.unit || "sqft" }
          : undefined,

        // ── Coordinates: only send when both values exist ──────────
        coordinates:
          data.lat && data.lng
            ? { lat: Number(data.lat), lng: Number(data.lng) }
            : undefined,

        // bhk:        data.bhk        ? Number(data.bhk)        : undefined,
        // bathrooms:  data.bathrooms  ? Number(data.bathrooms)  : undefined,
        // balconies:  data.balconies != null ? Number(data.balconies) : undefined,

        bhk:       parseCount(data.bhk),
        bathrooms: parseCount(data.bathrooms),
        balconies: parseCount(data.balconies),



        // ── Floor: Mongoose field is Number, form is text ──────────
        // Try to parse a number from the string. "5th Floor" → 5. "Ground" → undefined.
        floor: data.floor
          ? parseInt(data.floor, 10) || undefined
          : undefined,

        // ── Parkings: Mongoose field is String (single value) ──────
        // Schema has parkings: { type: String } not [String].
        // If user selected multiple, join them. Single → use as-is.
        // TODO: change Mongoose parkings to [String] to properly support multi-select.
        parkings: Array.isArray(data.parkings) && data.parkings.length
          ? data.parkings.join(", ")
          : undefined,

        // ── reraDate: empty string or null → undefined ─────────────
        reraDate: data.reraDate 
          ? new Date(data.reraDate)
          : undefined,


        // ── Arrays: ensure always arrays ───────────────────────────
        amenities:  Array.isArray(data.amenities)  ? data.amenities  : [],
        facilities: Array.isArray(data.facilities) ? data.facilities : [],
        security:   Array.isArray(data.security)   ? data.security   : [],

        // ── Strip RHF-only flat fields ─────────────────────────────
        lat: undefined,
        lng: undefined,

      };

      // WHAT DOES THIS DO???
      if (import.meta.env.DEV) { 
        console.log("[Form]  Payload sent to Dashboard:", payload);
      }

      onSubmit(payload);
    },
    [onSubmit]
  );

  // ── Submit: invalid path ───────────────────────────────────────────────────
  // RHF calls this when Zod validation FAILS.
  // Logs every blocking field so you can diagnose silently-failing submissions.
  const onInvalidSubmit = useCallback((errors) => {
    console.group("[Form] ❌ Submission blocked — validation errors:");
    const flatten = (obj, prefix = "") => {
      Object.entries(obj).forEach(([key, val]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val?.message) {
          console.error(`  ${path}: ${val.message}`);
        } else if (typeof val === "object" && val !== null) {
          flatten(val, path);
        }
      });
    };
    flatten(errors);
    console.groupEnd();
  }, []);

  return {
    methods,
    handleSubmit: handleSubmit(onFormSubmit, onInvalidSubmit),
    isMapsLoaded,
    mapsLoadError,
    autocompleteRef,
    coordinates,
    handlePlaceChanged,
    handleMapClick,
    isGeocoding,
    geocodeError,
  };
};