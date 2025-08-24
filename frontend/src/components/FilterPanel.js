import React, { useState } from "react";
import { FiChevronDown, FiChevronUp, FiFilter, FiX, FiSearch, FiDollarSign, FiHome, FiLayers, FiMapPin } from "react-icons/fi";
import "./FilterPanel.css";

const FilterSection = ({ title, children, isInitiallyOpen = true, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <div className="filter-section">
      <div
        className="filter-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="filter-section-title">
          {Icon && <Icon size={16} />}
          <h4>{title}</h4>
        </div>
        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
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
  mobileFilterOpen,
  setMobileFilterOpen
}) => {
  const filteredCities = filterOptions.cities?.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ) || [];

  return (
    <div className={`filter-panel ${isFilterOpen ? "open" : "collapsed"} ${mobileFilterOpen ? "mobile-open" : ""}`}>
      <div className="filter-header">
        <h3><FiFilter /> Filters</h3>
        <div className="filter-actions">
          {isFilterOpen && Object.keys(filters).length > 0 && (
            <button className="clear-btn" onClick={clearFilters}>
              Clear All
            </button>
          )}
          <button
            className="toggle-btn"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              if (mobileFilterOpen) setMobileFilterOpen(false);
            }}
            aria-label={isFilterOpen ? "Collapse filters" : "Expand filters"}
          >
            {isFilterOpen ? <FiX size={18} /> : <FiFilter size={18} />}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="filter-options">
          <FilterSection title="Search" icon={FiSearch} isInitiallyOpen={true}>
            <div className="filter-group">
              <div className="search-box">
                <FiSearch className="search-icon" />
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

          <FilterSection title="Budget" icon={FiDollarSign} isInitiallyOpen={true}>
            <div className="filter-group">
              <label>Max Budget</label>
              <div className="range-container">
                <input
                  type="range"
                  min="0"
                  max="50000000"
                  step="500000"
                  value={filters.budget || 50000000}
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
                Up to ₹{(filters.budget || 50000000).toLocaleString('en-IN')}
              </div>
            </div>
            
            <div className="quick-budget-options">
              <button 
                className={`budget-option ${!filters.budget ? 'active' : ''}`}
                onClick={() => handleFilterChange("budget", "")}
              >
                Any Budget
              </button>
              <button 
                className={`budget-option ${filters.budget === 10000000 ? 'active' : ''}`}
                onClick={() => handleFilterChange("budget", 10000000)}
              >
                Under ₹10L
              </button>
              <button 
                className={`budget-option ${filters.budget === 20000000 ? 'active' : ''}`}
                onClick={() => handleFilterChange("budget", 20000000)}
              >
                Under ₹20L
              </button>
              <button 
                className={`budget-option ${filters.budget === 50000000 ? 'active' : ''}`}
                onClick={() => handleFilterChange("budget", 50000000)}
              >
                Under ₹50L
              </button>
            </div>
          </FilterSection>

          <FilterSection title="BHK Type" icon={FiHome} isInitiallyOpen={true}>
            <div className="filter-group">
              <div className="checkbox-group">
                {['1', '2', '3', '4', '4+'].map(bhk => (
                  <label key={bhk} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.bhk === bhk}
                      onChange={() => handleFilterChange("bhk", filters.bhk === bhk ? "" : bhk)}
                    />
                    <span className="checkmark"></span>
                    {bhk} BHK
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Furnishing" icon={FiLayers} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {filterOptions.furnishingOptions?.map((f, idx) => (
                  <label key={idx} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.furnishing === f}
                      onChange={() => handleFilterChange("furnishing", filters.furnishing === f ? "" : f)}
                    />
                    <span className="checkmark"></span>
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Location" icon={FiMapPin} isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="search-box">
                <FiSearch className="search-icon" />
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
                        onChange={() => handleFilterChange("city", filters.city === city ? "" : city)}
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

          <FilterSection title="Property Status" isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {['Ready to Move', 'Under Construction', 'New Launch'].map(status => (
                  <label key={status} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.status === status}
                      onChange={() => handleFilterChange("status", filters.status === status ? "" : status)}
                    />
                    <span className="checkmark"></span>
                    {status}
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