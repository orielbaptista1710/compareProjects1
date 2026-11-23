// src/pages/Home/HomePageComponents/LocationSearchBar.jsx
import { useState, useRef, useEffect, useCallback, useId } from "react";
import { MapPin, Loader2 } from "lucide-react";

import API from "../../../api/api";
import { useDebounce } from "../../../hooks/useDebounceHook";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import "./LocationSearchBar.css";

const RECENT_KEY = "recentLocationSearches";
const MAX_RECENT = 5;

/**
 * Recent searches from localStorage. Returns [] when storage is blocked
 * (private mode, in-app browsers) or holds anything but a list of items with
 * a text label, so corrupted data can't crash the dropdown.
 */
const getRecent = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.filter((r) => r && typeof r.label === "string" && typeof r.type === "string");
  } catch {
    return [];
  }
};

// Best effort: a full or blocked storage must never stop a selection going through.
const saveRecent = (item) => {
  try {
    const existing = getRecent().filter((r) => r.label !== item.label);
    const updated = [item, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore: recent searches are a convenience only
  }
};

const MAX_SELECTED = 5;
const MAX_LOCALITIES = 25; // a group chip can carry many, and each becomes a URL param

const itemKey = (item) => `${item.type}|${item.city}|${item.label}`;

// Only a locality / group that names its city and areas can be combined with
// others; anything else (e.g. an old or odd recent search) just replaces.
const isArea = (item) =>
  (item.type === "locality" || item.type === "locality-group") &&
  typeof item.city === "string" && item.city !== "" &&
  Array.isArray(item.localities) && item.localities.length > 0;

const localityCount = (items) => new Set(items.flatMap((i) => i.localities)).size;

// What a chip says: the locality for a locality, "<area> (all areas)" for a
// group, the city for a city. (It used to say the city for everything.)
const chipLabel = (item) => {
  if (item.type === "locality-group") return `${item.label.split(" — ")[0]} (all areas)`;
  if (item.type === "locality") return item.label.split(",")[0];
  return item.city || item.label;
};

// Several localities of one city can be combined; a city, or anything from
// another city, replaces the selection (the listing page filters one city).
// Returns { items, notice }: notice is set when the pick was refused.
const nextSelection = (current, item) => {
  if (item.type === "city" || !isArea(item)) return { items: [item] };
  const sameCity = current.length > 0 && isArea(current[0]) && current[0].city === item.city;
  if (!sameCity) return { items: [item] };
  if (current.some((c) => itemKey(c) === itemKey(item))) return { items: current, notice: "Already added" };
  const items = [...current, item];
  if (items.length > MAX_SELECTED || localityCount(items) > MAX_LOCALITIES) {
    return { items: current, notice: "Limit reached — remove one to add more" };
  }
  return { items };
};

// One object for the parent: the item itself, or all localities merged.
const combine = (items) =>
  items.length === 1
    ? items[0]
    : {
        type: "locality",
        label: `${items.map(chipLabel).join(", ")}, ${items[0].city}`,
        city: items[0].city,
        localities: [...new Set(items.flatMap((i) => i.localities))],
      };

const textSelection = (label) => ({ type: "text", label, city: null, locality: null });

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

  const [selectedItems, setSelectedItems] = useState([]);
  const [notice, setNotice] = useState("");
  // Latest selection, read synchronously so two quick picks before a re-render
  // build on each other instead of on a stale copy.
  const selectedRef = useRef([]);
  const updateSelected = (items) => {
    selectedRef.current = items;
    setSelectedItems(items);
  };

  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const debouncedQuery = useDebounce(inputValue, 300);

  useOutsideClick(open, [wrapperRef], () => setOpen(false));

  useEffect(() => {
    const query = debouncedQuery.trim();

    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when query is cleared/too short, not a cascading-render loop - CHECK THIS 
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
    setOpen(false);
    setSuggestions([]);
    if (item.type === "city" || item.type === "locality" || item.type === "locality-group") {
      const { items, notice: refused } = nextSelection(selectedRef.current, item);
      if (refused) {
        // Nothing changes. Empty the box so the placeholder (which says why)
        // is actually visible; a placeholder is hidden while text is typed.
        setNotice(refused);
        setInputValue("");
        return;
      }
      saveRecent(item);
      setNotice("");
      updateSelected(items);
      setInputValue("");
      onSelect(combine(items));
    } else {
      // Free text replaces any chips, so what's shown is what gets searched.
      saveRecent(item);
      setNotice("");
      updateSelected([]);
      setInputValue(item.label);
      onSelect(item);
    }
  },
  [onSelect]
);

const removeItem = (item) => {
  const next = selectedRef.current.filter((i) => itemKey(i) !== itemKey(item));
  setNotice("");
  updateSelected(next);
  // With no chips left, the parent follows whatever is typed in the box.
  onSelect(next.length ? combine(next) : textSelection(inputValue));
};

  const handleInputChange = (e) => {
  const value = e.target.value;
  setInputValue(value);
  setOpen(true);
  // The list changes as you type; a highlight from the old list must not
  // let Enter pick an unrelated option.
  setActiveIndex(-1);
  setNotice("");

  if (selectedRef.current.length === 0) {
    onSelect(textSelection(value));
  }
  // else: typing while a city/locality chip is active is treated as a
  // separate suggestion lookup — it doesn't touch the parent's selection
  // until the user commits one from the dropdown.
};

  const listToShow = inputValue.trim().length >= 2 ? suggestions : getRecent();
  const showEmptyState = inputValue.trim().length >= 2 && !isLoading && suggestions.length === 0;

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(-1); // don't let Enter pick what was highlighted before Escape
      }
      return;
    }
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

  const listVisible = open && listToShow.length > 0;
  // Unique per instance, so two bars on one page don't share ids.
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index) => `${baseId}-option-${index}`;

  return (
  <div className="lsb-wrapper" ref={wrapperRef}>
    <MapPin size={18} className="lsb-icon" aria-hidden="true" />

    {selectedItems.map((item) => (
      <span className="lsb-chip" key={itemKey(item)}>
        {chipLabel(item)}
        <button
          type="button"
          className="lsb-chip-remove"
          onClick={() => removeItem(item)}
          aria-label={`Remove ${chipLabel(item)}`}
        >
          ×
        </button>
      </span>
    ))}

    <input
      type="text"
      className="lsb-input"
      value={inputValue}
      placeholder={notice || (selectedItems.length ? "Add more..." : placeholder)}
      onChange={handleInputChange}
      onFocus={() => setOpen(true)}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-label="Search location"
      aria-expanded={listVisible}
      aria-autocomplete="list"
      aria-controls={listVisible ? listboxId : undefined}
      aria-activedescendant={listVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined}
    />
    {isLoading && <Loader2 size={16} className="lsb-spinner" aria-hidden="true" />}

      {listVisible && (
        <ul id={listboxId} className="lsb-dropdown" role="listbox">
          {inputValue.trim().length < 2 && (
            <li className="lsb-section-label" role="presentation">Recent searches</li>
          )}

          
          {listToShow.map((item, index) => (
            <li
              key={`${item.type}-${item.label}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={`lsb-option ${index === activeIndex ? "lsb-option-active" : ""}`}
              onMouseDown={() => commitSelection(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin size={16} className="lsb-option-icon" aria-hidden="true" />
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
          <p className="lsb-empty" role="status">No matches — press Enter to search "{inputValue}" anyway</p>
        </div>
      )}
    </div>
  );
};