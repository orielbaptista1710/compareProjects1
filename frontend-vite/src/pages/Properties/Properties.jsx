// pages/Properties/Properties
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import Skeleton from 'react-loading-skeleton';
import { X, SlidersHorizontal, ChevronLeft, MessageCircle } from 'lucide-react';

import PropertyCard       from './PropertiesPageComponets/PropertyCard';
import SmartContactForm   from './PropertiesPageComponets/SmartContactForm';
import PropertyMap        from './PropertiesPageComponets/PropertyMap';
import FilterPanel        from './PropertiesPageComponets/FilterComponents/FilterPanel';
import ProjectViewSideBar from '../../components/ProjectViewSideBar';
import CompareTray        from './PropertiesPageComponets/CompareTray';
import ResultsHeader      from './PropertiesPageComponets/FilterComponents/ResultsHeader';
import Pagination         from './PropertiesPageComponets/Pagination';
import Seo                from '../../database/Seo';

import API from '../../api';
import { DEFAULT_FILTERS, formatFilterValue } from '../../utils/filters.schema';
import { FILTER_LABELS } from '../../assests/constants/propertyTypeConfig';

import './Properties.css';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_LIMIT = 12;

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const PropertySkeletons = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="property-card-skeleton">
        <Skeleton height={180} />
        <Skeleton count={3} style={{ marginTop: '0.5rem' }} />
      </div>
    ))}
  </>
);

const EmptyState = ({ onReset }) => (
  <div className="empty-state">
    <h3>No properties found</h3>
    <p>Try adjusting your filters to see more results.</p>
    <button className="reset-filters-btn" onClick={onReset}>
      Reset filters
    </button>
  </div>
);

// ─────────────────────────────────────────────
// URL ↔ Filter helpers
// ─────────────────────────────────────────────

const parseFiltersFromURL = (search) => {
  const p = new URLSearchParams(search);

  const areaMin  = p.get('areaMin');
  const areaMax  = p.get('areaMax');
  const areaUnit = p.get('areaUnit') ?? 'sqft';

  const area =
    areaMin != null || areaMax != null
      ? {
          min:  areaMin  != null ? Number(areaMin)  : 0,
          max:  areaMax  != null ? Number(areaMax)  : 10_000,
          unit: areaUnit,
        }
      : null;

  return {
    city:             p.get('city')              ?? '',
    locality:         p.getAll('locality'),
    search:           p.get('search')            ?? '',
    propertyType:     p.getAll('propertyType'),
    area,
    bhk:              p.getAll('bhk'),
    furnishing:       p.getAll('furnishing'),
    facing:           p.getAll('facing'),
    parkings:         p.getAll('parkings'),
    possessionStatus: p.getAll('possessionStatus'),
    floorLabel:       p.getAll('floorLabel'),
    amenities:        p.getAll('amenities'),
  };
};

const normalizeFiltersForAPI = (filters) => {
  const api = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'area') {
      if (value != null) {
        if (value.min != null && value.min > 0) api.areaMin = value.min;
        if (value.max != null)                  api.areaMax = value.max;
        if (value.unit)                         api.areaUnit = value.unit;
      }
      return;
    }
    if (value === '' || value == null)               return;
    if (Array.isArray(value) && value.length === 0)  return;
    api[key] = value;
  });
  return api;
};

const buildQueryString = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
};

const isFilterActive = (value) => {
  if (Array.isArray(value)) return value.some((v) => String(v ?? '').trim() !== '');
  return String(value ?? '').trim() !== '';
};

// ─────────────────────────────────────────────
// API fetchers
// ─────────────────────────────────────────────

const fetchProperties = async ({ queryKey }) => {
  const [, { filters, page, sortBy }] = queryKey;
  const qs = buildQueryString(normalizeFiltersForAPI(filters));
  const res = await API.get(`/api/properties?${qs}&page=${page}&limit=${PAGE_LIMIT}&sortBy=${sortBy}`);
  return res.data;
};

