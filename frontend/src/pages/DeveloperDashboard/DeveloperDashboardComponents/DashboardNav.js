import React, { useState } from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Box,
  Typography,
  Divider,
  useMediaQuery,
  IconButton,
  Paper,
  Toolbar,
} from "@mui/material";
import {
  Home as HomeIcon,
  AddCircleOutline as AddCircleIcon,
  ListAlt as ListAltIcon,
  HeadsetMic as HeadsetIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

const drawerWidth = 300;

const DashboardNav = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const drawerContent = (
    <Box
      sx={{
        width: drawerWidth,
        background: "linear-gradient(180deg, #ffffff, #f8f7fb)",
        color: "#333",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid #e5e0f0",
      }}
    >
      {/* Top Developer Header */}
      <Toolbar
        sx={{
          bgcolor: "#9417E2",
          color: "#fff",
          justifyContent: "center",
          flexDirection: "column",
          py: 2,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#fff",
            color: "#9417E2",
            width: 60,
            height: 60,
            mb: 1,
            fontWeight: 700,
          }}
        >
          {user?.displayName?.[0]?.toUpperCase() || "D"}
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {user?.displayName || "Developer"}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          CompareProjects Partner
        </Typography>
      </Toolbar>

      {/* Navigation Content */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: "#888",
            fontWeight: 600,
            mb: 1,
            ml: 1,
          }}
        >
          Actions
        </Typography>

        <List>
          <ListItemButton
            onClick={() => setActiveTab("sell")}
            selected={activeTab === "sell"}
            sx={{
              borderRadius: 2,
              transition: "all 0.2s ease",
              "&.Mui-selected": {
                background: "rgba(148, 23, 226, 0.15)",
                color: "#9417E2",
              },
              "&:hover": { background: "rgba(148, 23, 226, 0.1)" },
            }}
          >
            <ListItemIcon>
              <AddCircleIcon sx={{ color: "#9417E2" }} />
            </ListItemIcon>
            <ListItemText primary="Sell Property" />
          </ListItemButton>

          <ListItemButton
            onClick={() => setActiveTab("properties")}
            selected={activeTab === "properties"}
            sx={{
              borderRadius: 2,
              transition: "all 0.2s ease",
              "&.Mui-selected": {
                background: "rgba(148, 23, 226, 0.15)",
                color: "#9417E2",
              },
              "&:hover": { background: "rgba(148, 23, 226, 0.1)" },
            }}
          >
            <ListItemIcon>
              <ListAltIcon sx={{ color: "#9417E2" }} />
            </ListItemIcon>
            <ListItemText primary="My Properties" />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: "#888",
            fontWeight: 600,
            mb: 1,
            ml: 1,
          }}
        >
          Support
        </Typography>

          <ListItemButton
          onClick={() => setActiveTab("support")}
          selected={activeTab === "support"}
          sx={{
            borderRadius: 2,
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              background: "rgba(148, 23, 226, 0.15)",
              color: "#9417E2",
            },
            "&:hover": { background: "rgba(148, 23, 226, 0.1)" },
          }}
        >
          <ListItemIcon>
            <HeadsetIcon sx={{ color: "#9417E2" }} />
          </ListItemIcon>
          <ListItemText primary="Support / Help Center" />
        </ListItemButton>

        <Divider sx={{ my: 2 }} />

        <List>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: "#D90429" }} />
            </ListItemIcon>
            <ListItemText primary="Log Out" />
          </ListItemButton>
        </List>
      </Box>

      {/* Footer Section */}
      <Box sx={{ textAlign: "center", pb: 2, fontSize: "0.8rem", color: "#888" }}>
        <Divider sx={{ mb: 1 }} />
        CompareProjects © {new Date().getFullYear()}
      </Box>
    </Box>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        <IconButton
          color="primary"
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 900,
            backgroundColor: "white",
            boxShadow: 1,
            "&:hover": { backgroundColor: "#f5f5f5" },
          }}
        >
          <MenuIcon />
        </IconButton>

        {mobileOpen && (
          <Box
            sx={{
              position: "fixed",
              top: "64px",
              left: 0,
              width: drawerWidth,
              height: "calc(100% - 64px)",
              background: "#fff",
              boxShadow: "4px 0 12px rgba(0,0,0,0.2)",
              zIndex: 950,
              overflowY: "auto",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
              <IconButton onClick={() => setMobileOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            {drawerContent}
          </Box>
        )}
      </>
    );
  }

  // Desktop
  return (
    <Box
      sx={{
        width: drawerWidth,
        position: "sticky",
        top: "80px", // below header
        alignSelf: "flex-start",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {drawerContent}
    </Box>
  );
};

export default React.memo(DashboardNav);
