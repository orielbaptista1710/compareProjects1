import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./LocationSearchBar.css";

const LocationSearchBar = ({
  filters,
  setFilters,
  states = [],
  cities = [],
  localities = []
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue =
    filters.locality ||
    filters.city ||
    filters.state ||
    "";

  return (
    <div className="location-search-wrapper" ref={wrapperRef}>

      {/* COLLAPSED INPUT */}
      <div
        className={`location-input ${open ? "active" : ""}`}
        onClick={() => setOpen(true)}
      >
        <FaMapMarkerAlt className="location-icon" />
        <span className={displayValue ? "filled" : ""}>
          {displayValue || "Enter City, Locality"}
        </span>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="location-dropdown">

          {/* STATE */}
          <Select
            placeholder="Select State"
            value={filters.state ? { value: filters.state, label: filters.state } : null}
            onChange={(opt) =>
              setFilters((prev) => ({
                ...prev,
                state: opt?.value || "",
                city: "",
                locality: ""
              }))
            }
            options={states.map(s => ({ value: s, label: s }))}
          />

          {/* CITY */}
          <Select
            placeholder="Select City"
            isDisabled={!filters.state}
            value={filters.city ? { value: filters.city, label: filters.city } : null}
            onChange={(opt) =>
              setFilters((prev) => ({
                ...prev,
                city: opt?.value || "",
                locality: ""
              }))
            }
            options={cities.map(c => ({ value: c, label: c }))}
          />

          {/* LOCALITY */}
          <Select
            placeholder="Select Locality"
            isDisabled={!filters.city}
            value={filters.locality ? { value: filters.locality, label: filters.locality } : null}
            onChange={(opt) =>
              setFilters((prev) => ({
                ...prev,
                locality: opt?.value || ""
              }))
            }
            options={localities.map(l => ({ value: l, label: l }))}
          />

          {/* ADDRESS */}
          <input
            type="text"
            placeholder="Street / Area / Landmark"
            value={filters.address}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, address: e.target.value }))
            }
          />

          {/* PINCODE */}
          <input
            type="text"
            placeholder="Pincode"
            maxLength={6}
            value={filters.pincode}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, pincode: e.target.value }))
            }
          />

          <button
            className="apply-location-btn"
            onClick={() => setOpen(false)}
          >
            Apply Location
          </button>

        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;
