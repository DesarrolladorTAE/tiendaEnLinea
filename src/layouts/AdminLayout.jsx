import React, { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Drawer, IconButton, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "../pages/admin/Sidebar";

const drawerWidth = 240;

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar fijo en desktop */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          display: { xs: "none", md: "block" },
          backgroundColor: "#1a1a1a",
          height: "100vh",
        }}
      >
        <Sidebar />
      </Box>

      {/* Drawer móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        transitionDuration={350}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "#1a1a1a",
          },
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1, sm: 2 },
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Botón menú en mobile */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ display: { md: "none" }, mb: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default AdminLayout;
