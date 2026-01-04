// src/components/PropertiesPageComponents/FilterPanel.js
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  DollarSign,
  Home,
  Layers,
  MapPin,
  Compass,
  Car,
  Building2,
  Clock,
  CheckCircle,
} from "lucide-react";
import "./FilterPanel.css";

// FilterSection accepts icon component directly
const FilterSection = ({ title, children, isInitiallyOpen = true, icon: Icon, iconProps }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <div className="filter-section">
      <div className="filter-section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="filter-section-title">
          {Icon && <Icon {...iconProps} size={16} />}
          <h4>{title}</h4>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isOpen && <div className="filter-section-body">{children}</div>}
    </div>
  );
};

const FilterPanel = ({
  isFilterOpen,
  setIsFilterOpen,
  filters,
  handleFilterChange,
  clearFilters,
  filterOptions,
  searchQuery,
  setSearchQuery,
  citySearch, 
  setCitySearch,
}) => {
  const filteredCities =
    filterOptions.cities?.filter((city) =>
      city.toLowerCase().includes(citySearch.toLowerCase())
    ) || [];

  return (
    <div className={`filter-panel ${isFilterOpen ? "open" : "collapsed"}`}>
      <div className="filter-header">
        <h3>
          <Filter size={16} /> Filters
        </h3>
        <button className="clear-btn" onClick={clearFilters}>
          Clear All
        </button>
      </div>

      {isFilterOpen && (
        <div className="filter-options">
          {/* 🔍 Search */}
          <FilterSection title="Search" icon={Search} isInitiallyOpen={true}>
            <div className="filter-group">
              <div className="search-box">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="filter-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </FilterSection>

          {/* 💰 Budget */}
          <FilterSection title="Budget" icon={DollarSign} isInitiallyOpen={true}>
            <div className="filter-group">
              <label>Max Budget</label>
              <div className="range-container">
                <input
                  type="range"
                  min="0"
                  max={filterOptions.maxBudget || 50000000}
                  step="500000"
                  value={filters.budget || filterOptions.maxBudget || 50000000}
                  onChange={(e) => handleFilterChange("budget", e.target.value)}
                  className="range-slider"
                />
                <div className="range-labels">
                  <span>₹0</span>
                  <span>₹50L</span>
                  <span>₹1Cr</span>
                  <span>₹5Cr</span>
                </div>
              </div>
              <div className="budget-display">
                Up to ₹{(filters.budget || 50000000).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="quick-budget-options">
              <button
                className={`budget-option ${!filters.budget ? "active" : ""}`}
                onClick={() => handleFilterChange("budget", "")}
              >
                Any Budget
              </button>
              <button
                className={`budget-option ${
                  filters.budget === 10000000 ? "active" : ""
                }`}
                onClick={() => handleFilterChange("budget", 10000000)}
              >
                Under ₹10L
              </button>
              <button
                className={`budget-option ${
                  filters.budget === 20000000 ? "active" : ""
                }`}
                onClick={() => handleFilterChange("budget", 20000000)}
              >
                Under ₹20L
              </button>
              <button
                className={`budget-option ${
                  filters.budget === 50000000 ? "active" : ""
                }`}
                onClick={() => handleFilterChange("budget", 50000000)}
              >
                Under ₹50L
              </button>
            </div>
          </FilterSection>

          {/* 📍 Location */}
          <FilterSection title="Location" icon={MapPin} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="search-box">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search cities..."
                  className="filter-search"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                />
              </div>
              <div className="checkbox-group scrollable">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, idx) => (
                    <label key={idx} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.city === city}
                        onChange={() =>
                          handleFilterChange("city", filters.city === city ? "" : city)
                        }
                      />
                      <span className="checkmark"></span>
                      {city}
                    </label>
                  ))
                ) : (
                  <p className="no-results">No cities found</p>
                )}
              </div>
            </div>
          </FilterSection>

          {/* 🏢 Property Type */}
          <FilterSection title="Property Type" icon={Building2} isInitiallyOpen={true}>
            <div className="filter-group">
              <div className="checkbox-group">
                {filterOptions.propertyTypeOptions?.map((type, idx) => (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.propertyType === type}
                      onChange={() =>
                        handleFilterChange(
                          "propertyType",
                          filters.propertyType === type ? "" : type
                        )
                      }
                    />
                    <span className="checkmark"></span>
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 🏠 BHK Type */}
          <FilterSection title="BHK Type" icon={Home} isInitiallyOpen={true}>
            <div className="filter-group">
              <div className="checkbox-group">
                {["1", "2", "3", "4", "4+"].map((bhk) => (
                  <label key={bhk} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.bhk === bhk}
                      onChange={() =>
                        handleFilterChange("bhk", filters.bhk === bhk ? "" : bhk)
                      }
                    />
                    <span className="checkmark"></span>
                    {bhk} BHK
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 🕒 Age of Property */}
          <FilterSection title="Age of Property" icon={Clock} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {filterOptions.ageOptions?.map((age, idx) => (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.ageOfProperty === age}
                      onChange={() =>
                        handleFilterChange(
                          "ageOfProperty",
                          filters.ageOfProperty === age ? "" : age
                        )
                      }
                    />
                    <span className="checkmark"></span>
                    {age}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 🛋️ Furnishing */}
          <FilterSection title="Furnishing" icon={Layers} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {filterOptions.furnishingOptions?.map((f, idx) => (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.furnishing === f}
                      onChange={() =>
                        handleFilterChange(
                          "furnishing",
                          filters.furnishing === f ? "" : f
                        )
                      }
                    />
                    <span className="checkmark"></span>
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 🏗️ Property Status */}
          <FilterSection title="Property Status" icon={CheckCircle} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {[
                  "Ready to Move",
                  "Under Construction",
                  "Ready for Development",
                  "Possession Within 3 Months",
                  "Possession Within 6 Months",
                  "Possession Within 1 Year",
                  "Ready for Sale",
                  "New Launch",
                ].map((status) => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.status === status}
                      onChange={() =>
                        handleFilterChange("status", filters.status === status ? "" : status)
                      }
                    />
                    <span className="checkmark"></span>
                    {status}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 🧭 Facing */}
          <FilterSection title="Facing" icon={Compass} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {filterOptions.facingOptions?.map((facing, idx) => (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.facing === facing}
                      onChange={() =>
                        handleFilterChange("facing", filters.facing === facing ? "" : facing)
                      }
                    />
                    <span className="checkmark"></span>
                    {facing}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 🚗 Parking */}
          <FilterSection title="Parking" icon={Car} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {filterOptions.parkingOptions?.map((parkings, idx) => (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.parkings === parkings}
                      onChange={() =>
                        handleFilterChange(
                          "parkings",
                          filters.parkings === parkings ? "" : parkings
                        )
                      }
                    />
                    <span className="checkmark"></span>
                    {parkings}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
