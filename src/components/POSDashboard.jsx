import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Stack, Typography,
} from "@mui/material";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CreditScoreOutlinedIcon from "@mui/icons-material/CreditScoreOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import POS from "./POS";
import HistorialVentas from "./HistorialVentas";
import ComprasFacturadas from "./ComprasFacturadas";
import ClientesPOS from "./ClientesPOS";
import NotasInternas from "./NotasInternas";
import PendingSalesPOS from "./PendingSalePos";
import PosLocationPrintSettings from "./POS/PosLocationPrintSettings";
import CreditoFiadoPOS from "./CreditoFiadoPOS";
import PosCashPage from "./cash/PosCashPage";
import useCashStatus from "../hooks/POS/useCashStatus";
import { telorecargoPOS } from "../modules/telorecargo/service";
import { entity } from "../modules/telorecargo/model";

const POSTelorecargo = lazy(() => import("../modules/telorecargo/POSTelorecargo.jsx"));
const TourReportsPage = lazy(() => import("../pages/tours/TourReportsPage"));
const ToursPage = lazy(() => import("../pages/tours/ToursPage"));
const OfflinePaymentsPage = lazy(() => import("./offline/OfflinePaymentsPage"));

const sections = [
  { id: "venta", title: "Venta", icon: <ShoppingCartOutlinedIcon /> },
  { id: "caja", title: "Caja", icon: <PointOfSaleOutlinedIcon /> },
  { id: "historial", title: "Historial", icon: <HistoryOutlinedIcon /> },
  { id: "pedidos_web", title: "Pedidos web", icon: <ReceiptLongOutlinedIcon /> },
  { id: "ventas_pendientes", title: "Ventas pendientes", icon: <PendingActionsOutlinedIcon /> },
  { id: "credito_fiado", title: "Crédito y fiados", icon: <CreditScoreOutlinedIcon /> },
  { id: "clientes", title: "Clientes", icon: <PeopleAltOutlinedIcon /> },
  { id: "facturas", title: "Facturas", icon: <RequestQuoteOutlinedIcon /> },
  { id: "ventas_servicios", title: "Ventas de servicios", icon: <ConfirmationNumberOutlinedIcon /> },
  { id: "reportes_servicios", title: "Reportes de servicios", icon: <AssessmentOutlinedIcon /> },
  { id: "telorecargo", title: "Recargas Telorecargo", icon: <PhoneAndroidOutlinedIcon /> },
  { id: "notas", title: "Notas internas", icon: <StickyNote2OutlinedIcon /> },
  { id: "configuracion_pos", title: "Configuración", icon: <SettingsOutlinedIcon /> },
];

const navButton = {
  minHeight: 44,
  flexShrink: 0,
  borderRadius: 2,
  px: 1.5,
  textTransform: "none",
  fontWeight: 700,
  whiteSpace: "nowrap",
  color: "#e2e4e8",
  "&:hover": { bgcolor: "#353942", color: "#fff" },
  "&[aria-current='page']": {
    bgcolor: "#ffc107", color: "#17191c",
    "&:hover": { bgcolor: "#ffe082" },
  },
};

