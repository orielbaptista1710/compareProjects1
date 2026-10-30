// frontend-vite/src/hooks/useProjectUnits.js
import { useQuery } from "@tanstack/react-query";
import API from "../api/api";

const fetchProjectUnits = async (id) => {
  const res = await API.get(`/api/properties/project-units/${id}`);
  return res.data?.units ?? [];
};

// Sibling units of the same project (same projectKey), including the
// current one — powers the "other configurations" switcher on the property
// detail page. Returns an empty array for ungrouped listings (no
// projectKey), same as the backend does.
export const useProjectUnits = (id) => {
  const { data, isPending } = useQuery({
    queryKey: ["project-units", id],
    queryFn: () => fetchProjectUnits(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

  return { units: data ?? [], loading: isPending };
};
