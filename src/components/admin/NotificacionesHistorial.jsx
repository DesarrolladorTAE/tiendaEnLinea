// src/components/admin/NotificacionesHistorial.jsx
import React, { useEffect, useState } from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Avatar, Typography, Stack, Box, Button, useMediaQuery, useTheme,
  TableContainer, Slide
} from "@mui/material";
import axios from "../../axiosConfig";
import ModalRecargaPendiente from "./ModalRecargaPendiente";
import { toast } from "react-toastify";

const NotificacionesHistorial = ({ soloSolicitudes = false }) => {
  const [mensajes, setMensajes] = useState([]);
  const [recargaSeleccionada, setRecargaSeleccionada] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const cargarMensajes = async () => {
    try {
      const res = await axios.get("/admin/notificaciones");
      let data = res.data;

      if (soloSolicitudes) {
        const pendientesRes = await axios.get("/admin/recargas-pendientes");
        const idsPendientes = pendientesRes.data.map(r => r.id);
        data = data.filter(m =>
          m.mensaje?.toLowerCase().includes("nueva solicitud") &&
          idsPendientes.includes(m.transaccion_id)
        );
      }

      setMensajes(data);
      setVisible(true);
    } catch (err) {
      console.error("Error al cargar notificaciones", err);
    }
  };

  const verTransaccion = async (transaccion_id) => {
    try {
      const res = await axios.get("/admin/recargas-pendientes");
      const encontrada = res.data.find(r => r.id === transaccion_id);

      if (!encontrada) return toast.error("No se encontró la transacción");

      const recarga = {
        ...encontrada,
        user: encontrada.user || {},
        fecha_envio: encontrada.created_at,
        status: encontrada.status || "pendiente"
      };

      setRecargaSeleccionada(recarga);
      setDialogOpen(true);
    } catch (err) {
      console.error("Error al obtener transacción", err);
    }
  };

  const confirmarRecarga = async (id) => {
    try {
      await axios.post(`/admin/recargas/${id}/confirmar`);
      toast.success("✅ Recarga confirmada y saldo aplicado");
      setDialogOpen(false);
      cargarMensajes();
    } catch (err) {
      toast.error("❌ Error al confirmar recarga");
    }
  };

  const rechazarRecarga = async (id) => {
    try {
      await axios.post(`/admin/recargas/${id}/rechazar`);
      toast.info("🚫 Recarga rechazada");
      setDialogOpen(false);
      cargarMensajes();
    } catch (err) {
      toast.error("❌ Error al rechazar recarga");
    }
  };

  useEffect(() => {
    cargarMensajes();
  }, [soloSolicitudes]);

  return (
    <>
      <Typography variant="h5" mt={4} mb={1} textAlign="center" color="primary">
        {soloSolicitudes ? "📝 Solicitudes de Recarga" : "🔔 Historial de Notificaciones"}
      </Typography>

      <Typography variant="body2" textAlign="center" color="text.secondary" mb={2}>
        Mostrando: Nombre del usuario 👤, Mensaje 📩, Fecha 📅 y Acciones 🛠️
      </Typography>

      <Slide in={visible} direction="up" timeout={500}>
        <Paper elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "#1976d2" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>👤 Usuario</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>📩 Mensaje</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>📅 Fecha</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>🛠️ Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mensajes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body1" color="text.secondary" py={3}>
                        🚫 Aún no hay solicitudes registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  mensajes.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: "secondary.main" }}>
                            {m.user?.name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="bold">
                              {m.user?.name}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{m.mensaje}</TableCell>
                      <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          color="secondary"
                          onClick={() => verTransaccion(m.transaccion_id)}
                          disabled={!m.transaccion_id}
                        >
                          Ver solicitud
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Slide>

      <ModalRecargaPendiente
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        recarga={recargaSeleccionada}
        onConfirmar={confirmarRecarga}
        onRechazar={rechazarRecarga}
      />
    </>
  );
};

export default NotificacionesHistorial;
