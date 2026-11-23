// src/pages/Properties/useCityUrlSync.js
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useCity } from "../../contexts/CityContext";

/**
 * Keeps the listing page URL and CityContext (header CitySelector, filters)
 * in agreement, one direction at a time:
 *
 * - A city in the URL wins and is copied into CityContext.
 * - With no city in the URL, the selected/default city (Mumbai) is written
 *   into the URL so header, filters and results all agree.
 * - Except for a free-text search (`search=`) with no city: that searches
 *   every city. Forcing the saved city there turned "Pune" typed in the home
 *   search box into `search=Pune&city=Mumbai`, which shows nothing.
 */
export function useCityUrlSync(filters) {
  const navigate = useNavigate();
  const location = useLocation();
  const { city: contextCity, setCity } = useCity();
  // Spaces-only counts as no search: the backend trims it to nothing too.
  const hasSearch = Boolean(filters.search?.trim());

  useEffect(() => {
    if (filters.city) {
      if (filters.city !== contextCity) setCity(filters.city);
    } else if (contextCity && !hasSearch) {
      const params = new URLSearchParams(location.search);
      params.set("city", contextCity);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [filters.city, hasSearch, contextCity, setCity, navigate, location.pathname, location.search]);
}
