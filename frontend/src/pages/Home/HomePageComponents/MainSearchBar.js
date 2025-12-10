// src/components/MainSearchBar/MainSearchBar.js
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import API from "../../../api";
import ExpandableSearch from "./ExpandableSearch";
import "./MainSearchBar.css";

import PropertyTypePills from "../../Home/HomePageComponents/MainSeachBarComponets/PropertyTypePills";
import { components } from "react-select";

// ----------------------------
// CONSTANTS
// ----------------------------
const BUDGET_OPTIONS = [
  { value: "", label: "Select Budget" },
  { value: "500000", label: "Up to ₹5 Lakh" },
  { value: "1000000", label: "Up to ₹10 Lakh" },
  { value: "2000000", label: "Up to ₹20 Lakh" },
  { value: "5000000", label: "Up to ₹50 Lakh" },
  { value: "10000000", label: "Up to ₹1 Cr" },
  { value: "20000000", label: "Up to ₹2 Cr" },
  { value: "50000000", label: "Up to ₹5 Cr" }
];


// ----------------------------
// COMPONENT
// ----------------------------
const MainSearchBar = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    propertyType: "",
    budget: "",
    city: "",
    locality: ""
  });

  const [localities, setLocalities] = useState([]);
  const [localityLoading, setLocalityLoading] = useState(false);

  // ----------------------------
  // CITY FETCH (React Query)
  // ----------------------------
  const {
    data: cityData,
    isLoading: cityLoading,
    error: cityError
  } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await API.get("/api/properties/filters");
      return res.data?.cities || [];
    },
    staleTime: 1000 * 60 * 10,
    retry: 2
  });

  const cities = useMemo(() => cityData || [], [cityData]);

  // ----------------------------
  // FETCH LOCALITIES
  // ----------------------------
  const fetchLocalitiesForCity = useCallback(async (city) => {
    if (!city) return setLocalities([]);

    setLocalityLoading(true);
    try {
      const res = await API.get(
        `/api/properties/localities/${encodeURIComponent(city)}`
      );
      setLocalities(res.data.localities || []);
    } catch {
      setLocalities([]);
    } finally {
      setLocalityLoading(false);
    }
  }, []);

  // ----------------------------
// CUSTOM MENU FOR PROPERTY TYPE
// ----------------------------
const CustomPropertyTypeMenu = (props) => {
  const { selectProps } = props;

  return (
    <components.Menu {...props}>
      <PropertyTypePills
        value={selectProps.value?.value || ""}
        onChange={(val) => {
          selectProps.onChange({ value: val, label: val });
        }}
        closeMenu={selectProps.onMenuClose}
      />
    </components.Menu>
  );
};


  // ----------------------------
  // HANDLERS
  // ----------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (option) => {
    const city = option?.value || "";
    setFilters((prev) => ({ ...prev, city, locality: "" }));
    fetchLocalitiesForCity(city);
  };

  const handlePropertyTypeChange = (option) => {
    setFilters((prev) => ({
      ...prev,
      propertyType: option?.value || ""
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!filters.city) {
      alert("Please select a city before searching.");
      return;
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    navigate(`/properties?${queryParams.toString()}`);
  };

  const isLoading = cityLoading || localityLoading;

  if (cityError) {
    return (
      <div className="error-message">
        Failed to load search options. Please try refreshing the page.
      </div>
    );
  }

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="mainsearch-bar">

      <form className="main-search-container-section" onSubmit={handleSearch}>
        <div className="main-search-container">

          {/* CITY */}
          <div className="search-field">
            <Select
              placeholder="Select City"
              isClearable
              isSearchable
              className="dropdown-main"
              value={filters.city ? { value: filters.city, label: filters.city } : null}
              onChange={handleCityChange}
              options={cities.map((c) => ({ value: c, label: c }))}
              isDisabled={cityLoading}
            />
          </div>

          {/* LOCALITY */}
          <div className="search-field">
            <select
              id="locality"
              name="locality"
              className="dropdown-main"
              value={filters.locality}
              onChange={handleInputChange}
              disabled={!filters.city || localityLoading}
            >
              <option value="">
                {!filters.city
                  ? "Select City First"
                  : localityLoading
                  ? "Loading..."
                  : localities.length === 0
                  ? "No Localities"
                  : "Select Locality"}
              </option>

              {localities.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* PROPERTY TYPE */}
          <div className="search-field-type">
            <Select
  classNamePrefix="msb"
  placeholder="Property Type"
  value={
    filters.propertyType
      ? { value: filters.propertyType, label: filters.propertyType }
      : null
  }
  onChange={handlePropertyTypeChange}
  components={{ Menu: CustomPropertyTypeMenu }}   // 👈 MAGIC LINE
  isSearchable={false}
  menuShouldScrollIntoView={false}
  menuPosition="fixed"
  // menuPlacement="auto"
/>

          </div>

          {/* BUDGET */}
          <div className="search-field">
            <select
              id="budget"
              name="budget"
              className="dropdown-main"
              value={filters.budget}
              onChange={handleInputChange}
            >
              {BUDGET_OPTIONS.map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH BUTTON */}
          <button className="mainsearch-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Compare →"}
          </button>
        </div>
      </form>

      <div className="expandable-search-wrapper">
        <ExpandableSearch />
      </div>

    </div>
  );
};

export default MainSearchBar;
