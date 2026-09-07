// src/pages/Home/HomePageComponents/ExpandableSearch.jsx
import React, { useState, 
  useRef, 
  useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Home } from "lucide-react";
import PropertyCardSmall from "../Propertycardsmall/PropertyCardSmall";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useDebounce } from "../../../hooks/useDebounceHook";

import API from "../../../api";
import "./ExpandableSearch.css";

const MemoizedPropertyCard = React.memo(PropertyCardSmall);
const LISTBOX_ID = "search-results-listbox";

const ExpandableSearch = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFuzzy, setIsFuzzy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [prevDebouncedQuery, setPrevDebouncedQuery] = useState("");

  // const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  if (debouncedQuery !== prevDebouncedQuery) {
    setPrevDebouncedQuery(debouncedQuery);
    setHighlightIndex(-1);
  }

  const trimmedQuery = debouncedQuery.trim();
  const trimmedRawQuery = query.trim();

  // FIX: previously "loading" and "show dropdown" were both derived only from
  // debouncedQuery, so for ~350ms after every keystroke the dropdown kept
  // showing the *previous* query's results/no-results state as if it matched
  // what's currently typed. isPendingDebounce catches that window.
  const isPendingDebounce = trimmedRawQuery !== trimmedQuery;
  const isBusy = isLoading || (isPendingDebounce && trimmedRawQuery.length >= 2);

  // Gate visibility off the raw query length too, so clearing the input
  // hides the dropdown immediately instead of waiting for the debounce.
  const shouldShowDropdown =
    trimmedRawQuery.length >= 2 && (isBusy || error || results.length > 0);

  const closeSearch = useCallback(() => {
    // FIX: abort any in-flight request before clearing state, so a late
    // response can't repopulate results/reopen the dropdown after close.
    abortRef.current?.abort();
    setResults([]);
    setError("");
    setQuery("");
  }, []);

  useOutsideClick(shouldShowDropdown, [wrapperRef], closeSearch);
  useEscapeKey(shouldShowDropdown, closeSearch);

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setIsLoading(true);
        setError("");

        const { data } = await API.get(
          `/api/properties/search?query=${encodeURIComponent(trimmedQuery)}&limit=3`,
          { signal: controller.signal }
        );

        if (Array.isArray(data)) {
          setResults(data);
          setIsFuzzy(false);
        } else {
          setResults(data.properties || []);
          setIsFuzzy(Boolean(data.fuzzy));
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Search error:", err);
          setError("Unable to fetch results");
          setResults([]);
          setIsFuzzy(false);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [trimmedQuery]);

  const navigateToProperty = useCallback(
    (propertyId) => {
      setQuery("");
      setResults([]);
      navigate(`/property/${propertyId}`);
    },
    [navigate]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isBusy) return; // FIX: don't navigate to a stale first result mid-fetch
    if (highlightIndex >= 0 && results[highlightIndex]) {
      navigateToProperty(results[highlightIndex]._id);
    } else if (results.length > 0) {
      navigateToProperty(results[0]._id);
    }
  };

  const handleKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && highlightIndex >= 0 && !isBusy) {
      e.preventDefault();
      navigateToProperty(results[highlightIndex]._id);
    }
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="ai-search-container">
        <form className="ai-search-form" onSubmit={handleSubmit} role="search">
          <div className="ai-input-wrapper">
            <input
              // ref={inputRef}
              id="property-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="ai-search-input"
              placeholder="Search properties"
              aria-label="Search properties"
              aria-autocomplete="list"
              aria-expanded={shouldShowDropdown}
              aria-controls={shouldShowDropdown ? LISTBOX_ID : undefined}
              aria-activedescendant={
                highlightIndex >= 0 ? `search-result-${highlightIndex}` : undefined
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
        <div id={LISTBOX_ID} className="search-results-dropdown" role="listbox" aria-label="Property search results">
          {isBusy && (
            <div className="search-loading" role="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              Searching…
            </div>
          )}
          {error && !isBusy && <div className="search-error" role="alert">{error}</div>}
          {!isBusy && !error && results.length === 0 && (
            <div className="no-results" role="status">
              <Home size={28} aria-hidden="true" />
              <p>No properties found</p>
            </div>
          )}
          {isFuzzy && !isBusy && results.length > 0 && (
            <div className="fuzzy-indicator" aria-live="polite">Showing best matches</div>
          )}
          {!isBusy && !error && results.map((property, i) => (
            <div
              key={property._id}
              id={`search-result-${i}`}
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