import React from "react";
import { Typography, Box, Paper, useTheme, useMediaQuery } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/es"; // Español

const colors = ["#82ca9d", "#ffc658", "#d88484"];

const GraficasEstadisticas = ({
  registrosPorMes = [],
  pagosMes = 0,
  tiendasNuevas = 0,
  tiendasMuertas = 0,
  topTiendas = [],
  ventasPorMes = [], // ✅ nuevo prop
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Convierte mes "2025-07" => "julio 2025"
  const registrosFormateados = registrosPorMes.map((item) => ({
    ...item,
    mes: dayjs(item.mes).locale("es").format("MMMM YYYY"),
  }));
  const ventasFormateadas = ventasPorMes.map((item) => ({
    ...item,
    mes: dayjs(item.mes).locale("es").format("MMMM YYYY"),
  }));

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        📊 Gráficas Comparativas
      </Typography>

      <Box
        display="flex"
        flexWrap="wrap"
        gap={2}
        justifyContent="space-between"
      >
        {/* Gráfica 1 */}
        <Box
          component={Paper}
          elevation={3}
          sx={{
            p: 2,
            height: 420,
            flex: "1 1 300px",
            minWidth: isSmallScreen ? "100%" : "320px",
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            📈 Tiendas Registradas por Mes
          </Typography>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={registrosFormateados}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Gráfica 2 */}
       
        <Box
          component={Paper}
          elevation={3}
          sx={{
            p: 2,
            height: 420,
            flex: "1 1 300px",
            minWidth: isSmallScreen ? "100%" : "320px",
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            💳 Ventas por Mes
          </Typography>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={ventasFormateadas}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Gráfica 3 */}
        <Box
          component={Paper}
          elevation={3}
          sx={{
            p: 2,
            height: 420,
            flex: "1 1 300px",
            minWidth: isSmallScreen ? "100%" : "320px",
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            🏆 Top 3 Tiendas con mas Subscripciones
          </Typography>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={topTiendas}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default GraficasEstadisticas;