export default function POSDashboard({ posName, posDesdeAdmin, posLocationId, posBranchId }) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [telorecargoEnabled, setTelorecargoEnabled] = useState(null);
  const cash = useCashStatus(posLocationId);
  const activeSession = cash.status?.session;
  const requestedSection = params.get("seccion");
  const section = sections.find(({ id }) => id === requestedSection) ?? sections[0];
  const previousSection = useRef(section.id);
  const sectionHeader = useRef(null);

  const changeSection = (id) => {
    const next = id === "menu" ? "venta" : id;
    if (section.id === next) return;
    setParams((previous) => {
      const query = new URLSearchParams(previous);
      query.set("seccion", next);
      return query;
    }, { state: location.state });
  };
  const back = () => changeSection("venta");

  useEffect(() => {
    if (previousSection.current === section.id) return;
    previousSection.current = section.id;
    sectionHeader.current?.scrollIntoView?.({ block: "start" });
  }, [section.id]);

  useEffect(() => {
    let active = true;
    telorecargoPOS.state().then((response) => {
      if (active) setTelorecargoEnabled(entity(response)?.configured === true);
    }).catch(() => { if (active) setTelorecargoEnabled(false); });
    return () => { active = false; };
  }, [posLocationId]);

  const signOut = () => {
    localStorage.removeItem("POS_TOKEN");
    localStorage.removeItem("POS_LOCATION_ID");
    window.location.assign(posDesdeAdmin ? "/admin/pos" : "/prueba/pos");
  };

  const renderSection = () => {
    switch (section.id) {
      case "caja":
        return <PosCashPage cash={cash} posId={posLocationId} />;
      case "pedidos_web":
        return <OfflinePaymentsPage mode="pos" branchId={posBranchId} posLocationId={posLocationId} onBack={back} />;
      case "telorecargo":
        if (telorecargoEnabled === null) return <CircularProgress size={24} />;
        return telorecargoEnabled
          ? <POSTelorecargo posLocationId={posLocationId} onBack={back} />
          : <Alert severity="info">Telorecargo no está configurado para este punto de venta.</Alert>;
      case "reportes_servicios":
        return <TourReportsPage mode="pos" posBranchId={posBranchId} posLocationId={posLocationId} onBack={back} />;
      case "ventas_servicios":
        return <ToursPage mode="pos" posLocationId={posLocationId} posBranchId={posBranchId} onBack={back} />;
      case "historial":
        return <HistorialVentas cambiarVista={changeSection} posLocationId={posLocationId} />;
      case "ventas_pendientes":
        return <PendingSalesPOS cambiarVista={changeSection} posLocationId={posLocationId} />;
      case "credito_fiado":
        return <CreditoFiadoPOS cambiarVista={changeSection} posLocationId={posLocationId} />;
      case "notas":
        return <NotasInternas cambiarVista={changeSection} />;
      case "configuracion_pos":
        return <PosLocationPrintSettings cambiarVista={changeSection} posLocationId={posLocationId} />;
      case "facturas":
        return <ComprasFacturadas cambiarVista={changeSection} posLocationId={posLocationId} />;
      case "clientes":
        return <ClientesPOS cambiarVista={changeSection} />;
      default:
        return <POS cash={cash} openCash={() => changeSection("caja")} cart={cart} setCart={setCart} posName={posName} branchId={posBranchId} branchName={location.state?.branchName} />;
    }
  };

  const cashLabel = activeSession ? "Caja abierta" : cash.status?.cash_control_enabled === false
    ? "Control de caja desactivado" : cash.cutToday ? "Corte realizado" : cash.status ? "Caja sin abrir" : null;
  const failedDownloads = cash.downloads?.failed;

  return (
    <Box sx={{ minHeight: "100dvh", minWidth: 0, bgcolor: "#f5f6f8" }}>
      <Box ref={sectionHeader} component="header" sx={{ bgcolor: "#1d2025", color: "#fff", borderTop: "3px solid #ffc107", boxShadow: "0 4px 16px rgba(23,25,28,.14)" }}>
        <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ py: { xs: 1.25, sm: 1.75 }, borderBottom: "1px solid #373a41" }}>
            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
              <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2, display: { xs: "none", sm: "grid" }, placeItems: "center", bgcolor: "#ffc107", color: "#17191c" }}><PointOfSaleOutlinedIcon /></Box>
              <Box minWidth={0}>
                <Typography sx={{ fontSize: 12, color: "#ffc107 !important", fontWeight: 800 }}>Punto de venta</Typography>
                <Typography variant="h6" noWrap sx={{ color: "#fff !important", fontWeight: 800, lineHeight: 1.25 }}>{posName || "Terminal POS"}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" gap={0.75} alignItems="center" flexShrink={0}>
              {cashLabel && <Chip size="small" label={cashLabel} sx={{ display: { xs: "none", md: "inline-flex" }, bgcolor: activeSession ? "#174434" : "#363a43", color: activeSession ? "#bcf0d8" : "#e2e4e8" }} />}
              {activeSession && section.id !== "caja" && (
                <Button onClick={() => changeSection("caja")} startIcon={<LockOutlinedIcon />} sx={{ ...navButton, bgcolor: "#ffc107", color: "#17191c", "&:hover": { bgcolor: "#ffe082", color: "#17191c" } }}>
                  Hacer corte
                </Button>
              )}
              <Button onClick={signOut} aria-label="Cerrar sesión" sx={{ ...navButton, minWidth: 44 }}><LogoutIcon fontSize="small" /><Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.75 }}>Salir</Box></Button>
            </Stack>
          </Stack>
          <Box component="nav" aria-label="Secciones del punto de venta" sx={{
            display: { xs: "grid", sm: "flex" },
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            flexWrap: "wrap",
            gap: 0.5,
            py: 0.75,
          }}>
            {sections.map(({ id, title, icon }) => (
              <Button
                key={id}
                aria-current={section.id === id ? "page" : undefined}
                onClick={() => changeSection(id)}
                startIcon={icon}
                sx={{
                  ...navButton,
                  minWidth: 0,
                  minHeight: { xs: 54, sm: 40 },
                  px: { xs: 0.5, sm: 1.25 },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 0.35, sm: 0.75 },
                  whiteSpace: { xs: "normal", sm: "nowrap" },
                  lineHeight: 1.15,
                  fontSize: { xs: 11, sm: 13 },
                  "& .MuiButton-startIcon": { m: 0 },
                }}
              >
                {title}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" aria-labelledby="pos-section-title" sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Typography id="pos-section-title" component="h1" className={section.id === "venta" ? "visually-hidden" : undefined} sx={{ color: "#1d2025", fontSize: { xs: 23, md: 29 }, fontWeight: 800, mb: 2, letterSpacing: "-.02em" }}>{section.title}</Typography>
        {cash.downloads?.pending && <Alert severity="info" sx={{ mb: 2 }}>Preparando el PDF y Excel del inventario inicial…</Alert>}
        {Boolean(failedDownloads?.length) && (
          <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => cash.downloadOpening(cash.downloads.sessionId, failedDownloads)}>Reintentar</Button>}>
            No se pudo descargar {failedDownloads.map((format) => format === "pdf" ? "PDF" : "Excel").join(" y ")} del inventario inicial.
          </Alert>
        )}
        <Suspense fallback={<CircularProgress size={24} aria-label="Cargando sección" />}>{renderSection()}</Suspense>
      </Box>
    </Box>
  );
}
