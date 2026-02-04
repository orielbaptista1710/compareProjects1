// React + hooks
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Components
import PropertyCard from "./PropertiesPageComponets/PropertyCard";
import SmartContactForm from "./PropertiesPageComponets/SmartContactForm";
import FilterPanel from "./PropertiesPageComponets/FilterComponents/FilterPanel";
import ProjectViewSideBar from "../../components/ProjectViewSideBar";
import CompareTray from "./PropertiesPageComponets/CompareTray";
import ResultsHeader from "./PropertiesPageComponets/FilterComponents/ResultsHeader";
// Icons
import { ChevronDown, X, Loader2, Check } from "lucide-react";

// Utils & API
import debounce from "lodash.debounce";
import Skeleton from "react-loading-skeleton";
import API from "../../api";
import { DEFAULT_FILTERS, formatFilterValue } from "../../utils/filters.schema";
import { FILTER_LABELS } from "../../assests/constants/propertyTypeConfig";

// import { parseFiltersFromURL, buildQueryString, normalizeFiltersForAPI } from "../../utils/propertiesHelpers";

// SEO
import Seo from "../../database/Seo";

// Styles
import "./Properties.css";

// ---------------- REUSABLE SUBCOMPONENTS ----------------

// Skeleton loader for property cards
const PropertySkeletons = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="property-card-skeleton">
        <Skeleton height={180} />
        <Skeleton count={3} style={{ marginTop: "0.5rem" }} />
      </div>
    ))}
  </>
);

// Empty state when no properties are found
const EmptyState = ({ onReset }) => (
  <div className="empty-state">
    <h3>No properties found</h3>
    <p>Try adjusting your filters to see more results</p>
    <button className="reset-filters-btn" onClick={onReset}>
      Reset Filters
    </button>
  </div>
);

const parseFiltersFromURL = (search) => {  // use to ensure that the filters are in the correct format and are not missing any required fields
  const params = new URLSearchParams(search);
  //URLSearchParams is a built-in JavaScript object that allows you to work with the query string of a URL. It provides methods for getting, setting, and removing URL parameters.
  //URLSearchParmas is a string 
  //URL is the single source of truth
  return {
    //WILL HAVE TO ADD LOCALITY etc HERE later
    city: params.get("city"),
    locality: params.getAll("locality"),
    
    //here the url is being parsed and the values are being extracted
    //the url is a string but the mognodb dependent price is a NuMBER SO
    //URLSearchParams always returns strings SO params.get("budget") gives string -> Number as RangeSlider, backdend logic is expecting a number
    
    search: params.get("search"),

    // minBudget: params.get("minBudget"),    // NEW
    // maxBudget: params.get("maxBudget"),
    
    bhk: params.getAll("bhk"), 
    furnishing: params.getAll("furnishing"),
    facing: params.getAll("facing"),
    parkings: params.getAll("parkings"),
    propertyType: params.getAll("propertyType"),

  };
};




const Properties = ({ addToCompare, removeFromCompare, compareList }) => {
  const navigate = useNavigate();
  const location = useLocation(); //this is used for the url?

  // ---------------- STATE ----------------
  const [properties, setProperties] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState( "");

  const [page, setPage] = useState(1);
  const [totalMatched, setTotalMatched] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [sortBy, setSortBy] = useState("relevance");

  // to be used when mutli secelt on amaenties etc is added
  // const stableFilters = useMemo(() => JSON.stringify(filters), [filters]);

  // ---------------- READ URL FILTERS ----------------

//   const getActiveFiltersFromURL = (search) => {
//   const parsed = parseFiltersFromURL(search);

//   return Object.fromEntries(
//     Object.entries(parsed).filter(([_, v]) =>
//       Array.isArray(v) ? v.length > 0 : Boolean(v)
//     )
//   );
// };
 
  const filters = useMemo(() => ({
  ...DEFAULT_FILTERS,
  ...parseFiltersFromURL(location.search)
}), [location.search]);


const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });
  return params.toString();
};


const normalizeFiltersForAPI = (filters) => {
  const api = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    if (Array.isArray(value) && value.length === 0) return;
    api[key] = value;
  });
  return api;
};


useEffect(() => {
  setSearchInput(filters.search);
}, [filters.search]);

