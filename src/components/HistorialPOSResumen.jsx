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
import { alpha, useTheme } from "@mui/material/styles";
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
  const theme = useTheme();

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
        borderRadius: 5,
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(135deg, rgba(15,23,42,.025), rgba(255,255,255,.98))",
        boxShadow: "0 18px 45px rgba(15,23,42,.07)",
      }}
    >
      <Stack spacing={2.2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Typography fontWeight={950} sx={{ fontSize: { xs: 20, md: 24 } }}>
              Resumen financiero
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Cobros, créditos, anticipos y liquidaciones del periodo.
            </Typography>
          </Box>

          <Box textAlign={{ xs: "left", md: "right" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={800}
            >
              Total cobrado
            </Typography>

            <Typography fontWeight={950} sx={{ fontSize: { xs: 28, md: 34 } }}>
              {money(summary.total_cobrado)}
            </Typography>

            <Chip
              size="small"
              color="success"
              label={`${summary.count_rows || 0} movimientos`}
              sx={{ fontWeight: 900 }}
            />
          </Box>
        </Stack>

        <Divider />

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
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
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
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
                <LineChart
                  height={285}
                  xAxis={[
                    {
                      scaleType: "point",
                      data: labels,
                    },
                  ]}
                  series={[
                    {
                      label: "Efectivo",
                      data: chartData.map((d) => d.efectivo),
                      area: true,
                      curve: "natural",
                      valueFormatter: (v) => money(v),
                    },
                    {
                      label: "Transferencia",
                      data: chartData.map((d) => d.transferencia),
                      area: true,
                      curve: "natural",
                      valueFormatter: (v) => money(v),
                    },
                    {
                      label: "T. crédito",
                      data: chartData.map((d) => d.tc),
                      area: true,
                      curve: "natural",
                      valueFormatter: (v) => money(v),
                    },
                    {
                      label: "T. débito",
                      data: chartData.map((d) => d.td),
                      area: true,
                      curve: "natural",
                      valueFormatter: (v) => money(v),
                    },
                  ]}
                  grid={{ horizontal: true }}
                  sx={{
                    "& .MuiAreaElement-root": {
                      opacity: 0.18,
                    },
                    "& .MuiLineElement-root": {
                      strokeWidth: 2.8,
                    },
                  }}
                />
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
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
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: "success.main",
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
                    <TableRow>
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
              <Grid item xs={12} sm={6} md={3} key={label}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.2,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "rgba(248,250,252,.75)",
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
