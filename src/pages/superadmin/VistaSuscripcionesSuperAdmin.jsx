import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import axiosSuperadmin from "../../config/axiosSuperadmin";

const VistaSuscripcionesSuperAdmin = () => {
  const [suscripciones, setSuscripciones] = useState([]);

  useEffect(() => {
    obtenerSuscripciones();
  }, []);

  const obtenerSuscripciones = async () => {
    try {
      const res = await axiosSuperadmin.get("/admin/suscripciones/global");
      setSuscripciones(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  const formatoFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Historial Global de Suscripciones
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Monto</TableCell>
              
            </TableRow>
          </TableHead>
          <TableBody>
            {suscripciones.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.usuario_nombre ?? "—"}</TableCell>
                <TableCell>
                  {item.plan_id
                    ? item.plan_nombre
                    : item.store_complemento?.complemento?.nombre || "—"}
                </TableCell>
                <TableCell>{formatoFecha(item.inicio)}</TableCell>
                <TableCell>{item.fin ? formatoFecha(item.fin) : "—"}</TableCell>
                <TableCell>${item.monto}</TableCell>
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default VistaSuscripcionesSuperAdmin;
