import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Stack, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, MenuItem, Checkbox, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Pagination, Tooltip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ================= helpers ================= */
const monthsMx = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
];

function monthRange(isoYear, isoMonth0) {
  const start = new Date(isoYear, isoMonth0, 1, 0, 0, 0, 0);
  const end = new Date(isoYear, isoMonth0 + 1, 1, 0, 0, 0, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startStr: fmt(start), endStr: fmt(end) };
}

function money(n = 0) {
  const v = Number(n || 0);
  return `$${v.toFixed(2)} MXN`;
}

/* ================= componente ================= */
export default function VentasDelMes() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [seleccion, setSeleccion] = useState([]);
  const [usoCfdi, setUsoCfdi] = useState("S01");

  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  const [modalOpen, setModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState(null);

  // 🔹 Carga TODAS las ventas del mes (sin filtrar status)
  const loadVentas = async () => {
    setLoading(true);
    try {
      const { startStr, endStr } = monthRange(year, month0);
      const params = new URLSearchParams({
        fecha_inicio: startStr,
        fecha_fin: endStr,
      }).toString();

      const { data } = await axios.get(`/admin/compras?${params}`);

      const todas = Array.isArray(data) ? data : [];
      todas.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setVentas(todas);
      setSeleccion([]);
      setPage(1);
    } catch {
      toast.error("❌ No se pudo cargar Ventas del Mes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
  }, [year, month0]);

  const totalVendido = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v.monto || 0), 0),
    [ventas]
  );

  const elegibles = useMemo(
    () => ventas.filter((v) => !v.folio_factura).map((v) => v.id),
    [ventas]
  );

  const allChecked = ventas.length > 0 && seleccion.length === ventas.length;
  const indeterminate = seleccion.length > 0 && !allChecked;

  const pageCount = Math.max(1, Math.ceil(ventas.length / rowsPerPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return ventas.slice(start, start + rowsPerPage);
  }, [page, ventas]);

  const toggleSeleccion = (id) => {
    setSeleccion((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodo = (checked) => {
    setSeleccion(checked ? ventas.map((v) => v.id) : []);
  };

  const abrirComprobante = (url) => {
    if (!url) return toast.info("No hay comprobante para esta venta.");
    setComprobanteUrl(url);
    setModalOpen(true);
  };

  const exportarExcel = () => {
    const datos = ventas.map((v) => ({
      Tienda: `${v.user?.name || ""} ${v.user?.apellidos || ""}`.trim() || "Sin nombre",
      Tipo: v.tipo,
      Monto: Number(v.monto || 0),
      Descripción: v.descripcion || "",
      Referencia: v.referencia || "",
      Fecha: new Date(v.created_at).toLocaleString(),
      FolioFactura: v.folio_factura || "",
      PDF: v.pdf_url || "",
      XML: v.xml_url || "",
      Estado: v.status || "",
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "VentasMes");
    const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    const archivo = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(archivo, `ventas_${monthsMx[month0]}_${year}.xlsx`);
  };

  const timbrarPG = async () => {
    if (seleccion.length === 0) return toast.info("Selecciona al menos una venta.");
    try {
      const { data } = await axios.post("/admin/facturacion-saldo/publico-general", {
        transaccion_ids: seleccion,
        uso_cfdi: usoCfdi,
        formaPago: "03",
        metodoPago: "PUE",
      });
      toast.success(`✅ Timbrado PG folio ${data.folio}`);
      loadVentas();
    } catch (e) {
      toast.error(e?.response?.data?.message || "❌ Error al timbrar (PG).");
    }
  };

  const timbrarPorTienda = async () => {
    if (seleccion.length === 0) return toast.info("Selecciona al menos una venta.");
    try {
      const { data } = await axios.post("/admin/facturacion-saldo/por-usuario", {
        transaccion_ids: seleccion,
        uso_cfdi: usoCfdi === "S01" ? "G03" : usoCfdi,
        formaPago: "03",
        metodoPago: "PUE",
      });
      toast.success(`✅ Timbrado por tienda folio ${data.folio}`);
      loadVentas();
    } catch (e) {
      toast.error(e?.response?.data?.message || "❌ Error al timbrar (por tienda).");
    }
  };

  const limpiar = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth0(t.getMonth());
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Encabezado */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Typography variant="h5">Ventas del Mes ✅</Typography>
          <Chip
            label={`Mes actual: ${monthsMx[month0][0].toUpperCase()}${monthsMx[month0].slice(1)} de ${year}`}
            color="secondary"
          />
        </Stack>

        <Stack direction="row" alignItems="center" gap={1}>
          <TextField
            select size="small" label="Mes"
            value={month0}
            onChange={(e) => setMonth0(Number(e.target.value))}
            sx={{ minWidth: 170 }}
          >
            {monthsMx.map((m, idx) => (
              <MenuItem key={m} value={idx}>
                {m[0].toUpperCase() + m.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select size="small" label="Año"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: 110 }}
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>

          <Tooltip title="Exportar a Excel">
            <IconButton onClick={exportarExcel}><FileDownloadIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Restablecer a mes actual">
            <IconButton onClick={limpiar}><RestartAltIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Total vendido y acciones */}
      <Stack direction="row" alignItems="center" gap={3} sx={{ my: 2 }} flexWrap="wrap">
        <Typography variant="h6">
          💰 Total vendido: <strong>{money(totalVendido)}</strong>
        </Typography>
        {/* <Chip label={`Elegibles: ${elegibles.length}`} />
        <Chip color="primary" label={`Seleccionadas: ${seleccion.length}`} /> */}
        <TextField
          select size="small" label="Uso CFDI" value={usoCfdi}
          onChange={(e) => setUsoCfdi(e.target.value)}
          sx={{ width: 120 }}
        >
          <MenuItem value="S01">S01</MenuItem>
          <MenuItem value="G03">G03</MenuItem>
        </TextField>
        <Button variant="contained" color="success" onClick={timbrarPG}>
          Facturar a Público General
        </Button>
        <Button variant="contained" onClick={timbrarPorTienda}>
          Facturar por Tienda
        </Button>
      </Stack>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ maxHeight: "62vh", overflow: "auto" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: "#6C63FF" }}>
                <TableCell sx={{ color: "#fff", width: 48 }}>
                  <Checkbox
                    color="secondary"
                    checked={allChecked}
                    indeterminate={indeterminate}
                    onChange={(e) => seleccionarTodo(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ color: "#fff" }}>Tienda</TableCell>
                <TableCell sx={{ color: "#fff" }}>Tipo</TableCell>
                <TableCell sx={{ color: "#fff" }}>Fecha</TableCell>
                <TableCell sx={{ color: "#fff" }}>Monto</TableCell>
                <TableCell sx={{ color: "#fff" }}>Estado</TableCell>
                <TableCell sx={{ color: "#fff" }}>Archivos</TableCell>
                <TableCell sx={{ color: "#fff" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8}>Cargando…</TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow><TableCell colSpan={8}>Sin registros en este mes.</TableCell></TableRow>
              ) : (
                pageRows.map((v) => {
                  const checked = seleccion.includes(v.id);
                  const nombreTienda = `${v.user?.name || ""} ${v.user?.apellidos || ""}`.trim() || "Sin nombre";
                  const fecha = new Date(v.created_at);
                  const fechaLabel = `${fecha.getDate()} de ${monthsMx[fecha.getMonth()]} de ${fecha.getFullYear()}`;
                  return (
                    <TableRow key={v.id} hover selected={checked}>
                      <TableCell>
                        <Checkbox color="secondary" checked={checked} onChange={() => toggleSeleccion(v.id)} />
                      </TableCell>
                      <TableCell>{nombreTienda}</TableCell>
                      <TableCell>
                        <Chip size="small" label={v.tipo || "—"} />
                      </TableCell>
                      <TableCell>{fechaLabel}</TableCell>
                      <TableCell>{money(v.monto)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={v.status === "confirmado" ? "success" : v.status === "rechazada" ? "error" : "default"}
                          label={v.status || "Desconocido"}
                        />
                      </TableCell>
                      <TableCell>
                        {v.pdf_url && (
                          <IconButton component="a" href={v.pdf_url} target="_blank" rel="noopener noreferrer" size="small" title="PDF">
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        )}
                        {v.xml_url && (
                          <IconButton component="a" href={v.xml_url} target="_blank" rel="noopener noreferrer" size="small" title="XML">
                            <InsertDriveFileIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => abrirComprobante(v.comprobante)}
                        >
                          Ver comprobante
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Paginación */}
        <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
          <Pagination
            page={page}
            count={pageCount}
            onChange={(_, p) => setPage(p)}
            size="medium"
            color="primary"
          />
        </Stack>
      </Paper>

      {/* Modal Comprobante */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Comprobante</DialogTitle>
        <DialogContent dividers>
          {!comprobanteUrl ? (
            <Typography variant="body2">No hay comprobante.</Typography>
          ) : comprobanteUrl.toLowerCase().endsWith(".pdf") ? (
            <Box component="iframe" src={comprobanteUrl} width="100%" height={600} style={{ border: "none" }} title="Comprobante PDF" />
          ) : (
            <Box component="img" src={comprobanteUrl} alt="Comprobante" sx={{ width: "100%", height: "auto", objectFit: "contain" }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
