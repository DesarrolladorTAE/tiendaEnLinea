import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, TextField, MenuItem, Stack, Avatar, Button, IconButton
} from "@mui/material";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    usuario_id: ""
  });

  const obtenerCompras = async (filtros = {}) => {
    const query = new URLSearchParams(filtros).toString();
    const response = await axios.get(`/admin/compras?${query}`);
    return response.data;
  };

  useEffect(() => {
    cargarCompras();
    cargarUsuarios();
  }, []);

  const cargarCompras = async () => {
    try {
      const data = await obtenerCompras(filtros);
      setCompras(data);
    } catch (err) {
      toast.error("No se pudo cargar el historial de compras.");
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get("/admin/usuarios");
      setUsuarios(res.data);
    } catch {
      toast.error("Error al cargar usuarios");
    }
  };

  const handleFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ fecha_inicio: "", fecha_fin: "", usuario_id: "" });
  };

  useEffect(() => {
    cargarCompras();
  }, [filtros]);

  const exportarExcel = () => {
    const datos = compras.map((c) => ({
      Usuario: c.user?.name || "Sin nombre",
      Monto: c.monto,
      Tipo: c.tipo,
      Descripción: c.descripcion,
      Referencia: c.referencia,
      Fecha: new Date(c.created_at).toLocaleString()
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Compras");

    const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    const archivo = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(archivo, "compras.xlsx");
  };

  const totalIngresos = compras
    .filter((c) => c.tipo === "ingreso")
    .reduce((sum, c) => sum + parseFloat(c.monto), 0);

  const totalEgresos = compras
    .filter((c) => c.tipo === "egreso")
    .reduce((sum, c) => sum + parseFloat(c.monto), 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Historial de Compras</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportarExcel}
          >
            Exportar Excel
          </Button>
          <IconButton onClick={limpiarFiltros} title="Limpiar filtros">
            <RestartAltIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Stack spacing={2} direction="row" mb={2}>
        <TextField
          label="Fecha Inicio"
          type="date"
          name="fecha_inicio"
          value={filtros.fecha_inicio}
          onChange={handleFiltro}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Fecha Fin"
          type="date"
          name="fecha_fin"
          value={filtros.fecha_fin}
          onChange={handleFiltro}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          select
          label="Usuario"
          name="usuario_id"
          value={filtros.usuario_id}
          onChange={handleFiltro}
          fullWidth
        >
          <MenuItem value="">Todos</MenuItem>
          {usuarios.map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Referencia</TableCell>
              <TableCell>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {compras.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar>{c.user?.name?.[0] || "U"}</Avatar>
                    <Typography>{c.user?.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>${c.monto}</TableCell>
                <TableCell>{c.tipo}</TableCell>
                <TableCell>{c.descripcion}</TableCell>
                <TableCell>{c.referencia}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell><strong>Totales:</strong></TableCell>
              <TableCell><strong>${(totalIngresos - totalEgresos).toFixed(2)}</strong></TableCell>
              <TableCell colSpan={4}>
                Ingresos: <strong>${totalIngresos.toFixed(2)}</strong> | Egresos: <strong>${totalEgresos.toFixed(2)}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Compras;
