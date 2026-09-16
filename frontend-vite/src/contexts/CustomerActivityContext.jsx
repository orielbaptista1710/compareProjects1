//frontend-vite/src/contexts/CustomerActivityContext.jsx

/* eslint-disable react-refresh/only-export-components */

import { useContext, useState, useEffect } from "react";
import API from "../api/api";
import { AuthContext } from "./AuthContext";
// import { CustomerActivityContext } from "./contextInstances/CustomerActivityContextInstance";
import {createContext} from "react";
export const CustomerActivityContext = createContext();

const HEART_PAGE_SIZE = 20;
const DEFAULT_HEART_PAGINATION = { page: 1, limit: HEART_PAGE_SIZE, total: 0, hasMore: false };

export const CustomerActivityProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  // Full, unpopulated list of hearted property ids — used app-wide (e.g. the
  // heart icon on any property card) to answer "is this property saved?"
  // without depending on which page of the Shortlist tab happens to be
  // loaded. Cheap: just id strings, no images/prices attached.
  const [heartedIds, setHeartedIds] = useState([]);
  // Only the currently-loaded page(s) of *populated* heart properties — what
  // the Shortlist tab actually renders. Grows as loadMoreHearts() is called.
  const [heartProperties, setHeartProperties] = useState([]);
  const [heartPagination, setHeartPagination] = useState(DEFAULT_HEART_PAGINATION);
  const [loadingMoreHearts, setLoadingMoreHearts] = useState(false);

  const [savedCompareProperties, setSavedCompareProperties] = useState([]); // server-persisted compare list
  const [loading, setLoading] = useState(false);
  // True only once the /my-activity fetch has settled (success or failure) for the
  // current currentUser. CompareSync waits on this — see comment there — instead of
  // `loading`, because `loading` flips inside this same effect and consumers that are
  // descendants of this provider run their effects *before* this one in the same commit,
  // so they'd still see the pre-fetch value.
  const [activityReady, setActivityReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchActivity = async () => {
      if (!currentUser) {
        if (!cancelled) {
          setHeartedIds([]);
          setHeartProperties([]);
          setHeartPagination(DEFAULT_HEART_PAGINATION);
          setSavedCompareProperties([]);
          setActivityReady(false);
        }
        return;
      }

      try {
        if (!cancelled) setLoading(true);
        const { data } = await API.get(
          `/api/customerActivity/my-activity?heartLimit=${HEART_PAGE_SIZE}`
        );
        if (!cancelled) {
          setHeartedIds(data.heartedIds || []);
          setHeartProperties(data.heartProperties || []);
          setHeartPagination(data.heartPagination || DEFAULT_HEART_PAGINATION);
          setSavedCompareProperties(data.compareProperties || []);
        }
      } catch (err) {
        console.error("Activity fetch error:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setActivityReady(true);
        }
      }
    };

    fetchActivity();
    return () => { cancelled = true; };
  }, [currentUser]);

  // Fetches the next page of hearted properties and appends it to what's
  // already loaded. Called by the Shortlist tab's "Load More" button.
  const loadMoreHearts = async () => {
    if (loadingMoreHearts || !heartPagination.hasMore) return;

    const nextPage = heartPagination.page + 1;

    try {
      setLoadingMoreHearts(true);
      const { data } = await API.get(
        `/api/customerActivity/my-activity?heartPage=${nextPage}&heartLimit=${heartPagination.limit}`
      );
      setHeartProperties((prev) => [...prev, ...(data.heartProperties || [])]);
      setHeartPagination(data.heartPagination || heartPagination);
    } catch (err) {
      console.error("Load more shortlisted properties error:", err);
    } finally {
      setLoadingMoreHearts(false);
    }
  };

  const toggleHeart = async (propertyId) => {
    const wasHearted = heartedIds.includes(propertyId);
    // Captured before removing, so a failed request can restore the exact
    // same card instead of a placeholder with no title/price/image.
    const removedProperty = wasHearted
      ? heartProperties.find((p) => p._id === propertyId)
      : null;

    setHeartedIds((prev) =>
      wasHearted ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
    // Only the removal case touches the loaded Shortlist page — a newly
    // hearted property wasn't fetched as part of any page, so there's no
    // correct position to insert it at; the Shortlist tab picks it up next
    // time it fetches (fresh mount, or a reload).
    if (wasHearted) {
      setHeartProperties((prev) => prev.filter((p) => p._id !== propertyId));
    }

    try {
      const { data } = await API.post(`/api/customerActivity/toggle-heart/${propertyId}`);
      setHeartedIds(data.heartedIds || []);
    } catch (err) {
      console.error("Toggle heart error:", err);
      setHeartedIds((prev) =>
        wasHearted ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
      );
      if (wasHearted && removedProperty) {
        setHeartProperties((prev) => [...prev, removedProperty]);
      }
      throw err;
    }
  };

  // Persist the full compare list — called (debounced) by CompareSync below
  const syncCompareList = async (propertyIds) => {
    try {
      const { data } = await API.put("/api/customerActivity/compare", { propertyIds });
      setSavedCompareProperties(data.compareProperties);
      return data.compareProperties;
    } catch (err) {
      console.error("Compare sync error:", err);
      throw err;
    }
  };

  return (
    <CustomerActivityContext.Provider
      value={{
        heartedIds,
        heartProperties,
        heartPagination,
        loadingMoreHearts,
        loadMoreHearts,
        toggleHeart,
        savedCompareProperties,
        syncCompareList,
        loading,
        activityReady,
      }}
    >
      {children}
    </CustomerActivityContext.Provider>
  );
};
