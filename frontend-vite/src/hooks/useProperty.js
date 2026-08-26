// frontend-vite/src/hooks/useProperty.js

import { useState, useEffect } from "react";

export const useProperty = (id) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProperty = async () => {
      if (!id) {
        if (!cancelled) {
          setProperty(null);
          setError("Invalid property ID");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/properties/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to load property");
        }

        const data = await response.json();

        if (!cancelled) {
          setProperty(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("useProperty error:", err);
          setProperty(null);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load property"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProperty();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return {
    property,
    loading,
    error,
  };
};