import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

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
import { posControlledEnabled, posServicesEnabled } from "../utils/posServices";
import { readSaleRecovery } from "../utils/posSaleRecovery";
import { cashAlreadyCutMessage, cashBlockMessage } from "../utils/cashControl";

const POSServiceWorkspace = React.lazy(() => import("./POS/POSServiceWorkspace"));
const operationalSections = [
  { key: "service_sales", id: "servicios", title: "Servicios", icon: <ConfirmationNumberOutlinedIcon /> },
  { key: "vehicle_records", id: "expedientes", title: "Expedientes vehiculares", icon: <ReceiptLongOutlinedIcon /> },
];

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

const classicCards = {
  servicios: { color: "#107269", description: "Agenda, recepción, órdenes e historial" },
  expedientes: { color: "#1e67b9", description: "Vehículos e historial de atención" },
  pedidos_web: { color: "#1e67b9", description: "Revisar comprobantes de pedidos de productos de esta caja" },
  reportes_servicios: { color: "#107269", description: "Manifiesto de pasajeros y descarga Excel", icon: <ReceiptLongOutlinedIcon /> },
  ventas_servicios: { color: "#985b00", description: "Ventas, reservas, pasajeros y pagos de tours", icon: <RocketLaunchRoundedIcon /> },
  venta: { color: "#157b34", description: "Accede al módulo principal de ventas" },
  telorecargo: { color: "#1764b6", description: "Recargas, saldo compartido y solicitudes de abono" },
  historial: { color: "#204acd", description: "Consulta todas las ventas realizadas" },
  ventas_pendientes: { color: "#9c5e05", title: "Ventas Pendientes", description: "Consulta ventas con saldo pendiente" },
  credito_fiado: { color: "#ad5007", title: "Módulo de crédito", description: "Control de fiados, abonos y saldos pendientes." },
  notas: { color: "#bd0ea4", title: "Notas Internas", description: "Gestiona notas y recordatorios" },
  facturas: { color: "#ad5007", description: "Consulta tus facturas" },
  clientes: { color: "#6037ad", description: "Consulta y administra clientes" },
  configuracion_pos: { color: "#107269", description: "Configura las opciones de la terminal" },
  caja: { color: "#2647a5", description: "Abre y administra la caja" },
};

const classicLink = { borderRadius: 3, textTransform: "none", fontWeight: 800 };

function ClassicMenu({ modules, visibleSections, changeSection }) {
  if (modules.error) return <Alert severity="error">{modules.error}</Alert>;
  if (!modules.keys) return <CircularProgress aria-label="Consultando módulos" />;
  if (!visibleSections.length) return <Alert severity="info">La tienda no tiene módulos visibles para este punto de venta.</Alert>;

  return (
    <Box component="nav" aria-label="Módulos del punto de venta" sx={{
      display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
      gap: { xs: 1.5, md: 3 }, pt: { xs: 1, md: 2 },
    }}>
      {Object.keys(classicCards).map(id => {
        const section = visibleSections.find(item => item.id === id);
        if (!section) return null;
        const { title, color, description, icon } = classicCards[id];
        return (
          <Button key={id} onClick={() => changeSection(id)} sx={{
            minHeight: { xs: 150, sm: 180, md: 220 }, p: 2, flexDirection: "column", gap: 1,
            bgcolor: color, color: "#fff", borderRadius: "16px", textTransform: "none",
            boxShadow: "0 5px 12px #0005", "&:hover": { bgcolor: color, filter: "brightness(.94)" },
            "& .MuiSvgIcon-root": { fontSize: 36 },
          }}>
            {icon ?? section.icon}
            <Typography component="span" sx={{ color: "inherit !important", fontWeight: 900, fontSize: 19 }}>{title ?? section.title}</Typography>
            <Typography component="span" sx={{ color: "inherit !important", fontSize: 14, maxWidth: 205, lineHeight: 1.3 }}>{description}</Typography>
          </Button>
        );
      })}
    </Box>
  );
}

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

