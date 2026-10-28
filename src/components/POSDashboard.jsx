import React, { lazy, Suspense, useEffect, useState } from "react";
import { telorecargoPOS } from "../modules/telorecargo/service";
import { entity } from "../modules/telorecargo/model";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Button,
  CircularProgress,
} from "@mui/material";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HistoryIcon from "@mui/icons-material/History";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import NoteIcon from "@mui/icons-material/Note";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import CreditScoreIcon from "@mui/icons-material/CreditScore";

import POS from "./POS";
import HistorialVentas from "./HistorialVentas";
import ComprasFacturadas from "./ComprasFacturadas";
import ClientesPOS from "./ClientesPOS";
import NotasInternas from "./NotasInternas";
import PendingSalesPOS from "./PendingSalePos";
import PosLocationPrintSettings from "./POS/PosLocationPrintSettings";
import CreditoFiadoPOS from "./CreditoFiadoPOS";

const POSTelorecargo = lazy(() => import("../modules/telorecargo/POSTelorecargo.jsx"));
const TourReportsPage = lazy(() => import("../pages/tours/TourReportsPage"));
const ToursPage = lazy(() => import("../pages/tours/ToursPage"));

const POSDashboard = ({
  posName = "Mi Punto de Venta",
  storeName = "Mi Tienda",
  posDesdeAdmin = false,
  posLocationId = null,
  posBranchId = null,
}) => {
  const [vista, setVista] = useState("menu");
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [telorecargoAccess, setTelorecargoAccess] = useState(null);
  const telorecargoEnabled = telorecargoAccess?.posId === posLocationId && telorecargoAccess?.configured === true;
  useEffect(() => {
    if (!posLocationId || vista !== "menu") return undefined;
    let alive = true;
    telorecargoPOS.state().then((response) => {
      if (alive) setTelorecargoAccess({ posId: posLocationId, configured: entity(response)?.configured === true });
    }).catch(() => {
      if (alive) setTelorecargoAccess({ posId: posLocationId, configured: false });
    });
    return () => { alive = false; };
  }, [posLocationId, vista]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const opciones = [
    { id: "reportes_servicios", titulo: "Reportes de servicios", descripcion: "Manifiesto de pasajeros y descarga Excel", color: "#0f766e", icono: <ReceiptLongIcon /> },
    {
      id: "ventas_servicios",
      titulo: "Ventas de servicios",
      descripcion: "Ventas, reservas, pasajeros y pagos de tours",
      color: "#9a5c00",
      icono: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "venta",
      titulo: "Venta",
      descripcion: "Accede al módulo principal de ventas",
      color: "#15803d",
      icono: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
    },
    { id: "telorecargo", titulo: "Recargas Telorecargo", descripcion: "Recargas, saldo compartido y solicitudes de abono", color: "#1565c0", icono: <PhoneAndroidIcon sx={{ fontSize: 40 }} /> },
    {
      id: "historial",
      titulo: "Historial",
      descripcion: "Consulta todas las ventas realizadas",
      color: "#1d4ed8",
      icono: <HistoryIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "ventas_pendientes",
      titulo: "Ventas Pendientes",
      descripcion: "Consulta ventas con saldo pendiente",
      color: "#a16207",
      icono: <PendingActionsIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "credito_fiado",
      titulo: "Módulo de crédito",
      descripcion: "Control de fiados, abonos y saldos pendientes.",
      color: "#b45309",
      icono: <CreditScoreIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "notas",
      titulo: "Notas Internas",
      descripcion: "Gestiona notas y recordatorios",
      color: "#bf0fadff",
      icono: <NoteIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "facturas",
      titulo: "Facturas",
      descripcion: "Revisa las Ventas facturadas",
      color: "#b45309",
      icono: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
    },
    {
      id: "clientes",
      titulo: "Clientes",
      descripcion: "Gestiona los clientes de la tienda",
      color: "#673ab7",
      icono: <PeopleAltIcon sx={{ fontSize: 40 }} />,
    },

    {
      id: "configuracion_pos",
      titulo: "Configuración punto de venta",
      descripcion: "Administra la conectividad, automatizaciones y futuras opciones de este punto de venta.",
      color: "#0f766e",
      icono: <SettingsInputComponentIcon sx={{ fontSize: 40 }} />,
    },

    {
      id: "proximamente",
      titulo: "Próximamente",
      descripcion: "Nuevas funciones en desarrollo",
      color: "#2610efff",
      icono: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
      disabled: true,
    },
  ];

  const cerrarSesion = async () => {
    setLoadingLogout(true);
    setTimeout(() => {
      localStorage.removeItem("POS_TOKEN");
      if (posDesdeAdmin) {
        window.location.href = "/admin/pos";
      } else {
        window.location.href = "/prueba/pos";
      }
    }, 1200);
  };

  const renderVista = () => {
    switch (vista) {
      case "telorecargo":
        if (!telorecargoEnabled) return null;
        return <Suspense fallback={<CircularProgress />}><POSTelorecargo key={posLocationId} posLocationId={posLocationId} onBack={() => setVista("menu")} /></Suspense>;
      case "reportes_servicios":
        return <Suspense fallback={<CircularProgress />}><TourReportsPage mode="pos" posBranchId={posBranchId} posLocationId={posLocationId} onBack={() => setVista("menu")} /></Suspense>;
      case "ventas_servicios":
        return <Suspense fallback={<CircularProgress />}><ToursPage mode="pos" posLocationId={posLocationId} posBranchId={posBranchId} onBack={() => setVista("menu")} /></Suspense>;
      case "venta":
        return (
          <POS
            posName={posName}
            posDesdeAdmin={posDesdeAdmin}
            cambiarVista={setVista}
            posLocationId={posLocationId}
          />
        );

      case "historial":
        return (
          <HistorialVentas
            cambiarVista={setVista}
            posLocationId={posLocationId}
          />
        );
      case "ventas_pendientes":
        return (
          <PendingSalesPOS
            cambiarVista={setVista}
            posLocationId={posLocationId}
          />
        );
      case "credito_fiado":
        return (
          <CreditoFiadoPOS
            cambiarVista={setVista}
            posLocationId={posLocationId}
          />
        );

      case "notas":
        return <NotasInternas cambiarVista={setVista} />;

      case "configuracion_pos":
        return (
          <PosLocationPrintSettings
            cambiarVista={setVista}
            posLocationId={posLocationId}
          />
        );

      case "facturas":
        return (
          <ComprasFacturadas
            cambiarVista={setVista}
            posLocationId={posLocationId}
          />
        );



      case "clientes":
        return <ClientesPOS cambiarVista={setVista} />;

      default:
        return (
          <Box
            mt={4}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: { xs: 1.2, sm: 2, md: 3 },
              alignItems: "stretch",
            }}
          >
            {opciones.filter((opcion) => opcion.id !== "telorecargo" || telorecargoEnabled).map((opcion) => (
              <Card
                key={opcion.id}
                className="pos-menu-card"
                sx={{
                  backgroundColor: opcion.color,
                  color: "white",
                  "& .MuiTypography-root, & .MuiSvgIcon-root, & .MuiCardActionArea-root": { color: "#fff !important" },
                  borderRadius: { xs: 3, md: 4 },
                  minHeight: { xs: 150, sm: 180, md: 220 },
                  boxShadow: 8,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  opacity: opcion.disabled ? 0.6 : 1,
                  cursor: opcion.disabled ? "default" : "pointer",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                  "&:hover": {
                    transform: opcion.disabled ? "none" : "translateY(-3px)",
                  },
                }}
              >
                <CardActionArea
                  disabled={opcion.disabled}
                  onClick={() => setVista(opcion.id)}
                  sx={{ height: "100%" }}
                >
                  <CardContent
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      px: { xs: 1, sm: 2 },
                      py: { xs: 2, sm: 2.5 },
                      gap: { xs: 0.8, sm: 1.2 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "& svg": {
                          fontSize: { xs: 28, sm: 34, md: 40 },
                          width: "1em",
                          height: "1em",
                        },
                      }}
                    >
                      {opcion.icono}
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "0.88rem", sm: "1rem", md: "1.1rem" },
                        lineHeight: 1.2,
                        color: "#fff",
                      }}
                    >
                      {opcion.titulo}
                    </Typography>

                    <Typography
                      sx={{
                        display: { xs: "none", sm: "block" },
                        color: "rgba(255,255,255,0.9)",
                        fontSize: { sm: "0.78rem", md: "0.9rem" },
                        lineHeight: 1.3,
                        maxWidth: 220,
                      }}
                    >
                      {opcion.descripcion}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        );
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 4 }, py: { xs: 2, md: 4 }, minWidth: 0 }} display="flex" flexDirection="column" minHeight="100vh">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={2}
      >
        <Box mb={isMobile ? 2 : 0}>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: 20, sm: 26, md: 32 }, display: "flex", alignItems: "center", gap: 1, overflowWrap: "anywhere" }}>
            <PointOfSaleOutlinedIcon aria-hidden="true" /> Punto de Venta: {posName}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={
            loadingLogout ? (
              <CircularProgress size={18} color="error" />
            ) : (
              <LogoutIcon />
            )
          }
          onClick={cerrarSesion}
          disabled={loadingLogout}
        >
          {loadingLogout ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </Box>

      {renderVista()}
    </Box>
  );
};

export default POSDashboard;
