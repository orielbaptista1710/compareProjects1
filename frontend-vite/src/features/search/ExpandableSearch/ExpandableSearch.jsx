// src/pages/Home/HomePageComponents/ExpandableSearch.jsx
import React, { useState,
  useRef, useMemo, useId,
  useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Send, Home } from "lucide-react";
import PropertyCardSmall from "../Propertycardsmall/PropertyCardSmall";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useDebounce } from "../../../hooks/useDebounceHook";

import API from "../../../api/api";
import "./ExpandableSearch.css";

const MemoizedPropertyCard = React.memo(PropertyCardSmall);
const NO_RESULTS = [];
const RATE_LIMIT_MESSAGE = "Too many searches — please wait a moment and try again.";

// react-query passes an AbortSignal and cancels the request when the query
// key changes, so a slow response for an older query is simply dropped.
const fetchSearchResults = async ({ queryKey: [, query], signal }) => {
  const { data } = await API.get(
    `/api/properties/search?query=${encodeURIComponent(query)}&limit=3`,
    { signal }
  );
  return Array.isArray(data)
    ? { results: data, fuzzy: false }
    : { results: data.properties || [], fuzzy: Boolean(data.fuzzy) };
};

const ExpandableSearch = () => {
  const navigate = useNavigate();
  const idPrefix = useId();
  const listboxId = `${idPrefix}-listbox`;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [prevDebouncedQuery, setPrevDebouncedQuery] = useState("");

  const wrapperRef = useRef(null);
  // Stable array so useOutsideClick doesn't re-subscribe on every render.
  const outsideClickRefs = useMemo(() => [wrapperRef], []);

  const debouncedQuery = useDebounce(query, 350);

  if (debouncedQuery !== prevDebouncedQuery) {
    setPrevDebouncedQuery(debouncedQuery);
    setHighlightIndex(-1);
  }

  const trimmedQuery = debouncedQuery.trim();
  const trimmedRawQuery = query.trim();

  const { data, error: queryError, isFetching, refetch } = useQuery({
    queryKey: ["property-search", trimmedQuery],
    queryFn: fetchSearchResults,
    enabled: trimmedQuery.length >= 2,
    staleTime: 60_000,
    // No automatic retries: retrying a 429 only hits the limit again, and the
    // user can retry with Enter (see handleSubmit).
    retry: false,
  });

  const results = data?.results ?? NO_RESULTS;
  const isFuzzy = Boolean(data?.fuzzy);
  const error = queryError
    ? queryError.response?.status === 429 ? RATE_LIMIT_MESSAGE : "Unable to fetch results"
    : "";

  // Busy while the debounce hasn't caught up with the input, or while the
  // debounced query is being fetched.
  const isPendingDebounce = trimmedRawQuery !== trimmedQuery;
  const isBusy =
    trimmedRawQuery.length >= 2 &&
    (isPendingDebounce || (trimmedQuery.length >= 2 && isFetching));

  // Gate visibility off the raw query length too, so clearing the input
  // hides the dropdown immediately instead of waiting for the debounce.
  const shouldShowDropdown = isOpen && trimmedRawQuery.length >= 2;

  // Closing only hides the dropdown — the typed text stays, so a stray tap
  // (or the start of a scroll on mobile) doesn't wipe what the user wrote.
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightIndex(-1);
  }, []);

  useOutsideClick(shouldShowDropdown, outsideClickRefs, closeDropdown);
  useEscapeKey(shouldShowDropdown, closeDropdown);

  // Keep the keyboard-highlighted result visible in a scrolling dropdown.
  useEffect(() => {
    if (highlightIndex < 0) return;
    document
      .getElementById(`${idPrefix}-option-${highlightIndex}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [highlightIndex, idPrefix]);

  const navigateToProperty = useCallback(
    (propertyId) => {
      setQuery("");
      setIsOpen(false);
      navigate(`/property/${propertyId}`);
    },
    [navigate]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // Don't navigate to a result that belongs to a different query.
    if (trimmedRawQuery.length < 2 || isBusy) return;
    setIsOpen(true);
    if (error) {
      refetch(); // Enter retries a failed search
      return;
    }
    const target = results[highlightIndex] ?? results[0];
    if (target) navigateToProperty(target._id);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    if (isBusy || !results.length) return;
    if (e.key === "ArrowDown") {
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else {
      setHighlightIndex((i) => Math.max(i - 1, 0));
    }
  };

  const showResults = shouldShowDropdown && !isBusy && !error;

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="ai-search-container">
        <form className="ai-search-form" onSubmit={handleSubmit} role="search">
          <div className="ai-input-wrapper">
            <input
              id="property-search-input"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className="ai-search-input"
              placeholder="Search properties"
              aria-label="Search properties"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={shouldShowDropdown}
              aria-controls={shouldShowDropdown ? listboxId : undefined}
              aria-activedescendant={
                showResults && highlightIndex >= 0
                  ? `${idPrefix}-option-${highlightIndex}`
                  : undefined
              }
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button className="ai-search-submit" type="submit" aria-label="Search">
            <Send size={16} />
          </button>
        </form>
      </div>

      {shouldShowDropdown && (
        <div id={listboxId} className="search-results-dropdown" role="listbox" aria-label="Property search results">
          {isBusy && (
            <div className="search-loading" role="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              Searching…
            </div>
          )}
          {error && !isBusy && <div className="search-error" role="alert">{error}</div>}
          {showResults && results.length === 0 && (
            <div className="no-results" role="status">
              <Home size={28} aria-hidden="true" />
              <p>No properties found</p>
            </div>
          )}
          {showResults && isFuzzy && results.length > 0 && (
            <div className="fuzzy-indicator" aria-live="polite">Showing best matches</div>
          )}
          {showResults && results.map((property, i) => (
            <div
              key={property._id}
              id={`${idPrefix}-option-${i}`}
              className={`property-result-item ${i === highlightIndex ? "highlighted" : ""}`}
              role="option"
              aria-selected={i === highlightIndex}
              onClick={(e) => {
                e.stopPropagation();
                navigateToProperty(property._id);
              }}
            >
              <MemoizedPropertyCard property={property} disableNavigation />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;
