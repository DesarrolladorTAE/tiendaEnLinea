import React, { useMemo, useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Typography,
  Stack,
  LinearProgress,
  Box,
  Chip,
  useMediaQuery,
  Button,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { LineChart } from "@mui/x-charts/LineChart";

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const PAYMENT_META = {
  efectivo: {
    label: "Efectivo",
    color: "#2e7d32",
    bg: "rgba(46,125,50,.10)",
  },
  transferencia: {
    label: "Transferencia",
    color: "#1976d2",
    bg: "rgba(25,118,210,.10)",
  },
  tc: {
    label: "Tarjeta crédito",
    color: "#ed6c02",
    bg: "rgba(237,108,2,.10)",
  },
  td: {
    label: "Tarjeta débito",
    color: "#9c27b0",
    bg: "rgba(156,39,176,.10)",
  },
  sin_metodo: {
    label: "Sin método",
    color: "#546e7a",
    bg: "rgba(84,110,122,.10)",
  },
};

function ResumenCard({ title, total, count, color, subtitle, icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor:
          color === "success"
            ? "success.light"
            : color === "info"
              ? "info.light"
              : color === "error"
                ? "error.light"
                : "divider",
        bgcolor:
          color === "success"
            ? "rgba(46,125,50,.05)"
            : color === "info"
              ? "rgba(25,118,210,.05)"
              : color === "error"
                ? "rgba(211,47,47,.05)"
                : "white",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>

          <Typography
            variant="h5"
            fontWeight={900}
            sx={{ mt: 0.7, lineHeight: 1.1 }}
          >
            {money(total)}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            bgcolor:
              color === "success"
                ? alpha("#2e7d32", 0.12)
                : color === "info"
                  ? alpha("#1976d2", 0.12)
                  : color === "error"
                    ? alpha("#d32f2f", 0.12)
                    : alpha("#000", 0.06),
            color:
              color === "success"
                ? "success.main"
                : color === "info"
                  ? "info.main"
                  : color === "error"
                    ? "error.main"
                    : "text.primary",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1.4 }}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
      >
        <Chip
          size="small"
          label={`${count} registros`}
          color={color}
          variant="outlined"
        />

        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function PaymentAreaChart({ title, rows = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const chartData = useMemo(() => {
    const ventasRows = rows.filter((r) => r.rowType === "venta");

    const devolucionesParcialesPorVenta = new Map();

    rows
      .filter((r) => r.rowType === "devolucion")
      .forEach((r) => {
        const ventaId = r.venta_id;
        const tipo = String(r.estado || r.tipo || "").toLowerCase();
        if (!ventaId) return;
        if (tipo.includes("total")) return;

        const actual = devolucionesParcialesPorVenta.get(ventaId) || 0;
        devolucionesParcialesPorVenta.set(ventaId, actual + Number(r.total || 0));
      });

    const diasMap = new Map();

    ventasRows.forEach((row) => {
      const venta = row.venta || {};
      const status = String(venta.status || row.estado || "").toLowerCase();
      const fecha = String(row.fecha || venta.created_at || "").slice(0, 10);

      if (!fecha) return;
      if (status === "cancelled" || status === "devuelta") return;

      let neto = Number(venta.total_amount ?? row.total ?? 0);

      if (status === "partially_cancelled" && Array.isArray(venta.items)) {
        const cancelado = venta.items
          .filter((it) => String(it?.estado || "").toLowerCase() === "cancelado")
          .reduce((acc, it) => acc + Number(it?.total_price || 0), 0);

        neto -= cancelado;
      }

      const devolucionParcial = devolucionesParcialesPorVenta.get(row.venta_id) || 0;
      neto -= devolucionParcial;
      neto = Math.max(0, neto);

      let paymentMethods = Array.isArray(venta.payment_methods) ? venta.payment_methods : [];

      if (!paymentMethods.length) {
        if (venta.payment_method) {
          paymentMethods = [
            {
              method: venta.payment_method,
              total: Number(venta.total_amount ?? row.total ?? 0),
            },
          ];
        } else {
          paymentMethods = [
            {
              method: "sin_metodo",
              total: Number(venta.total_amount ?? row.total ?? 0),
            },
          ];
        }
      }

      const totalPagos = paymentMethods.reduce((acc, p) => acc + Number(p.total || 0), 0);

      if (!diasMap.has(fecha)) {
        diasMap.set(fecha, {
          fecha,
          efectivo: 0,
          transferencia: 0,
          tc: 0,
          td: 0,
          sin_metodo: 0,
        });
      }

      const dia = diasMap.get(fecha);

      if (totalPagos > 0) {
        paymentMethods.forEach((p) => {
          const key = p.method || "sin_metodo";
          const proporcion = Number(p.total || 0) / totalPagos;
          const asignado = neto * proporcion;

          if (dia[key] == null) dia[key] = 0;
          dia[key] += asignado;
        });
      } else {
        const key = venta.payment_method || "sin_metodo";
        if (dia[key] == null) dia[key] = 0;
        dia[key] += neto;
      }
    });

    return Array.from(diasMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [rows]);

  const labels = chartData.map((d) => {
    const [, m, day] = d.fecha.split("-");
    return `${day}/${m}`;
  });


  const efectivoData = chartData.map((d) => Number(d.efectivo || 0));
  const transferenciaData = chartData.map((d) => Number(d.transferencia || 0));
  const tcData = chartData.map((d) => Number(d.tc || 0));
  const tdData = chartData.map((d) => Number(d.td || 0));

  const maxValue = Math.max(
    ...efectivoData,
    ...transferenciaData,
    ...tcData,
    ...tdData,
    0
  );

  const chartHeight = isMobile ? 240 : 340;
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
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          <PaymentsRoundedIcon fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={900}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Distribución diaria neta por método de pago
          </Typography>
        </Box>
      </Stack>

      {chartData.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin datos disponibles
        </Typography>
      ) : (
        <Box
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            alignItems: "stretch",
            mt: 0.5,
          }}
        >
          <LineChart
            height={chartHeight}
            xAxis={[
              {
                scaleType: "point",
                data: labels,
                tickLabelStyle: {
                  fontSize: isMobile ? 10 : 11,
                  fill: theme.palette.text.secondary,
                },
              },
            ]}
            yAxis={[
              {
                min: 0,
                max: maxValue > 0 ? Math.ceil(maxValue * 1.2) : 100,
                tickLabelStyle: {
                  fontSize: isMobile ? 10 : 11,
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
                label: "Tarjeta crédito",
                data: tcData,
                area: true,
                showMark: !isMobile,
                curve: "natural",
                color: PAYMENT_META.tc.color,
                valueFormatter: (value) => money(value),
              },
              {
                id: "td",
                label: "Tarjeta débito",
                data: tdData,
                area: true,
                showMark: !isMobile,
                curve: "natural",
                color: PAYMENT_META.td.color,
                valueFormatter: (value) => money(value),
              },
            ]}
            margin={{
              top: 4,
              right: isMobile ? 4 : 8,
              bottom: isMobile ? 22 : 26,
              left: isMobile ? 46 : 72,
            }}
            sx={{
              "& .MuiChartsSurface-root": {
                width: "100% !important",
                height: "100% !important",
              },
              "& .MuiAreaElement-root": {
                opacity: 0.22,
              },
              "& .MuiLineElement-root": {
                strokeWidth: 3,
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
            grid={{ horizontal: true }}
          />
        </Box>
      )}
    </Paper>
  );
}

function PaymentTotalsTable({ title, rows = [] }) {
  const totalGeneral = rows.reduce((acc, item) => acc + Number(item.total || 0), 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Totales netos por método de pago
      </Typography>

      <Stack spacing={1.1} sx={{ mt: 2 }}>
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin datos disponibles
          </Typography>
        ) : (
          rows.map((item) => {
            const meta = PAYMENT_META[item.key] || PAYMENT_META.sin_metodo;
            const percent = totalGeneral
              ? (Number(item.total || 0) / totalGeneral) * 100
              : 0;

            return (
              <Box
                key={item.key}
                sx={{
                  p: 1.2,
                  borderRadius: 2.5,
                  bgcolor: meta.bg,
                  border: "1px solid",
                  borderColor: alpha(meta.color, 0.18),
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: meta.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" fontWeight={800} noWrap>
                      {item.label}
                    </Typography>
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    {percent.toFixed(1)}%
                  </Typography>
                </Stack>

                <Typography variant="body1" fontWeight={900} sx={{ mt: 0.7 }}>
                  {money(item.total)}
                </Typography>
              </Box>
            );
          })
        )}
      </Stack>
    </Paper>
  );
}

function MiniBarsCountPaginated({ title, rows = [] }) {
  const theme = useTheme();
  const pageSize = 6;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const currentRows = rows.slice(start, start + pageSize);
  const total = rows.reduce((acc, item) => acc + Number(item.count || 0), 0);

  useEffect(() => {
    setPage(0);
  }, [rows]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(0);
    }
  }, [page, totalPages]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(theme.palette.info.main, 0.1),
            color: "info.main",
            flexShrink: 0,
          }}
        >
          <CategoryRoundedIcon fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={900}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Categorías con más ventas registradas
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.25}>
        {currentRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin datos disponibles
          </Typography>
        ) : (
          currentRows.map((item) => {
            const percent = total ? (Number(item.count || 0) / total) * 100 : 0;

            return (
              <Box key={item.key}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                  sx={{ mb: 0.6 }}
                >
                  <Typography variant="body2" noWrap title={item.label} fontWeight={700}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {item.count} ventas
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.info.main, 0.12),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                    },
                  }}
                />
              </Box>
            );
          })
        )}
      </Stack>

      {rows.length > pageSize ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 2 }}
        >
          <Typography variant="caption" color="text.secondary">
            Página {safePage + 1} de {totalPages}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ChevronLeftRoundedIcon />}
              disabled={safePage <= 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Ant.
            </Button>

            <Button
              size="small"
              variant="contained"
              endIcon={<ChevronRightRoundedIcon />}
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Sig.
            </Button>
          </Stack>
        </Stack>
      ) : null}
    </Paper>
  );
}

