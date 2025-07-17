import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GraficasEstadisticas from "../../components/superadmin-dash/GraficasEstadisticas";
import TiendasNuevasDelMes from "../../components/superadmin-dash/TiendasNuevasDelMes";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrosPorMes, setRegistrosPorMes] = useState([]);
  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [tiendasNuevas, setTiendasNuevas] = useState(0);
  const [tiendasMuertas, setTiendasMuertas] = useState(0);
  const [topTiendas, setTopTiendas] = useState([]);

  useEffect(() => {
    axiosSuperadmin
      .get("/admin/overview")
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
    axiosSuperadmin
      .get("/admin/estadisticas/registros-mes")
      .then((res) => setRegistrosPorMes(res.data.data))
      .catch(console.error);
    axiosSuperadmin
      .get("/admin/estadisticas/pagos-mes")
      .then((res) => setVentasPorMes(res.data.data))
      .catch(console.error);
    axiosSuperadmin
      .get("/admin/estadisticas/top-tiendas")
      .then((res) => setTopTiendas(res.data.data))
      .catch(console.error);
  }, []);

  const statCards = [
    {
      label: "Tiendas registradas",
      value: stats?.tiendas ?? 0,
      icon: <StorefrontIcon fontSize="inherit" sx={{ color: "#9c27b0" }} />,
    },
    {
      label: "Ventas en Planes",
      value: `$${(stats?.ventas_planes ?? 0).toLocaleString()}`,
      icon: <ShowChartIcon fontSize="inherit" sx={{ color: "#2e7d32" }} />,
    },
    {
      label: "Ventas en Complementos",
      value: `$${(stats?.ventas_complementos ?? 0).toLocaleString()}`,
      icon: <ShowChartIcon fontSize="inherit" sx={{ color: "#1976d2" }} />,
    },
  ];

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box mt={2}>
      <Typography variant="h5" gutterBottom>
        📊 Panel de Estadísticas Generales
      </Typography>

      {/* Zona superior: Tabla a la izquierda, tarjetas a la derecha */}
      <Grid container spacing={3} alignItems="flex-start">
        {/* Columna izquierda */}
        <Grid item xs={12} md={4}>
          <TiendasNuevasDelMes />
        </Grid>

        {/* Columna derecha */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3} justifyContent="center" mt={18}>
            {statCards.map((stat) => (
              <Grid item xs={12} sm={6} md={4} key={stat.label}>
                <Card
                  sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    boxShadow: 3,
                    borderRadius: 3,
                    height: "100%",
                    minWidth: 220,
                  }}
                >
                  <Box sx={{ fontSize: 50, mb: 1 }}>{stat.icon}</Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stat.value}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Zona inferior: Gráficas */}
      <Box mt={5}>
        <GraficasEstadisticas
          registrosPorMes={registrosPorMes}
          topTiendas={topTiendas}
          ventasPorMes={ventasPorMes}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
