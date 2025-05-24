import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, TextField, MenuItem, Stack, Avatar, Button, IconButton,
  Autocomplete, TablePagination
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
  const [pagina, setPagina] = useState(0);
  const [filtradas, setFiltradas] = useState([]);
  const filasPorPagina = 10;
  const [filtros, setFiltros] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    usuario_id: "",
    status: "confirmado",
  });

  const obtenerCompras = async (filtros = {}) => {
    const query = new URLSearchParams(filtros).toString();
    const response = await axios.get(`/admin/compras?${query}`);
    return response.data;
  };

  const cargarCompras = async () => {
    try {
      const data = await obtenerCompras(filtros);
      const resultado = filtros.status ? data.filter(c => c.status === filtros.status) : data;
      setCompras(resultado);
      setFiltradas(resultado);
      setPagina(0);
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
    setFiltros({ fecha_inicio: "", fecha_fin: "", usuario_id: "", status: "confirmado" });
    setComprobanteSeleccionado(null);
  };

  const exportarExcel = () => {
    const datos = filtradas.map((c) => ({
      Usuario: `${c.user?.name || ''} ${c.user?.apellidos || ''}`.trim() || "Sin nombre",
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

  const paginatedCompras = filtradas.slice(pagina * filasPorPagina, pagina * filasPorPagina + filasPorPagina);
  const totalesConfirmadas = filtradas.filter(c => c.status === "confirmado");
  const totalIngresos = totalesConfirmadas.filter(c => c.tipo === "ingreso").reduce((sum, c) => sum + parseFloat(c.monto), 0);
  const totalEgresos = totalesConfirmadas.filter(c => c.tipo === "egreso").reduce((sum, c) => sum + parseFloat(c.monto), 0);

  useEffect(() => {
    cargarCompras();
    cargarUsuarios();
  }, []);

  useEffect(() => {
    cargarCompras();
  }, [filtros]);

  return (
    <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} sx={{ mt: 2 }}>
      <Box flex={1}>
        <Stack spacing={2} mb={2}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Typography variant="h5" color="primary">📜 Historial de Ventas de Saldo</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, md: 0 } }}>
              <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportarExcel}>Exportar Excel</Button>
              <IconButton onClick={limpiarFiltros} title="Limpiar filtros"><RestartAltIcon /></IconButton>
            </Stack>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Fecha Inicio" type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={handleFiltro} InputLabelProps={{ shrink: true }} sx={{ flex: 1, borderRadius: 2 }} fullWidth />
            <TextField label="Fecha Fin" type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={handleFiltro} InputLabelProps={{ shrink: true }} sx={{ flex: 1, borderRadius: 2 }} fullWidth />
            <Autocomplete
              options={usuarios}
              getOptionLabel={(option) => `${option.name || ''} ${option.apellidos || ''}`.trim()}
              value={usuarios.find(u => u.id === filtros.usuario_id) || null}
              onChange={(_, newValue) => setFiltros({ ...filtros, usuario_id: newValue ? newValue.id : "" })}
              renderInput={(params) => <TextField {...params} label="Usuario" fullWidth sx={{ borderRadius: 2 }} />}
              sx={{ flex: 2 }}
            />
            <TextField select label="Estado" name="status" value={filtros.status} onChange={handleFiltro} fullWidth sx={{ flex: 1, borderRadius: 2 }}>
              <MenuItem value="confirmado">Confirmadas</MenuItem>
              <MenuItem value="rechazada">Rechazadas</MenuItem>
              <MenuItem value="">Todas</MenuItem>
            </TextField>
          </Stack>
        </Stack>

        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
            <Table stickyHeader>
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
                {paginatedCompras.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Stack direction="row" alignItems="center" spacing={1}><Avatar>{c.user?.name?.[0] || "U"}</Avatar><Typography>{`${c.user?.name || ''} ${c.user?.apellidos || ''}`.trim()}</Typography></Stack></TableCell>
                    <TableCell>${c.monto}</TableCell>
                    <TableCell>{c.descripcion}</TableCell>
                    <TableCell>{c.referencia}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                    <TableCell><Button variant="outlined" size="small" color="secondary" startIcon={<VisibilityIcon />} onClick={() => { setComprobanteSeleccionado(c.comprobante); setZoom(1); }}>Abrir</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <Box sx={{ px: 2, py: 2, bgcolor: "#F5F5F5", borderTop: "1px solid #ccc" }}>
            <Typography variant="body1">
              <strong>Totales Confirmados:</strong> Ingresos: ${totalIngresos.toFixed(2)} | Egresos: ${totalEgresos.toFixed(2)} | Neto: ${(totalIngresos - totalEgresos).toFixed(2)}
            </Typography>
          </Box>
          <TablePagination
            component="div"
            count={filtradas.length}
            page={pagina}
            onPageChange={(e, newPage) => setPagina(newPage)}
            rowsPerPage={filasPorPagina}
            rowsPerPageOptions={[filasPorPagina]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      </Box>

      <Box sx={{ width: { xs: "100%", md: 400 }, maxHeight: "85vh", overflow: "auto", bgcolor: "#F5F7FF", p: 0, borderRadius: 2, boxShadow: 4, position: { md: "sticky" }, top: { md: 80 } }}>
        <Box sx={{ px: 2, py: 1, bgcolor: "#F5F7FF", position: "sticky", top: 0, zIndex: 2 }}>
          <Typography variant="h6" color="secondary" mb={1}>📎 Comprobante</Typography>
          <Box display="flex" justifyContent="center" alignItems="center">
            <IconButton onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}><AddIcon /></IconButton>
            <Typography variant="body2">Zoom: {Math.round(zoom * 100)}%</Typography>
            <IconButton onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}><RemoveIcon /></IconButton>
          </Box>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
          {comprobanteSeleccionado ? (
            comprobanteSeleccionado.endsWith(".pdf") ? (
              <Box component="iframe" src={comprobanteSeleccionado} width="100%" height={600 * zoom} style={{ border: "none" }} title="Comprobante PDF" />
            ) : (
              <Box component="img" src={comprobanteSeleccionado} alt="Comprobante" sx={{ width: `${zoom * 100}%`, objectFit: "contain" }} />
            )
          ) : (
            <Typography variant="body2" color="text.secondary">Selecciona una compra para ver el comprobante 📂</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Compras;
