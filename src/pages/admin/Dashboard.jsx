// src/pages/admin/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Avatar,
  Divider,
  Chip,
  alpha,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";

import axios from "../../axiosConfig";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  Line,
} from "recharts";

import { motion } from "framer-motion";

/* ==========================
   HELPERS UI (Premium)
========================== */

const MotionPaper = motion(Paper);

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45, ease: "easeOut" },
  }),
};

const glowBorder = (theme) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: 3,
  border: `1px solid ${alpha("#fff", 0.12)}`,
  background: `linear-gradient(180deg, ${alpha("#ffffff", 0.92)}, ${alpha(
    "#ffffff",
    0.86
  )})`,
  boxShadow: `0 24px 70px ${alpha("#000", 0.20)}`,
  backdropFilter: "blur(10px)",
  "&:before": {
    content: '""',
    position: "absolute",
    inset: -2,
    background: `radial-gradient(650px 280px at 15% 10%, ${alpha(
      theme.palette.primary.main,
      0.22
    )}, transparent 55%),
                 radial-gradient(650px 280px at 85% 0%, ${alpha(
                   "#8b5cf6",
                   0.18
                 )}, transparent 55%)`,
    filter: "blur(18px)",
    opacity: 0.9,
    pointerEvents: "none",
  },
});

const softHover = {
  transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 28px 80px rgba(0,0,0,.22)",
    borderColor: "rgba(255,255,255,.20)",
  },
};

const fmtMoney = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fmtAxis = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/* ✅ TICKS ORDENADOS */
const buildNiceTicks = (maxVal, isMobile) => {
  const safeMax = Math.max(0, Number(maxVal || 0));

  const step = isMobile
    ? safeMax <= 6000
      ? 2000
      : safeMax <= 20000
      ? 4000
      : 8000
    : safeMax <= 6000
    ? 1000
    : safeMax <= 20000
    ? 2000
    : 5000;

  const top = Math.max(step, Math.ceil(safeMax / step) * step);

  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  return { ticks, top };
};

const SectionHeader = ({ icon, title, subtitle, right }) => {
  const theme = useTheme();
  return (
    <MotionPaper
      elevation={0}
      variants={fadeUp}
      custom={0}
      initial="hidden"
      animate="show"
      sx={{
        p: { xs: 1.4, sm: 1.7, md: 2.0 },
        borderRadius: 3,
        border: `1px solid ${alpha("#0f172a", 0.10)}`,
        bgcolor: alpha("#ffffff", 0.92),
        boxShadow: `0 18px 55px ${alpha("#000", 0.10)}`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            }}
          >
            {icon}
          </Avatar>

          <Box>
            <Typography sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  mt: 0.2,
                  fontSize: 12,
                  fontWeight: 800,
                  color: alpha("#0f172a", 0.55),
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {right}
      </Stack>
    </MotionPaper>
  );
};

const StatCard = ({ icon, label, value, sub, tone = "primary", index = 0 }) => {
  const theme = useTheme();
  const toneColor =
    tone === "success"
      ? "#22c55e"
      : tone === "warning"
      ? "#f59e0b"
      : tone === "info"
      ? "#60a5fa"
      : theme.palette.primary.main;

  return (
    <MotionPaper
      elevation={0}
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="show"
      sx={{
        p: 2.2,
        borderRadius: 3,
        border: `1px solid ${alpha("#000", 0.06)}`,
        background: `linear-gradient(180deg, ${alpha("#ffffff", 0.95)}, ${alpha(
          "#ffffff",
          0.88
        )})`,
        boxShadow: `0 18px 55px ${alpha("#000", 0.14)}`,
        ...softHover,
      }}
    >
      <Stack direction="row" spacing={1.6} alignItems="center">
        <Avatar
          sx={{
            width: 46,
            height: 46,
            bgcolor: alpha(toneColor, 0.14),
            color: toneColor,
            border: `1px solid ${alpha(toneColor, 0.22)}`,
            boxShadow: `0 10px 26px ${alpha("#000", 0.12)}`,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 900, color: alpha("#111827", 0.65) }}>
            {label}
          </Typography>

          <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#0f172a", lineHeight: 1.15 }}>
            {value}
          </Typography>

          {sub && (
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha("#111827", 0.55) }}>
              {sub}
            </Typography>
          )}
        </Box>

        <Chip
          size="small"
          label="LIVE"
          sx={{
            fontWeight: 900,
            height: 22,
            bgcolor: alpha(toneColor, 0.10),
            color: toneColor,
            border: `1px solid ${alpha(toneColor, 0.18)}`,
          }}
        />
      </Stack>
    </MotionPaper>
  );
};

