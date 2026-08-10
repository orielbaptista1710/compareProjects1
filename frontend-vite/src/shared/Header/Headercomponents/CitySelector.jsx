//frontend-vite/src/shared/Header/Headercomponents/CitySelector.jsx
import { useState, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Search, MapPin, ChevronDown } from "lucide-react";
import { TOP_SELECTOR_CITIES } from "../../../database/citySelectorData";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { useCity } from "../../../contexts/CityContext";
import "./CitySelector.css";

/**
 * CitySelector component allows users to select a city from a dropdown list,
 * search through cities, detect their location, or reset the selection.
 * It updates the URL parameters when a city is selected on the properties page.
 */
 export default function CitySelector() {
  const navigate = useNavigate();
  const location = useLocation();

  // State for dropdown visibility and search input
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Context for managing selected city
  const { city, setCity } = useCity();

  // Close dropdown on outside click
  useOutsideClick(open, [wrapperRef], () => setOpen(false));

  /**
   * Centralized city selection handler
   */
  const handleSelectCity = useCallback((selectedCity) => {
    setCity(selectedCity);      // still update context (for non-Properties pages)
    setOpen(false);
    setSearch("");

    // If already on /properties, push city into URL so the page reacts immediately
    if (location.pathname === "/properties") {
      const params = new URLSearchParams(location.search);
      if (selectedCity) {
        params.set("city", selectedCity);
      } else {
        params.delete("city");
      }
      params.delete("locality"); // stale locality from old city
      navigate(`/properties?${params.toString()}`, { replace: true });
    }
  }, [setCity, navigate, location]);

  /**
   * Reset city selection
   */
  const handleResetCity = useCallback(() => {
    handleSelectCity(null);
  }, [handleSelectCity]);

  /**
   * Detect user location (placeholder)
   */
  const detectLocation = useCallback(() => {
    // TODO: replace with real geolocation + reverse geocoding
    const detectedCity = "Mumbai";
    handleSelectCity(detectedCity);
  }, [handleSelectCity]);

  /**
   * Filter cities based on search
   */
  const filteredCities = useMemo(() => {
    if (!search.trim()) return TOP_SELECTOR_CITIES;

    return TOP_SELECTOR_CITIES.filter(({ name }) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="city-wrapper" ref={wrapperRef}>
      {/* Trigger */}
      <button
        className="city-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {city || "City"} <ChevronDown size={14} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="city-dropdown" role="listbox">
          {/* Search */}
          <div className="city-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Select or type your city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="city-actions">
            <button className="detect-btn" onClick={detectLocation}>
              <MapPin size={16} />
              Detect my location
            </button>

            {city && (
              <button className="reset-btn" onClick={handleResetCity}>
                Reset City
              </button>
            )}
          </div>

          {/* Cities */}
          <p className="city-title">Top Cities</p>

          <div className="city-grid">
            {filteredCities.length === 0 ? (
              <p className="no-cities">No cities found</p>
            ) : (
              filteredCities.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className="city-item"
                  onClick={() => handleSelectCity(name)}
                  role="option"
                  aria-selected={city === name}
                >
                  <div className="city-icon">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <span>{name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
