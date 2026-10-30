import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../../../api/api";
import { MAX_COMPARE } from "../../../hooks/useCompareList";

const fetchRelated = async (id) => {
  const res = await API.get(`/api/properties/related/${id}`);
  return Array.isArray(res.data) ? res.data : [];
};

// Suggestions for the empty compare slots: properties related to the first
// compared one (same developer or locality — see getRelatedProperties on the
// backend). Keyed on that one id, so adding/removing the others never
// refetches. Same property type is ranked first; anything already being
// compared is dropped. Errors just mean "no suggestions".
export const useCompareRecommendations = (properties) => {
  const anchor = properties[0];
  const enabled = Boolean(anchor?._id) && properties.length < MAX_COMPARE;

  const { data, isPending } = useQuery({
    queryKey: ["compareRecommendations", anchor?._id],
    queryFn: () => fetchRelated(anchor._id),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const recommendations = useMemo(() => {
    if (!enabled || !data) return [];
    const inCompare = new Set(properties.map((p) => p._id));
    const fresh = data.filter((p) => p?._id && !inCompare.has(p._id));
    const sameType = (p) => p.propertyType === anchor.propertyType;
    return [...fresh.filter(sameType), ...fresh.filter((p) => !sameType(p))];
  }, [enabled, data, properties, anchor]);

  return { recommendations, loading: enabled && isPending };
};
