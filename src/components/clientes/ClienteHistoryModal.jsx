// src/components/clientes/ClienteHistoryModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Chip,
  TextField,
  MenuItem,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import axiosClient from "../../config/axiosClientPOS";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function SummaryCard({ title, value, icon }) {
  return (
    <Paper
      elevation={0}
      sx={(t) => ({
        borderRadius: 3,
        p: 2,
        border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
        bgcolor: t.palette.mode === "dark" ? alpha("#0b1220", 0.5) : "#fff",
        height: "100%",
      })}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={(t) => ({
            width: 38,
            height: 38,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor:
              t.palette.mode === "dark"
                ? alpha(t.palette.primary.main, 0.18)
                : alpha(t.palette.primary.main, 0.1),
            color: "primary.main",
            flexShrink: 0,
          })}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function getStatusLabel(status) {
  const map = {
    paid: "Pagada",
    open: "Abierta",
    cancelled: "Cancelada",
    partially_cancelled: "Parcialmente cancelada",
    devuelta: "Devuelta",
  };
  return map[status] || status || "—";
}

function getStatusColor(status) {
  const map = {
    paid: "success",
    open: "warning",
    cancelled: "error",
    partially_cancelled: "warning",
    devuelta: "info",
  };
  return map[status] || "default";
}

export default function ClienteHistoryModal({ open, onClose, cliente }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");

  const load = async (selectedMonth = month, selectedStatus = status) => {
    if (!cliente?.id || !open) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await axiosClient.get(`/clientes/${cliente.id}/ventas`, {
        params: {
          ...(selectedMonth ? { month: selectedMonth } : {}),
          ...(selectedStatus ? { status: selectedStatus } : {}),
        },
      });
      setPayload(data);
    } catch (e) {
      setPayload(null);
      setError("No se pudo cargar el historial del cliente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && cliente?.id) {
      setMonth("");
      setStatus("");
      setPayload(null);
      setError("");
      load("", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente?.id]);

  const monthlyIndex = useMemo(
    () => payload?.monthly_index || [],
    [payload]
  );

  const sales = useMemo(() => payload?.sales?.data || [], [payload]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 4 },
          height: { xs: "100dvh", sm: "calc(100dvh - 48px)" },
          maxHeight: { xs: "100dvh", sm: "calc(100dvh - 48px)" },
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          background: "linear-gradient(135deg, #111827 0%, #0ea5e9 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <HistoryIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 22 }, color:"#fff" }}>
            Historial del cliente
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color:"#ffff"}}>
            {cliente?.nombre_alias || "Cliente"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        dividers
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.default, 0.96)
              : "#f8fafc",
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={(t) => ({
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
                bgcolor:
                  t.palette.mode === "dark" ? alpha("#0b1220", 0.5) : "#fff",
              })}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonOutlineIcon color="primary" />
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>
                      {payload?.cliente?.nombre_alias ||
                        cliente?.nombre_alias ||
                        "Cliente"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {payload?.cliente?.email ||
                        cliente?.email ||
                        "Sin email"}{" "}
                      ·{" "}
                      {payload?.cliente?.telefono ||
                        cliente?.telefono ||
                        "Sin teléfono"}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                flexWrap="wrap"
              >
                <TextField
                  select
                  label="Mes"
                  value={month}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMonth(v);
                    load(v, status);
                  }}
                  size="small"
                  sx={{ minWidth: { xs: "100%", sm: 220 } }}
                >
                  <MenuItem value="">Todos los meses</MenuItem>
                  {monthlyIndex.map((m) => (
                    <MenuItem key={m.month_key} value={m.month_key}>
                      {m.month_label} ({m.ventas_count})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Estado"
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStatus(v);
                    load(month, v);
                  }}
                  size="small"
                  sx={{ minWidth: { xs: "100%", sm: 220 } }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="paid">Pagada</MenuItem>
                  <MenuItem value="open">Abierta</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                  <MenuItem value="partially_cancelled">
                    Parcialmente cancelada
                  </MenuItem>
                  <MenuItem value="devuelta">Devuelta</MenuItem>
                </TextField>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={(t) => ({
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
                bgcolor:
                  t.palette.mode === "dark" ? alpha("#0b1220", 0.5) : "#fff",
                height: "100%",
              })}
            >
              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                Índice por mes
              </Typography>

              <Stack
                spacing={1}
                sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5 }}
              >
                {monthlyIndex.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Sin movimientos
                  </Typography>
                ) : (
                  monthlyIndex.map((m) => (
                    <Paper
                      key={m.month_key}
                      elevation={0}
                      sx={(t) => ({
                        p: 1.2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(t.palette.divider, 0.8)}`,
                        bgcolor:
                          month === m.month_key
                            ? alpha(t.palette.primary.main, 0.08)
                            : "transparent",
                        cursor: "pointer",
                      })}
                      onClick={() => {
                        const next = month === m.month_key ? "" : m.month_key;
                        setMonth(next);
                        load(next, status);
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>
                            {m.month_label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {m.ventas_count} venta
                            {m.ventas_count === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 800 }}>
                          {money.format(m.total_neto_sum || 0)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard
              title="Ventas totales"
              value={payload?.summary?.ventas_total ?? 0}
              icon={<ReceiptLongIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard
              title="Monto total"
              value={money.format(payload?.summary?.monto_total ?? 0)}
              icon={<PointOfSaleIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard
              title="Monto neto"
              value={money.format(payload?.summary?.monto_neto ?? 0)}
              icon={<PaidIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <SummaryCard
              title="Meses con actividad"
              value={monthlyIndex.length}
              icon={<CalendarMonthIcon fontSize="small" />}
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={(t) => ({
            borderRadius: 3,
            border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
            bgcolor: t.palette.mode === "dark" ? alpha("#0b1220", 0.5) : "#fff",
            p: 2,
          })}
        >
          <Typography sx={{ fontWeight: 800, mb: 1.5 }}>
            Ventas registradas
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : sales.length === 0 ? (
            <Typography color="text.secondary">
              Sin ventas para mostrar.
            </Typography>
          ) : (
            <Stack spacing={1.2}>
              {sales.map((sale) => (
                <Paper
                  key={sale.id}
                  elevation={0}
                  sx={(t) => ({
                    p: 1.4,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(t.palette.divider, 0.8)}`,
                  })}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.2}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>
                        Venta #{sale.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleString("es-MX")
                          : "Sin fecha"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Método: {sale.payment_method || "—"}
                      </Typography>
                    </Box>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Chip
                        size="small"
                        label={getStatusLabel(sale.status)}
                        color={getStatusColor(sale.status)}
                        variant="outlined"
                      />
                      <Typography sx={{ fontWeight: 900 }}>
                        {money.format(Number(sale.total_amount || 0))}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
}