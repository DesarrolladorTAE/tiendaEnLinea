import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import FacturarVentaDialog from "./ventas/FacturarVentaDialog";

// --- Helpers robustos ---
const capitalizeFirst = (s) =>
  s ? s.replace(/^\p{L}/u, (m) => m.toUpperCase()) : s;
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
const safeDateFrom = (val) => {
  if (!val) return null;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, day] = val.split("-").map(Number);
    const d = new Date(y, m - 1, day);
    return isValidDate(d) ? d : null;
  }
  if (val instanceof Date) return isValidDate(val) ? val : null;
  const d = new Date(val);
  return isValidDate(d) ? d : null;
};

const fmtDay = (yyyyMMdd) => {
  const d = safeDateFrom(yyyyMMdd);
  if (!d) return "Fecha inválida";
  return capitalizeFirst(
    new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Mexico_City",
    }).format(d)
  );
};

// Agrupa por día (YYYY-MM-DD) usando rows[].fechaISO | created_at | fecha
const groupByDay = (rows = []) => {
  const map = new Map();
  const sinFecha = [];
  rows.forEach((r) => {
    const raw = r.fechaISO ?? r.created_at ?? r.fecha;
    const d = safeDateFrom(raw);
    if (!d) {
      sinFecha.push(r);
      return;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  return { map, sinFecha };
};

// Mapea método de pago a chip
const chipPago = (tipoPago) => {
  const code = (tipoPago || "").toString().toLowerCase();
  switch (code) {
    case "efectivo":
      return { label: "Efectivo", color: "success", variant: "outlined" };
    case "tc":
      return {
        label: "Tarjeta crédito",
        color: "primary",
        variant: "outlined",
      };
    case "td":
      return { label: "Tarjeta débito", color: "primary", variant: "outlined" };
    case "transferencia":
      return { label: "Transferencia", color: "info", variant: "outlined" };
    default:
      return { label: tipoPago || "—", color: "default", variant: "outlined" };
  }
};

// Parsea un importe string tipo "$1,234.50" a número
const parseMoney = (s) =>
  Number(String(s || "").replace(/[^0-9.-]+/g, "")) || 0;

// Formatea suma a dinero MX
const fmtMoney = (n) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// --- Componente ---
export default function SalesTable({
  rows = [],
  loading = false, // <- NUEVO: opcional
  onClickFacturar,
}) {
  // Agrupar por día y ordenar días DESC
  const { days, grouped, sinFecha } = useMemo(() => {
    const { map, sinFecha } = groupByDay(rows);
    const keys = Array.from(map.keys()).sort((a, b) => {
      const da = safeDateFrom(a)?.getTime() ?? 0;
      const db = safeDateFrom(b)?.getTime() ?? 0;
      return db - da;
    });
    return { days: keys, grouped: map, sinFecha };
  }, [rows]);

  const [dayIndex, setDayIndex] = useState(0);
  const [dense, setDense] = useState(false); // <- NUEVO: densidad compacta
  const [viewAll, setViewAll] = useState(false); // <- NUEVO: ver todos los días en una sola vista
  const [ventaActiva, setVentaActiva] = useState(null);
  const [openFacturar, setOpenFacturar] = useState(false);


  const onSubmitFactura = async ({ ventaId, cliente_id, cliente_nuevo }) => {
    // Aquí haces tu request real:
    // if (cliente_id) await axiosClient.post(`/ventas/${ventaId}/facturar`, { cliente_id });
    // else await axiosClient.post(`/ventas/${ventaId}/facturar`, { cliente: cliente_nuevo });

    console.log("Facturar:", { ventaId, cliente_id, cliente_nuevo });
  };

  // reset a 0 cuando cambien los días
  useEffect(() => {
    setDayIndex(0);
  }, [days.length]);

  const hasDays = days.length > 0;
  const dayKey = hasDays ? days[dayIndex] : null;
  const dayRows = hasDays ? grouped.get(dayKey) : [];

  // Total del día (o de todo si viewAll)
  const rowsShown = viewAll ? rows : dayRows;
  const totalDia = useMemo(
    () => rowsShown.reduce((acc, r) => acc + parseMoney(r.total), 0),
    [rowsShown]
  );

  return (
    <Paper
      elevation={4}
      sx={{
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: (t) =>
          `0 8px 24px ${
            t.palette.mode === "dark" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.08)"
          }`,
      }}
    >
      {/* Toolbar superior */}
      <Box
        sx={(t) => ({
          px: 2,
          pt: 1.25,
          pb: 1,
          borderBottom: `1px solid ${t.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
          background:
            t.palette.mode === "dark"
              ? "transparent"
              : "linear-gradient(180deg,#fafbff, #fff)",
          // sx={{ width: '100%' }}
        })}
      >
        {/* Navegación por día */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Día anterior">
            <span>
              <IconButton
                size="small"
                onClick={() =>
                  setDayIndex((i) => Math.min(i + 1, days.length - 1))
                }
                disabled={!hasDays || dayIndex >= days.length - 1 || viewAll}
              >
                <ChevronLeftIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Día siguiente">
            <span>
              <IconButton
                size="small"
                onClick={() => setDayIndex((i) => Math.max(i - 1, 0))}
                disabled={!hasDays || dayIndex <= 0 || viewAll}
              >
                <ChevronRightIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Chip
            variant="outlined"
            label={
              loading
                ? "Cargando…"
                : viewAll
                ? "Todos los registros"
                : hasDays
                ? fmtDay(dayKey)
                : "Sin registros"
            }
            sx={{ fontWeight: 700, maxWidth: "100%" }}
          />
          {hasDays && !viewAll && (
            <Chip
              color="primary"
              label={`Día ${dayIndex + 1} de ${days.length}`}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>

        {/* Acciones rápidas */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            size="small"
            variant={viewAll ? "contained" : "outlined"}
            startIcon={<ViewWeekIcon />}
            onClick={() => setViewAll((v) => !v)}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            {viewAll ? "Ver por día" : "Ver todos"}
          </Button>

          <Tooltip title="Ir al último día (hoy)">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setViewAll(false);
                  setDayIndex(0);
                }}
                disabled={!hasDays}
              >
                <TodayIcon />
              </IconButton>
            </span>
          </Tooltip>

          <FormControlLabel
            control={
              <Switch
                checked={dense}
                onChange={(e) => setDense(e.target.checked)}
                size="small"
              />
            }
            label="Compacta"
            sx={{ ml: 1 }}
          />
        </Stack>
      </Box>

      {/* Sub-toolbar: total del día */}
      <Box
        sx={(t) => ({
          px: 2,
          py: 1,
          borderBottom: `1px solid ${t.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        })}
      >
        <Chip
          label={`Total ${viewAll ? "listado" : "del día"}: $${fmtMoney(
            totalDia
          )}`}
          color="success"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
        {sinFecha.length > 0 && (
          <Chip
            size="small"
            variant="outlined"
            color="warning"
            label={`Registros sin fecha: ${sinFecha.length}`}
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <TableContainer
        sx={{
          overflowX: "auto",
          maxHeight: { xs: 420, md: 600 },
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table
          stickyHeader
          size={dense ? "small" : "medium"}
          aria-label="Tabla de ventas por día"
        >
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? t.palette.background.paper
                      : "#f7f7fb",
                  color: "text.primary",
                  fontWeight: 700,
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  py: dense ? 0.75 : { xs: 1, sm: 1.5 },
                },
              }}
            >
              <TableCell>Folio</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                Tipo de pago
              </TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Skeletons de carga
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={160} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Skeleton variant="text" width={120} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rounded"
                      width={96}
                      height={dense ? 28 : 36}
                      sx={{ mx: "auto" }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (viewAll ? rows : dayRows).length > 0 ? (
              (viewAll ? rows : dayRows).map((r, idx) => {
                const pago = chipPago(r.tipoPago);
                return (
                  <TableRow
                    key={r.id ?? `${viewAll ? "all" : dayKey}-${idx}`}
                    hover
                    sx={{
                      transition:
                        "background-color .2s ease, transform .1s ease",
                      "&:nth-of-type(odd)": {
                        bgcolor: (t) =>
                          t.palette.mode === "dark"
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(0,0,0,0.015)",
                      },
                      "&:hover": {
                        bgcolor: (t) =>
                          t.palette.mode === "dark"
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontWeight: 600,
                        letterSpacing: ".3px",
                        fontSize: { xs: "0.95rem", sm: "1rem" },
                        py: dense ? 0.75 : { xs: 1, sm: 1.25 },
                      }}
                    >
                      {r.folio}
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        fontSize: { xs: "0.95rem", sm: "1rem" },
                        py: dense ? 0.75 : undefined,
                      }}
                    >
                      {r.fecha}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        fontSize: { xs: "1rem", sm: "1.05rem" },
                        py: dense ? 0.75 : undefined,
                      }}
                    >
                      {r.total}
                    </TableCell>

                    <TableCell
                      sx={{
                        display: { xs: "none", sm: "table-cell" },
                        py: dense ? 0.75 : undefined,
                      }}
                    >
                      <Chip
                        size={dense ? "small" : "medium"}
                        label={pago.label}
                        color={pago.color}
                        variant={pago.variant}
                        sx={{ textTransform: "capitalize", fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ py: dense ? 0.5 : undefined }}
                    >
                      <Button
                        variant="contained"
                        size={dense ? "small" : "medium"}
                        startIcon={<ReceiptLongIcon />}
                        onClick={() => onClickFacturar?.(r)}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          fontWeight: 700,
                          px: { xs: 1.5, sm: 2 },
                          py: { xs: 0.5, sm: 0.75 },
                          boxShadow: 0,
                          "&:hover": { boxShadow: 2 },
                        }}
                      >
                        Facturar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{
                    py: { xs: 4, md: 6 },
                    color: "text.secondary",
                    fontSize: { xs: "0.95rem", sm: "1rem" },
                  }}
                >
                  Sin registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer: navegación rápida */}
      <Box
        sx={(t) => ({
          px: 2,
          py: 1,
          borderTop: `1px solid ${t.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        })}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={() => setDayIndex((i) => Math.min(i + 1, days.length - 1))}
            disabled={!hasDays || dayIndex >= days.length - 1 || viewAll}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDayIndex((i) => Math.max(i - 1, 0))}
            disabled={!hasDays || dayIndex <= 0 || viewAll}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Box>
      
    </Paper>
    
  );
}
