// Shared full-page inbox for administration and POS.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Divider,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Paper,
  Skeleton,
  Tooltip,
  useMediaQuery,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CancelPresentationRoundedIcon from "@mui/icons-material/CancelPresentationRounded";
import ImageSearchRoundedIcon from "@mui/icons-material/ImageSearchRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DocumentSettingsTheme from "../admin/DocumentSettingsTheme";

import axiosClientStore from "../../config/axiosClient";
import axiosClientPOS from "../../config/axiosClientPOS";
import { showConfirm, showSuccess, alertFromAxiosError } from "../../utils/alerts";

const STATUS_TABS = [
  { key: "pending", label: "Nuevas" },
  { key: "approved", label: "Confirmadas" },
  { key: "rejected", label: "Canceladas" },
];

const moneyMX = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

const pick = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

const isTour = row => row?.source === "tour" || String(row?.id || "").startsWith("tour-");
const paymentLabel = type => ({ deposit: "Anticipo", partial: "Abono", full: "Liquidación", final: "Liquidación" }[type] || "Pago");
const canAct = (row, action) => row?.actions?.[`can_${action}`] ?? (!isTour(row) && (["delete", "send_ticket"].includes(action) || !["approved", "rejected"].includes(pick(row?.status ?? row?.form?.status))));
function StatusChip({ formStatus, saleStatus }) {
  const fs = pick(formStatus);
  const ss = pick(saleStatus);

  if (ss === "paid" || fs === "approved") {
    return <Chip size="small" color="success" label="Confirmada" sx={{ fontWeight: 900 }} />;
  }
  if (ss === "cancelled" || fs === "rejected") {
    return <Chip size="small" color="default" label="Cancelada" sx={{ fontWeight: 900 }} />;
  }
  return <Chip size="small" color="warning" label="Pendiente" sx={{ fontWeight: 900 }} />;
}

function MonthDefault() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

function isPdfUrl(url = "") {
  const u = String(url || "").toLowerCase();
  return u.includes(".pdf") || u.includes("application/pdf");
}
function isImageUrl(url = "") {
  const u = String(url || "").toLowerCase();
  return (
    u.includes(".png") ||
    u.includes(".jpg") ||
    u.includes(".jpeg") ||
    u.includes(".webp") ||
    u.includes("image/")
  );
}

export default function OfflinePaymentsPage({ onBack, branches = [], mode = "store", branchId, posLocationId }) {
  const open = true;
  const [branch, setBranch] = useState("");
  const [pos, setPos] = useState("");
  const [locations, setLocations] = useState([]);
  const [scopeError, setScopeError] = useState("");
  const effectiveBranch = branchId || branch;
  const effectivePos = mode === "pos" ? "" : (posLocationId || pos);
  useEffect(() => {
    if (!open || mode !== "store" || !effectiveBranch) return;
    const controller = new AbortController();
    setLocations([]); setScopeError("");
    axiosClientStore.get(`/branches/${effectiveBranch}/pos`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setLocations(data?.list ?? data?.data ?? []);
    }).catch(() => { if (!controller.signal.aborted) setScopeError("No se pudieron cargar las cajas de la sucursal."); });
    return () => controller.abort();
  }, [open, mode, effectiveBranch]);
  const controls = mode === "store" ? <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
    {!branchId && <TextField select label="Sucursal" value={branch} onChange={e => { setBranch(e.target.value); setPos(""); setLocations([]); }} sx={{ minWidth: 200 }}><MenuItem value="">Todas (incluye pedidos antiguos sin venta)</MenuItem>{branches.map(item => <MenuItem key={item.id} value={item.id}>{item.name || `Sucursal #${item.id}`}</MenuItem>)}</TextField>}
    {!posLocationId && <TextField select label="Caja" value={pos} disabled={!effectiveBranch} onChange={e => setPos(e.target.value)} sx={{ minWidth: 200 }}><MenuItem value="">Todas las cajas</MenuItem>{Array.isArray(locations) && locations.map(item => <MenuItem key={item.id} value={item.id}>{item.name || `Caja #${item.id}`}</MenuItem>)}</TextField>}
    {scopeError && <Typography color="error">{scopeError}</Typography>}
  </Stack> : <Typography>Productos de esta caja y comprobantes de tours de la sucursal.</Typography>;
  return <DocumentSettingsTheme><OfflinePaymentsContent key={`${mode}-${effectiveBranch}-${effectivePos}`} open={open} onClose={onBack} mode={mode} branchId={effectiveBranch} posLocationId={effectivePos} scopeControls={controls} /></DocumentSettingsTheme>;
}

