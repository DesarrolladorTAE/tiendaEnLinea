import React, { useState, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Drawer, IconButton, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Sidebar from "../pages/admin/Sidebar";
import { TiendaProvider, useTienda } from "../context/TiendaContext";
import { AdminUiProvider, useAdminUi } from "../context/AdminUiContext";

const drawerWidth = 240;

const AdminContent = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ CORRECTO (tu contexto se llama tiendaLoading)
  const { tiendaLoading } = useTienda();

  // ✅ control para ocultar sidebar/topbar desde sucursales
  const { hideLayout } = useAdminUi();

  const globalSections = [
    "/admin/micuenta",
    "/admin/membresia",
    "/admin/complementos",
  ];
  const isGlobalSection = globalSections.some((path) => location.pathname.startsWith(path));
  const layoutHidden = hideLayout || isGlobalSection;

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
      {!layoutHidden ? (
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
      {!layoutHidden ? (
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
          px: layoutHidden ? 0 : { xs: 2, sm: 3, md: 4 },
          py: layoutHidden ? 0 : { xs: 1, sm: 2 },
          backgroundColor: layoutHidden ? "#fffaf2" : "#f5f5f5",
        }}
      >
        {/* Botón menú en mobile */}
        {!layoutHidden ? (
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

        {isGlobalSection && (
          <Box component="header" sx={{ position: "sticky", top: 0, zIndex: 20, px: { xs: 2, sm: 3, md: 5 }, py: 1.5, bgcolor: "rgba(255,255,255,.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(32,32,32,.08)" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Button onClick={() => navigate("/admin/sucursales")} startIcon={<ArrowBackRoundedIcon />} sx={{ color: "#202020", fontWeight: 800, textTransform: "none" }}>Sucursales</Button>
              <Box component="img" src="/assets/logoc.png" alt="Mi Tienda en Línea MX" sx={{ width: { xs: 140, sm: 180 }, maxHeight: 48, objectFit: "contain" }} />
            </Stack>
          </Box>
        )}

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
