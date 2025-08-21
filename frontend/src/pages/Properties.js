import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import SmartContactForm from "../components/SmartContactForm";
import "./Properties.css";
import { 
  FiChevronDown, 
  FiChevronUp, 
  FiFilter, 
  FiX, 
  FiSliders, 
  FiSearch,
  FiLoader,
  FiCheck,
  FiTrash2,
  FiHome,
  FiDollarSign,
  FiMapPin,
  FiLayers,
  FiMessageCircle
} from "react-icons/fi";

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

const Properties = ({ addToCompare, removeFromCompare, compareList }) => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showCompareToast, setShowCompareToast] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/properties");
        setProperties(res.data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFilters = async () => {
      try {
        const res = await axios.get("/api/properties/filters");
        setFilterOptions(res.data);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };

    fetchProperties();
    fetchFilters();
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setVisibleCount(12);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
    setCitySearch("");
    setVisibleCount(12);
  }, []);

  const loadMoreProperties = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 12);
      setIsLoadingMore(false);
    }, 500);
  }, []);

  // Enhanced compare functionality
  const handleAddToCompare = useCallback((property) => {
    const added = addToCompare(property);
    if (added) {
      setShowCompareToast(true);
      setTimeout(() => setShowCompareToast(false), 3000);
    }
  }, [addToCompare]);

  const goToComparePage = useCallback(() => {
    navigate('/compare');
  }, [navigate]);

  const isInCompareList = useCallback((propertyId) => {
    const normalizeId = (id) => {
      if (!id) return null;
      if (typeof id === 'object' && id.$oid) return id.$oid;
      return id.toString();
    };
    
    return compareList.some(item => normalizeId(item._id) === normalizeId(propertyId));
  }, [compareList]);

  const filteredProperties = properties.filter((p) => {
    let match = true;
    if (filters.city && p.city !== filters.city) match = false;
    if (filters.furnishing && p.furnishing !== filters.furnishing) match = false;
    if (filters.bhk && p.bhk !== filters.bhk) match = false;
    if (filters.budget && Number(p.price) > Number(filters.budget)) match = false;
    if (filters.status && p.status !== filters.status) match = false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !p.description.toLowerCase().includes(searchQuery.toLowerCase())) match = false;
    return match;
  });

  const filteredCities = filterOptions.cities?.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  ) || [];

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch(sortBy) {
      case "price-low-high":
        return a.price - b.price;
      case "price-high-low":
        return b.price - a.price;
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return a.featured ? -1 : 1;
    }
  });

  const propertiesToShow = sortedProperties.slice(0, visibleCount);
  const hasMoreProperties = visibleCount < sortedProperties.length;

  return (
    <div className="properties-page">
      {/* Compare Toast Notification */}
      {showCompareToast && (
        <div className="compare-toast">
          <div className="toast-content">
            <FiCheck size={18} />
            <span>Property added to comparison!</span>
            <button 
              className="toast-action"
              onClick={() => setShowCompareToast(false)}
            >
              ×
            </button>
          </div>
          <div className="toast-progress"></div>
        </div>
      )}

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <div className="compare-bar">
          <div className="compare-bar-content">
            <div className="compare-items-container">
              <div className="compare-items-scroll">
                {compareList.map(property => (
                  <div key={property._id} className="compare-item">
                    <img 
                      src={property.images?.[0] || "/api/placeholder/60/40"} 
                      alt={property.title}
                      className="compare-item-image"
                    />
                    <div className="compare-item-info">
                      <p className="compare-item-price">₹{property.price?.toLocaleString('en-IN')}</p>
                      <p className="compare-item-title">{property.title}</p>
                    </div>
                    <button 
                      className="compare-remove-btn"
                      onClick={() => removeFromCompare(property._id)}
                      aria-label="Remove from comparison"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="compare-bar-actions">
              <span className="compare-count">
                {compareList.length} {compareList.length === 1 ? 'property' : 'properties'} selected
              </span>
              <button 
                className="compare-clear-btn"
                onClick={() => navigate('/compare')}
              >
                <FiTrash2 size={14} />
                Clear All
              </button>
              <button 
                className="compare-now-btn"
                onClick={goToComparePage}
              >
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Toggle */}
      <div className="mobile-filter-toggle">
        <button 
          className="filter-toggle-btn"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          <FiSliders size={18} />
          <span>Filters</span>
          {Object.keys(filters).length > 0 && (
            <span className="filter-count">{Object.keys(filters).length}</span>
          )}
        </button>
        
        {/* Mobile Contact Form Toggle */}
        <button 
          className="contact-form-toggle-btn"
          onClick={() => setShowContactForm(!showContactForm)}
        >
          <FiMessageCircle size={18} />
          <span>Contact</span>
        </button>
      </div>

      {/* Sidebar Filter */}
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

      {/* Property List and Contact Form Container */}
      <div className="main-content-container">
        {/* Property List */}
        <div className="property-list-container">
          <div className="results-header">
            <div className="results-info">
              <h2>
                {filteredProperties.length} Properties 
                {filters.city && ` in ${filters.city}`}
                {filters.bhk && `, ${filters.bhk} BHK`}
              </h2>
              <p>Explore our curated selection of premium properties</p>
            </div>
            
            <div className="results-controls">
              <div className="sort-dropdown">
                <label htmlFor="sort-by">Sort by:</label>
                <select 
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <FiChevronDown className="dropdown-arrow" />
              </div>
            </div>
          </div>

          <div className="active-filters-container">
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <span key={key} className="active-filter">
                  {key}: {value}
                  <button onClick={() => handleFilterChange(key, "")}>×</button>
                </span>
              )
            )}
            {Object.keys(filters).length > 0 && (
              <button className="clear-all-filters" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          <div className="property-list list">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading properties...</p>
              </div>
            ) : propertiesToShow.length > 0 ? (
              <>
                {propertiesToShow.map((property) => (
                  <PropertyCard 
                    key={property._id} 
                    property={property} 
                    viewMode="list"
                    addToCompare={handleAddToCompare}
                    goToComparePage={goToComparePage}
                    isInCompare={isInCompareList(property._id)}
                  />
                ))}
                
                {hasMoreProperties && (
                  <div className="load-more-container">
                    <button 
                      className="load-more-btn"
                      onClick={loadMoreProperties}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <FiLoader className="spinner" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${sortedProperties.length - visibleCount} remaining)`
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <h3>No properties found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button className="reset-filters-btn" onClick={clearFilters}>
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Smart Contact Form - Desktop */}
        <div className={`contact-form-sidebar ${showContactForm ? 'expanded' : ''}`}>
          <div className="contact-form-header">
            <h3><FiMessageCircle /> Get Expert Help</h3>
            <button 
              className="contact-form-toggle"
              onClick={() => setShowContactForm(!showContactForm)}
            >
              {showContactForm ? <FiX /> : <FiMessageCircle />}
            </button>
          </div>
          
          {showContactForm && (
            <div className="contact-form-content">
              <SmartContactForm />
            </div>
          )}
        </div>

        {/* Smart Contact Form - Mobile Overlay */}
        {mobileFilterOpen && (
          <div 
            className="mobile-filter-overlay"
            onClick={() => setMobileFilterOpen(false)}
          ></div>
        )}

        {/* Mobile Contact Form */}
        {/* <div className={`mobile-contact-form ${showContactForm ? 'mobile-open' : ''}`}>
          <div className="mobile-contact-form-header">
            <h3>Get Expert Help</h3>
            <button onClick={() => setShowContactForm(false)}>
              <FiX />
            </button>
          </div>
          <div className="mobile-contact-form-content">
            <SmartContactForm />
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Properties;