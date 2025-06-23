// src/components/suscripciones/TablaHistorialSuscripciones.jsx
import React, { useEffect, useState } from "react";
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { showError } from "../../utils/alerts";

const TablaHistorialSuscripciones = () => {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    obtenerHistorial();
  }, []);

  const obtenerHistorial = async () => {
    try {
      const res = await axiosClient.get("/suscripciones/historial");
      setHistorial(res.data || []);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      showError("No se pudo cargar el historial de suscripciones.");
    }
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        📜 Historial de Suscripciones
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Estatus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historial.length > 0 ? (
              historial.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.fecha}</TableCell>
                  <TableCell>{item.concepto}</TableCell>
                  <TableCell>${item.monto}</TableCell>
                  <TableCell>{item.metodo}</TableCell>
                  <TableCell>{item.estatus}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay registros en el historial.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default TablaHistorialSuscripciones;
