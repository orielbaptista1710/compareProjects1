import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";
import { AuthContext } from "./AuthContext";

export const CustomerActivityContext = createContext();

export const CustomerActivityProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  const [heartProperties, setHeartProperties] = useState([]);
  const [savedCompareProperties, setSavedCompareProperties] = useState([]); // server-persisted compare list
  const [loading, setLoading] = useState(false);

  const customerId = currentUser?._id;

  useEffect(() => {
    if (!currentUser) {
      setHeartProperties([]);
      setSavedCompareProperties([]);
      return;
    }

    const fetchActivity = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/api/customerActivity/my-activity");
        setHeartProperties(data.heartProperties || []);
        setSavedCompareProperties(data.compareProperties || []);
      } catch (err) {
        console.error("Activity fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [customerId]);

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