function OfflinePaymentsContent({ open, onClose, mode, branchId, posLocationId, scopeControls }) {
  const axiosClient = mode === "pos" ? axiosClientPOS : axiosClientStore;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [month, setMonth] = useState(MonthDefault());

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // ticket preview modal
  const [ticketPreviewOpen, setTicketPreviewOpen] = useState(false);
  const [ticketPreviewUrl, setTicketPreviewUrl] = useState(null);

  // proof preview modal + zoom/pan (solo para imagen)
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const prettyDate = (d) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      return dt.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return String(d);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (tab === "pending") return "Solicitudes nuevas por validar (prioriza las que traen comprobante).";
    if (tab === "approved") return "Historial de solicitudes confirmadas en el mes seleccionado.";
    return "Solicitudes rechazadas/canceladas del mes seleccionado.";
  }, [tab]);

  const fetchStats = useCallback(async () => {
    if (!open) return;
    setStatsLoading(true);
    try {
      const { data } = await axiosClient.get("/admin/offline-payments/stats", { params: { source, month, branch_id: branchId || undefined, pos_location_id: posLocationId || undefined } });
      setStats(data?.data ?? null);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [open, source, month, axiosClient, branchId, posLocationId]);

  const fetchList = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/admin/offline-payments", {
        params: { source, page, status: tab, per_page: 20, month, branch_id: branchId || undefined, pos_location_id: posLocationId || undefined },
      });
      const list = data?.data?.data ?? data?.data ?? [];
      setRows(Array.isArray(list) ? list : []);
      setLastPage(data?.data?.last_page || 1);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar las solicitudes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, source, page, tab, month, axiosClient, branchId, posLocationId]);

  useEffect(() => {
    if (!open) return;
    fetchStats();
    fetchList();
  }, [open, tab, month, fetchList, fetchStats]);

  const filtered = useMemo(() => {
    const s = pick(q);
    if (!s) return rows;
    return rows.filter((r) => {
      const name = pick(r?.full_name);
      const phone = pick(r?.phone);
      const email = pick(r?.email);
      const saleId = String(r?.sale?.id ?? "");
      return name.includes(s) || phone.includes(s) || email.includes(s) || saleId.includes(s) || pick(r?.booking?.booking_code).includes(s) || pick(r?.booking?.tour_name).includes(s);
    });
  }, [rows, q]);

  // en "Nuevas" separa con/sin comprobante
  const pendingWithProof = useMemo(() => {
    if (tab !== "pending") return [];
    return filtered.filter((r) => !!r?.has_proof);
  }, [filtered, tab]);

  const pendingWithoutProof = useMemo(() => {
    if (tab !== "pending") return [];
    return filtered.filter((r) => !r?.has_proof);
  }, [filtered, tab]);

  const openDetails = useCallback(async (row) => {
    const id = row?.id;
    if (!id) return;

    setSelectedId(id);
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);

    try {
      const { data } = await axiosClient.get(`/admin/offline-payments/${id}`);
      setDetail(data?.data ?? null);
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar el detalle");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [axiosClient]);

  const handleApprove = useCallback(async () => {
    if (!canAct(detail, "approve") || !selectedId) return;

    const ok = await showConfirm(
      isTour(detail) ? "Confirmar este movimiento actualiza el saldo de la reserva y genera sus avisos. Continuar?" : "Confirmar este pago y enviar el ticket al cliente?",
      "Sí, confirmar"
    );
    if (!ok) return;

    try {
      const { data } = await axiosClient.post(`/admin/offline-payments/${selectedId}/approve`, {});
      await showSuccess(data?.message || "Pago confirmado");
      setDetailOpen(false);
      fetchStats();
      fetchList();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo confirmar el pago");
    }
  }, [selectedId, detail, axiosClient, fetchList, fetchStats]);

  const handleReject = useCallback(async () => {
    if (!canAct(detail, "reject") || !selectedId) return;

    const ok = await showConfirm(isTour(detail) ? "Rechazar este comprobante? El cliente podra enviar uno nuevo." : "Rechazar esta solicitud? La venta quedara pendiente.", "Rechazar");
    if (!ok) return;

    try {
      const { data } = await axiosClient.post(`/admin/offline-payments/${selectedId}/reject`, {});
      await showSuccess(data?.message || "Solicitud rechazada");
      setDetailOpen(false);
      fetchStats();
      fetchList();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo rechazar la solicitud");
    }
  }, [selectedId, detail, axiosClient, fetchList, fetchStats]);

  const handleDelete = useCallback(
    async (rowId) => {
      const ok = await showConfirm(
        "¿Eliminar este registro? Por seguridad se cancelará la venta asociada.",
        "Sí, eliminar"
      );
      if (!ok) return;

      try {
        const { data } = await axiosClient.delete(`/admin/offline-payments/${rowId}`, {
          params: { hard_delete: 0 },
        });
        await showSuccess(data?.message || "Eliminado");
        if (selectedId === rowId) setDetailOpen(false);
        fetchStats();
        fetchList();
      } catch (err) {
        alertFromAxiosError(err, "No se pudo eliminar");
      }
    },
    [fetchList, fetchStats, selectedId, axiosClient]
  );

  const handleResendTicket = useCallback(async () => {
    if (!selectedId || isTour(detail) || !canAct(detail, "send_ticket")) return;

    const phone = detail?.form?.phone || "";
    const ok = await showConfirm(
      `¿Re-enviar el ticket por WhatsApp al número del cliente?\n\n${phone}`,
      "Sí, enviar"
    );
    if (!ok) return;

    try {
      const { data } = await axiosClient.post(`/admin/offline-payments/${selectedId}/send-ticket`, {});
      await showSuccess(data?.message || "Ticket enviado");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo enviar el ticket");
    }
  }, [selectedId, detail, axiosClient]);

  const ticketUrl = detail?.sale?.ticket_url || null;
  const proofUrl = detail?.proof_url || detail?.form?.proof_url || null;
  const [proofType, setProofType] = useState("");
  useEffect(() => () => { if (proofPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(proofPreviewUrl); }, [proofPreviewUrl]);
  const previewProof = async () => {
    try {
      setProofPreviewUrl(null);
      if (isTour(detail)) {
        const response = await axiosClient.get(`/admin/offline-payments/${selectedId}/proof`, { responseType: "blob" });
        setProofType(response.data.type || response.headers?.["content-type"] || "");
        setProofPreviewUrl(URL.createObjectURL(response.data));
      } else { setProofType(""); setProofPreviewUrl(proofUrl); }
      setProofPreviewOpen(true);
    } catch (err) { alertFromAxiosError(err, "No se pudo cargar el comprobante"); }
  };

  // ✅ regla: ticket SOLO en confirmadas/canceladas
  const canShowTicket = useMemo(() => {
    if (!detail || isTour(detail) || !canAct(detail, "send_ticket")) return false;
    if (tab !== "approved" && tab !== "rejected") return false; // <- bloquea en "Nuevas"
    const fs = pick(detail?.form?.status);
    const ss = pick(detail?.sale?.status);
    return fs === "approved" || fs === "rejected" || ss === "paid" || ss === "cancelled";
  }, [detail, tab]);

  const StatCard = ({ icon, label, value, sub }) => (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        bgcolor: alpha("#000", 0.02),
        borderColor: alpha("#000", 0.08),
        minWidth: { xs: "100%", sm: 220 },
        flex: 1,
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha("#000", 0.04),
            border: `1px solid ${alpha("#000", 0.08)}`,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 1000, lineHeight: 1.1 }}>{value}</Typography>
          {sub ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {sub}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );

  const renderRow = (r) => {
    const saleId = r?.sale?.id ?? null;
    const grand = r?.amount ?? r?.sale?.grand_total ?? 0;

    return (
      <Paper
        key={r.id}
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2.5,
          transition: "150ms",
          "&:hover": { boxShadow: 2 },
          borderColor: r?.has_proof ? alpha("#1976d2", 0.25) : alpha("#000", 0.12),
          bgcolor: r?.has_proof ? alpha("#1976d2", 0.03) : "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.75 }}>
              <Chip size="small" label={isTour(r) ? "Tours" : "Productos"} />
              <StatusChip formStatus={r.status} saleStatus={r?.sale?.status} />
              {isTour(r) && <Chip size="small" label={r.booking?.booking_code || r.id} />}
              {saleId ? (
                <Chip size="small" variant="outlined" label={`Venta #${saleId}`} sx={{ fontWeight: 900 }} />
              ) : null}
              {r?.has_proof ? (
                <Chip size="small" color="info" label="Con comprobante" sx={{ fontWeight: 900 }} />
              ) : (
                <Chip size="small" variant="outlined" label="Sin comprobante" sx={{ fontWeight: 900 }} />
              )}
            </Stack>

            <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>{r?.full_name || "Cliente"}</Typography>

            <Typography variant="body2" color="text.secondary">
              {r?.phone ? `📞 ${r.phone}` : "📞 —"} {r?.email ? ` • ✉️ ${r.email}` : ""}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {prettyDate(r?.created_at)} · {isTour(r) ? paymentLabel(r.payment?.payment_type) : "Total"}: <b>{moneyMX(grand)}</b>
            </Typography>

            {isTour(r) && <Typography>{r.booking?.tour_name} · Saldo: {moneyMX(r.booking?.remaining_amount)}</Typography>}
            {r?.payment_account?.bank_name ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
                Cuenta: <b>{r.payment_account.bank_name}</b> • {r.payment_account.type}
              </Typography>
            ) : null}
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
            <Button
              onClick={() => openDetails(r)}
              variant="outlined"
              startIcon={<VisibilityRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
            >
              Ver
            </Button>

            {canAct(r, "delete") && <Tooltip title="Eliminar registro (cancela la venta por seguridad)">
              <Button
                onClick={() => handleDelete(r.id)}
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Eliminar
              </Button>
            </Tooltip>}
          </Stack>
        </Stack>
      </Paper>
    );
  };

  // ====== ZOOM/PAN para imagen comprobante ======
  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onWheelZoom = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY;
    setZoom((z) => {
      const next = delta > 0 ? z * 0.9 : z * 1.12;
      return Math.max(1, Math.min(6, next));
    });
  }, []);

  const onMouseDownPan = useCallback((e) => {
    // solo si hay zoom
    if (zoom <= 1.001) return;
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
  }, [zoom, offset.x, offset.y]);

  const onMouseMovePan = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
  }, [dragging]);

  const stopDragging = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (!proofPreviewOpen) return;
    // reset por cada apertura
    resetZoom();
  }, [proofPreviewOpen, resetZoom]);

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: 1500, mx: "auto", pb: 3, "& .MuiButton-root": { textTransform: "none", minHeight: 44 }, "& .MuiTypography-root": { overflowWrap: "anywhere" }, "& .MuiFormControl-root": { minWidth: 0 } }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 2.5, borderRadius: 3, bgcolor: "#1d2025", color: "#fff", border: "1px solid #30343b", borderTop: "3px solid #ffc107" }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Box><Typography component="h1" sx={{ color: "#fff !important", fontSize: { xs: 25, md: 32 }, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.035em" }}>Pedidos web y comprobantes</Typography><Typography sx={{ mt: 1, color: "#c7cbd1 !important" }}>Revisa pagos de productos y comprobantes de tours.</Typography></Box>
          {onClose && <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={onClose} sx={{ color: "#ffe082", borderColor: "#62552d", alignSelf: "flex-start" }}>{mode === "pos" ? "Volver al POS" : "Volver a sucursales"}</Button>}
        </Stack>
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #3a3d42" }}>
          <Typography sx={{ color: "#ffc107 !important", fontSize: 12, fontWeight: 700, letterSpacing: 1, mb: 1.5 }}>CÓMO FUNCIONA</Typography>
          <Box component="ol" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,minmax(0,1fr))" }, gap: 2, m: 0, p: 0, listStyle: "none" }}>{[["Filtra los pedidos", "Elige sucursal, caja, mes y estado."], ["Revisa el comprobante", "Abre la solicitud y verifica la evidencia."], ["Confirma el resultado", "Aprueba o rechaza el pago y consulta el resultado."]].map(([title, description], index) => <Box component="li" key={title} sx={{ display: "flex", gap: 1.25, minWidth: 0 }}><Box component="span" sx={{ width: 25, height: 25, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#ffc107", color: "#17191c", fontSize: 12, fontWeight: 800 }}>{index + 1}</Box><Box><Typography sx={{ color: "#fff !important", fontWeight: 700, fontSize: 14 }}>{title}</Typography><Typography sx={{ color: "#c7cbd1 !important", fontSize: 12, mt: .25 }}>{description}</Typography></Box></Box>)}</Box>
        </Box>
      </Paper>
      {/* ===================== LISTA PRINCIPAL ===================== */}
      {!detailOpen && <Paper variant="outlined" sx={{ borderRadius: 3, minWidth: 0 }}>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ mb: 2 }}>{scopeControls}</Box>
          {/* DASHBOARD */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: alpha("#000", 0.02),
              borderColor: alpha("#000", 0.08),
              mb: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 1000 }}>Resumen del mes</Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtra por mes para ver totales y control.
                </Typography>
              </Box>

              <TextField
                type="month"
                value={month}
                onChange={(e) => { setPage(1); setMonth(e.target.value || MonthDefault()); }}
                size="small"
                sx={{
                  minWidth: { xs: "100%", sm: 220 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {statsLoading ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, flex: 1 }}>
                    <Skeleton height={44} />
                    <Skeleton width="55%" />
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap">
                <StatCard
                  icon={<TrendingUpRoundedIcon fontSize="small" />}
                  label="Importe de solicitudes"
                  value={moneyMX(stats?.totals?.grand_total_all ?? 0)}
                  sub={`${stats?.counts?.all ?? 0} solicitud(es)`}
                />
                <StatCard
                  icon={<VerifiedRoundedIcon fontSize="small" />}
                  label="Confirmado / Pagado"
                  value={moneyMX(stats?.totals?.grand_total_approved ?? 0)}
                  sub={`${stats?.counts?.approved ?? 0} confirmada(s)`}
                />
                <StatCard
                  icon={<PendingActionsRoundedIcon fontSize="small" />}
                  label="Pendientes"
                  value={`${stats?.counts?.pending ?? 0}`}
                  sub="Por validar"
                />
                <StatCard
                  icon={<CancelPresentationRoundedIcon fontSize="small" />}
                  label="Canceladas"
                  value={`${stats?.counts?.rejected ?? 0}`}
                  sub="Rechazadas"
                />
              </Stack>
            )}
          </Paper>

          {/* HEADER + SEARCH */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 1000 }}>Panel de solicitudes</Typography>
              <Typography variant="body2" color="text.secondary">
                {headerSubtitle}
              </Typography>
            </Box>

            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              size="small"
              placeholder="Buscar por nombre, telefono, correo, venta, folio o tour"
              sx={{
                minWidth: { xs: "100%", md: 420 },
                "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <TextField select label="Origen" value={source} onChange={e => { setSource(e.target.value); setPage(1); }} sx={{ mt: 2, minWidth: 200 }}><MenuItem value="all">Productos y tours</MenuItem><MenuItem value="products">Productos</MenuItem><MenuItem value="tours">Tours</MenuItem></TextField>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setPage(1); }}
            sx={{ mt: 2 }}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
          >
            {STATUS_TABS.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} sx={{ fontWeight: 1000, textTransform: "none" }} />
            ))}
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Stack spacing={1.2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="rounded" width={48} height={48} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="45%" />
                      <Skeleton width="65%" />
                    </Box>
                    <Skeleton variant="rounded" width={120} height={36} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : filtered.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 4, borderRadius: 2, textAlign: "center", bgcolor: alpha("#000", 0.02) }}
            >
              <Typography sx={{ fontWeight: 1000 }}>No hay solicitudes en esta sección</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Cuando un cliente envíe su comprobante, aparecerá aquí.
              </Typography>
            </Paper>
          ) : tab === "pending" ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha("#1976d2", 0.04) }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip label="Listas para validar" color="info" sx={{ fontWeight: 1000 }} />
                  <Typography variant="body2" color="text.secondary">
                    Con comprobante (prioridad)
                  </Typography>
                </Stack>

                {pendingWithProof.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay solicitudes con comprobante en este mes.
                  </Typography>
                ) : (
                  <Stack spacing={1.2}>{pendingWithProof.map((r) => renderRow(r))}</Stack>
                )}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip label="Sin comprobante" variant="outlined" sx={{ fontWeight: 1000 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aún no suben evidencia
                  </Typography>
                </Stack>

                {pendingWithoutProof.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay solicitudes sin comprobante en este mes.
                  </Typography>
                ) : (
                  <Stack spacing={1.2}>{pendingWithoutProof.map((r) => renderRow(r))}</Stack>
                )}
              </Paper>
            </Stack>
          ) : (
            <Stack spacing={1.2}>{filtered.map((r) => renderRow(r))}</Stack>
          )}
        </Box>
      </Paper>}

      {!detailOpen && <Stack direction="row" spacing={2} justifyContent="center" alignItems="center"><Button disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button><Typography>Página {page} de {lastPage}</Typography><Button disabled={loading || page >= lastPage} onClick={() => setPage(p => p + 1)}>Siguiente</Button></Stack>}
      {/* ===================== DETALLE MODAL ===================== */}
      {detailOpen && <Paper variant="outlined" sx={{ borderRadius: 3, minWidth: 0 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1} sx={{ p: { xs: 2, md: 3 } }}>
          <Typography component="h2" variant="h5" fontWeight={800}>Detalle de solicitud</Typography>
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => setDetailOpen(false)}>Volver a pedidos</Button>
        </Stack>

        <Divider />

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {detailLoading ? (
            <Stack spacing={1.2}>
              <Skeleton height={32} />
              <Skeleton height={32} />
              <Skeleton height={140} />
            </Stack>
          ) : !detail ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: "center" }}>
              <Typography sx={{ fontWeight: 1000 }}>No se pudo cargar el detalle</Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {/* Cliente */}
              <Typography variant="body2">Sucursal: {detail?.branch_id ?? detail?.booking?.branch_id ?? detail?.sale?.branch_id ?? "Sin asignar"} · Caja: {detail?.pos_location_id ?? detail?.booking?.pos_location_id ?? detail?.sale?.pos_location_id ?? "Sin asignar"}</Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography sx={{ fontWeight: 1000 }}>Cliente</Typography>
                  <StatusChip formStatus={detail?.status ?? detail?.form?.status} saleStatus={detail?.sale?.status} />
                </Stack>

                <Divider sx={{ my: 1.2 }} />

                <Typography>
                  <b>Nombre:</b> {(detail?.full_name ?? detail?.form?.full_name) || "—"}
                </Typography>
                <Typography>
                  <b>Teléfono:</b> {(detail?.phone ?? detail?.form?.phone) || "—"}
                </Typography>
                <Typography>
                  <b>Correo:</b> {(detail?.email ?? detail?.form?.email) || "—"}
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <b>Dirección:</b> {detail?.form?.address || "—"}
                </Typography>
                {detail?.form?.details ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                    {detail.form.details}
                  </Typography>
                ) : null}

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Enviado: {prettyDate(detail?.created_at ?? detail?.form?.created_at)}
                </Typography>
              </Paper>

              {isTour(detail) && <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={900}>Tour · {detail.booking?.booking_code}</Typography><Typography>{detail.booking?.tour_name}</Typography>
                <Typography>Salida: {detail.booking?.departure_date} {detail.booking?.departure_time}</Typography><Typography>Pasajeros: {detail.booking?.passenger_count}</Typography>
                <Typography>{paymentLabel(detail.payment?.payment_type)} a revisar: {moneyMX(detail.amount ?? detail.payment?.amount)}</Typography><Typography>Referencia: {detail.payment?.reference || "?"}</Typography>
                <Typography>Total de reserva: {moneyMX(detail.booking?.total)}</Typography><Typography>Pagado: {moneyMX(detail.booking?.paid_amount)} · Saldo: {moneyMX(detail.booking?.remaining_amount)}</Typography>
              </Paper>}
              {/* Venta */}
              {!isTour(detail) && <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Typography sx={{ fontWeight: 1000 }}>Venta #{detail?.sale?.id ?? "—"}</Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {/* ✅ TICKET SOLO EN CONFIRMADAS/CANCELADAS */}
                    {canShowTicket && ticketUrl ? (
                      <Button
                        variant="outlined"
                        startIcon={<ReceiptLongRoundedIcon />}
                        onClick={() => {
                          setTicketPreviewUrl(ticketUrl);
                          setTicketPreviewOpen(true);
                        }}
                        sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                      >
                        Ver ticket
                      </Button>
                    ) : null}

                    {canShowTicket && ticketUrl ? (
                      <Button
                        variant="outlined"
                        startIcon={<WhatsAppIcon />}
                        onClick={handleResendTicket}
                        sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                      >
                        Re-enviar WhatsApp
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>

                <Divider sx={{ my: 1.2 }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography>
                      <b>Subtotal:</b> {moneyMX(detail?.sale?.total_amount ?? 0)}
                    </Typography>
                    <Typography>
                      <b>Envío:</b> {moneyMX(detail?.sale?.shipping_cost ?? 0)}
                    </Typography>
                    <Typography sx={{ fontWeight: 1000, mt: 0.3 }}>
                      Total: {moneyMX(detail?.sale?.grand_total ?? 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography>
                      <b>Método:</b> {detail?.sale?.payment_method || "transferencia"}
                    </Typography>
                    <Typography>
                      <b>Estatus:</b> {detail?.sale?.status || "—"}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.2 }} />
                <Typography sx={{ fontWeight: 1000, mb: 1 }}>Productos</Typography>

                <Stack spacing={1}>
                  {(detail?.sale?.items || []).map((it, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha("#000", 0.02) }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 1000, lineHeight: 1.2 }}>
                            {it?.product_name || "Producto"}
                          </Typography>
                          {it?.variant_label ? (
                            <Typography variant="caption" color="text.secondary">
                              Variante: {it.variant_label}
                            </Typography>
                          ) : null}
                          {it?.warehouse_name ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              Almacén: {it.warehouse_name}
                            </Typography>
                          ) : null}
                        </Box>

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="body2">
                            {Number(it?.quantity ?? 0)} × {moneyMX(it?.unit_price ?? 0)}
                          </Typography>
                          <Typography sx={{ fontWeight: 1000 }}>{moneyMX(it?.total_price ?? 0)}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>}

              {/* Cuenta + comprobante */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 1000 }}>Pago recibido</Typography>
                <Divider sx={{ my: 1.2 }} />

                {detail?.sale?.payment_account ? (
                  <Box>
                    <Typography><b>Banco:</b> {detail.sale.payment_account.bank_name || "—"}</Typography>
                    <Typography><b>Beneficiario:</b> {detail.sale.payment_account.beneficiary_name || "—"}</Typography>
                    <Typography><b>Cuenta:</b> {detail.sale.payment_account.account_number || "—"}</Typography>
                    <Typography><b>CLABE:</b> {detail.sale.payment_account.clabe || "—"}</Typography>
                  </Box>
                ) : (
                  <Typography color="text.secondary">Sin cuenta asociada.</Typography>
                )}

                <Divider sx={{ my: 1.2 }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  {/* ✅ COMPROBANTE PREVIEW (NO abrir en otra pestaña) */}
                  {proofUrl ? (
                    <Button
                      variant="outlined"
                      startIcon={<ImageSearchRoundedIcon />}
                      onClick={previewProof}
                      sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                    >
                      Ver comprobante
                    </Button>
                  ) : (
                    <Chip label="Sin comprobante" variant="outlined" />
                  )}

                  <Box sx={{ flex: 1 }} />

                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                    <Button
                      onClick={handleReject}
                      variant="outlined"
                      color="warning"
                      startIcon={<CancelRoundedIcon />}
                      sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                      disabled={!canAct(detail, "reject")}
                    >
                      Rechazar
                    </Button>

                    <Button
                      onClick={handleApprove}
                      variant="contained"
                      startIcon={<CheckCircleRoundedIcon />}
                      sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                      disabled={!canAct(detail, "approve")}
                    >
                      Confirmar
                    </Button>

                    {canAct(detail, "delete") && <Button
                      onClick={async () => {
                        if (!selectedId) return;
                        const ok = await showConfirm(
                          "¿Eliminar esta solicitud? (La venta se cancelará por seguridad)",
                          "Sí, eliminar"
                        );
                        if (!ok) return;
                        await handleDelete(selectedId);
                      }}
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                    >
                      Eliminar
                    </Button>}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Box>
      </Paper>}

      {/* ===================== TICKET PREVIEW MODAL (solo confirmadas/canceladas) ===================== */}
      <Dialog
        open={ticketPreviewOpen}
        onClose={() => setTicketPreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 1000 }}>
          Vista previa del ticket
          <IconButton onClick={() => setTicketPreviewOpen(false)} sx={{ position: "absolute", right: 10, top: 10 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          {ticketPreviewUrl ? (
            <Box sx={{ width: "100%", height: isMobile ? "100vh" : "80vh" }}>
              <iframe
                src={ticketPreviewUrl}
                title="Ticket PDF"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography>No se pudo cargar el ticket.</Typography>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={() => window.open(ticketPreviewUrl, "_blank")}
            sx={{ textTransform: "none", fontWeight: 1000 }}
          >
            Descargar
          </Button>

          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={handleResendTicket}
            sx={{ textTransform: "none", fontWeight: 1000 }}
          >
            Re-enviar WhatsApp
          </Button>

          <Button onClick={() => setTicketPreviewOpen(false)} sx={{ textTransform: "none", fontWeight: 1000 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== PROOF PREVIEW MODAL (zoom/pan para imagen) ===================== */}
      <Dialog
        open={proofPreviewOpen}
        onClose={() => setProofPreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 1000 }}>
          Vista previa del comprobante
          <IconButton onClick={() => setProofPreviewOpen(false)} sx={{ position: "absolute", right: 10, top: 10 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          {!proofPreviewUrl ? (
            <Box sx={{ p: 3 }}>
              <Typography>No se pudo cargar el comprobante.</Typography>
            </Box>
          ) : (proofType.includes("pdf") || isPdfUrl(proofPreviewUrl)) ? (
            <Box sx={{ width: "100%", height: isMobile ? "100vh" : "80vh" }}>
              <iframe
                src={proofPreviewUrl}
                title="Comprobante PDF"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </Box>
          ) : (
            // ✅ IMAGEN con zoom/pan
            <Box
              sx={{
                width: "100%",
                height: isMobile ? "100vh" : "80vh",
                bgcolor: alpha("#000", 0.02),
                position: "relative",
                overflow: "hidden",
                cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
              }}
              onWheel={onWheelZoom}
              onMouseDown={onMouseDownPan}
              onMouseMove={onMouseMovePan}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  userSelect: "none",
                }}
              >
                <Box
                  component="img"
                  src={proofPreviewUrl}
                  alt="Comprobante"
                  draggable={false}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: dragging ? "none" : "transform 80ms linear",
                    boxShadow: `0 14px 46px ${alpha("#000", 0.18)}`,
                    borderRadius: 2,
                    pointerEvents: "none",
                  }}
                />
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  position: "absolute",
                  left: 12,
                  bottom: 12,
                  p: 1,
                  borderRadius: 2,
                  bgcolor: alpha("#fff", 0.92),
                  borderColor: alpha("#000", 0.08),
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={`Zoom: ${Math.round(zoom * 100)}%`}
                    sx={{ fontWeight: 900 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Rueda = zoom • Arrastrar = mover
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          {proofPreviewUrl && (proofType.startsWith("image/") || isImageUrl(proofPreviewUrl)) ? (
            <Button
              variant="outlined"
              startIcon={<RestartAltRoundedIcon />}
              onClick={resetZoom}
              sx={{ textTransform: "none", fontWeight: 1000 }}
            >
              Reset zoom
            </Button>
          ) : null}

          <Button
            variant="outlined"
            startIcon={<DownloadRoundedIcon />}
            onClick={() => window.open(proofPreviewUrl, "_blank")}
            sx={{ textTransform: "none", fontWeight: 1000 }}
          >
            Descargar
          </Button>

          <Button onClick={() => setProofPreviewOpen(false)} sx={{ textTransform: "none", fontWeight: 1000 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
