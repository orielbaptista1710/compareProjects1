import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropertyCard from "./PropertiesPageComponets/PropertyCard";
import SmartContactForm from "./PropertiesPageComponets/SmartContactForm";
import FilterPanel from "./PropertiesPageComponets/FilterPanel";
import ProjectViewSideBar from "../../components/ProjectViewSideBar";
import CompareTray from "./PropertiesPageComponets/CompareTray";
import {
  ChevronDown,
  X,
  Loader2,
  Check,
  Trash2,
  MessageCircle,
} from "lucide-react"; 
import Seo from "../../database/Seo";
import API from "../../api";
import "./Properties.css";
import debounce from "lodash.debounce";


const Properties = ({ addToCompare, removeFromCompare, compareList }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ---------------- STATE ----------------
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showCompareToast, setShowCompareToast] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  // ---------------- READ URL FILTERS ----------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const parsedFilters = Object.fromEntries(params.entries());
    if (Object.keys(parsedFilters).length > 0) {
      setFilters(parsedFilters);
    }
    window.scrollTo(0, 0);
  }, [location.search]);

  // ---------------- FETCH PROPERTIES + FILTER OPTIONS ----------------
  useEffect(() => {
    const fetchPropertiesAndFilters = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams(filters).toString(); //here the filters are converted to a query string- URLSearchParams is a built-in JavaScript object that allows you to easily construct query strings from an object of key-value pairs.
        const [propRes, filterRes] = await Promise.all([ //Promise.all allows to run multiple promises in parallel
          API.get(`/api/properties?${query}`), // here the query string is appended to the API endpoint URL 
          API.get("/api/properties/filters"), 
        ]);
        setProperties(propRes.data || []);  
        setFilterOptions(filterRes.data || {});  //
      } catch (err) {
        console.error("Error fetching properties or filters:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertiesAndFilters();
  }, [filters]);

  // ---------------- FILTER HANDLERS ----------------
  const handleFilterChange = useCallback(
    debounce((filterName, value) => {
      setFilters((prev) => ({ ...prev, [filterName]: value }));
      setVisibleCount(12);
    }, 300),
    []
  );

  const handleSortChange = useCallback((event) => {
    setSortBy(event.target.value);
  }, []);

  const handleSearchQueryChange = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 300)
  )

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
    setCitySearch("");
    setVisibleCount(12);
    navigate("/properties");
  }, [navigate]);

  // ---------------- LOAD MORE ----------------
  const loadMoreProperties = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12);
      setIsLoadingMore(false);
    }, 400);
  }, []);

  // ---------------- COMPARE FUNCTIONALITY ----------------
  const handleAddToCompare = useCallback(
    (property) => {
      const added = addToCompare(property);
      if (added) {
        setShowCompareToast(true);
        setTimeout(() => setShowCompareToast(false), 2500);
      }
    },
    [addToCompare]
  );

  const goToComparePage = useCallback(() => {
    navigate("/compare");
  }, [navigate]);

  const isInCompareList = useCallback(
    (propertyId) => {
      const normalizeId = (id) => {
        if (!id) return null;
        if (typeof id === "object" && id.$oid) return id.$oid;
        return id.toString();
      };
      return compareList.some(
        (item) => normalizeId(item._id) === normalizeId(propertyId)
      );
    },
    [compareList]
  );

  // ---------------- FILTERING & SORTING (CLIENT-SIDE) ----------------
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      let match = true;
      if (filters.city && p.city !== filters.city) match = false;
      if (filters.propertyType && p.propertyType !== filters.propertyType)
        match = false;
      if (filters.furnishing && !p.furnishing?.includes(filters.furnishing))
        match = false;
      if (filters.bhk && p.bhk !== filters.bhk) match = false;
      if (filters.status && !p.possessionStatus?.includes(filters.status))
        match = false;
      if (filters.budget && Number(p.price) > Number(filters.budget))
        match = false;
      if (filters.facing && p.facing !== filters.facing) match = false;
      if (filters.parkings && !p.parking?.includes(filters.parkings))
        match = false;
      if (filters.featured && !p.featured) match = false;
      if (filters.ageOfProperty && p.ageOfProperty !== filters.ageOfProperty)
        match = false;

      if (
        searchQuery &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
        match = false;
      return match;
    });
  }, [properties, filters, searchQuery]);

  const sortedProperties = useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      switch (sortBy) {
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
  }, [filteredProperties, sortBy]);

  const propertiesToShow = useMemo(
    () => sortedProperties.slice(0, visibleCount),
    [sortedProperties, visibleCount]
  );

  const hasMoreProperties = visibleCount < sortedProperties.length;

  // ---------------- RENDER ----------------
  return (
    <div className="properties-page">
      <Seo
        title="Properties for Sale | CompareProjects"
        description="Find the best properties for sale in India. Browse apartments, villas, and more. Compare and find your dream home today!"
      />

      {/* ✅ Compare Toast */}
      {showCompareToast && (
        <div className="compare-toast" aria-live="polite">
          <div className="toast-content">
            <Check size={18} strokeWidth={2} />
            <span>Property added to comparison!</span>
            <button
              className="toast-action"
              onClick={() => setShowCompareToast(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="toast-progress"></div>
        </div>
      )}

      {/* ✅ Compare Bar */}
      


      {/* ✅ Filter Panel */}
      <FilterPanel
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        filters={filters}
        handleFilterChange={handleFilterChange}
        clearFilters={clearFilters}
        filterOptions={filterOptions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        citySearch={citySearch}
        setCitySearch={setCitySearch}
      />

      {/* ✅ Main Content */}
      <div className="main-content-container">
        <div className="property-list-container">
          <div className="results-header">
            <div className="results-info">
              <h2>
                {filteredProperties.length} Properties{" "}
                {filters.city && `in ${filters.city}`}{" "}
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
                <ChevronDown className="dropdown-arrow" size={18} />
              </div>
            </div>
          </div>

          {/* ✅ Active Filters */}
          <div className="active-filters-container">
            {Object.entries(filters).map(([key, value]) =>
              value ? (
                <span key={key} className="active-filter">
                  {key}: {value}
                  <button onClick={() => handleFilterChange(key, "")}>
                    <X size={12} />
                  </button>
                </span>
              ) : null
            )}
            {Object.keys(filters).length > 0 && (
              <button className="clear-all-filters" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          {/* ✅ Property List */}
          <div className="property-list list">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading properties...</p>
              </div>
            ) : propertiesToShow.length > 0 ? (
              <>
                {propertiesToShow.map((property, index) => (
  <React.Fragment key={property._id}>
    
    {/* Render 2 cards → then tray → then rest */}
    <PropertyCard
      property={property}
      viewMode="list"
      addToCompare={handleAddToCompare}
      goToComparePage={goToComparePage}
      isInCompare={isInCompareList(property._id)}
    />

    {index === 1 && compareList.length > 0 && (
      <CompareTray
        compareList={compareList}
        removeFromCompare={removeFromCompare}
        goToComparePage={goToComparePage}
      />
    )}

  </React.Fragment>
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
                          <Loader2 className="spinner" size={16} />
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

        {/* ✅ Contact Form & Sidebar */}
        <div className="contact-and-sideview">
          <div className={`contact-form-sidebar ${showContactForm ? "expanded" : ""}`}>
            <div className="propertiespage-contact-form-header">
              <h3>
                <MessageCircle size={18} /> Get Expert Help
              </h3>
              <button
                className="contact-form-toggle"
                onClick={() => setShowContactForm(!showContactForm)}
              >
                {showContactForm ? <X size={16} /> : <MessageCircle size={16} />}
              </button>
            </div>

            {showContactForm && (
              <div className="contact-form-content">
                <SmartContactForm />
              </div>
            )}
          </div>

          <div className="sideProjectsView">
            <ProjectViewSideBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;
