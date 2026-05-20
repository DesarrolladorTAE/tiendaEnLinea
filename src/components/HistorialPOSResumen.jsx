import React, { useMemo } from "react";
import {
  Grid,
  Paper,
  Typography,
  Stack,
  LinearProgress,
  Box,
  Chip,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";

import { LineChart } from "@mui/x-charts/LineChart";

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const STATUS_COBRADOS = ["paid", "credit_paid"];
const STATUS_PENDIENTES_COBRO = ["open", "credit"];

const PAYMENT_META = {
  efectivo: {
    label: "Efectivo",
    color: "#2e7d32",
    bg: "rgba(46,125,50,.08)",
  },
  transferencia: {
    label: "Transferencia",
    color: "#1976d2",
    bg: "rgba(25,118,210,.08)",
  },
  tc: {
    label: "Tarjeta crédito",
    color: "#ed6c02",
    bg: "rgba(237,108,2,.08)",
  },
  td: {
    label: "Tarjeta débito",
    color: "#9c27b0",
    bg: "rgba(156,39,176,.08)",
  },
  credit_paid: {
    label: "Crédito pagado",
    color: "#00897b",
    bg: "rgba(0,137,123,.08)",
  },
};

const getStatus = (row) => {
  const raw = String(row?.venta?.status || row?.estadoRaw || row?.estado || "")
    .toLowerCase()
    .trim();

  if (raw === "open" || raw.includes("pendiente")) return "open";

  if (raw === "credit" || raw.includes("credito") || raw.includes("crédito")) {
    return "credit";
  }

  if (raw === "credit_paid" || raw.includes("crédito pagado")) {
    return "credit_paid";
  }

  if (raw === "paid" || raw.includes("pagada")) return "paid";

  if (raw === "cancelled" || raw.includes("cancelada")) return "cancelled";

  if (raw === "partially_cancelled" || raw.includes("parcial")) {
    return "partially_cancelled";
  }

  if (raw === "devuelta" || raw.includes("devuelta")) return "devuelta";

  return raw;
};

const esCobrada = (status) => STATUS_COBRADOS.includes(status);

const esPendienteCobro = (status) => STATUS_PENDIENTES_COBRO.includes(status);

const normalizePaymentMethod = (method) => {
  const value = String(method || "")
    .toLowerCase()
    .trim();

  if (!value) return "";

  if (["efectivo", "cash"].includes(value)) return "efectivo";

  if (
    [
      "transferencia",
      "transfer",
      "spei",
      "bank_transfer",
      "transferencia bancaria",
    ].includes(value)
  ) {
    return "transferencia";
  }

  if (
    [
      "tc",
      "credito",
      "crédito",
      "tarjeta_credito",
      "tarjeta crédito",
      "tarjeta de crédito",
      "credit_card",
    ].includes(value)
  ) {
    return "tc";
  }

  if (
    [
      "td",
      "debito",
      "débito",
      "tarjeta_debito",
      "tarjeta débito",
      "tarjeta de débito",
      "debit_card",
    ].includes(value)
  ) {
    return "td";
  }

  if (["credit_paid", "credito_pagado", "crédito pagado"].includes(value)) {
    return "credit_paid";
  }

  return "";
};

const detectPaymentFromText = (text) => {
  const value = String(text || "").toLowerCase();

  if (value.includes("efectivo")) return "efectivo";
  if (value.includes("transferencia") || value.includes("spei"))
    return "transferencia";
  if (
    value.includes("t. crédito") ||
    value.includes("tarjeta crédito") ||
    value.includes("tarjeta de crédito")
  )
    return "tc";
  if (
    value.includes("t. débito") ||
    value.includes("tarjeta débito") ||
    value.includes("tarjeta de débito")
  )
    return "td";
  if (value.includes("crédito pagado") || value.includes("credito pagado"))
    return "credit_paid";

  return "";
};

const getFechaKey = (value) => {
  if (!value) return "";

  const fecha = new Date(value);

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getVentaTotal = (row) =>
  Number(
    row?.venta?.total_amount ??
      row?.venta?.total ??
      row?.venta?.amount ??
      row?.venta?.pending_amount ??
      row?.venta?.credit_amount ??
      row?.venta?.balance ??
      row?.total ??
      0,
  );

const getVentaPaymentMethods = (row) => {
  const venta = row?.venta || {};
  const status = getStatus(row);
  const totalVenta = getVentaTotal(row);

  if (status === "credit_paid") {
    return [
      {
        method: "credit_paid",
        total: totalVenta,
      },
    ];
  }

  const possibleArrays = [
    venta.payment_methods,
    venta.payments,
    venta.sale_payments,
    venta.payment_details,
  ];

  for (const arr of possibleArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      const normalized = arr
        .map((p) => {
          const key = normalizePaymentMethod(
            p.method || p.payment_method || p.type || p.name,
          );

          return {
            method: key,
            total: Number(p.total ?? p.amount ?? p.paid_amount ?? 0),
          };
        })
        .filter((p) => p.method && PAYMENT_META[p.method]);

      if (normalized.length > 0) return normalized;
    }
  }

  const directMethod = normalizePaymentMethod(
    venta.payment_method || venta.method || venta.payment_type,
  );

  if (directMethod && PAYMENT_META[directMethod]) {
    return [
      {
        method: directMethod,
        total: totalVenta,
      },
    ];
  }

  const labelMethod = detectPaymentFromText(
    venta.payment_label || row?.pago || "",
  );

  if (labelMethod && PAYMENT_META[labelMethod]) {
    return [
      {
        method: labelMethod,
        total: totalVenta,
      },
    ];
  }

  return [
    {
      method: "efectivo",
      total: totalVenta,
    },
  ];
};

function ResumenCard({ title, total, count, color, subtitle, icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor:
          color === "success"
            ? "success.light"
            : color === "info"
              ? "info.light"
              : color === "warning"
                ? "warning.light"
                : color === "error"
                  ? "error.light"
                  : "divider",
        bgcolor:
          color === "success"
            ? "rgba(46,125,50,.04)"
            : color === "info"
              ? "rgba(25,118,210,.04)"
              : color === "warning"
                ? "rgba(237,108,2,.05)"
                : color === "error"
                  ? "rgba(211,47,47,.04)"
                  : "white",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor:
              color === "success"
                ? alpha("#2e7d32", 0.12)
                : color === "info"
                  ? alpha("#1976d2", 0.12)
                  : color === "warning"
                    ? alpha("#ed6c02", 0.12)
                    : color === "error"
                      ? alpha("#d32f2f", 0.12)
                      : alpha("#000", 0.06),
            color:
              color === "success"
                ? "success.main"
                : color === "info"
                  ? "info.main"
                  : color === "warning"
                    ? "warning.main"
                    : color === "error"
                      ? "error.main"
                      : "text.primary",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>

          <Typography
            fontWeight={950}
            sx={{ fontSize: { xs: 20, md: 23 }, lineHeight: 1.05 }}
          >
            {money(total)}
          </Typography>

          <Stack
            direction="row"
            spacing={0.7}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 0.5 }}
          >
            <Chip
              size="small"
              label={`${count} reg.`}
              color={color}
              variant="outlined"
              sx={{ height: 22, fontWeight: 800 }}
            />

            {subtitle ? (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function PaymentAreaChart({ rows = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const chartData = useMemo(() => {
    const diasMap = new Map();

    rows.forEach((row) => {
      if (row.rowType !== "venta") return;

      const status = getStatus(row);
      if (!esCobrada(status)) return;

      const fecha = getFechaKey(row.fecha || row?.venta?.created_at);
      if (!fecha) return;

      if (!diasMap.has(fecha)) {
        diasMap.set(fecha, {
          fecha,
          efectivo: 0,
          transferencia: 0,
          tc: 0,
          td: 0,
          credit_paid: 0,
        });
      }

      const dia = diasMap.get(fecha);
      const payments = getVentaPaymentMethods(row);

      payments.forEach((p) => {
        if (!PAYMENT_META[p.method]) return;
        dia[p.method] += Number(p.total || 0);
      });
    });

    return Array.from(diasMap.values()).sort((a, b) =>
      a.fecha.localeCompare(b.fecha),
    );
  }, [rows]);

  const labels = chartData.map((d) => {
    const [, m, day] = d.fecha.split("-");
    return `${day}/${m}`;
  });

  const efectivoData = chartData.map((d) => Number(d.efectivo || 0));
  const transferenciaData = chartData.map((d) => Number(d.transferencia || 0));
  const tcData = chartData.map((d) => Number(d.tc || 0));
  const tdData = chartData.map((d) => Number(d.td || 0));
  const creditPaidData = chartData.map((d) => Number(d.credit_paid || 0));

  const maxValue = Math.max(
    ...efectivoData,
    ...transferenciaData,
    ...tcData,
    ...tdData,
    ...creditPaidData,
    0,
  );

  const chartHeight = isMobile ? 230 : 285;

  const formatCompactMoney = (value) => {
    const n = Number(value || 0);
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.2, md: 1.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        >
          <PaymentsRoundedIcon fontSize="small" />
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={950}>
            Cobros por día
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pagadas y créditos pagados
          </Typography>
        </Box>
      </Stack>

      {chartData.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin datos disponibles
        </Typography>
      ) : (
        <LineChart
          height={chartHeight}
          xAxis={[
            {
              scaleType: "point",
              data: labels,
              tickLabelStyle: {
                fontSize: isMobile ? 9 : 10,
                fill: theme.palette.text.secondary,
              },
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100,
              tickLabelStyle: {
                fontSize: isMobile ? 9 : 10,
                fill: theme.palette.text.secondary,
              },
              valueFormatter: (value) => formatCompactMoney(value),
            },
          ]}
          series={[
            {
              id: "efectivo",
              label: "Efectivo",
              data: efectivoData,
              area: true,
              showMark: !isMobile,
              curve: "natural",
              color: PAYMENT_META.efectivo.color,
              valueFormatter: (value) => money(value),
            },
            {
              id: "transferencia",
              label: "Transferencia",
              data: transferenciaData,
              area: true,
              showMark: !isMobile,
              curve: "natural",
              color: PAYMENT_META.transferencia.color,
              valueFormatter: (value) => money(value),
            },
            {
              id: "tc",
              label: "T. crédito",
              data: tcData,
              area: true,
              showMark: !isMobile,
              curve: "natural",
              color: PAYMENT_META.tc.color,
              valueFormatter: (value) => money(value),
            },
            {
              id: "td",
              label: "T. débito",
              data: tdData,
              area: true,
              showMark: !isMobile,
              curve: "natural",
              color: PAYMENT_META.td.color,
              valueFormatter: (value) => money(value),
            },
            {
              id: "credit_paid",
              label: "Crédito pagado",
              data: creditPaidData,
              area: true,
              showMark: !isMobile,
              curve: "natural",
              color: PAYMENT_META.credit_paid.color,
              valueFormatter: (value) => money(value),
            },
          ]}
          margin={{
            top: 6,
            right: 8,
            bottom: 20,
            left: isMobile ? 42 : 58,
          }}
          grid={{ horizontal: true }}
          sx={{
            "& .MuiAreaElement-root": {
              opacity: 0.2,
            },
            "& .MuiLineElement-root": {
              strokeWidth: 2.7,
            },
            "& .MuiMarkElement-root": {
              stroke: "#fff",
              strokeWidth: 2,
            },
            "& .MuiChartsAxis-line": {
              stroke: alpha(theme.palette.text.primary, 0.15),
            },
            "& .MuiChartsAxis-tick": {
              stroke: alpha(theme.palette.text.primary, 0.12),
            },
            "& .MuiChartsGrid-line": {
              stroke: alpha(theme.palette.text.primary, 0.08),
            },
          }}
        />
      )}
    </Paper>
  );
}

function CompactListCard({ title, subtitle, icon, rows = [], footer }) {
  const totalGeneral = rows.reduce(
    (acc, item) => acc + Number(item.total || 0),
    0,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.2, md: 1.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(25,118,210,.10)",
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={950}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Stack spacing={0.8}>
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin datos disponibles
          </Typography>
        ) : (
          rows.map((item, index) => {
            const meta = PAYMENT_META[item.key] || {
              color: "#607d8b",
              bg: "rgba(96,125,139,.08)",
            };

            const percent = totalGeneral
              ? (Number(item.total || 0) / totalGeneral) * 100
              : 0;

            return (
              <Box
                key={item.key}
                sx={{
                  px: 1,
                  py: 0.85,
                  borderRadius: 2,
                  bgcolor: item.bg || meta.bg,
                  border: "1px solid",
                  borderColor: alpha(item.color || meta.color, 0.18),
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Stack
                    direction="row"
                    spacing={0.8}
                    alignItems="center"
                    sx={{ minWidth: 0 }}
                  >
                    {item.showIndex ? (
                      <Chip
                        size="small"
                        label={index + 1}
                        sx={{
                          width: 23,
                          height: 23,
                          bgcolor: item.color || meta.color,
                          color: "#fff",
                          fontWeight: 900,
                          "& .MuiChip-label": { px: 0 },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          bgcolor: item.color || meta.color,
                          flexShrink: 0,
                        }}
                      />
                    )}

                    <Typography variant="body2" fontWeight={900} noWrap>
                      {item.label}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" fontWeight={950}>
                    {money(item.total)}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 44, textAlign: "right" }}
                  >
                    {percent.toFixed(1)}%
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(percent, 100)}
                  sx={{
                    mt: 0.7,
                    height: 6,
                    borderRadius: 10,
                    bgcolor: alpha(item.color || meta.color, 0.12),
                    "& .MuiLinearProgress-bar": {
                      bgcolor: item.color || meta.color,
                    },
                  }}
                />
              </Box>
            );
          })
        )}
      </Stack>

      {footer ? (
        <>
          <Divider sx={{ my: 1.2 }} />
          {footer}
        </>
      ) : null}
    </Paper>
  );
}

