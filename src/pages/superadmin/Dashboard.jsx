import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShowChartIcon from "@mui/icons-material/ShowChart";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("SUPERADMIN_TOKEN");

  useEffect(() => {
    if (!token) return;
    axios
      .get("https://mitiendaenlineamx.com.mx/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data.stats))
      .catch((err) => console.error("Error cargando estadísticas", err))
      .finally(() => setLoading(false));
  }, [token]);

  const statCards = [
    {
      label: "Usuarios",
      value: stats?.usuarios ?? 0,
      icon: <PeopleAltIcon fontSize="large" color="primary" />,
    },
    {
      label: "Ventas totales",
      value: `$${(stats?.ventas ?? 0).toLocaleString()}`,
      icon: <ShowChartIcon fontSize="large" color="success" />,
    },
    {
      label: "Tiendas registradas",
      value: stats?.tiendas ?? 0,
      icon: <StorefrontIcon fontSize="large" color="secondary" />,
    },
    {
      label: "Visitas",
      value: stats?.visitas ?? 0,
      icon: <BarChartIcon fontSize="large" color="warning" />,
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

      <Grid container spacing={3} mt={1}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
              <Box sx={{ mr: 2 }}>{stat.icon}</Box>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  {stat.label}
                </Typography>
                <Typography variant="h6">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
