import React, { useState, useEffect } from "react";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import useRealtimeUserData from "../hooks/useRealtimeUserData";
import { useSelector } from "react-redux";

const drawerWidth = 270;
const TOPBAR_H_MOBILE = 64;
const TOPBAR_H_DESKTOP = 74;

const AdminLayout = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { isAuthenticated, sessionLoaded } = useSelector((state) => state.user);

  if (!sessionLoaded) return null;
  if (!isAuthenticated) return <Navigate to="/loginmui" replace />;

  useRealtimeUserData(5000);

  const handleDrawerToggle = () => setOpenSidebar((prev) => !prev);

  useEffect(() => {
    setOpenSidebar(false);
  }, [location]);

  const topbarH = isMobile ? TOPBAR_H_MOBILE : TOPBAR_H_DESKTOP;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#0b1220",
        backgroundImage: `
          radial-gradient(1200px 600px at 10% 10%, rgba(59,130,246,.20), transparent 60%),
          radial-gradient(900px 500px at 90% 20%, rgba(99,102,241,.18), transparent 55%),
          radial-gradient(900px 600px at 50% 100%, rgba(34,197,94,.10), transparent 55%)
        `,
      }}
    >
      <Sidebar
        open={isDesktop ? true : openSidebar}
        onClose={handleDrawerToggle}
        variant={isDesktop ? "permanent" : "temporary"}
      />

      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          ml: isDesktop ? `${drawerWidth}px` : 0,
          transition: "margin .25s ease",
          position: "relative",
        }}
      >
        <Topbar onMenuClick={handleDrawerToggle} drawerWidth={drawerWidth} />

        {/* Contenido */}
        <Box
          sx={{
            pt: 2,
            minHeight: "100vh",
            px: { xs: 1.2, sm: 2, md: 2.5 },
            pb: 4,
          }}
        >
          <Box
            sx={{
              // ✅ el alto real disponible tomando el Topbar real
              minHeight: `calc(100vh - ${topbarH + 16}px)`,
              borderRadius: 3,
              bgcolor: alpha("#ffffff", 0.9),
              border: `1px solid ${alpha("#ffffff", 0.7)}`,
              boxShadow: `0 24px 70px ${alpha("#000", 0.22)}`,
              backdropFilter: "blur(10px)",
              overflow: "hidden",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;