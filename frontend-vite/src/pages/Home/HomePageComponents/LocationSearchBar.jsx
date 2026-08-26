//frontend/src/pages/Home/HomePageComponents/LocationSearchBar.jsx
//LocationSearchBar is used in Home page on MainSearchBar

import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import debounce from "lodash.debounce";
import API from "../../../api";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { useCity } from "../../../contexts/CityContext";
import "./LocationSearchBar.css";

const LocationSearchBar = ({ onSelect }) => {
  const { city } = useCity();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [prevCity, setPrevCity] = useState(city);

  const debouncedUpdate = useMemo(
    () =>
      debounce((value) => {
        setDebouncedQuery(value);
      }, 300),
    []
  );

  useEffect(() => {
    return () => debouncedUpdate.cancel();
  }, [debouncedUpdate]);

  /* ---------------- Reset on City Change (render-time adjustment) ----------------
     Replaces useEffect(() => { setQuery(""); setDebouncedQuery(""); }, [city]).
     Tracking prevCity in state (not a ref) lets us safely branch during render —
     refs can't be read/written at this point, only state can be adjusted here. */
  if (city !== prevCity) {
    setPrevCity(city);
    setQuery("");
    setDebouncedQuery("");
    debouncedUpdate.cancel(); // also cancel any in-flight debounce from the old city
  }

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedUpdate(value);
    setOpen(true);
  };

  /* ---------------- React Query ---------------- */

  const { data = [], isFetching } = useQuery({
    queryKey: ["location-options", debouncedQuery, city],
    queryFn: async ({ signal }) => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const res = await API.get("/api/properties/location-options", {
        params: { q: debouncedQuery, city },
        signal, // forward React Query's abort signal so stale requests are cancelled
      });

      return Array.from(
        new Map(
          (res.data || []).map((item) => [item.label.toLowerCase(), item])
        ).values()
      );
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  /* ---------------- Select ---------------- */

  const handleSelect = (item) => {
    setQuery(item.label);
    setOpen(false);
    onSelect(item);
  };

  /* ---------------- Outside Click ---------------- */

  useOutsideClick(open, [ref], () => setOpen(false));

  /* ---------------- Render ---------------- */

  return (
    <div className="location-search" ref={ref}>
      <MapPin size={16} />

      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="location-listbox"
        aria-autocomplete="list"
        placeholder={city ? `Search in ${city}` : "Enter location"}
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
      />

      {open && debouncedQuery.length >= 2 && (
        <div id="location-listbox" role="listbox" className="location-dropdown">
          {isFetching && <div className="location-loading">Searching...</div>}

          {!isFetching && data.length === 0 && (
            <div className="location-no-results">No locations found</div>
          )}

          {!isFetching &&
            data.map((item) => (
              <button
                key={`${item.city}-${item.locality}`}
                type="button"
                role="option"
                aria-selected={query === item.label}
                className="location-item"
                onClick={() => handleSelect(item)}
              >
                <strong>{item.label.split(",")[0]}</strong>
                {item.label.includes(",") && <span>{item.label.split(",")[1]}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;