export default function POSDashboard({ posName, posDesdeAdmin, posLocationId, posBranchId, session, interfaceDesign = "actual", onRefreshInterface }) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [cart, setCart] = useState([]);
  const checkoutInProgress = useRef(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [recoveryReceipt, setRecoveryReceipt] = useState(false);
  const startCheckout = () => {
    if (checkoutInProgress.current) return false;
    checkoutInProgress.current = true;
    setCheckoutPending(true);
    return true;
  };
  const finishCheckout = () => {
    checkoutInProgress.current = false;
    setCheckoutPending(false);
  };
  const [refreshError, setRefreshError] = useState("");
  const classic = interfaceDesign === "clasico";
  const modules = useVisiblePOSModules(posLocationId);
  const cash = useCashStatus(posLocationId);
  const activeSession = cash.status?.session;
  const requestedSection = params.get("seccion");
  const defaultSection = cash.status?.cash_control_enabled === false ? "venta" : "caja";
  const operational = posServicesEnabled && !posDesdeAdmin && Boolean(session);
  const authorizedKeys = modules.authorizedKeys ?? [];
  const orderAuthorized = authorizedKeys.includes("service_sales") && modules.operationalKeys?.includes("service_sales");
  const availableSections = operational ? [...sections,
    ...operationalSections.filter(({ key }) => key === "vehicle_records" ? authorizedKeys.includes(key) : orderAuthorized)] : sections;
  const visibleSections = (modules.keys ?? []).flatMap((key) => availableSections.filter((item) => item.key === key));
  const deniedOperational = operationalSections.some(({ id }) => id === requestedSection) &&
    (!operational || (modules.keys && !visibleSections.some(({ id }) => id === requestedSection)));
  const section = visibleSections.find(({ id }) => id === requestedSection)
    ?? visibleSections.find(({ id }) => id === defaultSection)
    ?? visibleSections[0];
  const showClassicMenu = classic && !deniedOperational && (!requestedSection || (modules.keys && section?.id !== requestedSection));
  const sectionId = showClassicMenu ? undefined : section?.id;
  const previousSection = useRef(sectionId);
  const sectionHeader = useRef(null);

  const changeSection = (id) => {
    if (requestedSection === id) return;
    setParams((previous) => {
      const query = new URLSearchParams(previous);
      ["vista", "id", "cliente", "captura", "history"].forEach((key) => query.delete(key));
      query.set("seccion", id);
      return query;
    }, { state: location.state });
  };

  useEffect(() => {
    if (previousSection.current === sectionId) return;
    previousSection.current = sectionId;
    setRecoveryReceipt(false);
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
    if (deniedOperational) return <Alert severity="warning">Este módulo operativo no está disponible en la terminal.</Alert>;
    if (operationalSections.some(({ id }) => id === requestedSection) && !modules.keys) {
      return modules.error ? <Alert severity="error">{modules.error}</Alert> : <CircularProgress aria-label="Consultando módulos" />;
    }
    switch (sectionId) {
      case "servicios":
      case "expedientes":
        return <React.Suspense fallback={<CircularProgress aria-label="Cargando servicios" />}>
          <POSServiceWorkspace section={sectionId} posId={posLocationId} branchId={posBranchId}
            session={session} moduleKeys={authorizedKeys} />
        </React.Suspense>;
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
        return <HistorialVentas posLocationId={posLocationId} classicNavigation={classic && (
          <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
            <Button variant="contained" startIcon={<DashboardRoundedIcon />} onClick={goToClassicMenu}
              sx={{ ...classicLink, minHeight: 46, bgcolor: "grey.900", "&:hover": { bgcolor: "grey.800" } }}>
              Regresar al panel
            </Button>
            {[["venta", "Ventas"], ["ventas_pendientes", "Pendientes"], ["credito_fiado", "Crédito"], ["facturas", "Facturas"]].map(([id, label]) => {
              const item = visibleSections.find(section => section.id === id);
              return item && <Button key={id} variant="outlined" startIcon={item.icon} onClick={() => changeSection(id)}
                sx={{ ...classicLink, minHeight: 46 }}>{label}</Button>;
            })}
          </Stack>
        )} />;
      case "ventas_pendientes":
        return <PendingSalesPOS classic={classic} posLocationId={posLocationId} />;
      case "credito_fiado":
        return <CreditoFiadoPOS classic={classic} posLocationId={posLocationId} />;
      case "notas":
        return <NotasInternas classic={classic} />;
      case "configuracion_pos":
        return <PosLocationPrintSettings posLocationId={posLocationId} />;
      case "facturas":
        return <ComprasFacturadas posLocationId={posLocationId} />;
      case "clientes":
        return <ClientesPOS />;
      case "venta":
        if (!cash.canSell && !(posControlledEnabled && (recoveryReceipt || readSaleRecovery(posLocationId)))) {
          return <SalesCashGate cash={cash} posName={posName} />;
        }
        return <>
          {operational && /^\?seccion=servicios&vista=orders&id=\d+$/.test(location.state?.returnToOrder?.slice(location.pathname.length) ?? "") &&
            location.state.returnToOrder.startsWith(location.pathname + "?") &&
            <Button component={Link} to={location.state.returnToOrder}>Volver a la orden de servicio</Button>}
          <POS cash={cash} cart={cart} setCart={setCart} posName={posName} branchId={posBranchId} modules={authorizedKeys}
            operationalServices={operational && orderAuthorized} orderAuthorized={orderAuthorized}
            idempotencyEnabled={modules.idempotencyEnabled} serviceOrderId={location.state?.serviceOrderId}
            checkoutPending={checkoutPending} startCheckout={startCheckout} finishCheckout={finishCheckout}
            onRecoveryReceipt={setRecoveryReceipt}
            onDetachOrder={() => setParams(params, { replace: true, state: null })} branchName={location.state?.branchName} classic={classic} />
        </>;
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
    <Box sx={{ minHeight: "100dvh", minWidth: 0, bgcolor: classic ? "#f3f3f3" : "#f5f6f8" }}>
      <Box ref={sectionHeader} component="header" sx={{ bgcolor: classic ? "#f3f3f3" : "#1d2025", color: classic ? "#111" : "#fff", borderTop: classic ? "none" : "3px solid #ffc107", boxShadow: classic ? "none" : "0 4px 16px rgba(23,25,28,.14)" }}>
        <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ py: { xs: 1.25, sm: 1.75 }, borderBottom: classic ? "none" : "1px solid #373a41" }}>
            {classic ? (
              <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                <PointOfSaleOutlinedIcon fontSize="small" />
                <Typography component="h1" sx={{ color: "#000 !important", fontSize: { xs: 20, md: 32 }, fontWeight: 700, lineHeight: 1.25 }}>
                  Punto de Venta: {posName || "Terminal POS"}
                </Typography>
              </Stack>
            ) : (
            <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
              <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2, display: { xs: "none", sm: "grid" }, placeItems: "center", bgcolor: classic ? "transparent" : "#ffc107", color: "#17191c" }}><PointOfSaleOutlinedIcon /></Box>
              <Box minWidth={0}>
                <Typography sx={{ fontSize: 12, color: classic ? "#444 !important" : "#ffc107 !important", fontWeight: 800 }}>Punto de venta</Typography>
                <Typography variant="h6" noWrap sx={{ color: classic ? "#111 !important" : "#fff !important", fontWeight: 800, lineHeight: 1.25 }}>{posName || "Terminal POS"}</Typography>
              </Box>
            </Stack>
            )}
            <Stack direction="row" gap={0.75} alignItems="center" flexShrink={0}>
              {!classic && cashLabel && modules.keys?.includes("cash") && <Chip size="small" label={cashLabel} sx={{ display: { xs: "none", md: "inline-flex" }, bgcolor: activeSession ? "#174434" : "#363a43", color: activeSession ? "#bcf0d8" : "#e2e4e8" }} />}
              <Button onClick={refreshMenu} disabled={modules.refreshing} aria-label="Actualizar menú" title="Actualizar menú" sx={{ ...navButton, color: classic ? "#333" : navButton.color, minWidth: 44, "&.Mui-disabled": { color: "#aeb7c2" } }}><RefreshRoundedIcon fontSize="small" /></Button>
              {classic ? <Button variant="outlined" color="error" onClick={signOut} aria-label="Cerrar sesión"
                startIcon={<LogoutIcon fontSize="small" />} sx={{ minWidth: 40, "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } } }}>
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Cerrar sesión</Box>
              </Button> : <Button onClick={signOut} aria-label="Cerrar sesión" sx={{ ...navButton, color: classic ? "#c62828" : navButton.color, minWidth: 44 }}><LogoutIcon fontSize="small" /><Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.75 }}>Salir</Box></Button>}
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

      <Box component="section" aria-labelledby={showClassicMenu ? undefined : "pos-section-title"} sx={{ maxWidth: 1600, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 }, py: classic ? 2 : { xs: 2, md: 3 }, minWidth: 0 }}>
        {refreshError && <Alert severity="warning" sx={{ mb: 2 }}>{refreshError}</Alert>}
        {showClassicMenu && <ClassicMenu modules={modules} visibleSections={visibleSections} changeSection={changeSection} />}
        {classic && sectionId === "venta" && (
          <Box component="nav" aria-label="Accesos de venta" sx={{
            p: 2, mb: 2, bgcolor: "#fff", border: "1px solid #ddd", borderRadius: 3,
            boxShadow: "0 12px 28px #0001", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1,
          }}>
            {["historial", "facturas"].map(id => {
              const item = visibleSections.find(section => section.id === id);
              const color = id === "historial" ? "#f59e0b" : "#ef4248";
              return item && <Button key={id} variant="contained" startIcon={item.icon}
                onClick={() => changeSection(id)} sx={{ ...classicLink, minWidth: 160, bgcolor: color, "&:hover": { bgcolor: color, filter: "brightness(.94)" } }}>{item.title}</Button>;
            })}
            <Button variant="outlined" startIcon={<DashboardRoundedIcon />} onClick={goToClassicMenu}
              sx={{ ...classicLink, minWidth: 160 }}>Panel</Button>
          </Box>
        )}
        {classic && sectionId && !["venta", "historial"].includes(sectionId) && (
          <Button variant="outlined" color={sectionId === "ventas_pendientes" ? "primary" : "success"}
            startIcon={sectionId === "ventas_pendientes" ? <ArrowBackRoundedIcon /> : <DashboardRoundedIcon />}
            onClick={goToClassicMenu} sx={{ ...classicLink, mb: 2 }}>
            {sectionId === "ventas_pendientes" ? "Volver al panel" : "Regresar al Panel"}
          </Button>
        )}
        {!showClassicMenu && <>
        <Typography id="pos-section-title" component={classic ? "h2" : "h1"} className={sectionId === "caja" ? undefined : "visually-hidden"} sx={{ color: "#1d2025", fontSize: { xs: 23, md: 29 }, fontWeight: 800, mb: 2, letterSpacing: "-.02em" }}>{section?.title ?? "Módulos del punto de venta"}</Typography>
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