useEffect(() => {
  setPage(1);
}, [filters, sortBy]);

  // ---------------- FETCH PROPERTIES + FILTER OPTIONS ----------------

  useEffect(() => {
  const controller = new AbortController();

  const fetchProperties = async () => {
    try {
      if (page === 1 && !filters.search) setLoading(true);

      const normalizedFilters = normalizeFiltersForAPI(filters);
      const query = buildQueryString(normalizedFilters);

      const res = await API.get(
        `/api/properties?${query}&page=${page}&limit=12&sortBy=${sortBy}`,
        { signal: controller.signal }
      );

      setTotalMatched(res.data.totalMatched || 0);

      setProperties((prev) =>
        page === 1
          ? res.data.properties || []
          : [...prev, ...(res.data.properties || [])]
      );
    } catch (err) {
      if (err.name === "CanceledError") return;
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  fetchProperties();

  return () => controller.abort();
}, [filters, page, sortBy]);




  useEffect(() => {
  const controller = new AbortController();

  const fetchFilterOptions = async () => {
    try {
      const res = await API.get(
        "/api/properties/filters",
        { signal: controller.signal }
      );
      setFilterOptions(res.data || {});
    } catch (err) {
      if (err.name === "CanceledError") return;
      console.error("Error fetching filter options:", err);
    }
  };

  fetchFilterOptions();
  return () => controller.abort();
}, []);



  // ---------------- FILTER HANDLERS ----------------//


  const handleFilterChange = useCallback(
  (key, value) => {
    const params = new URLSearchParams(location.search);

    //  MULTI-SELECT
    if (Array.isArray(value)) {
  params.delete(key);
  value.forEach((v) => {
    if (v !== "" && v !== null && v !== undefined) {
      params.append(key, String(v));
    }
  });
}
    //  SINGLE SELECT
    else if (value === "" || value === null || value === undefined) {
      params.delete(key);
    } 
    else {
      params.delete(key); // force change
      params.set(key, String(value));
    }


    navigate(`/properties?${params.toString()}`, { replace: true });
    setPage(1);///is this ok?

  },
  [location.search, navigate]
);


//  Debounced search handler (URL update delayed)
const debouncedUpdateURL = useMemo(
  () =>
    debounce((value) => {
      handleFilterChange("search", value);
    }, 500),
  [handleFilterChange]
);

useEffect(() => {
  return () => {
    debouncedUpdateURL.cancel();
  };
}, [debouncedUpdateURL]);


const handleSearchInputChange = (value) => {
  setSearchInput(value);          // instant UI update
  debouncedUpdateURL(value);      // delayed expensive work
};



  const clearFilters = useCallback(() => {
    navigate("/properties");
  }, [navigate]);

  // ---------------- LOAD MORE ----------------
  // const hasMoreProperties = properties.length < totalMatched;

//   const loadMoreProperties = useCallback(() => {
//   if (!hasMoreProperties || isLoadingMore) return;
//   setIsLoadingMore(true);
//   setPage((prev) => prev + 1);
// }, [hasMoreProperties, isLoadingMore]);


  // ---------------- COMPARE FUNCTIONALITY ----------------
  const handleAddToCompare = useCallback(
    (property) => {
      const added = addToCompare(property);
    },
    [addToCompare]
  );

  const goToComparePage = useCallback(() => {
    navigate("/compare");
  }, [navigate]);

  const compareIdSet = useMemo(() => {
  return new Set(
    compareList
      .map(item => {
        if (!item?._id) return null;
        if (typeof item._id === "object" && item._id.$oid) {
          return item._id.$oid;
        }
        return item._id.toString();
      })
      .filter(Boolean)
  );
}, [compareList]);


  const isInCompareList = useCallback(
  (propertyId) => {
    if (!propertyId) return false;

    const normalizedId =
      typeof propertyId === "object" && propertyId.$oid
        ? propertyId.$oid
        : propertyId.toString();

    return compareIdSet.has(normalizedId);
  },
  [compareIdSet]
);


  const seoData = useMemo(() => ({
  title: `${filters.city || "India"} Properties for Sale | CompareProjects`,
  description: `Browse ${totalMatched || properties.length} verified properties ${
    filters.city ? `in ${filters.city}` : "across India"
  }. Compare prices, amenities, and projects.`,
}), [filters.city, totalMatched]);


  // ---------------- RENDER ----------------
  return (
    <div className="properties-page">
      <Seo {...seoData} />        

      {/* Main Content */}
      <div className="main-content-container">
        <div className="filters-column">
          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            filterOptions={filterOptions}
            searchQuery={searchInput}
            onSearchChange={handleSearchInputChange}
          />
        </div>

        <div className="property-list-container">

          <ResultsHeader
            totalMatched={totalMatched}
            filters={filters}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* ✅ Active Filters */}
          <div className="active-filters-container">
  {Object.entries(filters)
    .filter(([_, value]) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    )
    .flatMap(([key, value]) => {
      const label = FILTER_LABELS[key];
      if (!label) return [];

      if (Array.isArray(value)) {
        return value.map((v) => (
          <span key={`${key}-${v}`} className="active-filter">
            <strong>{label}:</strong> {formatFilterValue(key, v)}
            <button
              onClick={() =>
                handleFilterChange(
                  key,
                  value.filter((x) => x !== v)
                )
              }
            >
              <X size={12} />
            </button>
          </span>
        ));
      }

      return (
        <span key={key} className="active-filter">
          <strong>{label}:</strong> {formatFilterValue(key, value)}
          <button onClick={() => handleFilterChange(key, "")}>
            <X size={12} />
          </button>
        </span>
      );
    })}

  {Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  ) && (
    <button className="clear-all-filters" onClick={clearFilters}>
      Clear all
    </button>
  )}
</div>




          {/* ✅ Property List */}
               <div className="property-list list">
  {loading && page === 1 ? (
    <PropertySkeletons />
  ) : properties.length === 0 ? (
    <EmptyState onReset={clearFilters} />
  ) : (
    <>
      {properties.map((property, index) => (
        <React.Fragment key={property._id}>
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

      {isLoadingMore && <PropertySkeletons count={3} />}
    </>
  )}
</div>


        </div>

        {/* ✅ Contact Form & Sidebar */}
        <div className="contact-and-sideview">
          <SmartContactForm />

          <div className="sideProjectsView">
            <ProjectViewSideBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;
