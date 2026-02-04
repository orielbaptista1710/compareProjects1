import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { Search } from "lucide-react";
import CheckboxGroup from "./CheckboxGroup";
import API from "../../../../api";
import { useCity } from "../../../../contexts/CityContext";
import { useDebounce } from "../../../../hooks/useDebounceHook";
import "./LocalityFilter.css";

const LocalityFilter = ({ value = [], onChange }) => {
  const { city } = useCity();

  const [allLocalities, setAllLocalities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // debounce search (250ms feels right for filters)
  const debouncedSearch = useDebounce(search, 250);

  // cache localities per city
  const localityCache = useRef({});

  /* ---------------- Fetch localities ---------------- */

  useEffect(() => {
    if (!city) {
      setAllLocalities([]);
      setSearch("");
      return;
    }

    // serve from cache
    if (localityCache.current[city]) {
      setAllLocalities(localityCache.current[city]);
      return;
    }

    const controller = new AbortController();

    const fetchLocalities = async () => {
      setLoading(true);
      try {
        const res = await API.get(
          `/api/properties/localities/${city}`,
          { signal: controller.signal }
        );

        const data = res.data.localities || [];
        localityCache.current[city] = data;
        setAllLocalities(data);
      } catch (e) {
        if (e.name !== "CanceledError") {
          console.error("Failed to load localities", e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocalities();
    return () => controller.abort();
  }, [city]);

  /* ---------------- Filtering ---------------- */

  const filteredLocalities = useMemo(() => {
    if (!debouncedSearch) return allLocalities;

    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allLocalities;

    return allLocalities.filter((l) =>
      l.toLowerCase().includes(q)
    );
  }, [debouncedSearch, allLocalities]);

  /* ---------------- City NOT selected ---------------- */

  if (!city) return null;

  /* ---------------- Render ---------------- */

  return (
    <>

      <div className="locality-search">
        <Search size={14} />
        <input
          placeholder={`Search localities in ${city}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        />
      )}
    </>
  );
};

export default React.memo(LocalityFilter);
