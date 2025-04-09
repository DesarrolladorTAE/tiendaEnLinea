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
  const [datos, setDatos] = useState(null); // Inicialmente null

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

      <Grid container spacing={4}>
        <Grid item xs={12} md={20}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Recargas por mes (últimos 6 meses)
            </Typography>
            <Typography variant="h4" color="primary" fontWeight="bold" mb={2}>
              {Number(
                (datos.recargasMensuales || []).reduce((acc, val) => acc + (parseFloat(val.total) || 0), 0)
              ).toFixed(2)} MXN
            </Typography>

            <Box sx={{ width: '100%', maxWidth: 1000, margin: '0 auto' }}></Box>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={datos?.recargasMensuales || []}
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis dataKey="mes" tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                  }}
                  labelStyle={{ color: "#4B5563" }}
                  itemStyle={{ color: "#4F46E5" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  fill="url(#colorTotal)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>


        <Grid item xs={12} md={6}>
          <Typography variant="h6">Carriers más utilizados</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datos?.carriers || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="carrier" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6">Productos más vendidos</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={datos?.masVendidos || []} dataKey="ventas" nameKey="producto" cx="50%" cy="50%" outerRadius={80} label>
                {(datos?.masVendidos || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042"][index % 4]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6">Compras en Conekta</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datos?.conekta || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="monto" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" mb={2}>Actividades recientes</Typography>
        <Paper>
          <Box p={2}>
            <Stack spacing={2}>
              {actividades.length === 0 && <Typography>No hay actividades recientes</Typography>}
              {actividades.map((a, idx) => (
                <Box key={idx}>
                  <Typography variant="body1">{a.descripcion}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(a.fecha).toLocaleString()}</Typography>
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
