// src/components/MainSearchBar/MainSearchBar.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search,MapPin, House } from "lucide-react";
import API from "../../../api";

import LocationSearchBar from "./LocationSearchBar";
import PropertyTypePills from "../../Home/HomePageComponents/MainSeachBarComponets/PropertyTypePills";
import ExpandableSearch from "./ExpandableSearch";

import { DEFAULT_FILTERS } from "../../../utils/filters.schema";
import "./MainSearchBar.css";

const MainSearchBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dropdownRef = useRef(null);
  const budgetRef = useRef(null);

  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  /* -------------------- FETCH FILTER OPTIONS -------------------- */
  useQuery({
    queryKey: ["property-filter-options"],
    queryFn: () =>
    API.get("/api/properties/filters").then((res) => res.data),
    staleTime: 1000 * 60 * 10,
  });

  /* -------------------- URL → FILTER STATE -------------------- */
  const filters = useMemo(
  () => ({
    ...DEFAULT_FILTERS,
    city: searchParams.get("city"),
    locality: searchParams.get("locality"),
    propertyType: searchParams.get("propertyType"),
    bhk: searchParams.get("bhk"),
  }),
  [searchParams]
);

  useEffect(() => {
  setDraftFilters(filters);
}, [filters]);

  /* -------------------- UPDATE URL -------------------- */
  const handleSearch = () => {
  const params = new URLSearchParams();

  Object.entries(draftFilters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== "" && v != null) {
          params.append(key, String(v));
        }
      });
    } else if (value !== "" && value != null) {
      params.set(key, String(value));
    }
  });

  navigate(`/properties?${params.toString()}`);
};

  /* -------------------- PROPERTY LABEL -------------------- */
  const getPropertyTypeLabel = () => {
  const source = isPropertyOpen ? draftFilters : filters;

  const types = Array.isArray(source.propertyType) 
    ? source.propertyType 
    : [];
  
  const bhks = Array.isArray(source.bhk) 
    ? source.bhk 
    : [];

  if (types.length === 0 && bhks.length === 0) {
    return "Property Type";
  }

  const parts = [
    types.length === 1 ? types[0] : types.length > 1 ? `${types.length} Types` : null,
    bhks.length === 1 ? `${bhks[0]} BHK` : bhks.length > 1 ? `${bhks.length} BHKs` : null,
  ].filter(Boolean);

  return parts.join(" + ") || "Property Type";
};

  /* -------------------- OUTSIDE CLICK + ESC -------------------- */
  useEffect(() => {
    if (!isPropertyOpen) return;

    const handlePointer = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsPropertyOpen(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") setIsPropertyOpen(false);
    };

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isPropertyOpen]);

  useEffect(() => {
    if (!isBudgetOpen) return;

    const handlePointer = (e) => {
      if (budgetRef.current && !budgetRef.current.contains(e.target)) {
        setIsBudgetOpen(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") setIsBudgetOpen(false);
    };

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isBudgetOpen]);

  return (
    <div className="mainsearch-bar">
      <div className="main-search-container-section">
        <div className="main-search-container">

          {/* LOCATION SEARCH */}
          <LocationSearchBar
            onSelect={(location) => {
              setDraftFilters((prev) => ({
                ...prev,
                city: location.city,
                locality: location.locality ? [location.locality] : [],
              }));
            }}
          />

          {/* VERTICAL DIVIDER */}
          <div className="search-divider" />

          {/* PROPERTY TYPE + BHK */}
          <div className="search-field-type" ref={dropdownRef}>
            <button
              type="button"
              className={`property-type-trigger ${
                isPropertyOpen ? "active" : ""
              }`}
              aria-expanded={isPropertyOpen}
              onClick={() => setIsPropertyOpen((p) => !p)}
            >
              <span className="property-icon">
                <House width={16} />
              </span>
              <span>{getPropertyTypeLabel()}</span>
              <span className="chevron">▾</span>
            </button>

            {isPropertyOpen && (
              <div className="property-type-dropdown">
                <PropertyTypePills
                  valueMap={draftFilters}
                  onChange={(key, value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      [key]: value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          {/* VERTICAL DIVIDER */}
          <div className="search-divider" />

          {/* BUDGET DROPDOWN */}
          <div className="search-field-budget" ref={budgetRef}>
            <button
              type="button"
              className={`budget-trigger ${isBudgetOpen ? "active" : ""}`}
              aria-expanded={isBudgetOpen}
              onClick={() => setIsBudgetOpen((p) => !p)}
            >
              <span className="budget-icon">
              <MapPin width={16}/>
              </span>
              <span>Budget</span>
              <span className="chevron">▾</span>
            </button>

            {isBudgetOpen && (
              <div className="budget-dropdown">
                <div className="budget-dropdown-content">
                  <p className="budget-placeholder">Budget options coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* SEARCH BUTTON */}
          <button
            className="mainsearch-btn"
            type="button"
            onClick={handleSearch}
          >
            <Search size={18} />
            Search
          </button>

        </div>
      </div>

      <ExpandableSearch />
    </div>
  );
};

export default MainSearchBar;