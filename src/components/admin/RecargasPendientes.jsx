// src/components/admin/RecargasPendientes.jsx
import React, { useEffect, useState } from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Typography
} from "@mui/material";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";

const RecargasPendientes = () => {
  const [recargas, setRecargas] = useState([]);

  const cargarRecargas = async () => {
    try {
      const res = await axios.get("/admin/recargas-pendientes");
      setRecargas(res.data);
    } catch (err) {
      toast.error("Error al cargar recargas pendientes");
    }
  };

  const confirmarRecarga = async (id) => {
    try {
      await axios.post(`/admin/recargas/${id}/confirmar`);
      toast.success("Recarga confirmada y saldo aplicado");
      cargarRecargas();
    } catch (err) {
      toast.error("Error al confirmar recarga");
    }
  };

  const rechazarRecarga = async (id) => {
    try {
      await axios.post(`/admin/recargas/${id}/rechazar`);
      toast.info("Recarga rechazada");
      cargarRecargas();
    } catch (err) {
      toast.error("Error al rechazar recarga");
    }
  };

  useEffect(() => {
    cargarRecargas();
  }, []);

  return (
    <>
      <Typography variant="h5" mt={4} mb={2}>Recargas Manuales Pendientes</Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recargas.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.user?.name}</TableCell>
                <TableCell>${r.monto}</TableCell>
                <TableCell>
                  <a href={r.comprobante} target="_blank" rel="noopener noreferrer">
                    Ver comprobante
                  </a>
                </TableCell>
                <TableCell>{new Date(r.fecha_envio).toLocaleString()}</TableCell>
                <TableCell>
                  <Button color="success" onClick={() => confirmarRecarga(r.id)}>💰 Confirmar</Button>
                  <Button color="error" onClick={() => rechazarRecarga(r.id)}>❌ Rechazar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
};

export default RecargasPendientes;
