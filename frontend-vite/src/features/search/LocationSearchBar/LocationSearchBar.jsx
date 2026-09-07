// src/pages/Home/HomePageComponents/LocationSearchBar.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

import API from "../../../api";
import { useDebounce } from "../../../hooks/useDebounceHook";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import "./LocationSearchBar.css";

const RECENT_KEY = "recentLocationSearches";
const MAX_RECENT = 5;

/**
 * Retrieves recent items from localStorage
 * @returns {Array} Returns an array of recent items or empty array if not found or error occurs
 */
const getRecent = () => {
  try {
    // Try to parse and return the stored data from localStorage
    // Return empty array if parsing fails or item doesn't exist
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    // Return empty array if any error occurs during parsing
    return [];
  }
};

const saveRecent = (item) => {
  const existing = getRecent().filter((r) => r.label !== item.label);
  const updated = [item, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};

/**
 * Uncontrolled-ish location typeahead. Reports the *selected* location object
 * (or plain free text if the user never picks a suggestion) via onSelect.
 * Does not touch CityContext or the URL — that's the parent's job.
 */
export default function LocationSearchBar({ onSelect, placeholder = "Search locality, city..." }) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [selectedItem, setSelectedItem] = useState(null);

  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const debouncedQuery = useDebounce(inputValue, 300);

  useOutsideClick(open, [wrapperRef], () => setOpen(false));

  useEffect(() => {
    const query = debouncedQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    API.get(`/api/locations/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        setSuggestions(res.data.results || []);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") console.error("Location search failed:", err);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

const commitSelection = useCallback(
  (item) => {
    if (item.type === "city" || item.type === "locality" || item.type === "locality-group") {
      setSelectedItem(item);
      setInputValue("");
    } else {
      setInputValue(item.label);
    }
    setOpen(false);
    setSuggestions([]);
    saveRecent(item);
    onSelect(item);
  },
  [onSelect]
);

const clearSelection = () => {
  setSelectedItem(null);
  onSelect({ type: "text", label: "", city: null, locality: null });
};

  const handleInputChange = (e) => {
  const value = e.target.value;
  setInputValue(value);
  setOpen(true);

  if (!selectedItem) {
    onSelect({ type: "text", label: value, city: null, locality: null });
  }
  // else: typing while a city/locality chip is active is treated as a
  // separate suggestion lookup — it doesn't touch the parent's selection
  // until the user commits one from the dropdown.
};

  const listToShow = inputValue.trim().length >= 2 ? suggestions : getRecent();
  const showEmptyState = inputValue.trim().length >= 2 && !isLoading && suggestions.length === 0;

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, listToShow.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && listToShow[activeIndex]) {
        commitSelection(listToShow[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
  <div className="lsb-wrapper" ref={wrapperRef}>
    <Search size={18} className="lsb-icon" />

    {selectedItem && (
      <span className="lsb-chip">
        {selectedItem.city || selectedItem.label}
        <button
          type="button"
          className="lsb-chip-remove"
          onClick={clearSelection}
          aria-label="Remove location"
        >
          ×
        </button>
      </span>
    )}

    <input
      type="text"
      className="lsb-input"
      value={inputValue}
      placeholder={selectedItem ? "Add more..." : placeholder}
      onChange={handleInputChange}
      onFocus={() => setOpen(true)}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-expanded={open}
      aria-autocomplete="list"
      aria-controls="lsb-listbox"
    />
    {isLoading && <Loader2 size={16} className="lsb-spinner" />}

      {open && listToShow.length > 0 && (
        <ul id="lsb-listbox" className="lsb-dropdown" role="listbox">
          {inputValue.trim().length < 2 && (
            <li className="lsb-section-label">Recent searches</li>
          )}

          
          {listToShow.map((item, index) => (
            <li
              key={`${item.type}-${item.label}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`lsb-option ${index === activeIndex ? "lsb-option-active" : ""}`}
              onMouseDown={() => commitSelection(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin size={16} className="lsb-option-icon" />
              <div className="lsb-option-text">
                <span className="lsb-option-title">
                  {item.type === "locality-group" ? item.label.split(" — ")[0] : item.label.split(",")[0]}
                  {item.type === "locality-group" && <span className="lsb-tag lsb-tag-group">All areas</span>}
                </span>
                <span className="lsb-option-subtitle">
                  {item.type === "city" ? "City" : item.city}
                  {item.type === "locality-group" && ` • ${item.areaCount} areas`}
                </span>
              </div>
            </li>
          ))}


          
        </ul>
      )}

      {open && showEmptyState && (
        <div className="lsb-dropdown">
          <p className="lsb-empty">No matches — press Enter to search "{inputValue}" anyway</p>
        </div>
      )}
    </div>
  );
};