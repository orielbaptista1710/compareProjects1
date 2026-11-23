import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import CheckboxGroup from "../CheckboxGroup/CheckboxGroup";
import API from "../../../../api/api";
import { useCity } from "../../../../contexts/CityContext";
import { useDebounce } from "../../../../hooks/useDebounceHook";

const NO_LOCALITIES = [];

const fetchLocalities = async (city, signal) => {
  const res = await API.get(`/api/properties/localities/${encodeURIComponent(city)}`, { signal });
  return res.data.localities || NO_LOCALITIES;
};

const LocalityFilter = ({ value = [], onChange }) => {
  const { city } = useCity();

  const [search, setSearch] = useState("");
  const [prevCity, setPrevCity] = useState(city);

  const debouncedSearch = useDebounce(search, 250);

  /* ── Reset the search box synchronously during render when the city changes ──
     Uses useState (not a ref) to track the previous city, since refs can't be
     read/written during render — only state can be adjusted this way. ── */
  if (city !== prevCity) {
    setPrevCity(city);
    setSearch("");
  }

  /* ── Localities for the city. React Query caches per city, de-duplicates
     requests and cancels the in-flight one when the city changes. ── */
  const {
    data: allLocalities = NO_LOCALITIES,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["localities", city],
    queryFn: ({ signal }) => fetchLocalities(city, signal),
    enabled: Boolean(city),
    staleTime: 5 * 60_000,
  });

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

      {isLoading ? (
        <p className="filter-loading">Loading localities…</p>
      ) : isError ? (
        <p className="filter-hint" role="alert">
          Couldn&apos;t load localities.{" "}
          <button type="button" className="filter-clear-btn" onClick={() => refetch()}>
            Retry
          </button>
        </p>
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
