import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Paper, Stack, Avatar
} from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import axios from "../../axiosConfig";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ usuarios: 0, notificaciones: 0, enviadosHoy: 0 });
  const [actividades, setActividades] = useState([]);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    cargarDatos();
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

  const InfoCard = ({ icon, label, value }) => (
    <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{icon}</Avatar>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Paper>
  );

  if (!datos) {
    return <Typography>Cargando datos del dashboard...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" mb={3}>Panel de Actividades y Estadísticas</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<WhatsAppIcon />} label="Usuarios registrados" value={stats.usuarios} />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<NotificationsActiveIcon />} label="Notificaciones totales" value={stats.notificaciones} />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<TrendingUpIcon />} label="Mensajes enviados hoy" value={stats.enviadosHoy} />
        </Grid>
      </Grid>

      {/* Recargas por mes */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Recargas por mes (últimos 6 meses)
          </Typography>
          <Typography variant="h4" color="primary" fontWeight="bold" mb={2}>
            {Number((datos.recargasMensuales || []).reduce((acc, val) => acc + (parseFloat(val.total) || 0), 0)).toFixed(2)} MXN
          </Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos.recargasMensuales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Carriers más utilizados */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" mb={2}>Carriers más utilizados</Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos.carriers || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="carrier" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Productos más vendidos */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" mb={2}>Productos más vendidos</Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos.masVendidos || []}
                  dataKey="ventas"
                  nameKey="producto"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {(datos.masVendidos || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#6366F1", "#06B6D4", "#F59E0B", "#EF4444"][index % 4]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Compras en Conekta */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" mb={2}>Compras en Conekta</Typography>
          <Box sx={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos.conekta || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="monto" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Actividades recientes */}
      <Box mt={4}>
        <Typography variant="h6" mb={2}>Actividades recientes</Typography>
        <Paper>
          <Box p={2}>
            <Stack spacing={2}>
              {actividades.length === 0 && <Typography>No hay actividades recientes</Typography>}
              {actividades.map((a, idx) => (
                <Box key={idx}>
                  <Typography variant="body1">{a.descripcion}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(a.fecha).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