const isVentaAnuladaTotal = (status) => {
  const s = String(status || "").toLowerCase();
  return s === "cancelled" || s === "devuelta";
};

const isVentaParcialmenteCancelada = (status) => {
  return String(status || "").toLowerCase() === "partially_cancelled";
};

const getMontoCanceladoParcial = (venta) => {
  if (!Array.isArray(venta?.items)) return 0;

  return venta.items
    .filter((it) => String(it?.estado || "").toLowerCase() === "cancelado")
    .reduce((acc, it) => acc + Number(it?.total_price || 0), 0);
};

const getPagoLabel = (key) => {
  if (key === "efectivo") return "Efectivo";
  if (key === "transferencia") return "Transferencia";
  if (key === "tc") return "Tarjeta crédito";
  if (key === "td") return "Tarjeta débito";
  if (key === "sin_metodo") return "Sin método";
  return key;
};

export default function HistorialPOSResumen({ rows = [] }) {
  const resumen = useMemo(() => {
    const ventasRows = rows.filter((r) => r.rowType === "venta");
    const devolucionesRows = rows.filter((r) => r.rowType === "devolucion");
    const cancelacionesRows = rows.filter((r) => r.rowType === "cancelacion");

    const totalDevoluciones = devolucionesRows.reduce(
      (acc, r) => acc + Number(r.total || 0),
      0
    );

    const totalCancelaciones = cancelacionesRows.reduce(
      (acc, r) => acc + Number(r.total || 0),
      0
    );

    const devolucionesParcialesPorVenta = new Map();

    devolucionesRows.forEach((r) => {
      const ventaId = r.venta_id;
      const tipo = String(r.estado || r.tipo || "").toLowerCase();

      if (!ventaId) return;
      if (tipo.includes("total")) return;

      const actual = devolucionesParcialesPorVenta.get(ventaId) || 0;
      devolucionesParcialesPorVenta.set(ventaId, actual + Number(r.total || 0));
    });

    const ventasVigentes = [];
    let totalVentasNetas = 0;

    ventasRows.forEach((row) => {
      const venta = row.venta || {};
      const status = String(venta.status || row.estado || "").toLowerCase();
      const totalOriginal = Number(venta.total_amount ?? row.total ?? 0);

      if (isVentaAnuladaTotal(status)) return;

      let neto = totalOriginal;

      if (isVentaParcialmenteCancelada(status)) {
        neto -= getMontoCanceladoParcial(venta);
      }

      const devolucionParcial = devolucionesParcialesPorVenta.get(row.venta_id) || 0;
      neto -= devolucionParcial;
      neto = Math.max(0, neto);

      totalVentasNetas += neto;
      ventasVigentes.push({
        ...row,
        neto,
      });
    });

    const pagoMap = new Map();
    const categoriaMap = new Map();

    ventasVigentes.forEach((row) => {
      const venta = row.venta || {};
      const neto = Number(row.neto || 0);

      let paymentMethods = Array.isArray(venta.payment_methods)
        ? venta.payment_methods
        : [];

      if (!paymentMethods.length) {
        if (venta.payment_method) {
          paymentMethods = [
            {
              method: venta.payment_method,
              total: Number(venta.total_amount ?? row.total ?? 0),
            },
          ];
        } else {
          paymentMethods = [
            {
              method: "sin_metodo",
              total: Number(venta.total_amount ?? row.total ?? 0),
            },
          ];
        }
      }

      const totalPagosRegistrados = paymentMethods.reduce(
        (acc, p) => acc + Number(p.total || 0),
        0
      );

      if (totalPagosRegistrados > 0) {
        paymentMethods.forEach((p) => {
          const key = p.method || "sin_metodo";
          const proporcion = Number(p.total || 0) / totalPagosRegistrados;
          const asignado = neto * proporcion;

          const cur = pagoMap.get(key) || {
            key,
            label: getPagoLabel(key),
            total: 0,
          };

          cur.total += asignado;
          pagoMap.set(key, cur);
        });
      } else {
        const key = venta.payment_method || "sin_metodo";

        const cur = pagoMap.get(key) || {
          key,
          label: getPagoLabel(key),
          total: 0,
        };

        cur.total += neto;
        pagoMap.set(key, cur);
      }

      const categories = Array.isArray(venta.categories) ? venta.categories : [];

      if (!categories.length) {
        const cur = categoriaMap.get("Sin categoría") || {
          key: "Sin categoría",
          label: "Sin categoría",
          total: 0,
          count: 0,
        };
        cur.total += neto;
        cur.count += 1;
        categoriaMap.set("Sin categoría", cur);
      } else {
        categories.forEach((c) => {
          const key = c.name || "Sin categoría";
          const cur = categoriaMap.get(key) || {
            key,
            label: key,
            total: 0,
            count: 0,
          };
          cur.total += neto;
          cur.count += 1;
          categoriaMap.set(key, cur);
        });
      }
    });

    return {
      ventasTotal: totalVentasNetas,
      ventasCount: ventasVigentes.length,
      devolucionesTotal: totalDevoluciones,
      devolucionesCount: devolucionesRows.length,
      cancelacionesTotal: totalCancelaciones,
      cancelacionesCount: cancelacionesRows.length,
      porPago: Array.from(pagoMap.values()).sort((a, b) => b.total - a.total),
      porCategoria: Array.from(categoriaMap.values()).sort((a, b) => b.count - a.count),
    };
  }, [rows]);

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} md={4}>
          <ResumenCard
            title="Ventas netas"
            total={resumen.ventasTotal}
            count={resumen.ventasCount}
            color="success"
            subtitle="Sin canceladas ni devueltas totales"
            icon={<TrendingUpRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ResumenCard
            title="Devoluciones"
            total={resumen.devolucionesTotal}
            count={resumen.devolucionesCount}
            color="info"
            icon={<ReplayRoundedIcon fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <ResumenCard
            title="Cancelaciones"
            total={resumen.cancelacionesTotal}
            count={resumen.cancelacionesCount}
            color="error"
            icon={<CancelRoundedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid item xs={12} xl={8}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} lg={8}>
              <PaymentAreaChart
                title="Vendido neto por tipo de pago"
                rows={rows}
              />
            </Grid>

            <Grid item xs={12} lg={4}>
              <PaymentTotalsTable
                title="Totales por pago"
                rows={resumen.porPago}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} xl={4}>
          <MiniBarsCountPaginated
            title="Ventas por categoría"
            rows={resumen.porCategoria}
          />
        </Grid>
      </Grid>
    </Box>
  );
}