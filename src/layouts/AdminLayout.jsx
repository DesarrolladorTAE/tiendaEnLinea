import React, { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Drawer, IconButton, Box, CircularProgress, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "../pages/admin/Sidebar";
import { TiendaProvider, useTienda } from "../context/TiendaContext";
import { AdminUiProvider, useAdminUi } from "../context/AdminUiContext";

const drawerWidth = 240;

const AdminContent = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ CORRECTO (tu contexto se llama tiendaLoading)
  const { tiendaLoading } = useTienda();

  // ✅ control para ocultar sidebar/topbar desde sucursales
  const { hideLayout } = useAdminUi();

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  if (tiendaLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          backgroundColor: "#f5f5f5",
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Cargando información de la tienda...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar fijo en desktop */}
      {!hideLayout ? (
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
      ) : null}

      {/* Drawer móvil */}
      {!hideLayout ? (
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
      ) : null}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          px: hideLayout ? 0 : { xs: 2, sm: 3, md: 4 },
          py: hideLayout ? 0 : { xs: 1, sm: 2 },
          backgroundColor: hideLayout ? "#fff" : "#f5f5f5",
        }}
      >
        {/* Botón menú en mobile */}
        {!hideLayout ? (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: "none" }, mb: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : null}

        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};

const AdminLayout = () => (
  <TiendaProvider autoAlerta forzarCTA={false} soloUnaVezPorSesion={false}>
    <AdminUiProvider>
      <AdminContent />
    </AdminUiProvider>
  </TiendaProvider>
);

export default AdminLayout;
