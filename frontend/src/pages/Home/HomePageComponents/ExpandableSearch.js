import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import "./ExpandableSearch.css";
import { Send, Sparkles, Home } from "lucide-react";
import PropertyCardSmall from "../HomePageComponents/PropertyCardSmall";
import API from "../../../api";

const MemoizedPropertyCard = React.memo(PropertyCardSmall);

/* ---------------- Debounce Hook ---------------- */
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

const ExpandableSearch = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFuzzy, setIsFuzzy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const debouncedQuery = useDebounce(query);

  /* ---------------- Suggestions ---------------- */
  const quickSuggestions = useMemo(
    () => [
      "Best neighborhoods",
      "Price trends",
      "Compare cities",
      "Investment tips",
    ],
    []
  );

  /* ---------------- Reset highlight ---------------- */
  useEffect(() => {
    setHighlightIndex(-1);
  }, [debouncedQuery]);

  /* ---------------- Fetch Results ---------------- */
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsFuzzy(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setIsLoading(true);
        setError("");

        const { data } = await API.get(
          `/api/properties/search?query=${encodeURIComponent(
            trimmed
          )}&limit=3`,
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
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  /* ---------------- Navigation ---------------- */
  const navigateToProperty = useCallback(
    (propertyId) => {
      navigate(`/property/${propertyId}`);
      setQuery("");
      setResults([]);
    },
    [navigate]
  );

  /* ---------------- Submit ---------------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (results.length > 0) {
      navigateToProperty(results[0]._id);
    }
  };

  /* ---------------- Keyboard ---------------- */
  const handleKeyDown = (e) => {
    if (!results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) =>
        Math.min(i + 1, results.length - 1)
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) =>
        Math.max(i - 1, 0)
      );
    }

    if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      navigateToProperty(results[highlightIndex]._id);
    }
  };

  const shouldShowDropdown =
    debouncedQuery.trim().length >= 2 &&
    (isLoading || error || results.length > 0);

  return (
    <div className="search-wrapper">
      <div className="ai-search-container">
        <form
          className="ai-search-form"
          onSubmit={handleSubmit}
          role="search"
        >
          <div className="ai-input-wrapper">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="ai-search-input"
              placeholder="Search properties, prices, trends..."
              aria-autocomplete="list"
              aria-expanded={shouldShowDropdown}
            />
          </div>

          <button
            className="ai-search-submit"
            type="submit"
            aria-label="Search"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {query.length < 2 && (
        <div className="quick-suggestions-container">
          {quickSuggestions.map((s) => (
            <button
              key={s}
              className="suggestion-pill"
              onClick={() => setQuery(s)}
            >
              <Sparkles size={12} />
              {s}
            </button>
          ))}
        </div>
      )}

      {shouldShowDropdown && (
        <div
          className="search-results-dropdown"
          ref={dropdownRef}
          role="listbox"
        >
          {isLoading && (
            <div className="search-loading">
              <span className="loading-spinner" />
              Searching…
            </div>
          )}

          {error && !isLoading && (
            <div className="search-error">
              {error}
            </div>
          )}

          {!isLoading && !error && results.length === 0 && (
            <div className="no-results">
              <Home size={28} />
              <p>No properties found</p>
            </div>
          )}

          {isFuzzy && !isLoading && results.length > 0 && (
            <div className="fuzzy-indicator">
              Showing best matches
            </div>
          )}

          {results.map((property, i) => (
            <div
              key={property._id}
              className={`property-result-item ${
                i === highlightIndex ? "highlighted" : ""
              }`}
              role="option"
              aria-selected={i === highlightIndex}
              onClick={() =>
                navigateToProperty(property._id)
              }
            >
              <MemoizedPropertyCard property={property} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;