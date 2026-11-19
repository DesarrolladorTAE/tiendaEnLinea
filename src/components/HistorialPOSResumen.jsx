import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const METHOD_LABELS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "Tarjeta crédito",
  td: "Tarjeta débito",
};

const chartMethods = [
  { key: "efectivo", label: "Efectivo", color: "#a86600" },
  { key: "transferencia", label: "Transferencia", color: "#176cbe" },
  { key: "tc", label: "T. crédito", color: "#7543b2" },
  { key: "td", label: "T. débito", color: "#197754" },
];

const CONCEPT_LABELS = {
  sale_paid: "Ventas pagadas",
  sale_paid_mixed: "Ventas pago mixto",
  pending_initial_payment: "Anticipos iniciales",
  pending_payment: "Abonos de ventas pendientes",
  pending_final_payment: "Liquidaciones de ventas pendientes",
  credit_payment: "Abonos crédito",
  credit_liquidation: "Liquidaciones crédito",
};

const getDateKey = (value) => {
  if (!value) return "";
  const d = new Date(value);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const getMethod = (row) =>
  row?.payment?.method || row?.payment_method || row?.method || "sin_metodo";

const getMethodLabel = (method) =>
  METHOD_LABELS[method] || method?.toUpperCase?.() || "Sin método";

const getAmount = (row) => Number(row?.amount || 0);

export default function HistorialPOSResumen({ summary = {}, rows = [] }) {
  const chartData = useMemo(() => {
    const map = new Map();

    rows
      .filter((row) => row.affects_cash_total)
      .forEach((row) => {
        const date = getDateKey(row.date || row.fecha);
        if (!date) return;

        if (!map.has(date)) {
          map.set(date, {
            date,
            efectivo: 0,
            transferencia: 0,
            tc: 0,
            td: 0,
          });
        }

        const method = getMethod(row);
        const item = map.get(date);

        if (method in item) {
          item[method] += getAmount(row);
        }
      });

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [rows]);

  const conceptoRows = useMemo(() => {
    const map = new Map();

    rows
      .filter((row) => row.affects_cash_total)
      .forEach((row) => {
        const method = getMethod(row);
        const concept = row.row_type || "otro";
        const key = `${concept}-${method}`;

        const current = map.get(key) || {
          key,
          concept,
          conceptLabel: CONCEPT_LABELS[concept] || row.label || "Movimiento",
          method,
          methodLabel: getMethodLabel(method),
          total: 0,
          count: 0,
        };

        current.total += getAmount(row);
        current.count += 1;

        map.set(key, current);
      });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows]);

  const labels = chartData.map((d) => {
    const [, month, day] = d.date.split("-");
    return `${day}/${month}`;
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.6 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#fff",
        minWidth: 0,
      }}
    >
      <Stack spacing={2.2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, bgcolor: "#252b34", color: "#fff", borderLeft: "4px solid #ffc107" }}
        >
          <Box>
            <Typography component="h2" sx={{ color: "#fff !important", fontWeight: 800, fontSize: { xs: 20, md: 24 } }}>
              Resumen financiero
            </Typography>

            <Typography variant="body2" sx={{ color: "#d6dce5 !important" }}>
              Cobros, créditos, anticipos y liquidaciones del periodo.
            </Typography>
          </Box>

          <Box textAlign={{ xs: "left", md: "right" }}>
            <Typography
              variant="caption"
              sx={{ color: "#d6dce5 !important" }}
              fontWeight={800}
            >
              Total cobrado
            </Typography>

            <Typography sx={{ color: "#ffd454 !important", fontWeight: 900, fontVariantNumeric: "tabular-nums", fontSize: { xs: 25, md: 34 }, overflowWrap: "anywhere" }}>
              {money(summary.total_cobrado)}
            </Typography>

            <Chip
              size="small"
              label={`${summary.count_rows || 0} movimientos`}
              sx={{ bgcolor: "#414957", color: "#fff", fontWeight: 700 }}
            />
          </Box>
        </Stack>

        <Divider />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                height: "100%",
                minWidth: 0,
                bgcolor: "#f8fafc",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#ffc107",
                    color: "#17191c",
                  }}
                >
                  <PaymentsRoundedIcon fontSize="small" />
                </Box>

                <Box>
                  <Typography fontWeight={950}>Cobros por día</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Separado por método de pago
                  </Typography>
                </Box>
              </Stack>

              {chartData.length === 0 ? (
                <Box py={6} textAlign="center">
                  <Typography color="text.secondary">
                    Sin datos para graficar.
                  </Typography>
                </Box>
              ) : (
                <>
                <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                  {chartMethods.map(({ key, label, color }) => (
                    <Stack key={key} direction="row" gap={0.6} alignItems="center" sx={{ px: 0.9, py: 0.4, borderRadius: 1.5, bgcolor: "#fff", border: "1px solid #dbe2ea" }}>
                      <Box aria-hidden="true" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color }} />
                      <Typography variant="caption" fontWeight={700}>{label}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <LineChart
                  height={255}
                  hideLegend
                  xAxis={[
                    {
                      scaleType: "point",
                      data: labels,
                    },
                  ]}
                  series={chartMethods.map(({ key, label, color }) => ({
                    id: key, label, color, data: chartData.map((day) => day[key]),
                    curve: "linear", showMark: chartData.length <= 14, valueFormatter: money,
                  }))}
                  grid={{ horizontal: true }}
                  sx={{
                    "& .MuiChartsGrid-line": { stroke: "#dbe2ea", strokeDasharray: "4 4" },
                    "& .MuiLineElement-root": {
                      strokeWidth: 2.8,
                    },
                  }}
                />
                </>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                height: "100%",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#fff3cc",
                    color: "#785900",
                  }}
                >
                  <TrendingUpRoundedIcon fontSize="small" />
                </Box>

                <Box>
                  <Typography fontWeight={950}>Conceptos cobrados</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Monto por método de pago
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eef2f6" }}>
                      <TableCell sx={{ fontWeight: 900 }}>Concepto</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Método</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900 }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {conceptoRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" color="text.secondary">
                            Sin cobros registrados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      conceptoRows.map((item) => (
                        <TableRow key={item.key}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800}>
                              {item.conceptLabel}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.count} mov.
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={item.methodLabel}
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={950}>
                              {money(item.total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Divider />

        <Grid container spacing={1}>
          {[
            ["Ventas pagadas", summary.ventas_pagadas],
            ["Anticipos / abonos pendientes", summary.anticipos_pendientes],
            ["Liquidaciones pendientes", summary.pagos_finales_pendientes],
            ["Ventas a crédito", summary.ventas_credito_generadas],
            ["Abonos crédito", summary.abonos_credito],
            ["Liquidaciones crédito", summary.liquidaciones_credito],
            ["Cancelaciones", summary.cancelaciones],
            ["Devoluciones", summary.devoluciones],
          ]
            .filter(([, value]) => Number(value || 0) > 0)
            .map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.2,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "#e1e6ed",
                    borderLeft: "3px solid #ffc107",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={800}
                  >
                    {label}
                  </Typography>

                  <Typography fontWeight={950}>{money(value)}</Typography>
                </Box>
              </Grid>
            ))}
        </Grid>
      </Stack>
    </Paper>
  );
}
