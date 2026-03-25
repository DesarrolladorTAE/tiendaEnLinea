import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Chip,
  Button,
  Drawer,
  TextField,
  MenuItem,
  Divider,
  CircularProgress,
  IconButton,
  Avatar,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";
import HistoryIcon from "@mui/icons-material/History";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const LABELS_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "Tarjeta de crédito",
  td: "Tarjeta de débito",
};

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const ES_CANCELADA = (s) =>
  ["cancelled", "devuelta", "partially_cancelled"].includes(
    String(s || "").toLowerCase()
  );

const pagosDeVenta = (v) => {
  if (Array.isArray(v?.payment_methods) && v.payment_methods.length) {
    return v.payment_methods;
  }
  if (v?.payment_method) {
    return [{ method: v.payment_method, total: Number(v.total_amount || 0) }];
  }
  return [];
};

const etiquetaPagoVenta = (v) => {
  if (v?.payment_label) return v.payment_label;
  const parts = pagosDeVenta(v).map(
    (p) => `${LABELS_PAGO[p.method] || p.method} ${money(p.total)}`
  );
  return parts.length ? parts.join(" + ") : "—";
};

function CompactSummary({
  totalVigentes,
  totalDevoluciones,
  totalCancelaciones,
  ticketsVigentes,
  ticketsDevoluciones,
  ticketsCanceladas,
}) {
  const items = [
    {
      label: "Ventas",
      value: money(totalVigentes),
      extra: `${ticketsVigentes} tickets`,
      tone: "#e8f5e9",
    },
    {
      label: "Devueltas",
      value: money(totalDevoluciones),
      extra: `${ticketsDevoluciones} tickets`,
      tone: "#e3f2fd",
    },
    {
      label: "Canceladas",
      value: money(totalCancelaciones),
      extra: `${ticketsCanceladas} tickets`,
      tone: "#ffebee",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        overflowX: "auto",
        pb: 0.25,
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {items.map((item) => (
        <Paper
          key={item.label}
          elevation={0}
          sx={{
            minWidth: 165,
            px: 1.25,
            py: 1.1,
            borderRadius: 3,
            bgcolor: item.tone,
            border: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
          <Typography fontWeight={900} sx={{ mt: 0.25 }}>
            {item.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.extra}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

function SegmentedTabs({ tab, setTab }) {
  const tabs = [
    { value: 1, label: "Ventas" },
    { value: 4, label: "Dev." },
    { value: 5, label: "Canc." },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0.5,
        borderRadius: 999,
        border: "1px solid",
        borderColor: "divider",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 0.5,
      }}
    >
      {tabs.map((item) => (
        <Button
          key={item.value}
          size="small"
          variant={tab === item.value ? "contained" : "text"}
          onClick={() => setTab(item.value)}
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 800,
            minHeight: 36,
          }}
        >
          {item.label}
        </Button>
      ))}
    </Paper>
  );
}

function MobileDayPagination({ groups, page, setPage }) {
  const current = groups?.[page];

  if (!groups?.length) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.1,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1}>
        <Box>
          <Typography fontWeight={800}>
            {current?.label || "Sin fecha"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Página {page + 1} de {groups.length} · {current?.total || 0} movimientos
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
          >
            Anterior
          </Button>

          <Button
            fullWidth
            size="small"
            variant="contained"
            disabled={page >= groups.length - 1}
            onClick={() => setPage((p) => Math.min(groups.length - 1, p + 1))}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
          >
            Siguiente
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function paymentIcon(methodLabel = "") {
  const txt = String(methodLabel).toLowerCase();

  if (txt.includes("efectivo")) return <LocalAtmIcon fontSize="small" />;
  if (txt.includes("transfer")) {
    return <AccountBalanceWalletIcon fontSize="small" />;
  }
  if (
    txt.includes("crédito") ||
    txt.includes("credito") ||
    txt.includes("debito") ||
    txt.includes("débito") ||
    txt.includes("tarjeta")
  ) {
    return <CreditCardIcon fontSize="small" />;
  }

  return <SwapHorizIcon fontSize="small" />;
}

function VentaFeedItem({
  venta,
  abrirTicket,
  abrirDetalles,
  cancelarVenta,
  devolverVenta,
}) {
  const estadoMeta = (() => {
    switch (String(venta?.status || "").toLowerCase()) {
      case "paid":
        return { label: "Pagada", color: "success" };
      case "cancelled":
        return { label: "Cancelada", color: "error" };
      case "partially_cancelled":
        return { label: "Parcial", color: "warning" };
      case "devuelta":
        return { label: "Devuelta", color: "info" };
      default:
        return { label: "—", color: "default" };
    }
  })();

  const fecha = venta?.created_at
    ? format(parseISO(String(venta.created_at).slice(0, 10)), "d MMM yyyy", {
        locale: es,
      })
    : "Sin fecha";

  const pago = etiquetaPagoVenta(venta);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "primary.main",
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            #{venta.id}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              gap={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} noWrap>
                  Venta #{venta.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fecha}
                </Typography>
              </Box>

              <Chip
                size="small"
                label={estadoMeta.label}
                color={estadoMeta.color}
                sx={{ flexShrink: 0 }}
              />
            </Stack>

            <Typography
              variant="h6"
              fontWeight={900}
              sx={{ mt: 0.4, lineHeight: 1.1 }}
            >
              {money(venta?.total_amount)}
            </Typography>

            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{ mt: 0.7, color: "text.secondary" }}
            >
              {paymentIcon(pago)}
              <Typography variant="body2" noWrap>
                {pago}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={0.6}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 0.9 }}
            >
              {venta?.categories?.length ? (
                <>
                  {venta.categories.slice(0, 2).map((c) => (
                    <Chip key={c.id} size="small" variant="outlined" label={c.name} />
                  ))}
                  {venta.categories.length > 2 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`+${venta.categories.length - 2}`}
                    />
                  )}
                </>
              ) : (
                <Chip size="small" variant="outlined" label="Sin categoría" />
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="text"
            startIcon={<PrintIcon />}
            onClick={() => abrirTicket?.(venta.id)}
            sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
          >
            Ticket
          </Button>

          <Button
            size="small"
            variant="text"
            startIcon={<VisibilityIcon />}
            onClick={() => abrirDetalles?.(venta.id)}
            sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
          >
            Ver
          </Button>

          {!ES_CANCELADA(venta?.status) && (
            <>
              <Button
                size="small"
                color="error"
                variant="text"
                startIcon={<CancelIcon />}
                onClick={() => cancelarVenta?.(venta.id)}
                sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
              >
                Cancelar
              </Button>

              <Button
                size="small"
                color="info"
                variant="text"
                startIcon={<ReplayIcon />}
                onClick={() => devolverVenta?.(venta.id)}
                sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
              >
                Devolver
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function MovimientoFeedItem({ row, color = "default", onTicket, onDetails }) {
  const venta = row?.sale || {};
  const fecha = row?.fecha || row?.created_at;
  const totalAfectado = Number(row?.importe_afectado ?? venta?.total_amount ?? 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: "4px solid",
        borderLeftColor: color === "error" ? "error.main" : "info.main",
      }}
    >
      <Stack spacing={0.8}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Box>
            <Typography fontWeight={800}>
              {color === "error" ? "Cancelación" : "Devolución"} #{row.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Venta {venta?.id ? `#${venta.id}` : "—"}
            </Typography>
          </Box>

          <Chip
            size="small"
            color={color}
            variant="outlined"
            label={
              (row?.tipo || "").toUpperCase() ||
              (color === "error" ? "CANCELADA" : "DEVUELTA")
            }
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {fecha
            ? format(parseISO(String(fecha).slice(0, 10)), "d MMM yyyy", {
                locale: es,
              })
            : "—"}
        </Typography>

        <Typography variant="h6" fontWeight={900}>
          {money(totalAfectado)}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {row?.motivo || "Sin motivo"}
        </Typography>

        {venta?.id ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="text"
              startIcon={<PrintIcon />}
              onClick={() => onTicket?.(venta.id)}
              sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
            >
              Ticket
            </Button>

            <Button
              size="small"
              variant="text"
              startIcon={<VisibilityIcon />}
              onClick={() => onDetails?.(venta.id)}
              sx={{ textTransform: "none", fontWeight: 700, px: 1 }}
            >
              Ver
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}

function EmptyState({ text }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px dashed",
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Paper>
  );
}

export default function HistorialPOSMobile({
  tab,
  setTab,
  pagina,
  setPagina,
  loading,
  textoRango,
  ventasFiltradas,
  devoluciones,
  cancelacionesRows,
  ventasGroups,
  devolucionesGroups,
  cancelacionesGroups,
  totalVigentes,
  totalDevoluciones,
  totalCancelaciones,
  ticketsVigentes,
  ticketsDevoluciones,
  ticketsCanceladas,
  tipoPago,
  modoConsulta,
  fechaInicio,
  fechaFin,
  setModoConsulta,
  setFechaInicio,
  setFechaFin,
  setTipoPago,
  handleFiltrar,
  limpiarFiltros,
  hoyISO,
  cambiarVista,
  abrirTicket,
  abrirDetalles,
  cancelarVenta,
  devolverVenta,
}) {
  const [openFilters, setOpenFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState(
    tab === 1 || tab === 4 || tab === 5 ? tab : 1
  );

  useEffect(() => {
    if (tab === 1 || tab === 4 || tab === 5) {
      setCurrentTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    setPagina?.(0);
  }, [currentTab, setPagina]);

  const handleChangeTab = (value) => {
    setCurrentTab(value);
    setTab?.(value);
  };

  const resumenPago = useMemo(() => {
    return tipoPago ? LABELS_PAGO[tipoPago] || tipoPago : "Todos";
  }, [tipoPago]);

  const currentGroups =
    currentTab === 1
      ? ventasGroups
      : currentTab === 4
      ? devolucionesGroups
      : currentTab === 5
      ? cancelacionesGroups
      : [];

  const currentRows = currentGroups?.[pagina]?.rows || [];

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      );
    }

    if (currentTab === 1) {
      if (!currentGroups?.length) {
        return <EmptyState text="No hay ventas en el rango seleccionado." />;
      }

      return (
        <Stack spacing={1}>
          {currentRows.map((venta) => (
            <VentaFeedItem
              key={venta.id}
              venta={venta}
              abrirTicket={abrirTicket}
              abrirDetalles={abrirDetalles}
              cancelarVenta={cancelarVenta}
              devolverVenta={devolverVenta}
            />
          ))}
        </Stack>
      );
    }

    if (currentTab === 4) {
      if (!currentGroups?.length) {
        return <EmptyState text="No hay devoluciones en el rango seleccionado." />;
      }

      return (
        <Stack spacing={1}>
          {currentRows.map((row) => (
            <MovimientoFeedItem
              key={row.id}
              row={row}
              color="info"
              onTicket={abrirTicket}
              onDetails={abrirDetalles}
            />
          ))}
        </Stack>
      );
    }

    if (currentTab === 5) {
      if (!currentGroups?.length) {
        return <EmptyState text="No hay cancelaciones en el rango seleccionado." />;
      }

      return (
        <Stack spacing={1}>
          {currentRows.map((row) => (
            <MovimientoFeedItem
              key={row.id}
              row={row}
              color="error"
              onTicket={abrirTicket}
              onDetails={abrirDetalles}
            />
          ))}
        </Stack>
      );
    }

    return null;
  };

  return (
    <Box sx={{ width: "100%", px: 0, py: 0.5 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<ShoppingCartIcon />}
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
            onClick={() => cambiarVista?.("venta")}
          >
            Ventas
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="warning"
            startIcon={<ReceiptLongIcon />}
            sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
            onClick={() => cambiarVista?.("facturas")}
          >
            Facturas
          </Button>
        </Stack>

        <Button
          fullWidth
          variant="outlined"
          color="success"
          startIcon={<DashboardIcon />}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
          onClick={() => cambiarVista?.("menu")}
        >
          Regresar al panel
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 1.2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={900}>Historial POS</Typography>
                <Typography variant="caption" color="text.secondary">
                  {textoRango}
                </Typography>
              </Box>

              <IconButton
                onClick={() => setOpenFilters(true)}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                }}
              >
                <TuneIcon />
              </IconButton>
            </Stack>

            <Chip
              size="small"
              variant="outlined"
              label={`Pago: ${resumenPago}`}
              sx={{ alignSelf: "flex-start" }}
            />
          </Stack>
        </Paper>

        <CompactSummary
          totalVigentes={totalVigentes}
          totalDevoluciones={totalDevoluciones}
          totalCancelaciones={totalCancelaciones}
          ticketsVigentes={ticketsVigentes}
          ticketsDevoluciones={ticketsDevoluciones}
          ticketsCanceladas={ticketsCanceladas}
        />

        <SegmentedTabs tab={currentTab} setTab={handleChangeTab} />

        <MobileDayPagination
          groups={currentGroups}
          page={pagina}
          setPage={setPagina}
        />

        {renderContent()}

        <Drawer
          anchor="bottom"
          open={openFilters}
          onClose={() => setOpenFilters(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              p: 2,
            },
          }}
        >
          <Stack spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 5,
                borderRadius: 999,
                bgcolor: "divider",
                alignSelf: "center",
              }}
            />

            <Stack direction="row" alignItems="center" spacing={1}>
              <HistoryIcon fontSize="small" />
              <Typography fontWeight={800}>Filtros</Typography>
            </Stack>

            <TextField
              select
              label="Modo"
              size="small"
              value={modoConsulta}
              onChange={(e) => {
                const v = e.target.value;
                setModoConsulta(v);
                if (v === "dia") {
                  const h = hoyISO();
                  setFechaInicio(h);
                  setFechaFin(h);
                }
              }}
              fullWidth
            >
              <MenuItem value="dia">Día</MenuItem>
              <MenuItem value="personalizada">Rango</MenuItem>
            </TextField>

            {modoConsulta === "dia" ? (
              <TextField
                type="date"
                label="Fecha"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setFechaFin(e.target.value);
                }}
                fullWidth
              />
            ) : (
              <Stack direction="row" spacing={1}>
                <TextField
                  type="date"
                  label="Inicio"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="Fin"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  fullWidth
                />
              </Stack>
            )}

            <TextField
              select
              label="Tipo de pago"
              size="small"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="tc">Tarjeta de crédito</MenuItem>
              <MenuItem value="td">Tarjeta de débito</MenuItem>
            </TextField>

            <Divider />

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  handleFiltrar?.();
                  setOpenFilters(false);
                }}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
              >
                Aplicar
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  limpiarFiltros?.();
                  setOpenFilters(false);
                }}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
              >
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </Drawer>
      </Stack>
    </Box>
  );
}