// hooks/usePropertyForm.js
import { useRef, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { propertySchemas, defaultPropertyValues } from "../propertySchema";
import { LISTED_BY } from "../../../../constants/roles";
import { MEDIA_UPLOAD_ENABLED } from "../../../../config/features";
import { mediaPayload, videoUrlFrom } from "../../../../features/listings/media/mediaPayload";
import { listingTitleFor } from "../../../../features/listings/listingTitle";
import { INDIA_BOUNDS } from "../../../../constants/listingRules";
import { parseFloor, floorText } from "../../../../features/listings/floor";

// Count fields are stored as numbers but the radio pills are strings with a
// "+" bucket at the top, so in edit mode 3 → "3" and 6 → "5+".
const COUNT_CAPS = { bhk: 5, bathrooms: 5, balconies: 4 };

const toPillValue = (val, cap) => {
  if (val == null || val === "") return "";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return n >= cap ? `${cap}+` : String(n);
};

// Shapes Dashboard's formData (a saved property in edit mode, or the empty
// baseline) into the values the form inputs expect.
export const toFormValues = (formData = {}) => {
  const values = { ...defaultPropertyValues, ...formData };
  for (const [field, cap] of Object.entries(COUNT_CAPS)) {
    values[field] = toPillValue(values[field], cap);
  }
  // <input type="date"> only accepts YYYY-MM-DD; the API returns a full ISO string
  values.reraDate = values.reraDate ? String(values.reraDate).slice(0, 10) : "";
  // The backend treats "has a RERA number" as RERA approved, but older docs can
  // have a number with the flag false. Tick the box so saving doesn't wipe it.
  values.reraApproved = Boolean(values.reraApproved || values.reraNumber);
  // Text inputs: a saved floor -1 shows as "B1", an older numeric tower 3 as "3"
  values.floor = String(floorText(values.floor));
  values.tower = values.tower == null ? "" : String(values.tower);
  // An older listing can have the pincode saved as a number; the field is text
  values.pincode = values.pincode == null ? "" : String(values.pincode);
  if (formData.coordinates) {
    values.lat = formData.coordinates.lat;
    values.lng = formData.coordinates.lng;
  }
  // The video field shows the YouTube link stored in the listing's virtualTours
  if (MEDIA_UPLOAD_ENABLED) values.videoUrl = videoUrlFrom(formData);
  return values;
};

// A saved listing always has a coordinates object (the API stores its
// `source` by default), so only lat AND lng make a pin.
const coordinatesFrom = (formData = {}) => {
  const { lat, lng } = formData.coordinates ?? {};
  return lat != null && lng != null ? { lat, lng } : null;
};

// Mainland India plus the Andaman, Nicobar and Lakshadweep islands. A pin
// outside this box is a slip of the finger, not a listing. The API checks the
// same box (constants/listingRules.js, FORM-10).
export const isInIndia = (lat, lng) =>
  lat >= INDIA_BOUNDS.south && lat <= INDIA_BOUNDS.north &&
  lng >= INDIA_BOUNDS.west && lng <= INDIA_BOUNDS.east;

const parseCount = (val) => {
  if (val == null || val === "") return undefined;
  const n = parseInt(val, 10); // parseInt("5+") → 5, parseInt("1") → 1
  return Number.isNaN(n) ? undefined : n;
};


// RHF errors are nested ({ area: { value: {...} } }) — flatten to "area.value"
const errorPaths = (errors, prefix = "") =>
  Object.entries(errors).flatMap(([key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val?.message) return [path];
    return val && typeof val === "object" ? errorPaths(val, path) : [];
  });

// role: a LISTED_BY value; picks which fields the schema requires.
export const usePropertyForm = ({
  formData = {},
  onSubmit,
  editingId = null,
  role = LISTED_BY.DEVELOPER,
}) => {
  const autocompleteRef = useRef(null);
  const formRef = useRef(null);

  // Initialise map pin from edit-mode data if available
  const [coordinates, setCoordinates] = useState(() => coordinatesFrom(formData));

  const methods = useForm({
    resolver: zodResolver(propertySchemas[role] ?? propertySchemas[LISTED_BY.DEVELOPER]),
    defaultValues: toFormValues(formData),
    mode: "onTouched", // validate on blur, not every keystroke
  });

  const { setValue, handleSubmit, reset, clearErrors } = methods;

  // ── Re-sync when switching between add and edit ───────────────────────────
  // useForm only reads defaultValues on mount. Cancel Edit keeps this component
  // mounted, so without this the old listing stays in the fields and the next
  // submit creates a duplicate. Keyed on editingId (not formData) so a parent
  // re-render can't wipe what the user is typing.
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    reset(toFormValues(formDataRef.current));
    setCoordinates(coordinatesFrom(formDataRef.current));
  }, [editingId, reset]);

  // ── Coordinate sync: state + RHF ──────────────────────────────────────────
  const applyCoordinates = useCallback(
    (lat, lng) => {
      setCoordinates({ lat, lng });
      setValue("lat", lat, { shouldValidate: false, shouldDirty: true });
      setValue("lng", lng, { shouldValidate: false, shouldDirty: true });
      clearErrors(["lat", "lng"]); // e.g. the server's "Place the pin inside India"
    },
    [setValue, clearErrors]
  );

  // Takes the pin off the map. On a saved listing, the save then sends
  // coordinates: null so the API removes the saved pin too (FORM-10).
  const removePin = useCallback(() => {
    setCoordinates(null);
    setValue("lat", undefined, { shouldValidate: false, shouldDirty: true });
    setValue("lng", undefined, { shouldValidate: false, shouldDirty: true });
    clearErrors(["lat", "lng"]);
  }, [setValue, clearErrors]);

  // ── Pin from a whole set of values (e.g. a restored draft) ────────────────
  // reset() only updates RHF; the map pin is separate state.
  const syncCoordinates = useCallback((values = {}) => {
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    const has = values.lat !== "" && values.lat != null && values.lng !== "" && values.lng != null;
    setCoordinates(has && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
  }, []);

  // ── Address autofill from Google Places result ────────────────────────────
  const applyAddressComponents = useCallback(
    (place) => {
      const opts = { shouldValidate: true, shouldDirty: true };
      const parts = place.address_components || [];
      const find = (...types) =>
        parts.find((c) => types.some((t) => c.types.includes(t)))?.long_name;

      if (place.formatted_address) setValue("address", place.formatted_address, opts);
      if (!parts.length) return;

      // Fill every field from the new place, blanking what it doesn't give.
      // Otherwise the locality or pincode of the previous search stays behind
      // under the new city.
      const state = find("administrative_area_level_1");
      if (state) setValue("state", state, opts);
      setValue("city", find("locality", "administrative_area_level_3") || "", opts);
      setValue("locality", find("sublocality_level_1", "sublocality", "neighborhood") || "", opts);
      setValue("pincode", find("postal_code") || "", opts);
    },
    [setValue]
  );

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    // The search box can suggest places abroad; the API would refuse the pin
    if (!isInIndia(lat, lng)) {
      toast.error("Pick a place inside India.");
      return;
    }
    applyCoordinates(lat, lng);
    applyAddressComponents(place);
  }, [applyCoordinates, applyAddressComponents]);

  // ── Map click → move the pin ──────────────────────────────────────────────
  // Address autofill comes from the search box above the map. Reverse
  // geocoding on click needs a backend /api/geocode route, which isn't
  // mounted yet — add it here once it is.
  // Also used when the pin is dragged.
  const handleMapClick = useCallback(
    (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (!isInIndia(lat, lng)) {
        toast.error("Place the pin inside India.");
        return;
      }
      applyCoordinates(lat, lng);
    },
    [applyCoordinates]
  );

  // ── Submit: valid path ─────────────────────────────────────────────────────
  // Only runs when ALL Zod validations pass.
  // Transforms the Zod-validated data into the exact shape the backend expects.
  const onFormSubmit = useCallback(
    (data) => {
      // "5+" alone can't say whether the listing has 5 or 7 BHK. If the pill
      // still shows the saved value's bucket, keep the saved number.
      const countFor = (field, value) => {
        const saved = formDataRef.current?.[field];
        if (saved != null && saved !== "" && toPillValue(saved, COUNT_CAPS[field]) === value) {
          return Number(saved);
        }
        return parseCount(value);
      };

      const payload = {
        ...data,

        // ── Title: generated from the details, never typed ────────
        title: listingTitleFor(data, formDataRef.current ?? {}),

        // ── Type normalisations ──────────────────────────────────
        pincode:   String(data.pincode).trim(),
        price:     Number(data.price),
        emiStarts: data.emiStarts ? Number(data.emiStarts) : undefined,

        // ── Area: already nested from form, just clean the value ──
        // area.value "" → undefined so Mongoose skips it cleanly. type ""
        // means "not specified" and clears a saved type (FORM-07).
        area: data.area?.value
          ? { value: Number(data.area.value), unit: data.area.unit || "sqft", type: data.area.type || "" }
          : undefined,

        // ── Coordinates: only send when both values exist. A saved pin
        // the poster removed is sent as null so the API clears it. ──
        coordinates:
          data.lat && data.lng
            ? { lat: Number(data.lat), lng: Number(data.lng) }
            : coordinatesFrom(formDataRef.current ?? {})
              ? null
              : undefined,

        bhk:       countFor("bhk", data.bhk),
        bathrooms: countFor("bathrooms", data.bathrooms),
        balconies: countFor("balconies", data.balconies),

        // ── Floor: typed as text, stored as a number (B1 = -1) ──────
        floor: parseFloor(data.floor),

        // ── RERA: the backend marks a listing RERA approved whenever it has a
        // reraNumber, so unticking the box must clear the number too.
        reraNumber: data.reraApproved ? data.reraNumber : "",
        reraDate:   data.reraApproved && data.reraDate ? new Date(data.reraDate) : undefined,

        // ── Photos, brochure, video link (only while uploads are on) ──
        ...(MEDIA_UPLOAD_ENABLED ? mediaPayload(data, formDataRef.current ?? {}) : {}),

        // ── Strip RHF-only flat fields ─────────────────────────────
        lat: undefined,
        lng: undefined,
        videoUrl: undefined,
      };

      if (import.meta.env.DEV) {
        console.log("[Form] Payload sent to Dashboard:", payload);
      }

      onSubmit(payload);
    },
    [onSubmit]
  );

  // ── Submit: invalid path ───────────────────────────────────────────────────
  // RHF calls this when Zod validation FAILS. Tell the user how many fields
  // need fixing and bring the first one (in page order) into view — the pill
  // and card inputs are visually hidden, so RHF's own focus isn't visible.
  const onInvalidSubmit = useCallback((errors) => {
    const paths = errorPaths(errors);
    if (import.meta.env.DEV) {
      console.warn("[Form] Submission blocked — invalid fields:", paths);
    }
    toast.error(
      paths.length === 1
        ? "1 field needs your attention"
        : `${paths.length} fields need your attention`
    );

    const invalid = new Set(paths);
    const first = [...(formRef.current?.querySelectorAll("[name]") || [])]
      .find((el) => invalid.has(el.name));
    if (!first) return;

    const target = first.closest(".form-col, .fieldset") || first;
    target.scrollIntoView?.({ behavior: "smooth", block: "center" });
    if (first.type !== "hidden") first.focus({ preventScroll: true });
  }, []);

  // Built per submit event (not during render) — onInvalidSubmit reads formRef
  const submit = useCallback(
    (e) => handleSubmit(onFormSubmit, onInvalidSubmit)(e),
    [handleSubmit, onFormSubmit, onInvalidSubmit]
  );

  return {
    methods,
    formRef,
    handleSubmit: submit,
    autocompleteRef,
    coordinates,
    syncCoordinates,
    handlePlaceChanged,
    handleMapClick,
    removePin,
  };
};
