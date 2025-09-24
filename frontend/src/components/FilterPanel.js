import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons/faChevronUp";
import { faFilter } from "@fortawesome/free-solid-svg-icons/faFilter";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons/faDollarSign";
import { faHouse } from "@fortawesome/free-solid-svg-icons/faHouse";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons/faLayerGroup";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faCompass } from "@fortawesome/free-solid-svg-icons/faCompass";
import { faCar } from "@fortawesome/free-solid-svg-icons/faCar";
import { faBuilding } from "@fortawesome/free-solid-svg-icons/faBuilding";
// import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faClock } from "@fortawesome/free-solid-svg-icons/faClock";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons/faCircleCheck"
import "./FilterPanel.css";

// FilterSection now accepts icon component + iconProps
const FilterSection = ({ title, children, isInitiallyOpen = true, icon: Icon, iconProps }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <div className="filter-section">
      <div className="filter-section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="filter-section-title">
          {Icon && <Icon {...iconProps} size={16} />}
          <h4>{title}</h4>
        </div>
        {isOpen ? <FontAwesomeIcon icon={faChevronUp} size={16} /> : <FontAwesomeIcon icon={faChevronDown} size={16} />}
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
        <h3><FontAwesomeIcon icon={faFilter} /> Filters</h3>
        <div className="filter-actions">
          {isFilterOpen && Object.keys(filters).length > 0 && (
            <button className="clear-btn" onClick={clearFilters}>
              Clear All
            </button>
          )}
          <button
  className="toggle-btn"
  onClick={() => {
    if (isFilterOpen) {
      setIsFilterOpen(false); // close when X clicked
    } else {
      setIsFilterOpen(true); // open when filter icon clicked
    }
    if (mobileFilterOpen) setMobileFilterOpen(false);
  }}
  aria-label={isFilterOpen ? "Collapse filters" : "Expand filters"}
>
  {isFilterOpen ? (
    <FontAwesomeIcon icon={faXmark} size={18} />
  ) : (
    <FontAwesomeIcon icon={faFilter} size={18} />
  )}
</button>

        </div>
      </div>

      {isFilterOpen && (
        <div className="filter-options">

  

  {/* <div className="filter-group">
    <button
      type="button"
      className={`featured-btn ${filters.featured ? "active" : ""}`}
      onClick={() => handleFilterChange("featured", !filters.featured)}
    >
      {filters.featured ? "Showing Featured Only" : "Show Featured Only"}
    </button>
  </div> */}


          <FilterSection 
            title="Search" 
            icon={FontAwesomeIcon} 
            iconProps={{ icon: faMagnifyingGlass }} 
            isInitiallyOpen={true}
          >
            <div className="filter-group">
              <div className="search-box">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
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

          <FilterSection 
            title="Budget" 
            icon={FontAwesomeIcon} 
            iconProps={{ icon: faDollarSign }} 
            isInitiallyOpen={true}
          >
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

          <FilterSection 
            title="Location" 
            icon={FontAwesomeIcon} 
            iconProps={{ icon: faLocationDot }} 
            isInitiallyOpen={false}
          >
            <div className="filter-group">
              <div className="search-box">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
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

          <FilterSection 
  title="Property Type" 
  icon={FontAwesomeIcon} 
  iconProps={{ icon: faBuilding }} 
  isInitiallyOpen={true}
>
  <div className="filter-group">
    <div className="checkbox-group">
      {filterOptions.propertyTypeOptions?.map((type, idx) => (
        <label key={idx} className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.propertyType === type}
            onChange={() =>
              handleFilterChange("propertyType", filters.propertyType === type ? "" : type)
            }
          />
          <span className="checkmark"></span>
          {type}
        </label>
      ))}
    </div>
  </div>
</FilterSection>


          <FilterSection 
            title="BHK Type" 
            icon={FontAwesomeIcon} 
            iconProps={{ icon: faHouse }} 
            isInitiallyOpen={true}
          >
            <div className="filter-group">
              <div className="checkbox-group"> {['1', '2', '3', '4', '4+'].map(bhk => ( 
                <label key={bhk} className="checkbox-label"> 
                <input 
                  type="checkbox" 
                  checked={filters.bhk === bhk} 
                  onChange={() => handleFilterChange("bhk", filters.bhk === bhk ? "" : bhk)} />
                 <span className="checkmark"></span> {bhk} BHK </label> ))} </div>
            </div>
          </FilterSection>

          <FilterSection 
  title="Age of Property" 
  icon={FontAwesomeIcon} 
  iconProps={{ icon: faClock }} 
  isInitiallyOpen={false}
>
  <div className="filter-group">
    <div className="checkbox-group">
      {filterOptions.ageOptions?.map((age, idx) => (
        <label key={idx} className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.ageOfProperty === age}
            onChange={() =>
              handleFilterChange("ageOfProperty", filters.ageOfProperty === age ? "" : age)
            }
          />
          <span className="checkmark"></span>
          {age}
        </label>
      ))}
    </div>
  </div>
</FilterSection>


          

          <FilterSection 
            title="Furnishing" 
            icon={FontAwesomeIcon} 
            iconProps={{ icon: faLayerGroup }} 
            isInitiallyOpen={false}
          >
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

          <FilterSection 
          title="Property Status" 
          icon={FontAwesomeIcon}
          iconProps={{ icon: faCircleCheck }}
          isInitiallyOpen={false}>
            <div className="filter-group">
              <div className="checkbox-group">
                {['Ready to Move', 'Under Construction', 'Ready for Development', 'Possession Within 3 Months','Possession Within 6 Months','Possession Within 1 Year','Ready for Sale', 'New Launch'].map(status => (
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

          <FilterSection 
  title="Facing" 
  icon={FontAwesomeIcon} 
  iconProps={{ icon: faCompass }} 
  isInitiallyOpen={false}
>
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

<FilterSection 
  title="Parking" 
  icon={FontAwesomeIcon} 
  iconProps={{ icon: faCar }} 
  isInitiallyOpen={false}
>
  <div className="filter-group">
    <div className="checkbox-group">
      {filterOptions.parkingOptions?.map((parkings, idx) => (
        <label key={idx} className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.parkings === parkings}
            onChange={() =>
              handleFilterChange("parkings", filters.parkings === parkings ? "" : parkings)
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