const fetchFilterOptions = async () => {
  const res = await API.get('/api/properties/filters');
  return res.data;
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

const Properties = ({ addToCompare, removeFromCompare, compareList }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchInput,   setSearchInput  ] = useState('');
  const [page,          setPage         ] = useState(1);
  const [sortBy,        setSortBy       ] = useState('relevance');
  const [isFilterOpen,  setIsFilterOpen ] = useState(false);  // filter drawer
  const [isContactOpen, setIsContactOpen] = useState(false);  // contact bottom sheet

  // URL is the single source of truth for filter state
  const filters = useMemo(
    () => ({ ...DEFAULT_FILTERS, ...parseFiltersFromURL(location.search) }),
    [location.search]
  );

  // ── Data fetching ──────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey:         ['properties', { filters, page, sortBy }],
    queryFn:          fetchProperties,
    keepPreviousData: true,
    staleTime:        30_000,
  });

  const { data: filterOptions = {} } = useQuery({
    queryKey:  ['property-filters'],
    queryFn:   fetchFilterOptions,
    staleTime: 5 * 60_000,
  });

  const properties   = data?.properties  ?? [];
  const totalMatched = data?.totalMatched ?? 0;
  const totalPages   = data?.totalPages   ?? 1;

  // ── Side-effects ───────────────────────────

  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Lock body scroll when any overlay is open
  const anyOverlayOpen = isFilterOpen || isContactOpen;
  useEffect(() => {
    document.body.style.overflow = anyOverlayOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyOverlayOpen]);

  // Escape closes whatever is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setIsFilterOpen(false);
      setIsContactOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ── URL mutation helpers ───────────────────

  const handleFilterChange = useCallback(
    (key, value) => {
      const params = new URLSearchParams(location.search);

      if (key === 'area') {
        params.delete('areaMin');
        params.delete('areaMax');
        params.delete('areaUnit');
        if (value != null) {
          if (value.min != null) params.set('areaMin', String(value.min));
          if (value.max != null) params.set('areaMax', String(value.max));
          if (value.unit)        params.set('areaUnit', value.unit);
        }
      } else if (Array.isArray(value)) {
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

  const debouncedSearch = useMemo(
    () => debounce((v) => handleFilterChange('search', v), 500),
    [handleFilterChange]
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearchInputChange = useCallback(
    (value) => {
      setSearchInput(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const clearFilters = useCallback(() => navigate('/properties'), [navigate]);

  // ── Compare helpers ────────────────────────

  const compareIdSet = useMemo(
    () =>
      new Set(
        compareList
          .map((item) => (typeof item?._id === 'object' ? item._id.$oid : item?._id))
          .filter(Boolean)
      ),
    [compareList]
  );

  const isInCompareList = useCallback(
    (id) => compareIdSet.has(id?.toString()),
    [compareIdSet]
  );

  // ── Active filter chips (derived) ─────────

  const activeChips = useMemo(() => {
    const chips = [];

    Object.entries(filters)
      .filter(([key]) => key !== 'area')
      .filter(([, v]) => isFilterActive(v))
      .forEach(([key, value]) => {
        const label = FILTER_LABELS[key];
        if (!label) return;
        (Array.isArray(value) ? value : [value]).forEach((v) => {
          chips.push({ key, value: v, label, display: formatFilterValue(key, v) });
        });
      });

    if (filters.area != null) {
      chips.push({
        key:     'area',
        value:   filters.area,
        label:   'Area',
        display: formatFilterValue('area', filters.area),
      });
    }

    return chips;
  }, [filters]);

  // ── SEO ────────────────────────────────────

  const seoData = useMemo(
    () => ({
      title: `${filters.city || 'India'} Properties for Sale | CompareProjects`,
      description: `Browse ${totalMatched} verified properties ${
        filters.city ? `in ${filters.city}` : 'across India'
      }.`,
    }),
    [filters.city, totalMatched]
  );

  const closeAllOverlays = useCallback(() => {
    setIsFilterOpen(false);
    setIsContactOpen(false);
  }, []);

  // ── Render ─────────────────────────────────

  return (
    <div className="properties-page">
      <Seo {...seoData} />

      {/* ── Shared dimming backdrop (filter drawer + contact sheet) ── */}
      <div
        className={`overlay-backdrop ${anyOverlayOpen ? 'overlay-backdrop--visible' : ''}`}
        onClick={closeAllOverlays}
        aria-hidden="true"
      />

      {/* ════════════════════════════════════════════════════════
          CONTACT BOTTOM SHEET — tablet + mobile only
          ─────────────────────────────────────────────────────
          • isInSheet={true} tells SmartContactForm to:
              – skip the collapsible header toggle
              – render width:100% (fills the sheet body)
              – show options in a 2-col grid to use the wider space
          • The sheet itself is display:none on desktop (CSS)
      ════════════════════════════════════════════════════════ */}
      <div
        className={`contact-sheet ${isContactOpen ? 'contact-sheet--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Enquire about properties"
      >
        {/* Drag-hint handle */}
        <div className="contact-sheet__handle" aria-hidden="true" />

        <div className="contact-sheet__header">
          <span className="contact-sheet__title">Get Expert Help</span>
          <button
            type="button"
            className="contact-sheet__close"
            onClick={() => setIsContactOpen(false)}
            aria-label="Close enquiry form"
          >
            <X size={18} />
          </button>
        </div>

        <div className="contact-sheet__body">
          {/*
           * isInSheet=true:
           *   - removes the purple toggle header (sheet already has its own header)
           *   - keeps the form always expanded
           *   - renders option buttons in a 2-col grid
           *   - width: 100% fills the sheet body
           */}
          <SmartContactForm isInSheet />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MAIN LAYOUT
      ════════════════════════════════════════════════════════ */}
      <div className="main-content-container">

        {/* ── Filter column / drawer ───────────────────────────────────── */}
        <div className={`filters-column ${isFilterOpen ? 'filters-open' : ''}`}>

          <div className="filter-drawer-header">
            <button
              type="button"
              className="filter-drawer-back"
              onClick={() => setIsFilterOpen(false)}
              aria-label="Close filters"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            {activeChips.length > 0 && (
              <span className="filter-drawer-chip-count">
                {activeChips.length} active
              </span>
            )}
          </div>

          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={clearFilters}
            filterOptions={filterOptions}
            searchQuery={searchInput}
            onSearchChange={handleSearchInputChange}
          />
        </div>

        {/* ── Property list ─────────────────────────────────────────────── */}
        <div className="property-list-container">

          {/* ── Mobile / tablet top bar ──────────────────────────────────
              [ Filters pill ]  [ Sort — flex:1 ]  [ Enquire pill ]
              Hidden on desktop via CSS.
          ─────────────────────────────────────────────────────────────── */}
          <div className="mobile-filter-bar">

            <button
              type="button"
              className={`mobile-filter-btn ${activeChips.length > 0 ? 'has-filters' : ''}`}
              onClick={() => setIsFilterOpen(true)}
              aria-label={`Open filters${activeChips.length > 0 ? `, ${activeChips.length} active` : ''}`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeChips.length > 0 && (
                <span className="mobile-filter-count">{activeChips.length}</span>
              )}
            </button>

            <select
              className="mobile-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort properties"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest first</option>
            </select>

            <button
              type="button"
              className="mobile-enquire-btn"
              onClick={() => setIsContactOpen(true)}
              aria-label="Enquire about properties"
            >
              <MessageCircle size={14} />
              Enquire
            </button>

          </div>

          <ResultsHeader
            totalMatched={totalMatched}
            filters={filters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            page={page}
            limit={PAGE_LIMIT}
            isLoading={isLoading}
            isFetching={isFetching}
          />

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="active-filters-container">
              {activeChips.map(({ key, value, label, display }) => (
                <span key={`${key}-${value}`} className="active-filter">
                  <strong>{label}:</strong> {display}
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        key,
                        Array.isArray(filters[key])
                          ? filters[key].filter((v) => v !== value)
                          : ''
                      )
                    }
                    aria-label={`Remove ${label}: ${display}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}

              <button
                type="button"
                className="clear-all-filters"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Cards */}
          <div className="property-list">
            {isLoading ? (
              <PropertySkeletons />
            ) : properties.length === 0 ? (
              <EmptyState onReset={clearFilters} />
            ) : (
              <>
                {properties.map((property, index) => {
                  const isSecond        = index === 1;
                  const isSixthMultiple = (index + 1) % 6 === 0 && !isSecond;
                  const showTray        = compareList.length > 0 && (isSecond || isSixthMultiple);

                  return (
                    <React.Fragment key={property._id}>
                      <PropertyCard
                        property={property}
                        addToCompare={addToCompare}
                        isInCompare={isInCompareList(property._id)}
                      />
                      {showTray && (
                        <CompareTray
                          compareList={compareList}
                          removeFromCompare={removeFromCompare}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {isFetching && !isLoading && <PropertySkeletons count={3} />}
              </>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isFetching={isFetching}
          />
        </div>

        {/* ── Right sidebar — desktop only ────────────────────────────────
            SmartContactForm here has no isInSheet prop (defaults false),
            so it renders with its normal collapsible toggle header.
            The sidebar CSS constrains it to ~380px width.
        ─────────────────────────────────────────────────────────────── */}
        <div className="contact-and-sideview">
          <SmartContactForm />
          <PropertyMap
            properties={properties}
            city={filters.city}
            locality={filters.locality}
          />
          <div className="side-projects-view">
            <ProjectViewSideBar />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Properties;