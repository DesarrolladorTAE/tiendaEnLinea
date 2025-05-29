import React, { useState, useEffect } from "react";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { Outlet, useLocation } from "react-router-dom";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const drawerWidth = 240;

const AdminLayout = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const handleDrawerToggle = () => {
    setOpenSidebar((prev) => !prev);
  };

  useEffect(() => {
    setOpenSidebar(false);
  }, [location]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        open={isDesktop ? true : openSidebar}
        onClose={handleDrawerToggle}
        variant={isDesktop ? "permanent" : "temporary"}
        sx={{
          width: isDesktop ? drawerWidth : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            position: "fixed",
            height: "100vh",
          },
        }}
      />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          ml: isDesktop ? 6 : 0, // Pequeño margen SOLO en escritorio, cero en móvil
          transition: "margin .2s", // Para que el movimiento sea suave si cambias de tamaño
        }}
      >
        <Topbar
          onMenuClick={handleDrawerToggle}
          sx={{
            position: "fixed",
            top: 0,
            left: isDesktop ? `${drawerWidth}px` : 0,
            width: isDesktop ? `calc(100% - ${drawerWidth}px)` : "100%",
            zIndex: 1201,
          }}
        />
        {/* El contenido NO tiene padding ni margin */}
        <Box sx={{ pt: { xs: 2, md: 2 }, minHeight: "100vh", bgcolor: "#fff" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
