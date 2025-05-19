// src/components/admin/NotificacionesHistorial.jsx
import React, { useEffect, useState } from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Avatar, Typography, Stack, Box, Button
} from "@mui/material";
import axios from "../../axiosConfig";
import ModalRecargaPendiente from "./ModalRecargaPendiente";
import { toast } from "react-toastify";

const NotificacionesHistorial = ({ soloSolicitudes = false }) => {
  const [mensajes, setMensajes] = useState([]);
  const [recargaSeleccionada, setRecargaSeleccionada] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cargarMensajes = async () => {
    try {
      const res = await axios.get("/admin/notificaciones");
      let data = res.data;

      if (soloSolicitudes) {
        data = data.filter(m => m.mensaje?.toLowerCase().includes("nueva solicitud"));
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

      setRecargaSeleccionada(encontrada);
      setDialogOpen(true);
    } catch (err) {
      console.error("Error al obtener transacción", err);
    }
  };

  const confirmarRecarga = async (id) => {
    try {
      await axios.post(`/admin/recargas/${id}/confirmar`);
      toast.success("Recarga confirmada y saldo aplicado");
      setDialogOpen(false);
      cargarMensajes();
    } catch (err) {
      toast.error("Error al confirmar recarga");
    }
  };

  const rechazarRecarga = async (id) => {
    try {
      await axios.post(`/admin/recargas/${id}/rechazar`);
      toast.info("Recarga rechazada");
      setDialogOpen(false);
      cargarMensajes();
    } catch (err) {
      toast.error("Error al rechazar recarga");
    }
  };

  useEffect(() => {
    cargarMensajes();
  }, [soloSolicitudes]);

  return (
    <>
      <Typography variant="h5" mt={4} mb={2}>
        {soloSolicitudes ? "Solicitudes de Recarga" : "Historial de Notificaciones"}
      </Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Mensaje</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mensajes.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>{m.user?.name?.[0]}</Avatar>
                    <Box>
                      <Typography>{m.user?.name}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{m.mensaje}</TableCell>
                <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => verTransaccion(m.transaccion_id)}
                    disabled={!m.transaccion_id}
                  >
                    Ver solicitud
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

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