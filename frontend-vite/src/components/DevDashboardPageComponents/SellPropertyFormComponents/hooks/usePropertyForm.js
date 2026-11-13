// hooks/usePropertyForm.js
import { useRef, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { propertySchema, defaultPropertyValues } from "../propertySchema";

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
const toFormValues = (formData = {}) => {
  const values = { ...defaultPropertyValues, ...formData };
  for (const [field, cap] of Object.entries(COUNT_CAPS)) {
    values[field] = toPillValue(values[field], cap);
  }
  // <input type="date"> only accepts YYYY-MM-DD; the API returns a full ISO string
  values.reraDate = values.reraDate ? String(values.reraDate).slice(0, 10) : "";
  // The backend treats "has a RERA number" as RERA approved, but older docs can
  // have a number with the flag false. Tick the box so saving doesn't wipe it.
  values.reraApproved = Boolean(values.reraApproved || values.reraNumber);
  if (formData.coordinates) {
    values.lat = formData.coordinates.lat;
    values.lng = formData.coordinates.lng;
  }
  return values;
};

const coordinatesFrom = (formData = {}) =>
  formData.coordinates
    ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng }
    : null;

const parseCount = (val) => {
  if (val == null || val === "") return undefined;
  const n = parseInt(val, 10); // parseInt("5+") → 5, parseInt("1") → 1
  return Number.isNaN(n) ? undefined : n;
};

// "5th Floor" → 5, "Ground" → 0, anything else unparseable → undefined
const parseFloor = (val) => {
  if (!val) return undefined;
  if (/^\s*ground/i.test(val)) return 0;
  return parseCount(val);
};

// RHF errors are nested ({ area: { value: {...} } }) — flatten to "area.value"
const errorPaths = (errors, prefix = "") =>
  Object.entries(errors).flatMap(([key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (val?.message) return [path];
    return val && typeof val === "object" ? errorPaths(val, path) : [];
  });

export const usePropertyForm = ({ formData = {}, onSubmit, editingId = null }) => {
  const autocompleteRef = useRef(null);
  const formRef = useRef(null);

  // Initialise map pin from edit-mode data if available
  const [coordinates, setCoordinates] = useState(() => coordinatesFrom(formData));

  const methods = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: toFormValues(formData),
    mode: "onTouched", // validate on blur, not every keystroke
  });

  const { setValue, handleSubmit, reset } = methods;

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
      setValue("lat", lat, { shouldValidate: false });
      setValue("lng", lng, { shouldValidate: false });
    },
    [setValue]
  );

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
    if (!place?.geometry?.location) return;
    applyCoordinates(place.geometry.location.lat(), place.geometry.location.lng());
    applyAddressComponents(place);
  }, [applyCoordinates, applyAddressComponents]);

  // ── Map click → move the pin ──────────────────────────────────────────────
  // Address autofill comes from the search box above the map. Reverse
  // geocoding on click needs a backend /api/geocode route, which isn't
  // mounted yet — add it here once it is.
  const handleMapClick = useCallback(
    (e) => applyCoordinates(e.latLng.lat(), e.latLng.lng()),
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

        bhk:       countFor("bhk", data.bhk),
        bathrooms: countFor("bathrooms", data.bathrooms),
        balconies: countFor("balconies", data.balconies),

        // ── Floor: Mongoose field is Number, form is text ──────────
        floor: parseFloor(data.floor),

        // ── RERA: the backend marks a listing RERA approved whenever it has a
        // reraNumber, so unticking the box must clear the number too.
        reraNumber: data.reraApproved ? data.reraNumber : "",
        reraDate:   data.reraApproved && data.reraDate ? new Date(data.reraDate) : undefined,

        // ── Strip RHF-only flat fields ─────────────────────────────
        lat: undefined,
        lng: undefined,
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
  };
};
