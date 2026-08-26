//frontend-vite/src/contexts/CustomerActivityContext.jsx

/* eslint-disable react-refresh/only-export-components */

import { useContext, useState, useEffect } from "react";
import API from "../api";
import { AuthContext } from "./AuthContext";
// import { CustomerActivityContext } from "./contextInstances/CustomerActivityContextInstance";
import {createContext} from "react";
export const CustomerActivityContext = createContext();
 

export const CustomerActivityProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  const [heartProperties, setHeartProperties] = useState([]);
  const [savedCompareProperties, setSavedCompareProperties] = useState([]); // server-persisted compare list
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchActivity = async () => {
      if (!currentUser) {
        if (!cancelled) {
          setHeartProperties([]);
          setSavedCompareProperties([]);
        }
        return;
      }

      try {
        if (!cancelled) setLoading(true);
        const { data } = await API.get("/api/customerActivity/my-activity");
        if (!cancelled) {
          setHeartProperties(data.heartProperties || []);
          setSavedCompareProperties(data.compareProperties || []);
        }
      } catch (err) {
        console.error("Activity fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchActivity();
    return () => { cancelled = true; };
  }, [currentUser]);

  const toggleHeart = async (propertyId) => {
    const wasHearted = heartProperties.some((p) => (p._id || p) === propertyId);

    setHeartProperties((prev) =>
      wasHearted
        ? prev.filter((p) => (p._id || p) !== propertyId)
        : [...prev, { _id: propertyId }]
    );

    try {
      const { data } = await API.post(`/api/customerActivity/toggle-heart/${propertyId}`);
      setHeartProperties(data.heartProperties);
    } catch (err) {
      console.error("Toggle heart error:", err);
      setHeartProperties((prev) =>
        wasHearted
          ? [...prev, { _id: propertyId }]
          : prev.filter((p) => (p._id || p) !== propertyId)
      );
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
        heartProperties,
        toggleHeart,
        savedCompareProperties,
        syncCompareList,
        loading,
      }}
    >
      {children}
    </CustomerActivityContext.Provider>
  );
};