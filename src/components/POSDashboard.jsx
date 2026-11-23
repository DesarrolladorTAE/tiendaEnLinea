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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

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
import useVisiblePOSModules from "../hooks/POS/useVisiblePOSModules";
import { cashAlreadyCutMessage, cashBlockMessage } from "../utils/cashControl";

const POSTelorecargo = lazy(() => import("../modules/telorecargo/POSTelorecargo.jsx"));
const TourReportsPage = lazy(() => import("../pages/tours/TourReportsPage"));
const ToursPage = lazy(() => import("../pages/tours/ToursPage"));
const OfflinePaymentsPage = lazy(() => import("./offline/OfflinePaymentsPage"));

const sections = [
  { key: "cash", id: "caja", title: "Caja", icon: <PointOfSaleOutlinedIcon /> },
  { key: "sales", id: "venta", title: "Venta", icon: <ShoppingCartOutlinedIcon /> },
  { key: "history", id: "historial", title: "Historial", icon: <HistoryOutlinedIcon /> },
  { key: "web_orders", id: "pedidos_web", title: "Pedidos web", icon: <ReceiptLongOutlinedIcon /> },
  { key: "pending_sales", id: "ventas_pendientes", title: "Ventas pendientes", icon: <PendingActionsOutlinedIcon /> },
  { key: "credits", id: "credito_fiado", title: "Crédito y fiados", icon: <CreditScoreOutlinedIcon /> },
  { key: "customers", id: "clientes", title: "Clientes", icon: <PeopleAltOutlinedIcon /> },
  { key: "invoices", id: "facturas", title: "Facturas", icon: <RequestQuoteOutlinedIcon /> },
  { key: "service_sales", id: "ventas_servicios", title: "Ventas de servicios", icon: <ConfirmationNumberOutlinedIcon /> },
  { key: "service_reports", id: "reportes_servicios", title: "Reportes de servicios", icon: <AssessmentOutlinedIcon /> },
  { key: "telorecargo", id: "telorecargo", title: "Recargas Telorecargo", icon: <PhoneAndroidOutlinedIcon /> },
  { key: "internal_notes", id: "notas", title: "Notas internas", icon: <StickyNote2OutlinedIcon /> },
  { key: "settings", id: "configuracion_pos", title: "Configuración", icon: <SettingsOutlinedIcon /> },
];

const classicDescriptions = {
  caja: "Abre y administra la caja", venta: "Accede al módulo principal de ventas", historial: "Consulta las ventas realizadas", pedidos_web: "Revisa los pedidos de productos de esta caja", ventas_pendientes: "Consulta y cobra ventas pendientes", credito_fiado: "Administra crédito y fiados", clientes: "Consulta y administra clientes", facturas: "Consulta tus facturas", ventas_servicios: "Ventas, reservas y pagos de servicios", reportes_servicios: "Consulta los reportes de servicios", telorecargo: "Recargas, saldo y solicitudes de abono", notas: "Consulta las notas internas", configuracion_pos: "Configura las opciones de la terminal",
};

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

