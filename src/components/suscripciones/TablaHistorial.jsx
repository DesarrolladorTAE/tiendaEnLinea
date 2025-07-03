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
  TextField,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { showError } from "../../utils/alerts";
import planes from "../../utils/planes";
import FilaSuscripcion from "./FilaSuscripcion";

const TablaHistorialSuscripciones = () => {
  const [historial, setHistorial] = useState([]);
  const [filtros, setFiltros] = useState({
    mes: "",
    anio: "",
    dia: "",
    monto: "",
    status: "",
  });

  const obtenerHistorial = async () => {
    try {
      const res = await axiosClient.get("/suscripciones/historial");
      setHistorial(res.data.data || []);
    } catch (error) {
      showError("No se pudo cargar el historial.");
    }
  };

  useEffect(() => {
    obtenerHistorial();
  }, []);

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ mes: "", anio: "", dia: "", monto: "", status: "" });
  };

  const filtrarHistorial = (item) => {
    const fecha = new Date(item.created_at);
    const cumpleMes = filtros.mes
      ? fecha.getMonth() + 1 === parseInt(filtros.mes)
      : true;
    const cumpleAnio = filtros.anio
      ? fecha.getFullYear() === parseInt(filtros.anio)
      : true;
    const cumpleDia = filtros.dia
      ? fecha.getDate() === parseInt(filtros.dia)
      : true;
    const cumpleMonto = filtros.monto
      ? parseFloat(item.monto) === parseFloat(filtros.monto)
      : true;
    const cumpleStatus = filtros.status ? item.status === filtros.status : true;
    return cumpleMes && cumpleAnio && cumpleDia && cumpleMonto && cumpleStatus;
  };

  const meses = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom>
        📜 Historial de Suscripciones
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          mb: 2,
          px: 1,
        }}
      >
        <TextField
          select
          name="status"
          label="Metodo de Pago"
          variant="standard"
          InputLabelProps={{ shrink: true }}
          value={filtros.status}
          onChange={handleFiltroChange}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="Conekta">Conekta</MenuItem>
          <MenuItem value="Transferencia">Transferencia</MenuItem>
          <MenuItem value="Sin confirmar">Sin confirmar</MenuItem>
        </TextField>

        <TextField
          name="monto"
          label="Monto"
          variant="standard"
          InputLabelProps={{ shrink: true }}
          value={filtros.monto}
          onChange={handleFiltroChange}
          sx={{ minWidth: 100 }}
        />

        <TextField
          select
          name="mes"
          label="Mes"
          variant="standard"
          InputLabelProps={{ shrink: true }}
          value={filtros.mes}
          onChange={handleFiltroChange}
          sx={{ minWidth: 120 }}
        >
          {meses.map((mes) => (
            <MenuItem key={mes.value} value={mes.value}>
              {mes.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          name="anio"
          label="Año"
          variant="standard"
          InputLabelProps={{ shrink: true }}
          value={filtros.anio}
          onChange={handleFiltroChange}
          sx={{ minWidth: 100 }}
        />

        <Button
          onClick={limpiarFiltros}
          variant="text"
          color="primary"
          sx={{
            ml: "auto",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          LIMPIAR
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>🗓 Adquirida</TableCell>
              <TableCell>⏳ Termina</TableCell>
              <TableCell>🧾 Concepto</TableCell>
              <TableCell>$ Monto</TableCell>
              <TableCell>📌 Metodo de Pago</TableCell>
              <TableCell>📄 Factura</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historial.filter(filtrarHistorial).map((item, i) => (
              <FilaSuscripcion
                key={i}
                item={item}
                planes={planes}
                onFacturado={obtenerHistorial}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default TablaHistorialSuscripciones;
