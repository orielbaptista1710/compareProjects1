// src/pages/Home/HeroSearch/MainSearchBar.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react"; // add Search
import ExpandableSearch from "../ExpandableSearch/ExpandableSearch";
import LocationSearchBar from "../LocationSearchBar/LocationSearchBar";
import PropertyTypePills from "../PropertyTypePills/PropertyTypePills";
import { useCity } from "../../../contexts/CityContext";
import "./MainSearchBar.css";

const buildQueryString = (params) => {
  const qs = new URLSearchParams(); 
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => v && qs.append(key, v));
    } else if (String(value).trim() !== "") {
      qs.set(key, value);
    }
  });
  return qs.toString();
};

export default function MainSearchBar() {
  const navigate = useNavigate();
  const { setCity } = useCity();

  const [location, setLocation] = useState(null);
  const [pillFilters, setPillFilters] = useState({});

  const handlePillChange = useCallback((target, values) => {
    setPillFilters((prev) => ({ ...prev, [target]: values }));
  }, []);

  const handleSearch = useCallback(() => {
    const params = { ...pillFilters };

    if (location?.type === "city") {
      params.city = location.city;
    } else if (location?.type === "locality" || location?.type === "locality-group") {
      params.city = location.city;
      params.locality = location.localities;
    } else if (location?.type === "text" && location.label.trim()) {
      params.search = location.label.trim();
    }

    if (params.city) setCity(params.city);
    navigate(`/properties?${buildQueryString(params)}`);
  }, [location, pillFilters, navigate, setCity]);

  return (
    <div className="mainsearch-bar">
      

      {/* Structured search — builds a /properties listing query. */}
      <div className="main-search-container-section">
        <div className="main-search-container">
          <div className="search-field">
            <LocationSearchBar onSelect={setLocation} />
          </div>

          <span className="search-divider" />

          <div className="search-field-type">
            <PropertyTypePills valueMap={pillFilters} onChange={handlePillChange} />
          </div>

          <button type="button" className="mainsearch-btn" onClick={handleSearch}>
            <Search size={18} />
            Search
          </button>
        </div>
      </div>

      {/* Quick lookup — finds a specific property/project by name and
          navigates straight to it. Independent of the filter bar below. */}
      <ExpandableSearch />
    </div>
  );
}