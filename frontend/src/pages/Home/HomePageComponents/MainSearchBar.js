// src/components/MainSearchBar/MainSearchBar.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import API from "../../../api";

import ExpandableSearch from "./ExpandableSearch";
import PropertyTypePills from "../../Home/HomePageComponents/MainSeachBarComponets/PropertyTypePills";
import { DEFAULT_FILTERS } from "../../../utils/filters.schema";
import "./MainSearchBar.css";

const MainSearchBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dropdownRef = useRef(null);

  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);



  const [isPropertyOpen, setIsPropertyOpen] = useState(false);

  /* -------------------- FETCH FILTER OPTIONS -------------------- */
  const {
    data: filterOptions,
    isLoading,
    // isError,
  } = useQuery({
    queryKey: ["property-filter-options"],
    // queryFn: () =>
    //   API.get("/api/properties/filters").then((res) => res.data),
    // staleTime: 1000 * 60 * 10,
    queryFn: async () => {
  const res = await API.get("/api/properties/filters");
  console.log("FILTER API RAW RESPONSE:", res);
  return res.data;
},

  });

  /* -------------------- URL → FILTER STATE -------------------- */
  const filters = useMemo(
    () => ({
      // ...DEFAULT_FILTERS,
      propertyType: searchParams.get("propertyType") || "",
      bhk: searchParams.get("bhk") || "",
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
    if (value) params.set(key, value);
  });

  navigate(`/properties?${params.toString()}`);
};


  /* -------------------- PROPERTY LABEL -------------------- */
  const getPropertyTypeLabel = () => {
  const source = isPropertyOpen ? draftFilters : filters;

  if (!source.propertyType && !source.bhk) {
    return "Property Type";
  }

  return [
    source.propertyType,
    source.bhk && `${source.bhk} BHK`,
  ]
    .filter(Boolean)
    .join(" + ");
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



console.log("filterOptions", filterOptions);



  return (
    <div className="mainsearch-bar">
      <div className="main-search-container-section">
        <div className="main-search-container">

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

          <button
  className="mainsearch-btn"
  type="button"
  onClick={handleSearch}
>
  Search
</button>

        </div>
      </div>

      <ExpandableSearch />
    </div>
  );
};

export default MainSearchBar;
