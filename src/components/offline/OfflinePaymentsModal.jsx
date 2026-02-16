// src/components/offline/OfflinePaymentsModal.jsx
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

import axiosClient from "../../config/axiosClient";
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

export default function OfflinePaymentsModal({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fullScreen = isMobile;

  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
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
      const { data } = await axiosClient.get("/admin/offline-payments/stats", { params: { month } });
      setStats(data?.data ?? null);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [open, month]);

  const fetchList = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/admin/offline-payments", {
        params: { status: tab, per_page: 100, month },
      });
      const list = data?.data?.data ?? data?.data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar las solicitudes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, tab, month]);

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
      return name.includes(s) || phone.includes(s) || email.includes(s) || saleId.includes(s);
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
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selectedId) return;

    const ok = await showConfirm(
      "¿Confirmar este pago? Se marcará como pagado y se enviará el ticket por WhatsApp al cliente.",
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
  }, [selectedId, fetchList, fetchStats]);

  const handleReject = useCallback(async () => {
    if (!selectedId) return;

    const ok = await showConfirm("¿Rechazar esta solicitud? La venta quedará pendiente.", "Sí, rechazar");
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
  }, [selectedId, fetchList, fetchStats]);

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
    [fetchList, fetchStats, selectedId]
  );

  const handleResendTicket = useCallback(async () => {
    if (!selectedId) return;

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
  }, [selectedId, detail]);

  const ticketUrl = detail?.sale?.ticket_url || null;
  const proofUrl = detail?.form?.proof_url || null;

  // ✅ regla: ticket SOLO en confirmadas/canceladas
  const canShowTicket = useMemo(() => {
    if (!detail) return false;
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
    const grand = r?.sale?.grand_total ?? 0;

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
              <StatusChip formStatus={r.status} saleStatus={r?.sale?.status} />
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
              {prettyDate(r?.created_at)} • Total: <b>{moneyMX(grand)}</b>
            </Typography>

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

            <Tooltip title="Eliminar registro (cancela la venta por seguridad)">
              <Button
                onClick={() => handleDelete(r.id)}
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Eliminar
              </Button>
            </Tooltip>
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
    <>
      {/* ===================== LISTA PRINCIPAL ===================== */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={fullScreen}>
        <DialogTitle sx={{ fontWeight: 1000 }}>
          Confirmación de pagos (Transferencia / Depósito / OXXO)
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 10, top: 10 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
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
                onChange={(e) => setMonth(e.target.value || MonthDefault())}
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
                  label="Total vendido (solicitudes)"
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
              placeholder="Buscar por nombre, teléfono, correo o ID de venta…"
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

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
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
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 1000 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== DETALLE MODAL ===================== */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 1000 }}>
          Detalle de solicitud
          <IconButton onClick={() => setDetailOpen(false)} sx={{ position: "absolute", right: 10, top: 10 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
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
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Typography sx={{ fontWeight: 1000 }}>Cliente</Typography>
                  <StatusChip formStatus={detail?.form?.status} saleStatus={detail?.sale?.status} />
                </Stack>

                <Divider sx={{ my: 1.2 }} />

                <Typography>
                  <b>Nombre:</b> {detail?.form?.full_name || "—"}
                </Typography>
                <Typography>
                  <b>Teléfono:</b> {detail?.form?.phone || "—"}
                </Typography>
                <Typography>
                  <b>Correo:</b> {detail?.form?.email || "—"}
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
                  Enviado: {prettyDate(detail?.form?.created_at)}
                </Typography>
              </Paper>

              {/* Venta */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
              </Paper>

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
                      onClick={() => {
                        setProofPreviewUrl(proofUrl);
                        setProofPreviewOpen(true);
                      }}
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
                      disabled={pick(detail?.form?.status) === "approved"}
                    >
                      Rechazar
                    </Button>

                    <Button
                      onClick={handleApprove}
                      variant="contained"
                      startIcon={<CheckCircleRoundedIcon />}
                      sx={{ textTransform: "none", fontWeight: 1000, borderRadius: 2 }}
                      disabled={pick(detail?.form?.status) === "approved"}
                    >
                      Confirmar
                    </Button>

                    <Button
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
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: "none", fontWeight: 1000 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

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
          ) : isPdfUrl(proofPreviewUrl) ? (
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
          {proofPreviewUrl && isImageUrl(proofPreviewUrl) ? (
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
    </>
  );
}