/* ==========================
   TOOLTIP PREMIUM (✅ muestra REAL)
========================== */
const PremiumTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  // 👇 el objeto completo del punto (trae total_real)
  const point = payload?.[0]?.payload || {};
  const real = point?.total_real ?? 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,
        borderRadius: 2.5,
        border: `1px solid ${alpha("#fff", 0.12)}`,
        bgcolor: alpha("#0b1220", 0.92),
        color: "white",
        boxShadow: `0 16px 45px ${alpha("#000", 0.35)}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 12, color: alpha("#fff", 0.75) }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 950, fontSize: 18, color: "#fff" }}>
        ${fmtMoney(real)} MXN
      </Typography>
    </Paper>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [stats, setStats] = useState({
    usuarios: 0,
    notificaciones: 0,
    enviadosHoy: 0,
  });
  const [actividades, setActividades] = useState([]);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      const res = await axios.get("/admin/dashboard");
      setStats(res.data.stats);
      setActividades(res.data.actividades);
      setDatos(res.data.graficas);
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    }
  };

  /**
   * ✅ SOLO VISUAL +1000:
   * - total_real: valor real del backend
   * - total_display: valor para dibujar (con +1000 SOLO al último punto)
   */

  // 1) REAL (sin tocar)
  const recargasMensualesReal = useMemo(() => {
    const arr = datos?.recargasMensuales || [];
    return arr.map((x) => ({
      ...x,
      total_real: Number(x.total) || 0,
    }));
  }, [datos]);

  // 2) DISPLAY (solo para dibujar)
  const recargasMensualesDisplay = useMemo(() => {
    const raw = recargasMensualesReal.map((x) => ({
      ...x,
      total_display: x.total_real,
    }));

    if (!raw.length) return raw;

    const lastIdx = raw.length - 1;
    raw[lastIdx] = {
      ...raw[lastIdx],
      total_display: (raw[lastIdx].total_real || 0) + 1000, // ✅ solo visual
    };

    return raw;
  }, [recargasMensualesReal]);

  // 3) Total REAL (sin +1000)
  const totalRecargasMXN = useMemo(() => {
    return recargasMensualesReal.reduce((acc, x) => acc + (x.total_real || 0), 0);
  }, [recargasMensualesReal]);

  // 4) ticks del eje Y con base en DISPLAY (para que no recorte el pico)
  const { yTicks, yTop } = useMemo(() => {
    const arr = recargasMensualesDisplay || [];
    const maxVal = arr.reduce((m, x) => Math.max(m, Number(x.total_display || 0)), 0);
    const { ticks, top } = buildNiceTicks(maxVal, isMobile);
    return { yTicks: ticks, yTop: top };
  }, [recargasMensualesDisplay, isMobile]);

  const actividadesOrdenadas = useMemo(() => {
    return (actividades || []).slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [actividades]);

  if (!datos) {
    return (
      <Box sx={{ p: { xs: 1, md: 2 } }}>
        <Typography sx={{ fontWeight: 900, color: "rgba(15,23,42,.9)" }}>
          Cargando datos del dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.2, sm: 2, md: 2.5 } }}>
      {/* ======= HEADER GENERAL ======= */}
      <SectionHeader
        icon={<DashboardRoundedIcon />}
        title="Panel de Actividades y Estadísticas"
        subtitle="Vista general con métricas, gráfica y eventos recientes"
        right={
          <Chip
            icon={<AccessTimeRoundedIcon />}
            label={`Actualizado: ${new Date().toLocaleString()}`}
            sx={{
              fontWeight: 900,
              bgcolor: alpha("#0f172a", 0.06),
              border: `1px solid ${alpha("#0f172a", 0.10)}`,
              color: alpha("#0f172a", 0.75),
              width: { xs: "100%", sm: "fit-content" },
              justifyContent: "center",
            }}
          />
        }
      />

      {/* ======= SECCIÓN 1: TARJETAS ======= */}
      <Box sx={{ mt: 2.2 }}>
        <SectionHeader
          icon={<InsightsRoundedIcon />}
          title="Resumen"
          subtitle="Indicadores principales del sistema"
        />

        <Grid container spacing={2.2} sx={{ mt: 0.2 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              index={0}
              icon={<WhatsAppIcon />}
              label="Usuarios registrados"
              value={stats.usuarios}
              sub="Cuentas activas en el sistema"
              tone="info"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              index={1}
              icon={<NotificationsActiveIcon />}
              label="Notificaciones totales"
              value={stats.notificaciones}
              sub="Admin/SuperAdmin"
              tone="warning"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              index={2}
              icon={<TrendingUpIcon />}
              label="Mensajes enviados hoy"
              value={stats.enviadosHoy}
              sub="Actividad del día"
              tone="success"
            />
          </Grid>
        </Grid>
      </Box>

      {/* ======= SECCIÓN 2: GRÁFICA ======= */}
      <Box sx={{ mt: 2.6 }}>
        <SectionHeader
          icon={<ShowChartRoundedIcon />}
          title="Ventas del Mes"
          subtitle="Evolución mensual (últimos 6 meses)"
          right={
            <Chip
              label={`Total real: $${fmtMoney(totalRecargasMXN)} MXN`}
              sx={{
                width: { xs: "100%", sm: "fit-content" },
                justifyContent: "center",
                fontWeight: 950,
                bgcolor: alpha(theme.palette.primary.main, 0.10),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              }}
            />
          }
        />

        <MotionPaper
          elevation={0}
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="show"
          sx={{
            ...glowBorder(theme),
            mt: 1.2,
            p: { xs: 1.6, sm: 2.2, md: 2.8 },
            ...softHover,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: { xs: 280, sm: 340, md: 440, lg: 560 },
              pl: { xs: 0, sm: 0.5, md: 1.0 },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={recargasMensualesDisplay}
                margin={{
                  top: 12,
                  right: isMobile ? 10 : 28,
                  left: isMobile ? 16 : 56,
                  bottom: isMobile ? 10 : 18,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="mes"
                  interval={0}
                  tick={{
                    fill: "#0f172a",
                    fontWeight: 900,
                    fontSize: isMobile ? 11 : 13,
                  }}
                  axisLine={{ stroke: alpha("#0f172a", 0.25) }}
                  tickLine={{ stroke: alpha("#0f172a", 0.18) }}
                  tickMargin={isMobile ? 10 : 12}
                  height={isMobile ? 32 : 40}
                />

                <YAxis
                  width={isMobile ? 56 : 92}
                  domain={[0, yTop]}
                  ticks={yTicks}
                  interval={0}
                  allowDecimals={false}
                  tick={{
                    fill: "#0f172a",
                    fontWeight: 900,
                    fontSize: isMobile ? 11 : 13,
                  }}
                  axisLine={{ stroke: alpha("#0f172a", 0.25) }}
                  tickLine={{ stroke: alpha("#0f172a", 0.18) }}
                  tickMargin={isMobile ? 8 : 12}
                  tickFormatter={fmtAxis}
                />

                <Tooltip content={<PremiumTooltip />} />

                {/* ✅ DIBUJA con total_display */}
                <Area
                  type="monotone"
                  dataKey="total_display"
                  stroke={theme.palette.primary.main}
                  strokeWidth={isMobile ? 3 : isDesktop ? 4.5 : 4}
                  fill={alpha(theme.palette.primary.main, 0.18)}
                  activeDot={{ r: isMobile ? 6 : 8 }}
                />

                <Line
                  type="monotone"
                  dataKey="total_display"
                  stroke={theme.palette.primary.main}
                  strokeWidth={isMobile ? 2 : isDesktop ? 3.2 : 3}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>

          <Typography
            sx={{
              mt: 1,
              fontSize: 11,
              fontWeight: 800,
              color: alpha("#0f172a", 0.5),
            }}
          >
            *El último punto incluye +$1,000 (solo visual) para resaltar el pico.
          </Typography>
        </MotionPaper>
      </Box>

      {/* ======= SECCIÓN 3: ACTIVIDADES ======= */}
      <Box sx={{ mt: 2.6 }}>
        <SectionHeader
          icon={<HistoryRoundedIcon />}
          title="Actividades recientes"
          subtitle="Últimos eventos registrados"
          right={
            <Chip
              size="small"
              label={`${actividadesOrdenadas.length}`}
              sx={{
                fontWeight: 900,
                bgcolor: alpha("#0f172a", 0.06),
                border: `1px solid ${alpha("#0f172a", 0.10)}`,
                color: alpha("#0f172a", 0.75),
              }}
            />
          }
        />

        <MotionPaper
          elevation={0}
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          sx={{
            mt: 1.2,
            p: { xs: 1.8, sm: 2.2, md: 2.6 },
            borderRadius: 3,
            border: `1px solid ${alpha("#0f172a", 0.10)}`,
            bgcolor: alpha("#ffffff", 0.92),
            boxShadow: `0 18px 55px ${alpha("#000", 0.12)}`,
            ...softHover,
          }}
        >
          {actividadesOrdenadas.length === 0 ? (
            <Typography sx={{ fontWeight: 800, color: alpha("#0f172a", 0.6) }}>
              No hay actividades recientes
            </Typography>
          ) : (
            <>
              <Divider sx={{ mb: 1.6, borderColor: alpha("#0f172a", 0.10) }} />
              <List
                disablePadding
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.1,
                }}
              >
                {actividadesOrdenadas.map((a, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * idx, duration: 0.3 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.4,
                        borderRadius: 3,
                        border: `1px solid ${alpha("#0f172a", 0.10)}`,
                        bgcolor: alpha("#0f172a", 0.02),
                        boxShadow: `0 12px 35px ${alpha("#000", 0.08)}`,
                        ...softHover,
                      }}
                    >
                      <ListItem disableGutters sx={{ p: 0 }}>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                fontWeight: 950,
                                color: "#0f172a",
                                fontSize: 13.5,
                                lineHeight: 1.35,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {a.descripcion}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              sx={{
                                mt: 0.5,
                                fontSize: 11.5,
                                fontWeight: 900,
                                color: alpha("#0f172a", 0.55),
                              }}
                            >
                              {a.fecha ? new Date(a.fecha).toLocaleString() : "—"}
                            </Typography>
                          }
                        />

                        <Chip
                          size="small"
                          label="Evento"
                          sx={{
                            ml: 1,
                            fontWeight: 900,
                            bgcolor: alpha(theme.palette.primary.main, 0.10),
                            color: theme.palette.primary.main,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                          }}
                        />
                      </ListItem>
                    </Paper>
                  </motion.div>
                ))}
              </List>
            </>
          )}
        </MotionPaper>
      </Box>
    </Box>
  );
};

export default Dashboard;