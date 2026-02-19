// src/components/MainSearchBar/LocationSearchBar.js
import React, { useState, useEffect, useRef,useCallback, useMemo } from "react";
import { MapPin } from "lucide-react";
import debounce from "lodash.debounce";
import API from "../../../api";
import { useCity } from "../../../contexts/CityContext";
import "./LocationSearchBar.css";

const LocationSearchBar = ({ onSelect }) => {
  const { city } = useCity();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("suggest"); 

  const ref = useRef(null);
  const hasSuggested = useRef(false);


  /* ---------------- Fetch Suggestions / Search ---------------- */

  const fetchLocations = useCallback(async ({ q, mode }) => {
  try {
    const res = await API.get("/api/properties/location-options", {
      params: { q: mode === "search" ? q : undefined, city, mode },
    });
    setResults(res.data || []);
  } catch (err) {
    setResults([]);
  }
}, [city]);

  const debouncedSearch = useMemo(
  () =>
    debounce((value) => {
      fetchLocations({ q: value, mode: "search" });
    }, 300),
  [fetchLocations]  
);

  // Cleanup both on unmount AND city change
useEffect(() => {
  return () => {
    debouncedSearch.cancel();
  };
}, [debouncedSearch, city]); 

  useEffect(() => {
  setQuery("");
  setResults([]);
}, [city]);


  /* ---------------- Handlers ---------------- */

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 2) {
      setMode("search");
      debouncedSearch(value);
    } else {
      setMode("suggest");
      fetchLocations({ mode: "suggest" });
    }

    setOpen(true);
  };

  const handleFocus = () => {
  setOpen(true);
  setMode("suggest");

  if (!hasSuggested.current) {
    fetchLocations({ mode: "suggest" });
    hasSuggested.current = true;
  }
};

  const handleSelect = (item) => {
    setQuery(item.label);
    setOpen(false);
    onSelect(item);
  };

  /* ---------------- Outside Click ---------------- */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  /* ---------------- Render ---------------- */

  return (
    <div className="location-search" ref={ref}>
      <MapPin size={16} />

      <input
        placeholder={
          city ? `Search in ${city}` : "Enter location to search"
        }
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
      />

      {open && results.length > 0 && (
        <div className="location-dropdown">
          {results.map((item, i) => (
            <button
              key={i}
              type="button"
              className="location-item"
              onClick={() => handleSelect(item)}
            >
              <strong>{item.label.split(",")[0]}</strong>
              {item.label.includes(",") && (
                <span>{item.label.split(",")[1]}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;
