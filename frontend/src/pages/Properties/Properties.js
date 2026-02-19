// React + hooks
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Components
import PropertyCard from "./PropertiesPageComponets/PropertyCard";
import SmartContactForm from "./PropertiesPageComponets/SmartContactForm";
import PropertyMap from "./PropertiesPageComponets/PropertyMap";
import FilterPanel from "./PropertiesPageComponets/FilterComponents/FilterPanel";
import ProjectViewSideBar from "../../components/ProjectViewSideBar";
import CompareTray from "./PropertiesPageComponets/CompareTray";
import ResultsHeader from "./PropertiesPageComponets/FilterComponents/ResultsHeader";

// Icons
import { X } from "lucide-react";

// Utils & API
import debounce from "lodash.debounce";
import Skeleton from "react-loading-skeleton";
import API from "../../api";
import { DEFAULT_FILTERS, formatFilterValue } from "../../utils/filters.schema";
import { FILTER_LABELS } from "../../assests/constants/propertyTypeConfig";

// SEO
import Seo from "../../database/Seo";

// Styles
import "./Properties.css";

/* ----------------------------------
   Reusable UI
----------------------------------- */

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

const EmptyState = ({ onReset }) => (
  <div className="empty-state">
    <h3>No properties found</h3>
    <p>Try adjusting your filters to see more results</p>
    <button className="reset-filters-btn" onClick={onReset}>
      Reset Filters
    </button>
  </div>
);

/* ----------------------------------
   Helpers
----------------------------------- */

const parseFiltersFromURL = (search) => {
  const params = new URLSearchParams(search);
  return {
    city: params.get("city"),
    locality: params.getAll("locality"),
    search: params.get("search"),
    propertyType: params.getAll("propertyType"),
    bhk: params.getAll("bhk"),
    furnishing: params.getAll("furnishing"),
    facing: params.getAll("facing"),
    parkings: params.getAll("parkings"),
  };
};

const normalizeFiltersForAPI = (filters) => {
  const api = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    if (Array.isArray(value) && value.length === 0) return;
    api[key] = value;
  });
  return api;
};

const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, String(value));
    }
  });
  return params.toString();
};

/* ----------------------------------
   API
----------------------------------- */

const fetchProperties = async ({ queryKey }) => {
  const [, { filters, page, sortBy }] = queryKey;

  const normalized = normalizeFiltersForAPI(filters);
  const query = buildQueryString(normalized);

  const res = await API.get(
    `/api/properties?${query}&page=${page}&limit=12&sortBy=${sortBy}`
  );

  return res.data;
};

const fetchFilterOptions = async () => {
  const res = await API.get("/api/properties/filters");
  return res.data;
};

/* ----------------------------------
   Component
----------------------------------- */

const Properties = ({ addToCompare, removeFromCompare, compareList }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");

  /* ---------- Filters from URL ---------- */

  const filters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      ...parseFiltersFromURL(location.search),
    }),
    [location.search]
  );

  /* ---------- React Query ---------- */

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["properties", { filters, page, sortBy }],
    queryFn: fetchProperties,
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const { data: filterOptions = {} } = useQuery({
    queryKey: ["property-filters"],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
  });

  const properties = data?.properties || [];
  const totalMatched = data?.totalMatched || 0;

  /* ---------- Effects ---------- */

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy]);

  /* ---------- Filter helpers ---------- */

  const isFilterActive = (value) => {
    if (Array.isArray(value)) {
      return value.some((v) => String(v || "").trim() !== "");
    }
    return String(value || "").trim() !== "";
  };

  const handleFilterChange = useCallback(
    (key, value) => {
      const params = new URLSearchParams(location.search);

      if (Array.isArray(value)) {
        params.delete(key);
        value.forEach((v) => v && params.append(key, v));
      } else if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      navigate(`/properties?${params.toString()}`, { replace: true });
    },
    [location.search, navigate]
  );

  const debouncedUpdateURL = useMemo(
    () =>
      debounce((value) => {
        handleFilterChange("search", value);
      }, 500),
    [handleFilterChange]
  );

  useEffect(() => {
    return () => debouncedUpdateURL.cancel();
  }, [debouncedUpdateURL]);

  const handleSearchInputChange = (value) => {
    setSearchInput(value);
    debouncedUpdateURL(value);
  };

  const clearFilters = useCallback(() => {
    navigate("/properties");
  }, [navigate]);

  /* ---------- Compare ---------- */

  const compareIdSet = useMemo(
    () =>
      new Set(
        compareList
          .map((i) => (typeof i?._id === "object" ? i._id.$oid : i?._id))
          .filter(Boolean)
      ),
    [compareList]
  );

  const isInCompareList = useCallback(
    (id) => compareIdSet.has(id?.toString()),
    [compareIdSet]
  );

  /* ---------- SEO ---------- */

  const seoData = useMemo(
    () => ({
      title: `${filters.city || "India"} Properties for Sale | CompareProjects`,
      description: `Browse ${totalMatched} verified properties ${
        filters.city ? `in ${filters.city}` : "across India"
      }.`,
    }),
    [filters.city, totalMatched]
  );

  /* ---------- Render ---------- */

  return (
    <div className="properties-page">
      <Seo {...seoData} />

      <div className="main-content-container">
        <div className="filters-column">
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

          {/* Active Filters */}
          <div className="active-filters-container">
            {Object.entries(filters)
              .filter(([_, v]) => isFilterActive(v))
              .flatMap(([key, value]) => {
                const label = FILTER_LABELS[key];
                if (!label) return [];

                return (Array.isArray(value) ? value : [value]).map((v) => (
                  <span key={`${key}-${v}`} className="active-filter">
                    <strong>{label}:</strong>{" "}
                    {formatFilterValue(key, v)}
                    <button onClick={() => handleFilterChange(key, "")}>
                      <X size={12} />
                    </button>
                  </span>
                ));
              })}

            {Object.values(filters).some(isFilterActive) && (
              <button
                className="clear-all-filters"
                onClick={clearFilters}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Property List */}
          <div className="property-list list">
            {isLoading ? (
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
                      addToCompare={addToCompare}
                      isInCompare={isInCompareList(property._id)}
                    />
                    {index === 1 && compareList.length > 0 && (
                      <CompareTray
                        compareList={compareList}
                        removeFromCompare={removeFromCompare}
                        goToComparePage={() => navigate("/compare")}
                      />
                    )}
                  </React.Fragment>
                ))}
                {isFetching && <PropertySkeletons count={3} />}
              </>
            )}
          </div>
        </div>

        <div className="contact-and-sideview">
          <SmartContactForm />
          <PropertyMap
            properties={properties}
            city={filters.city}
            locality={filters.locality}
          />
          <div className="sideProjectsView">
            <ProjectViewSideBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;
