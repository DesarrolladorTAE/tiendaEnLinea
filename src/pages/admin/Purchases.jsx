import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, TextField, MenuItem, Stack, Avatar, Button, IconButton, Divider
} from "@mui/material";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [zoom, setZoom] = useState(1);
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

  const cargarCompras = async () => {
    try {
      const data = await obtenerCompras(filtros);
      const confirmadas = data.filter(c => c.status === "confirmado");
      setCompras(confirmadas);
    } catch (err) {
      toast.error("❌ No se pudo cargar el historial de compras.");
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get("/admin/usuarios");
      setUsuarios(res.data);
    } catch {
      toast.error("⚠️ Error al cargar usuarios");
    }
  };

  const handleFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ fecha_inicio: "", fecha_fin: "", usuario_id: "" });
    setComprobanteSeleccionado(null);
  };

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

  const totalIngresos = compras.filter(c => c.tipo === "ingreso").reduce((sum, c) => sum + parseFloat(c.monto), 0);
  const totalEgresos = compras.filter(c => c.tipo === "egreso").reduce((sum, c) => sum + parseFloat(c.monto), 0);

  useEffect(() => {
    cargarCompras();
    cargarUsuarios();
  }, []);

  useEffect(() => {
    cargarCompras();
  }, [filtros]);

  return (
    <Box display="flex" flexDirection="row" gap={3} sx={{ mt: 2 }}>
      {/* 📊 Tabla */}
      <Box flex={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" color="primary">📜 Historial de Ventas de Saldo</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportarExcel}>Exportar Excel</Button>
            <IconButton onClick={limpiarFiltros} title="Limpiar filtros"><RestartAltIcon /></IconButton>
          </Stack>
        </Stack>

        <Stack spacing={2} direction="row" mb={2}>
          <TextField label="Fecha Inicio" type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={handleFiltro} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="Fecha Fin" type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={handleFiltro} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField select label="Usuario" name="usuario_id" value={filtros.usuario_id} onChange={handleFiltro} fullWidth>
            <MenuItem value="">Todos</MenuItem>
            {usuarios.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
          </TextField>
        </Stack>

        <Paper sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#6C63FF" }}>
                <TableCell sx={{ color: "#fff" }}>Usuario</TableCell>
                <TableCell sx={{ color: "#fff" }}>Monto</TableCell>
                <TableCell sx={{ color: "#fff" }}>Descripción</TableCell>
                <TableCell sx={{ color: "#fff" }}>Referencia</TableCell>
                <TableCell sx={{ color: "#fff" }}>Fecha</TableCell>
                <TableCell sx={{ color: "#fff" }}>Comprobante</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {compras.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell><Stack direction="row" alignItems="center" spacing={1}><Avatar>{c.user?.name?.[0] || "U"}</Avatar><Typography>{c.user?.name}</Typography></Stack></TableCell>
                  <TableCell>${c.monto}</TableCell>
                  <TableCell>{c.descripcion}</TableCell>
                  <TableCell>{c.referencia}</TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                  <TableCell><Button variant="outlined" size="small" color="secondary" startIcon={<VisibilityIcon />} onClick={() => { setComprobanteSeleccionado(c.comprobante); setZoom(1); }}>Abrir</Button></TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell><strong>Totales:</strong></TableCell>
                <TableCell><strong>${(totalIngresos - totalEgresos).toFixed(2)}</strong></TableCell>
                <TableCell colSpan={4}>Ingresos: <strong>${totalIngresos.toFixed(2)}</strong> | Egresos: <strong>${totalEgresos.toFixed(2)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* 📎 Sección fija comprobante */}
      <Box width={400} maxHeight="85vh" overflow="auto" bgcolor="#F5F7FF" p={2} borderRadius={2} boxShadow={4}>
        <Typography variant="h6" color="secondary" mb={1}>📎 Comprobante</Typography>
        {comprobanteSeleccionado ? (
          <>
            <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
              <IconButton onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}><AddIcon /></IconButton>
              <Typography variant="body2">Zoom: {Math.round(zoom * 100)}%</Typography>
              <IconButton onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}><RemoveIcon /></IconButton>
            </Box>
            {comprobanteSeleccionado.endsWith(".pdf") ? (
              <Box component="iframe" src={comprobanteSeleccionado} width="100%" height={600 * zoom} style={{ border: "none" }} title="Comprobante PDF" />
            ) : (
              <Box component="img" src={comprobanteSeleccionado} alt="Comprobante" sx={{ width: `${zoom * 100}%`, objectFit: "contain" }} />
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">Selecciona una compra para ver el comprobante 📂</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Compras;