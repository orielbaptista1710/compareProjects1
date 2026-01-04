import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from "react";
import "./ExpandableSearch.css";
import {
  Search,
  X,
  Send,
  Sparkles,
  Home
} from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
      "Investment tips"
    ],
    []
  );

  /* ---------------- Toggle ---------------- */
  const toggleSearch = useCallback(() => {
    setIsExpanded((prev) => {
      if (prev) {
        setQuery("");
        setResults([]);
        setError("");
        setIsFuzzy(false);
        setHighlightIndex(-1);
      }
      return !prev;
    });
  }, []);

  /* ---------------- Autofocus ---------------- */
  useEffect(() => {
    if (isExpanded) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isExpanded]);

  /* ---------------- Fetch Results ---------------- */
  useEffect(() => {
    if (!isExpanded) return;

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
          `/api/properties/search?query=${encodeURIComponent(trimmed)}&limit=3`,
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
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Unable to fetch results");
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery, isExpanded]);

  /* ---------------- Keyboard Navigation ---------------- */
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

    if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      window.location.href = `/property/${results[highlightIndex]._id}`;
    }

    if (e.key === "Escape") {
      setIsExpanded(false);
    }
  };

  /* ---------------- Outside Click ---------------- */
  const handleClickOutside = useCallback((e) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      !e.target.closest(".ai-search-container")
    ) {
      setIsExpanded(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  /* ---------------- Derived ---------------- */
  const shouldShowDropdown =
    isExpanded &&
    debouncedQuery.trim().length >= 2 &&
    (isLoading || error || results.length > 0);

  /* ---------------- Render ---------------- */
  return (
    <div className="search-wrapper">
      <div
        className={`ai-search-container ${isExpanded ? "expanded" : ""}`}
      >
        <button
          className="ai-search-toggle"
          onClick={toggleSearch}
          aria-label="Toggle AI search"
        >
          {!isExpanded ? (
            <div className="ask-rubi-minimal">
              <Sparkles size={14} />
              <span>Ask Rubi</span>
            </div>
          ) : (
            <Search size={18} />
          )}
        </button>

        {isExpanded && (
          <form className="ai-search-form">
            <div className="ai-input-wrapper">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="ai-search-input"
                placeholder="Ask about properties, prices, trends..."
              />
            </div>

            <div className="ai-action-buttons">
              <button className="ai-search-submit" type="submit">
                <Send size={16} />
              </button>
              <button
                type="button"
                className="ai-search-close"
                onClick={toggleSearch}
              >
                <X size={16} />
              </button>
            </div>
          </form>
        )}
      </div>

      {isExpanded && query.length < 2 && (
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
              <span className="spinner" />
              Searching…
            </div>
          )}

          {!isLoading && !error && results.length === 0 && (
            <div className="no-results">
              <Home size={28} />
              <p>No properties found</p>
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