function PendientesCobroCompact({ pendientes }) {
  const rows = [
    {
      key: "open",
      label: "Ventas pendientes",
      total: pendientes.open.total,
      count: pendientes.open.count,
      color: "#ed6c02",
      bg: "rgba(237,108,2,.08)",
    },
    {
      key: "credit",
      label: "Créditos pendientes",
      total: pendientes.credit.total,
      count: pendientes.credit.count,
      color: "#00897b",
      bg: "rgba(0,137,123,.08)",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.2, md: 1.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "warning.light",
        bgcolor: "rgba(237,108,2,.04)",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(237,108,2,.12)",
            color: "warning.main",
          }}
        >
          <PendingActionsRoundedIcon fontSize="small" />
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={950}>
            Pendiente por cobrar
          </Typography>
          <Typography variant="caption" color="text.secondary">
            No suma a totales de pago
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={0.8}>
        {rows.map((item) => (
          <Box
            key={item.key}
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: item.bg,
              border: "1px solid",
              borderColor: alpha(item.color, 0.22),
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="body2" fontWeight={900}>
                {item.label}
              </Typography>

              <Chip
                size="small"
                variant="outlined"
                label={`${item.count} reg.`}
                sx={{
                  height: 22,
                  fontWeight: 800,
                  color: item.color,
                  borderColor: alpha(item.color, 0.5),
                }}
              />
            </Stack>

            <Typography variant="h6" fontWeight={950} sx={{ mt: 0.3 }}>
              {money(item.total)}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 1 }} />

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" fontWeight={900}>
          Total pendiente
        </Typography>
        <Typography variant="body2" fontWeight={950}>
          {money(pendientes.total)}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function HistorialPOSResumen({ rows = [] }) {
  const resumen = useMemo(() => {
    const paymentMap = new Map();
    const categoryMap = new Map();

    const pendientes = {
      total: 0,
      count: 0,
      open: { total: 0, count: 0 },
      credit: { total: 0, count: 0 },
    };

    let totalCobrado = 0;
    let countCobrado = 0;
    let totalVentasPagadas = 0;
    let countVentasPagadas = 0;
    let totalCreditosPagados = 0;
    let countCreditosPagados = 0;
    let totalDevoluciones = 0;
    let countDevoluciones = 0;
    let totalCancelaciones = 0;
    let countCancelaciones = 0;

    rows.forEach((row) => {
      const status = getStatus(row);
      const total = getVentaTotal(row);

      if (row.rowType === "devolucion") {
        totalDevoluciones += Number(row.total || 0);
        countDevoluciones += 1;
        return;
      }

      if (row.rowType === "cancelacion") {
        totalCancelaciones += Number(row.total || 0);
        countCancelaciones += 1;
        return;
      }

      if (row.rowType !== "venta") return;

      if (esPendienteCobro(status)) {
        pendientes.total += total;
        pendientes.count += 1;

        if (status === "open") {
          pendientes.open.total += total;
          pendientes.open.count += 1;
        }

        if (status === "credit") {
          pendientes.credit.total += total;
          pendientes.credit.count += 1;
        }

        return;
      }

      if (!esCobrada(status)) return;

      totalCobrado += total;
      countCobrado += 1;

      if (status === "paid") {
        totalVentasPagadas += total;
        countVentasPagadas += 1;
      }

      if (status === "credit_paid") {
        totalCreditosPagados += total;
        countCreditosPagados += 1;
      }

      const paymentMethods = getVentaPaymentMethods(row);

      paymentMethods.forEach((p) => {
        if (!PAYMENT_META[p.method]) return;

        const meta = PAYMENT_META[p.method];

        const current = paymentMap.get(p.method) || {
          key: p.method,
          label: meta.label,
          total: 0,
          count: 0,
          color: meta.color,
          bg: meta.bg,
        };

        current.total += Number(p.total || 0);
        current.count += 1;

        paymentMap.set(p.method, current);
      });

      const venta = row.venta || {};
      const items = Array.isArray(venta.items) ? venta.items : [];

      items.forEach((it) => {
        const categoryName =
          it?.product?.category?.name ||
          it?.product?.category_name ||
          it?.category_name ||
          "Sin categoría";

        const key = String(categoryName).toLowerCase();

        const current = categoryMap.get(key) || {
          key,
          label: categoryName,
          total: 0,
          count: 0,
          showIndex: true,
          color: "#1976d2",
        };

        current.total += Number(
          it?.total_price ?? it?.subtotal ?? it?.total ?? 0,
        );
        current.count += 1;

        categoryMap.set(key, current);
      });
    });

    return {
      totalCobrado,
      countCobrado,
      totalVentasPagadas,
      countVentasPagadas,
      totalCreditosPagados,
      countCreditosPagados,
      totalDevoluciones,
      countDevoluciones,
      totalCancelaciones,
      countCancelaciones,
      pendientes,
      pagos: Array.from(paymentMap.values()).sort(
        (a, b) => Number(b.total || 0) - Number(a.total || 0),
      ),
      categorias: Array.from(categoryMap.values())
        .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
        .slice(0, 5),
    };
  }, [rows]);

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={1.2}>
        <Grid item xs={12} sm={6} md={3}>
          <ResumenCard
            title="Total cobrado"
            total={resumen.totalCobrado}
            count={resumen.countCobrado}
            color="success"
            subtitle="Pagadas + créditos"
            icon={<TrendingUpRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ResumenCard
            title="Ventas pagadas"
            total={resumen.totalVentasPagadas}
            count={resumen.countVentasPagadas}
            color="success"
            subtitle="Estado paid"
            icon={<PaymentsRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ResumenCard
            title="Créditos pagados"
            total={resumen.totalCreditosPagados}
            count={resumen.countCreditosPagados}
            color="info"
            subtitle="credit_paid"
            icon={<CreditScoreRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ResumenCard
            title="Pendiente por cobrar"
            total={resumen.pendientes.total}
            count={resumen.pendientes.count}
            color="warning"
            subtitle="Open + credit"
            icon={<PendingActionsRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PaymentAreaChart rows={rows} />
        </Grid>

        <Grid item xs={12} md={3}>
          <CompactListCard
            title="Totales de pago"
            subtitle="Solo dinero cobrado"
            icon={<PaymentsRoundedIcon fontSize="small" />}
            rows={resumen.pagos}
            footer={
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={900}>
                  Total
                </Typography>
                <Typography variant="body2" fontWeight={950}>
                  {money(resumen.totalCobrado)}
                </Typography>
              </Stack>
            }
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <CompactListCard
            title="Categorías"
            subtitle="Más vendidas"
            icon={<CategoryRoundedIcon fontSize="small" />}
            rows={resumen.categorias}
            footer={
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={900}>
                  Total cobrado
                </Typography>
                <Typography variant="body2" fontWeight={950}>
                  {money(resumen.totalCobrado)}
                </Typography>
              </Stack>
            }
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PendientesCobroCompact pendientes={resumen.pendientes} />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ResumenCard
            title="Devoluciones"
            total={resumen.totalDevoluciones}
            count={resumen.countDevoluciones}
            color="info"
            subtitle="Informativo"
            icon={<ReplayRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ResumenCard
            title="Cancelaciones"
            total={resumen.totalCancelaciones}
            count={resumen.countCancelaciones}
            color="error"
            subtitle="Informativo"
            icon={<CancelRoundedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
