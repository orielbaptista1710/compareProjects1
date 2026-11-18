// features/admin/hooks/useAdminStatusCounts.js
// How many listings are in each status ({ pending, approved, rejected, suspended,
// pendingEdited }), for the pending badge on the admin Listings tab.
//
// Polls once a minute while the tab is visible and refetches when the window
// regains focus (the app's default turns focus refetching off). Background tabs
// don't poll. The backend answers from a short cache, so many open admin tabs
// cost it one query between them. A failed poll stays silent: the badge just
// keeps its last value.
import { useQuery } from "@tanstack/react-query";
import API from "../../../api/api";

export const ADMIN_COUNTS_KEY = ["adminStatusCounts"];

export default function useAdminStatusCounts() {
  return useQuery({
    queryKey: ADMIN_COUNTS_KEY,
    queryFn: async () => (await API.get("/api/admin/properties/counts")).data,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
