import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";
import { AuthContext } from "./AuthContext";

export const CustomerActivityContext = createContext();

export const CustomerActivityProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  const [heartProperties, setHeartProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const customerId = currentUser?._id;

  // Fetch activity when user changes
  useEffect(() => {
    if (!currentUser) {
      setHeartProperties([]);
      return;
    }

    const fetchActivity = async () => {
      try {
        setLoading(true);

        //  Axios interceptor handles it
        const { data } = await API.get("/api/customerActivity/my-activity");

        setHeartProperties(data.heartProperties || []);
      } catch (err) {
        console.error("Activity fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [customerId]);

  // Toggle heart
  const toggleHeart = async (propertyId) => {
  // Optimistically update immediately
  const wasHearted = heartProperties.some(p => 
    (p._id || p) === propertyId
  );
  
  setHeartProperties(prev =>
    wasHearted
      ? prev.filter(p => (p._id || p) !== propertyId)
      : [...prev, { _id: propertyId }] // minimal placeholder
  );

  try {
    const { data } = await API.post(`/api/customerActivity/toggle-save/${propertyId}`);
    // Replace with real server data (has full property fields)
    setHeartProperties(data.heartProperties);
  } catch (err) {
    console.error('Toggle heart error:', err);
    // Rollback on failure
    setHeartProperties(prev =>
      wasHearted
        ? [...prev, { _id: propertyId }]
        : prev.filter(p => (p._id || p) !== propertyId)
    );
    // Surface the error to the UI
    throw err; // let PropertyPage catch it and show a toast
  }
};

  return (
    <CustomerActivityContext.Provider
      value={{
        heartProperties,
        toggleHeart,
        loading,
      }}
    >
      {children}
    </CustomerActivityContext.Provider>
  );
};