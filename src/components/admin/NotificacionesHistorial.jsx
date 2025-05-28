// src/components/admin/NotificacionesHistorial.jsx
import React, { useEffect, useState } from "react";
import {
  Paper, Typography, Avatar, Stack, Box, Button, useMediaQuery,
  useTheme, Divider
} from "@mui/material";
import axios from "../../axiosConfig";
import ModalRecargaPendiente from "./ModalRecargaPendiente";
import { toast } from "react-toastify";

const NotificacionesHistorial = ({ soloSolicitudes = false }) => {
  const [mensajes, setMensajes] = useState([]);
  const [recargaSeleccionada, setRecargaSeleccionada] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    } catch (err) {
      console.error("Error al cargar notificaciones", err);
    }
  };

  const verTransaccion = async (transaccion_id) => {
    try {
      const res = await axios.get("/admin/recargas-pendientes");
      const encontrada = res.data.find(r => r.id === transaccion_id);
      if (!encontrada) return toast.error("No se encontró la transacción");

      setRecargaSeleccionada({
        ...encontrada,
        user: encontrada.user || {},
        status: encontrada.status || "pendiente"
      });
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
      toast.info(" Recarga rechazada");
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


      {mensajes.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" py={5}>
          🚫 Aún no hay solicitudes registradas
        </Typography>
      ) : (
        <Stack spacing={2} px={isMobile ? 1 : 5} pb={4}>
          {mensajes.map((m) => (
            <Paper
              key={m.id}
              elevation={3}
              sx={{
                borderRadius: 3,
                p: 2,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: 2,
                borderLeft: "6px solid #1976d2"
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {m.user?.name?.[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight="bold">
                    {m.user?.name} {m.user?.apellidos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(m.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>

              <Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem sx={{ my: 1 }} />

              <Box flex={1}>
                <Typography>{m.mensaje}</Typography>
              </Box>

              <Box mt={isMobile ? 1 : 0}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => verTransaccion(m.transaccion_id)}
                  disabled={!m.transaccion_id}
                >
                  Ver solicitud
                </Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

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
