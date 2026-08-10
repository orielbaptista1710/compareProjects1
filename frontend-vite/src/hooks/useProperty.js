// hooks/useProperty.js
import { useState, useEffect } from 'react';

export const useProperty = (id) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid property ID');
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/properties/${id}`);
        if (!res.ok) throw new Error('Failed to load property');
        const data = await res.json();
        if (!cancelled) setProperty(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProperty();
    return () => { cancelled = true; };
  }, [id]);

  return { property, loading, error };
};