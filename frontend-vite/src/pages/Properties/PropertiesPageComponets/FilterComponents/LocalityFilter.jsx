import React, { useEffect, useMemo, useState, useRef } from "react";
import { Search } from "lucide-react";
import CheckboxGroup from "./CheckboxGroup";
import API from "../../../../api";
import { useCity } from "../../../../contexts/CityContext";
import { useDebounce } from "../../../../hooks/useDebounceHook";

const LocalityFilter = ({ value = [], onChange }) => {
  const { city } = useCity();

  const [allLocalities, setAllLocalities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 250);
  const cache = useRef({});

  /* ── Reset search when city changes ── */
  useEffect(() => {
    setSearch("");
  }, [city]);

  /* ── Fetch localities (with per-city cache) ── */
  useEffect(() => {
    if (!city) {
      setAllLocalities([]);
      return;
    }

    if (cache.current[city]) {
      setAllLocalities(cache.current[city]);
      return;
    }

    const controller = new AbortController();

    const fetchLocalities = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/properties/localities/${city}`, {
          signal: controller.signal,
        });
        const data = res.data.localities || [];
        cache.current[city] = data;
        setAllLocalities(data);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Failed to load localities:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocalities();
    return () => controller.abort();
  }, [city]);

  /* ── Client-side search filter ── */
  const filteredLocalities = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allLocalities;
    return allLocalities.filter((l) => l.toLowerCase().includes(q));
  }, [debouncedSearch, allLocalities]);

  if (!city) return null;

  return (
    <>
      <div className="locality-search">
        <Search size={13} aria-hidden="true" />
        <input
          type="search"
          placeholder={`Search in ${city}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search localities in ${city}`}
        />
      </div>

      {loading ? (
        <p className="filter-loading">Loading localities…</p>
      ) : filteredLocalities.length === 0 ? (
        <p className="filter-hint">No localities found</p>
      ) : (
        <CheckboxGroup
          options={filteredLocalities}
          value={value}
          onChange={onChange}
          scrollable
        />
      )}
    </>
  );
};

export default React.memo(LocalityFilter);