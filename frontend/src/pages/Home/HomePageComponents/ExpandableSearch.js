import React, { useState, useRef, useEffect, useCallback, useMemo} from 'react';
import './ExpandableSearch.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import PropertyCardSmall from '../HomePageComponents/PropertyCardSmall';
import API from '../../../api';

const MemoizedPropertyCard = React.memo(PropertyCardSmall);

// Debounce Hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ExpandableSearch = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isFuzzy, setIsFuzzy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  // Toggle Search
  const toggleSearch = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      if (!newState) {
        setQuery('');
        setResults([]);
        setError('');
        setIsFuzzy(false);
        setHighlightIndex(-1);
      }
      return newState;
    });
  }, []);

  // Auto-focus when expanded
  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  // Fetch Results
  useEffect(() => {
    if (!isExpanded) return;

    const trimmed = debouncedQuery.trim();

    // Hide dropdown if query is too short
    if (trimmed.length < 2) {
      setResults([]);
      setError('');
      setIsFuzzy(false);
      return;
    }

    const controller = new AbortController(); // AbortController to cancel the fetch request- this is done because the fetch request is a promise and we want to cancel it if the user types something else before the fetch request is complete

    const fetchResults = async () => { //fetchResults is an async function that fetches the results from the API
      try {
        setIsLoading(true);
        setError('');

        const { data } = await API.get( //here data is the response from the API
          `/api/properties/search?query=${encodeURIComponent(trimmed)}&limit=3`,
          { signal: controller.signal } //here we are passing the signal to the fetch request so that we can cancel it if the user types something else before the fetch request is complete
        );

        if (Array.isArray(data)) {      //if the data is an array, we set the results to the first 3 elements of the array and set isFuzzy to false- this is because the data is an array of properties and we want to show the first 3 properties that match the query
          setResults(data.slice(0, 3));
          setIsFuzzy(false);            //what is fuzzy? - fuzzy is a boolean value that is set to true if the query is not an exact match for any of the properties in the database- this is done because if the query is not an exact match, we want to show the closest match to the query
        } else {
          setResults(data.properties?.slice(0, 3) || []);
          setIsFuzzy(Boolean(data.fuzzy));
        }

      } catch (err) {                       //what happens here? - if there is an error, we check if the error is an AbortError and if it is not, we log the error to the console and set the error message to "Failed to fetch search results."
        if (err.name !== "AbortError") {    
          console.error(err);
          setError("Failed to fetch search results.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [debouncedQuery, isExpanded]);

  // Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      const selected = results[highlightIndex];
      console.log("Selected property:", selected);
      window.location.href = `/property/${selected._id}`; // window.location.herf is used to redirect the user to the property page
      //why use window.location.href instead of navigate? - because navigate is used to navigate to a different page in the react router and it is not available in this component
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsExpanded(false);
      setHighlightIndex(-1);
    }
  };

  // Close dropdown on outside click
  const handleClickOutside = useCallback((e) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      inputRef.current &&
      !inputRef.current.contains(e.target)
    ) {
      setIsExpanded(false);
      setHighlightIndex(-1);
    }
  }, []);

  useEffect(() => {   // this is done to make sure that the handleClickOutside function is called when the user clicks outside the dropdown
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);  // what does removeEventListener do? - it removes the event listener that was added in the useEffect hook- what is an event listener? - an event listener is a function that is called when a specific event occurs- in this case, the event is a mouse click
  }, [handleClickOutside]);

  // Submit Handler
  const handleSubmitt = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      console.log("Search submitted:", query);
      window.location.href = `/search?query=${query}`;
    }
  };

  // Hide dropdown unless user typed >= 2 chars
  const shouldShowDropdown = useMemo(() => {
    return (
      isExpanded &&
      debouncedQuery.trim().length >= 2 &&
      (isLoading || error || results.length > 0)
    );
  }, [isExpanded, debouncedQuery, isLoading, error, results.length]);

  return (
    <div className="search-wrapper">
      <div className={`ai-search-container ${isExpanded ? "expanded" : ""}`}>
        <button className="ai-search-toggle" onClick={toggleSearch}>
          {isExpanded ? <FontAwesomeIcon icon={faXmark} /> : <FontAwesomeIcon icon={faSearch} />}
        </button>

        <form className="ai-search-form" onSubmit={handleSubmitt}>
          <input
            type="text"
            ref={inputRef}
            className="ai-search-input"
            placeholder="Search properties, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="ai-search-submit">
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </form>
      </div>

      {/* DROPDOWN */}
      {shouldShowDropdown && (
        <div className="search-results-dropdown" ref={dropdownRef}>
          {isLoading && <div className="search-loading">Loading...</div>}
          {error && <div className="search-error">{error}</div>}

          {!isLoading && !error && (
            <>
              {isFuzzy && (
                <div className="fuzzy-info">
                  Showing approximate matches for your search.
                </div>
              )}

              {results.length > 0 ? (
                <div className="property-results">
                  {results.map((property, index) => (
                    <div
                      key={property._id}
                      className={`property-result-item ${
                        index === highlightIndex ? "highlighted" : ""
                      }`}
                    >
                      <MemoizedPropertyCard
                        property={{
                          ...property,
                          image: property.images?.[0] || "https://via.placeholder.com/120x80",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">No properties found</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;
