// frontend-vite/src/hooks/useProperty.js
import { useQuery } from "@tanstack/react-query";

const fetchProperty = async (id) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/properties/${id}`
  );
  if (!response.ok) {
    throw new Error("Failed to load property");
  }
  return response.json();
};

export const useProperty = (id) => {
  const { data, isPending, error } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // property details don't change every second
  });

  return {
    property: data ?? null,
    loading: isPending && Boolean(id),
    error: id ? error?.message : "Invalid property ID",
  };
};