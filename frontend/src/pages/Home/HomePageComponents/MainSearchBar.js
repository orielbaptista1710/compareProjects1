// src/components/MainSearchBar/MainSearchBar.js
import React, { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MainSearchBar.css";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import API from "../../../api";
import ExpandableSearch from "./ExpandableSearch";

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
  const [error, setError] = useState(null);

  // 🧠 Cached fetch using React Query
  const { data: cityData, isLoading: cityLoading, error: cityError } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await API.get("/api/properties/filters");
      return res.data?.cities || [];
    },
    staleTime: 1000 * 60 * 10, // cache for 10 mins
    retry: 2
  });

  // 🧭 Derived city list
  const cities = useMemo(() => cityData || [], [cityData]);

  // 🏦 Fetch localities (on-demand, not auto-run)
  const fetchLocalitiesForCity = useCallback(async (city) => {
    if (!city) {
      setLocalities([]);
      return;
    }
    setLocalityLoading(true);
    try {
      const res = await API.get(`/api/properties/localities/${encodeURIComponent(city)}`);
      setLocalities(res.data.localities || []);
    } catch (err) {
      console.error("Failed to fetch localities:", err);
      setLocalities([]);
    } finally {
      setLocalityLoading(false);
    }
  }, []);

  // 🧩 Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCityChange = useCallback(
    (selectedOption) => {
      const city = selectedOption?.value || "";
      setFilters((prev) => ({ ...prev, city, locality: "" }));
      fetchLocalitiesForCity(city);
    },
    [fetchLocalitiesForCity]
  );

  const handlePropertyTypeChange = useCallback((selectedOption) => {
    setFilters((prev) => ({
      ...prev,
      propertyType: selectedOption?.value || ""
    }));
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      if (!filters.city) {
        alert("Please select a city before searching.");
        return;
      }
      navigate(`/properties?${queryParams.toString()}`);
    },
    [filters, navigate]
  );

  // 💰 Memoized budgets & property types
  const budgetOptions = useMemo(
    () => [
      { value: "", label: "Select Budget" },
      { value: "500000", label: "Up to ₹5 Lakh" },
      { value: "1000000", label: "Up to ₹10 Lakh" },
      { value: "2000000", label: "Up to ₹20 Lakh" },
      { value: "5000000", label: "Up to ₹50 Lakh" },
      { value: "10000000", label: "Up to ₹1 Cr" },
      { value: "20000000", label: "Up to ₹2 Cr" },
      { value: "50000000", label: "Up to ₹5 Cr" }
    ],
    []
  );

  const propertyTypes = useMemo(
    () => [
      {
        label: "Residential",
        options: [
          { value: "Flats/Apartments", label: "Flats/Apartments" },
          { value: "Villa", label: "Villa" },
          { value: "Plot", label: "Plot" }
        ]
      },
      {
        label: "Commercial",
        options: [
          { value: "Shop/Showroom", label: "Shop/Showroom" },
          { value: "Industrial Warehouse", label: "Industrial Warehouse" },
          { value: "Retail", label: "Retail" }
        ]
      }
    ],
    []
  );

  const isLoading = cityLoading || localityLoading;

  if (cityError) {
    return (
      <div className="error-message">
        Failed to load cities. Please refresh or try again later.
      </div>
    );
  }

  return (
    <div className="mainsearch-bar">
      

      {error && <div className="error-message">{error}</div>}

      <form className="main-search-container-section" onSubmit={handleSearch}>
        <div className="main-search-container">
          {/* City Selector */}
          <div className="search-field">
            <Select
              placeholder="Select City"
              isClearable
              isSearchable
              value={filters.city ? { value: filters.city, label: filters.city } : null}
              onChange={handleCityChange}
              options={cities.map((c) => ({ value: c, label: c }))}
              isDisabled={cityLoading}
            />
          </div>

          {/* Locality Selector */}
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
              {localities.map((locality, idx) => (
                <option key={idx} value={locality}>
                  {locality}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type */}
          <div className="search-field-type">
            <Select
              placeholder="Property Type"
              isClearable
              value={filters.propertyType ? { value: filters.propertyType, label: filters.propertyType } : null}
              onChange={handlePropertyTypeChange}
              options={propertyTypes}
            />
          </div>

          {/* Budget */}
          <div className="search-field">
            <select
              id="budget"
              name="budget"
              className="dropdown-main"
              value={filters.budget}
              onChange={handleInputChange}
            >
              {budgetOptions.map((opt, idx) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
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