function SalesCashGate({ cash, posName }) {
  const loading = !cash.status && !cash.error;
  const title = cash.error ? "No pudimos consultar la caja"
    : loading ? "Consultando la caja"
      : cash.cutToday ? "Corte realizado"
        : cash.status.session ? "Caja fuera de horario" : "Caja cerrada";
  const message = cash.error || (cash.cutToday ? cashAlreadyCutMessage : cash.status ? cashBlockMessage(cash.status) : "Estamos verificando si puedes empezar a vender.");

  return (
    <Box component="section" aria-labelledby="sales-cash-gate-title" sx={{
      display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 180px" },
      maxWidth: 760, mx: "auto", mt: { xs: 0.5, sm: 2 }, overflow: "hidden", borderRadius: { xs: 3, sm: 4 },
      bgcolor: "#182738", color: "#fff", borderTop: "4px solid #ffc107", boxShadow: "0 12px 26px rgba(24,39,56,.15)",
    }}>
      <Stack spacing={2} sx={{ p: { xs: 2.5, sm: 4 }, minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0, borderRadius: 2, bgcolor: "#ffc107", color: "#182738" }}>
            {loading ? <CircularProgress size={22} color="inherit" aria-label="Consultando caja" /> : <LockOutlinedIcon />}
          </Box>
          <Typography variant="body2" sx={{ color: "#f5d574 !important", fontWeight: 750, overflowWrap: "anywhere" }}>
            {posName || "Punto de venta"}
          </Typography>
        </Stack>
        <Box role="status">
          <Typography id="sales-cash-gate-title" component="h2" sx={{ color: "#fff !important", fontSize: { xs: 24, sm: 32 }, fontWeight: 800, lineHeight: 1.15, mb: 1 }}>
            {title}
          </Typography>
          <Typography sx={{ color: "#d6e2ef !important", overflowWrap: "anywhere" }}>{message}</Typography>
        </Box>
        {cash.error && cash.refresh && <Button startIcon={<RefreshRoundedIcon />} onClick={cash.refresh}
          sx={{ minHeight: 46, alignSelf: { sm: "start" }, color: "#fff", textTransform: "none", fontWeight: 700 }}>Reintentar</Button>}
      </Stack>
      <Box aria-hidden="true" sx={{
        display: { xs: "none", sm: "grid" }, placeItems: "center", borderLeft: "1px solid #3c4b5b",
        background: "radial-gradient(circle, #384858 0%, #223447 60%, #1e2e40 100%)",
      }}>
        <Box sx={{ display: "grid", placeItems: "center", width: 104, height: 104, borderRadius: "50%", border: "1px solid #65737e", color: "#ffc107" }}>
          <PointOfSaleOutlinedIcon sx={{ fontSize: 56 }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function POSDashboard({ posName, posDesdeAdmin, posLocationId, posBranchId, interfaceDesign = "actual", onRefreshInterface }) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const [refreshError, setRefreshError] = useState("");
  const classic = interfaceDesign === "clasico";
  const modules = useVisiblePOSModules(posLocationId);
  const cash = useCashStatus(posLocationId);
  const activeSession = cash.status?.session;
  const requestedSection = params.get("seccion");
  const defaultSection = cash.status?.cash_control_enabled === false ? "venta" : "caja";
  const visibleSections = (modules.keys ?? []).map((key) => sections.find((item) => item.key === key)).filter(Boolean);
  const section = visibleSections.find(({ id }) => id === requestedSection)
    ?? visibleSections.find(({ id }) => id === defaultSection)
    ?? visibleSections[0];
  const sectionId = section?.id;
  const previousSection = useRef(sectionId);
  const sectionHeader = useRef(null);

  const changeSection = (id) => {
    if (requestedSection === id) return;
    setParams((previous) => {
      const query = new URLSearchParams(previous);
      query.set("seccion", id);
      return query;
    }, { state: location.state });
  };

  useEffect(() => {
    if (previousSection.current === sectionId) return;
    previousSection.current = sectionId;
    sectionHeader.current?.scrollIntoView?.({ block: "start" });
  }, [sectionId]);

  const goToClassicMenu = () => setParams(previous => { const query = new URLSearchParams(previous); query.delete("seccion"); return query; }, { state: location.state });
  const refreshMenu = async () => {
    setRefreshError("");
    await modules.refresh();
    try { await onRefreshInterface?.(); } catch { setRefreshError("No se pudo actualizar la interfaz del punto de venta."); }
  };

  const signOut = () => {
    localStorage.removeItem("POS_TOKEN");
    localStorage.removeItem("POS_LOCATION_ID");
    window.location.assign(posDesdeAdmin ? "/admin/pos" : "/prueba/pos");
  };

  const renderSection = () => {
    switch (sectionId) {
      case "caja":
        return <PosCashPage cash={cash} posId={posLocationId} />;
      case "pedidos_web":
        return <OfflinePaymentsPage mode="pos" branchId={posBranchId} posLocationId={posLocationId} />;
      case "telorecargo":
        return <POSTelorecargo posLocationId={posLocationId} />;
      case "reportes_servicios":
        return <TourReportsPage mode="pos" posBranchId={posBranchId} posLocationId={posLocationId} />;
      case "ventas_servicios":
        return <ToursPage mode="pos" posLocationId={posLocationId} posBranchId={posBranchId} />;
      case "historial":
        return <HistorialVentas posLocationId={posLocationId} />;
      case "ventas_pendientes":
        return <PendingSalesPOS posLocationId={posLocationId} />;
      case "credito_fiado":
        return <CreditoFiadoPOS posLocationId={posLocationId} />;
      case "notas":
        return <NotasInternas />;
      case "configuracion_pos":
        return <PosLocationPrintSettings posLocationId={posLocationId} />;
      case "facturas":
        return <ComprasFacturadas posLocationId={posLocationId} />;
      case "clientes":
        return <ClientesPOS />;
      case "venta":
        if (!cash.canSell) {
          return <SalesCashGate cash={cash} posName={posName} />;
        }
        return <POS cash={cash} cart={cart} setCart={setCart} posName={posName} branchId={posBranchId} branchName={location.state?.branchName} classic={classic} />;
      default:
        if (modules.error) return <Alert severity="error">{modules.error}</Alert>;
        if (!modules.keys) return <CircularProgress size={24} aria-label="Consultando módulos" />;
        return <Alert severity="info">La tienda no tiene módulos visibles para este punto de venta.</Alert>;
    }
  };

  const cashLabel = activeSession ? "Caja abierta" : cash.status?.cash_control_enabled === false
    ? "Control de caja desactivado" : cash.cutToday ? "Corte realizado" : cash.status ? "Caja sin abrir" : null;
  const failedDownloads = cash.downloads?.failed;

  return (
    <Box sx={{ minHeight: "100dvh", minWidth: 0, bgcolor: "#f5f6f8" }}>
      <Box ref={sectionHeader} component="header" sx={{ bgcolor: classic ? "#f3f3f3" : "#1d2025", color: classic ? "#111" : "#fff", borderTop: classic ? "none" : "3px solid #ffc107", boxShadow: classic ? "none" : "0 4px 16px rgba(23,25,28,.14)" }}>
        <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ py: { xs: 1.25, sm: 1.75 }, borderBottom: classic ? "none" : "1px solid #373a41" }}>
            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
              <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2, display: { xs: "none", sm: "grid" }, placeItems: "center", bgcolor: classic ? "transparent" : "#ffc107", color: "#17191c" }}><PointOfSaleOutlinedIcon /></Box>
              <Box minWidth={0}>
                <Typography sx={{ fontSize: 12, color: classic ? "#444 !important" : "#ffc107 !important", fontWeight: 800 }}>Punto de venta</Typography>
                <Typography variant="h6" noWrap sx={{ color: classic ? "#111 !important" : "#fff !important", fontWeight: 800, lineHeight: 1.25 }}>{posName || "Terminal POS"}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" gap={0.75} alignItems="center" flexShrink={0}>
              {cashLabel && modules.keys?.includes("cash") && <Chip size="small" label={cashLabel} sx={{ display: { xs: "none", md: "inline-flex" }, bgcolor: activeSession ? "#174434" : "#363a43", color: activeSession ? "#bcf0d8" : "#e2e4e8" }} />}
              <Button onClick={refreshMenu} disabled={modules.refreshing} aria-label="Actualizar menú" title="Actualizar menú" sx={{ ...navButton, color: classic ? "#333" : navButton.color, minWidth: 44, "&.Mui-disabled": { color: "#aeb7c2" } }}><RefreshRoundedIcon fontSize="small" /></Button>
              <Button onClick={signOut} aria-label="Cerrar sesión" sx={{ ...navButton, color: classic ? "#c62828" : navButton.color, minWidth: 44 }}><LogoutIcon fontSize="small" /><Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.75 }}>Salir</Box></Button>
            </Stack>
          </Stack>
          {!classic && <Box component="nav" aria-label="Secciones del punto de venta" sx={{
            display: { xs: "grid", sm: "flex" },
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            flexWrap: "wrap",
            gap: 0.5,
            py: 0.75,
          }}>
            {visibleSections.map(({ id, title, icon }) => (
              <Button
                key={id}
                aria-current={sectionId === id ? "page" : undefined}
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
          </Box>}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="pos-section-title" sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2, md: 3 }, minWidth: 0 }}>
        {refreshError && <Alert severity="warning" sx={{ mb: 2 }}>{refreshError}</Alert>}
        {classic && requestedSection && <Box sx={{ p: 1.25, mb: 2, bgcolor: "#fff", border: "1px solid #e0e0e0", borderRadius: 2, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
          {visibleSections.filter(item => ["historial", "facturas"].includes(item.id) && item.id !== sectionId).map(item => <Button key={item.id} variant="contained" startIcon={item.icon} onClick={() => changeSection(item.id)} sx={{ minWidth: 140, bgcolor: item.id === "historial" ? "#fb9900" : "#ef4248", textTransform: "none", fontWeight: 800 }}>{item.title}</Button>)}
          <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={goToClassicMenu} sx={{ minWidth: 140, textTransform: "none", fontWeight: 800 }}>Menú principal</Button>
        </Box>}
        {classic && !requestedSection ? <Box component="section" aria-label="Módulos del punto de venta"><Typography component="h1" sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 900, mb: 2 }}>Punto de venta: {posName || "Terminal POS"}</Typography>{modules.error ? <Alert severity="error">{modules.error}</Alert> : !modules.keys ? <CircularProgress aria-label="Consultando módulos" /> : visibleSections.length === 0 ? <Alert severity="info">La tienda no tiene módulos visibles para este punto de venta.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: { xs: 1.5, sm: 2 } }}>{visibleSections.map(({ id, title, icon }, index) => <Button key={id} onClick={() => changeSection(id)} sx={{ minHeight: { xs: 120, sm: 175 }, p: 2, display: "flex", flexDirection: "column", gap: 1, bgcolor: ["#1662b6", "#137368", "#9b5e00", "#157638", "#214bc9", "#a0440d"][index % 6], color: "#fff", borderRadius: 2.5, textTransform: "none", boxShadow: "0 6px 14px #0002", "&:hover": { filter: "brightness(.9)" }, "& .MuiSvgIcon-root": { fontSize: 36 } }}>{icon}<Typography component="span" sx={{ color: "#fff !important", fontWeight: 900, fontSize: 18 }}>{title}</Typography><Typography component="span" sx={{ color: "#fff !important", fontSize: 13, maxWidth: 240, lineHeight: 1.3 }}>{classicDescriptions[id]}</Typography></Button>)}</Box>}</Box> : null}
        {(!classic || requestedSection) && <><Typography id="pos-section-title" component="h1" className={sectionId === "caja" ? undefined : "visually-hidden"} sx={{ color: "#1d2025", fontSize: { xs: 23, md: 29 }, fontWeight: 800, mb: 2, letterSpacing: "-.02em" }}>{section?.title ?? "Módulos del punto de venta"}</Typography>
        {cash.downloads?.pending && <Alert severity="info" sx={{ mb: 2 }}>Preparando el PDF y Excel del inventario inicial…</Alert>}
        {Boolean(failedDownloads?.length) && (
          <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => cash.downloadOpening(cash.downloads.sessionId, failedDownloads)}>Reintentar</Button>}>
            No se pudo descargar {failedDownloads.map((format) => format === "pdf" ? "PDF" : "Excel").join(" y ")} del inventario inicial.
          </Alert>
        )}
        <Suspense fallback={<CircularProgress size={24} aria-label="Cargando sección" />}>{renderSection()}</Suspense></>}
      </Box>
    </Box>
  );
}
