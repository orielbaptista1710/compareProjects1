// frontend-vite/src/pages/Admin/AdminDashboard.jsx
// Admin shell: account header + Listings / Agents tabs. The active tab is in
// the URL (?tab=agents) so a refresh or shared link opens the same tab.
import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Button, Tabs, Tab, Skeleton } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import API from "../../api/api";
import AdminListings from "../../features/admin/listings/AdminListings";

// Only loaded when an admin opens the tab.
const AgentApplications = lazy(() => import("../../features/admin/agents/AgentApplications"));

const TABS = { LISTINGS: "listings", AGENTS: "agents" };

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === TABS.AGENTS ? TABS.AGENTS : TABS.LISTINGS;

  // Listings keep their filters in the URL too; switching tab starts clean.
  const switchTab = (_, next) => setSearchParams(next === TABS.AGENTS ? { tab: TABS.AGENTS } : {});

  const { data: currentUser } = useQuery({
    queryKey: ["adminMe"],
    queryFn:  async () => (await API.get("/api/auth/me")).data.user,
    staleTime: Infinity,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => API.post("/api/auth/logout"),
    onSettled: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 11, md: 13 },
        pb: 6,
        maxWidth: 1600,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Admin dashboard
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {currentUser && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 30, height: 30,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: "#fff", lineHeight: 1, fontSize: "0.7rem" }}
                >
                  {currentUser.displayName?.charAt(0).toUpperCase() ?? "A"}
                </Typography>
              </Box>

              <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column" }}>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {currentUser.displayName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    textTransform: "capitalize",
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {currentUser.role}
                </Typography>
              </Box>
            </Box>
          )}

          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<LogOut size={14} />}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            sx={{
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": { borderColor: "error.main", color: "error.main" },
            }}
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={switchTab}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        aria-label="Admin sections"
      >
        <Tab value={TABS.LISTINGS} label="Listings" />
        <Tab value={TABS.AGENTS} label="Agents" />
      </Tabs>

      {tab === TABS.AGENTS ? (
        <Suspense fallback={<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />}>
          <AgentApplications />
        </Suspense>
      ) : (
        <AdminListings />
      )}
    </Box>
  );
}
