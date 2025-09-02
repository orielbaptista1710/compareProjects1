import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
import "./MainSearchBar.css";
import Select from "react-select";
import API from "../api";
import ExpandableSearch from "./ExpandableSearch";

const MainSearchBar = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    propertyType: "",
    budget: "",
    city: "",
    locality: ""
  });

  const [cities, setCities] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const budgetOptions = useMemo(() => [
    { value: "", label: "Select Budget" },
    { value: "500000", label: "Up to ₹5 Lakh" },
    { value: "1000000", label: "Up to ₹10 Lakh" },
    { value: "2000000", label: "Up to ₹20 Lakh" },
    { value: "5000000", label: "Up to ₹50 Lakh" },
    { value: "10000000", label: "Up to ₹1 Cr" },
    { value: "20000000", label: "Up to ₹2 Cr" },
    { value: "50000000", label: "Up to ₹5 Cr" }
  ], []);

  const propertyTypeStyles = {
  control: (base) => ({
    ...base,
    maxHeight: 58,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '4px 8px',
    boxShadow: 'none',
    textAlign: 'left', // Left-align text
    '&:hover': {
      borderColor: '#cbd5e0'
    }
  }),
  menu: (base) => ({
    ...base,
    width: 480,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'left',
    overflow: 'hidden' 

  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
    overflow: 'visible !important', // Disables scrolling
    maxHeight: 'none !important' // Removes height limit
  }),
  group: (base) => ({
    ...base,
    padding: 0,
    marginBottom: '20px',
    '&:last-child': {
      marginBottom: '0'
    }
  }),
  groupHeading: (base) => ({
    ...base,
    color: '#2d3748',
    fontWeight: 600,
    fontSize: '15px',
    marginBottom: '12px',
    padding: 0,
    textTransform: 'none'
  }),
  option: (base, { isSelected }) => ({
    ...base,
    display: 'inline-block',
    padding: '8px 16px',
    margin: '0 8px 8px 0',
    borderRadius: '4px',
    background: isSelected ? '#D90429' : 'white',
    border: isSelected ? '1px solid #D90429' : '1px solid #e2e8f0',
    color: isSelected ? 'white' : '#2d3748',
    fontSize: '14px',
    lineHeight: '1.4',
    '&:hover': {
      background: isSelected ? '#D90429' : '#f8fafc'
    }
  }),
  indicatorsContainer: () => ({
    display: 'none'
  })
};

  const propertyTypes = useMemo(() => [
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
  ], []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const res = await API.get("/api/properties/filters");
        setCities(res.data?.cities || []);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  const fetchLocalitiesForCity = async (city) => {
    try {
      setIsLoading(true);
      const res = await API.get(`/api/properties/localities/${encodeURIComponent(city)}`);
      setLocalities(res.data.localities || []);
    } catch (err) {
      console.error("Failed to fetch localities:", err);
      setLocalities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    navigate(`/properties?${queryParams.toString()}`);
  };

  return (
    <div className="mainsearch-bar">
      <header className="search-header">
        <h1 className="search-title">Find Your Perfect Property Match</h1>
        <p className="search-subtitle">
          Discover properties tailored to your preferences
        </p>
      </header>

      <form className="main-search-container-section" onSubmit={handleSearch}>
        <div className="main-search-container">

          {/* City */}
          <div className="search-field">
            <label htmlFor="city" className="sr-only">City</label>
            <Select
              id="city"
              name="city"
              classNamePrefix="react-select"
              placeholder="Select City"
              isClearable
              isSearchable
              value={
                filters.city
                  ? { value: filters.city, label: filters.city }
                  : null
              }
              onChange={(selectedOption) => {
                const city = selectedOption?.value || "";
                setFilters((prev) => ({
                  ...prev,
                  city,
                  locality: ""
                }));
                if (city) {
                  fetchLocalitiesForCity(city);
                } else {
                  setLocalities([]);
                }
              }}
              options={cities.map((city) => ({ value: city, label: city }))}
              isDisabled={isLoading}
            />
          </div>

          {/* Locality */}
          <div className="search-field">
            <label htmlFor="locality" className="sr-only">Locality</label>
            <select
              id="locality"
              name="locality"
              className="dropdown-main"
              value={filters.locality}
              onChange={handleInputChange}
              disabled={!filters.city || isLoading}
            >
              <option value="">
                {!filters.city
                  ? "Select City First"
                  : localities.length === 0
                    ? "No Localities Available"
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
  <label htmlFor="propertyType" className="sr-only">Property Type</label>
  <Select
    id="propertyType"
    name="propertyType"
    placeholder="Property Type"
    isClearable
    isSearchable={false}
    value={
      filters.propertyType
        ? { value: filters.propertyType, label: filters.propertyType }
        : null
    }
    onChange={(selectedOption) => {
      setFilters(prev => ({
        ...prev,
        propertyType: selectedOption?.value || ""
      }));
    }}
    options={propertyTypes}
    isDisabled={isLoading}
    styles={propertyTypeStyles}
    components={{
      IndicatorSeparator: () => null,
      DropdownIndicator: () => null // Removes dropdown arrow completely
    }}
  />
</div>

          {/* Budget */}
          <div className="search-field">
            <label htmlFor="budget" className="sr-only">Budget</label>
            <select
              id="budget"
              name="budget"
              className="dropdown-main"
              value={filters.budget}
              onChange={handleInputChange}
            >
              {budgetOptions.map((opt, idx) => (
                <option key={idx} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            className="mainsearch-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Search"}
            <span className="search-icon" aria-hidden="true">→</span>
          </button>
        </div>
      </form>
                      <ExpandableSearch />

    </div>
  );
};

export default MainSearchBar;
