import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { Link } from "react-router-dom";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GraficasEstadisticas from "../../components/superadmin-dash/GraficasEstadisticas";
import TiendasNuevasDelMes from "../../components/superadmin-dash/TiendasNuevasDelMes";
import TiendasPorVencer from "../../components/superadmin-dash/TiendasPorVencer";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrosPorMes, setRegistrosPorMes] = useState([]);
  const [ventasPorMes, setVentasPorMes] = useState([]);
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
      linkTo: "/panel/tiendas",
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

      {/* Tarjetas centradas */}
      <Grid container justifyContent="center" spacing={3} mb={3}>
        {statCards.map((stat) => {
          const card = (
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
                cursor: stat.linkTo ? "pointer" : "default",
                transition: "transform 0.2s",
                "&:hover": stat.linkTo ? { transform: "scale(1.02)" } : {},
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
          );

          return (
            <Grid item xs={12} sm={6} md={4} key={stat.label}>
              {stat.linkTo ? (
                <Box component={Link} to={stat.linkTo} sx={{ textDecoration: "none" }}>
                  {card}
                </Box>
              ) : (
                card
              )}
            </Grid>
          );
        })}
      </Grid>

      {/* Dos tablas lado a lado */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TiendasNuevasDelMes />
        </Grid>
        <Grid item xs={12} md={6}>
          <TiendasPorVencer />
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
