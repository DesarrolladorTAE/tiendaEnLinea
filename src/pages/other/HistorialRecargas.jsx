import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import DatePicker from "react-datepicker";
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO } from "date-fns";
import { FiDownload, FiPrinter, FiSend } from "react-icons/fi";
import "react-datepicker/dist/react-datepicker.css";
import {
  Container, Typography, Box, Paper, Button, Select, MenuItem, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Snackbar, Alert
} from "@mui/material";

const HistorialRecargas = () => {
  const { pathname } = useLocation();
  const [recargas, setRecargas] = useState([]);
  const [filtro, setFiltro] = useState("hoy");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [recargaSeleccionada, setRecargaSeleccionada] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [modalVistaPrevia, setModalVistaPrevia] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");

  useEffect(() => {
    axios.get("/ver-recargas").then((res) => setRecargas(res.data));
  }, []);

  const hoy = new Date();

  const recargasFiltradas = recargas.filter((r) => {
    const fecha = parseISO(r.created_at);
    switch (filtro) {
      case "hoy":
        return isSameDay(fecha, hoy);
      case "dia":
        return isSameDay(fecha, fechaSeleccionada);
      case "semana":
        return isSameWeek(fecha, hoy);
      case "mes":
        return (
          fecha.getMonth() === mesSeleccionado &&
          fecha.getFullYear() === anioSeleccionado
        );
      case "año":
        return fecha.getFullYear() === anioSeleccionado;
      default:
        return true;
    }
  });

  const abrirModalEnvio = (recarga) => {
    setRecargaSeleccionada(recarga);
    setModalOpen(true);
    setTelefono("");
  };

  const enviarTicket = async () => {
    if (!telefono.match(/^\d{10}$/)) {
      setSnackbar({ open: true, message: "Número inválido", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`/recargas/${recargaSeleccionada.id}/enviar-ticket`, { telefono });
      if (data.success) {
        setSnackbar({ open: true, message: "Ticket enviado por WhatsApp", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "No se pudo enviar el ticket", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error al enviar el ticket", severity: "error" });
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  const verVistaPrevia = async (recargaId) => {
    try {
      const response = await axios.get(`/descargar-ticket/${recargaId}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setTicketBlobUrl(url);
      setModalVistaPrevia(true);
    } catch (err) {
      console.error("Error cargando vista previa:", err);
      setSnackbar({ open: true, message: "Error cargando vista previa", severity: "error" });
    }
  };

  const descargarTicket = async (recargaId) => {
    try {
      const response = await axios.get(`/descargar-ticket/${recargaId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${recargaId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Error al descargar:", err);
      setSnackbar({ open: true, message: "Error al descargar el ticket", severity: "error" });
    }
  };

  return (
    <LayoutOne headerTop="visible">
      <SEO titleTemplate="Ventas" />
      <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Ventas", path: pathname }]} />
      <Container sx={{ mt: 4, pb: 10 }}>
        <Typography variant="h4" gutterBottom>📇 Historial de Ventas</Typography>

        {/* Filtros */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 2 }}>
          {["hoy", "dia", "semana", "mes", "año"].map((item) => (
            <Button key={item} variant={filtro === item ? "contained" : "outlined"} onClick={() => setFiltro(item)} color="primary">
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Button>
          ))}

          {filtro === "dia" && (
            <DatePicker selected={fechaSeleccionada} onChange={(date) => setFechaSeleccionada(date)} customInput={<Button variant="outlined">📅 Elegir Día</Button>} />
          )}

          {filtro === "mes" && (
            <>
              <Select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} size="small" sx={{ minWidth: 120 }}>
                {[...Array(12)].map((_, i) => (
                  <MenuItem key={i} value={i}>{new Date(0, i).toLocaleString("default", { month: "long" })}</MenuItem>
                ))}
              </Select>
              <Select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} size="small" sx={{ minWidth: 100 }}>
                {[2023, 2024, 2025, 2026].map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </Select>
            </>
          )}

          {filtro === "año" && (
            <Select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} size="small" sx={{ minWidth: 100 }}>
              {[2023, 2024, 2025, 2026].map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          )}
        </Box>

        {/* Tabla */}
        <Paper elevation={3} sx={{ overflowX: "auto" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#0d1c71' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>Fecha</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Referencia</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Monto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Compañía</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Tipo</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Estado</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Opciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recargasFiltradas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(parseISO(r.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell>{r.producto?.Codigo || "N/A"}</TableCell>
                    <TableCell>{r.referencia}</TableCell>
                    <TableCell>${parseFloat(r.monto).toFixed(2)}</TableCell>
                    <TableCell>
                      {r.producto?.carrier?.Logotipo && <img src={r.producto.carrier.Logotipo} alt={r.producto.carrier.Nombre} style={{ height: 20, marginRight: 5 }} />}
                      {r.producto?.carrier?.Nombre || "Sin compañía"}
                    </TableCell>
                    <TableCell>{r.producto?.Codigo?.startsWith("TEL") || r.producto?.Codigo?.startsWith("MOV") ? "Tiempo Aire" : "Paquete"}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>
                      <IconButton title="Vista previa" onClick={() => verVistaPrevia(r.id)}><FiPrinter /></IconButton>
                      <IconButton title="Descargar PDF" onClick={() => descargarTicket(r.id)}><FiDownload /></IconButton>
                      <IconButton title="Enviar WhatsApp" onClick={() => abrirModalEnvio(r)}><FiSend /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Mensaje de no resultados */}
        {recargasFiltradas.length === 0 && (
          <Typography sx={{ mt: 2 }} color="text.secondary">
            No hay recargas para este filtro.
          </Typography>
        )}

        {/* Modal WhatsApp */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
          <DialogTitle>Enviar ticket por WhatsApp</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth label="Teléfono (10 dígitos)" value={telefono} onChange={(e) => setTelefono(e.target.value)} margin="dense" type="tel" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)} color="secondary">Cancelar</Button>
            <Button onClick={enviarTicket} color="primary" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Enviar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal vista previa */}
        <Dialog open={modalVistaPrevia} onClose={() => setModalVistaPrevia(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Vista previa del ticket</DialogTitle>
          <DialogContent dividers>
            {ticketBlobUrl && <iframe src={ticketBlobUrl} title="Vista previa" width="100%" height="400px" style={{ border: 'none' }} />}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalVistaPrevia(false)} color="secondary">Cerrar</Button>
            <Button onClick={() => document.querySelector('iframe')?.contentWindow?.print()} color="primary">Imprimir</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LayoutOne>
  );
};

export default withAuth(HistorialRecargas);
