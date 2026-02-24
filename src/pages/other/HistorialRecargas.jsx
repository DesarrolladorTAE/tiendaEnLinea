import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import DatePicker from "react-datepicker";
import { format, isSameDay, isSameWeek, parseISO } from "date-fns";
import { FiDownload, FiPrinter, FiSend } from "react-icons/fi";
import "react-datepicker/dist/react-datepicker.css";

import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Divider,
  Stack,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";

const BLUE_GRADIENT =
  "linear-gradient(90deg, #00A8FF 0%, #007BFF 60%, #0056D2 100%)";

const thSx = {
  background: BLUE_GRADIENT,
  color: "#fff",
  fontWeight: 950,
  borderBottom: "1px solid rgba(255,255,255,0.18)",
  whiteSpace: "nowrap",
};

const fieldSx = {
  "& .MuiInputLabel-root": { color: "rgba(11,18,32,0.62)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    background: "rgba(2,6,23,0.02)",
    "& fieldset": { borderColor: "rgba(15,23,42,0.14)" },
    "&:hover fieldset": { borderColor: "rgba(0,123,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(0,123,255,0.60)" },
  },
};

const iconBtnSx = {
  borderRadius: 2,
  border: "1px solid rgba(15,23,42,0.12)",
  background: "rgba(2,6,23,0.02)",
  "&:hover": { background: "rgba(0,123,255,0.08)" },
};

const iconBtnSxPrimary = {
  ...iconBtnSx,
  border: "1px solid rgba(0,123,255,0.22)",
  background: "rgba(0,123,255,0.06)",
  "&:hover": { background: "rgba(0,123,255,0.12)" },
};

function moneyMXN(n) {
  const num = Number(n || 0);
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function statusChip(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("exito") || s.includes("success") || s === "confirmado")
    return {
      label: status,
      bg: "rgba(46,204,113,0.16)",
      bd: "rgba(46,204,113,0.35)",
      fg: "rgba(0,90,40,0.95)",
    };
  if (s.includes("pend") || s === "pendiente")
    return {
      label: status,
      bg: "rgba(255,193,7,0.18)",
      bd: "rgba(255,193,7,0.35)",
      fg: "rgba(120,80,0,0.95)",
    };
  if (s.includes("rech") || s === "rechazada")
    return {
      label: status,
      bg: "rgba(244,67,54,0.14)",
      bd: "rgba(244,67,54,0.35)",
      fg: "rgba(140,0,0,0.95)",
    };
  return {
    label: status || "—",
    bg: "rgba(2,6,23,0.06)",
    bd: "rgba(15,23,42,0.12)",
    fg: "rgba(11,18,32,0.85)",
  };
}

function buildYearsFrom2024ToNow() {
  const currentYear = new Date().getFullYear();
  const start = 2024;
  const years = [];
  for (let y = start; y <= currentYear; y++) years.push(y);
  return years;
}

const meses = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

const ranges = [
  { value: "hoy", label: "Hoy" },
  { value: "dia", label: "Día específico" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Por mes" },
  { value: "anio", label: "Por año" },
];

const HistorialRecargas = () => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [recargas, setRecargas] = useState([]);

  // ✅ Nuevo filtro: rango + controles
  const [rango, setRango] = useState("hoy");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const years = useMemo(() => buildYearsFrom2024ToNow(), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [recargaSeleccionada, setRecargaSeleccionada] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [modalVistaPrevia, setModalVistaPrevia] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");

  useEffect(() => {
    axios.get("/ver-recargas").then((res) => setRecargas(res.data));
  }, []);

  const recargasFiltradas = useMemo(() => {
    const hoy = new Date();
    return recargas.filter((r) => {
      const fecha = parseISO(r.created_at);
      switch (rango) {
        case "hoy":
          return isSameDay(fecha, hoy);
        case "dia":
          return isSameDay(fecha, fechaSeleccionada);
        case "semana":
          return isSameWeek(fecha, hoy);
        case "mes":
          return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
        case "anio":
          return fecha.getFullYear() === anioSeleccionado;
        default:
          return true;
      }
    });
  }, [recargas, rango, fechaSeleccionada, mesSeleccionado, anioSeleccionado]);

  const abrirModalEnvio = (recarga) => {
    setRecargaSeleccionada(recarga);
    setModalOpen(true);
    setTelefono("");
  };

  const enviarTicket = async () => {
    if (!telefono.match(/^\d{10}$/)) {
      setSnackbar({ open: true, message: "Número inválido (10 dígitos).", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `/recargas/${recargaSeleccionada.id}/enviar-ticket`,
        { telefono }
      );
      if (data.success) {
        setSnackbar({ open: true, message: "Ticket enviado por WhatsApp ✅", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "No se pudo enviar el ticket ❌", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error al enviar el ticket ❌", severity: "error" });
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

  // Cuando cambias de rango, ajustamos defaults “bonitos”
  const handleChangeRango = (val) => {
    setRango(val);
    const now = new Date();
    if (val === "mes") {
      setMesSeleccionado(now.getMonth());
      setAnioSeleccionado(now.getFullYear());
    }
    if (val === "anio") setAnioSeleccionado(now.getFullYear());
    if (val === "dia") setFechaSeleccionada(now);
  };

  return (
    <LayoutOne headerTop="visible">
      <SEO titleTemplate="Ventas" />
      <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Ventas", path: pathname }]} />

      <Box sx={{ background: "#fff", py: { xs: 3, md: 4 }, position: "relative", overflow: "hidden" }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(700px 320px at 10% 10%, rgba(0,123,255,0.10), transparent 60%)," +
              "radial-gradient(680px 320px at 90% 20%, rgba(0,168,255,0.08), transparent 60%)," +
              "radial-gradient(800px 340px at 50% 95%, rgba(0,86,210,0.06), transparent 65%)",
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1, pb: 8 }}>
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontWeight: 950,
                color: "#0b1220",
                fontSize: { xs: 22, md: 30 },
                letterSpacing: "-0.02em",
              }}
            >
              📇 Historial de Ventas
            </Typography>
            <Typography sx={{ color: "rgba(11,18,32,0.62)", mt: 0.4 }}>
              Selecciona un rango y filtra tus recargas. En móvil se muestran como tarjetas.
            </Typography>
          </Box>

          {/* FILTROS: “otra manera” */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              background: "#fff",
              border: "1px solid rgba(15,23,42,0.10)",
              boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
              mb: 2,
              position: "relative",
              overflow: "visible", // ✅ para que NO se recorte el DatePicker
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: -220,
                pointerEvents: "none",
                opacity: 0.7,
                background:
                  "radial-gradient(closest-side at 20% 30%, rgba(0,123,255,0.10), transparent 60%)," +
                  "radial-gradient(closest-side at 80% 35%, rgba(0,168,255,0.08), transparent 60%)",
                filter: "blur(2px)",
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                {/* Rango */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, color: "#0b1220", mb: 0.8 }}>
                    Rango
                  </Typography>
                  <Select
                    value={rango}
                    onChange={(e) => handleChangeRango(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      ...fieldSx,
                      "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], borderRadius: 2.6 },
                    }}
                  >
                    {ranges.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Controles dinámicos */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, color: "#0b1220", mb: 0.8 }}>
                    Ajustes
                  </Typography>

                  {rango === "dia" && (
                    <Box sx={{ width: "100%" }}>
                      <DatePicker
                        selected={fechaSeleccionada}
                        onChange={(date) => setFechaSeleccionada(date)}
                        withPortal={isMobile} // ✅ mejor UX móvil
                        popperPlacement="bottom-start"
                        popperProps={{ strategy: "fixed" }}
                        customInput={
                          <Button
                            variant="outlined"
                            fullWidth
                            sx={{
                              textTransform: "none",
                              fontWeight: 950,
                              borderRadius: 2.6,
                              py: 1,
                              borderColor: "rgba(0,123,255,0.25)",
                              color: "#0b1220",
                              background: "rgba(0,123,255,0.05)",
                              "&:hover": { background: "rgba(0,123,255,0.09)" },
                            }}
                          >
                            📅 Elegir día: {format(fechaSeleccionada, "yyyy-MM-dd")}
                          </Button>
                        }
                      />
                    </Box>
                  )}

                  {rango === "mes" && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <Select
                        value={mesSeleccionado}
                        onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                      >
                        {meses.map((m) => (
                          <MenuItem key={m.value} value={m.value}>
                            {m.label}
                          </MenuItem>
                        ))}
                      </Select>

                      <Select
                        value={anioSeleccionado}
                        onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                      >
                        {years.map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </Stack>
                  )}

                  {rango === "anio" && (
                    <Select
                      value={anioSeleccionado}
                      onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                      size="small"
                      fullWidth
                      sx={fieldSx}
                    >
                      {years.map((y) => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </Select>
                  )}

                  {(rango === "hoy" || rango === "semana") && (
                    <Box
                      sx={{
                        p: 1.4,
                        borderRadius: 2.6,
                        border: "1px solid rgba(0,123,255,0.20)",
                        background: "rgba(0,123,255,0.05)",
                        color: "rgba(11,18,32,0.80)",
                        fontWeight: 800,
                      }}
                    >
                      {rango === "hoy" ? "Mostrando ventas de hoy." : "Mostrando ventas de esta semana."}
                    </Box>
                  )}
                </Box>

                <Box sx={{ alignSelf: { xs: "stretch", md: "flex-end" } }}>
                  <Chip
                    label={`${recargasFiltradas.length} venta(s)`}
                    sx={{
                      fontWeight: 950,
                      borderRadius: 2.2,
                      background: "rgba(2,6,23,0.06)",
                      border: "1px solid rgba(15,23,42,0.10)",
                      height: 40,
                      width: { xs: "100%", md: "auto" },
                      justifyContent: "center",
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Paper>

          {/* LISTADO */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(15,23,42,0.10)",
              boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
            }}
          >
            {isMobile ? (
              <Box sx={{ p: 2 }}>
                <AnimatePresence>
                  {recargasFiltradas.length ? (
                    <Stack spacing={1.6}>
                      {recargasFiltradas.map((r) => {
                        const chip = statusChip(r.status);
                        const carrierName = r.producto?.carrier?.Nombre || "Sin compañía";
                        const carrierLogo = r.producto?.carrier?.Logotipo;
                        const codigo = r.producto?.Codigo || "N/A";
                        const tipo =
                          codigo.startsWith("TEL") || codigo.startsWith("MOV")
                            ? "Tiempo Aire"
                            : "Paquete";

                        return (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.25 }}
                          >
                            <Box
                              sx={{
                                borderRadius: 3,
                                border: "1px solid rgba(15,23,42,0.10)",
                                background:
                                  "linear-gradient(180deg, rgba(0,123,255,0.05), rgba(0,168,255,0.03))",
                                p: 2,
                                boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                <Box>
                                  <Typography sx={{ fontWeight: 950, color: "#0b1220" }}>
                                    {moneyMXN(r.monto)}
                                  </Typography>
                                  <Typography sx={{ color: "rgba(11,18,32,0.62)", fontSize: 13, mt: 0.3 }}>
                                    {format(parseISO(r.created_at), "yyyy-MM-dd HH:mm")}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={chip.label || "—"}
                                  sx={{
                                    fontWeight: 950,
                                    borderRadius: 2,
                                    background: chip.bg,
                                    border: `1px solid ${chip.bd}`,
                                    color: chip.fg,
                                  }}
                                />
                              </Stack>

                              <Divider sx={{ my: 1.3, borderColor: "rgba(15,23,42,0.10)" }} />

                              <Stack spacing={0.7}>
                                <Typography sx={{ color: "rgba(11,18,32,0.84)" }}>
                                  <b>Producto:</b> {codigo}
                                </Typography>
                                <Typography sx={{ color: "rgba(11,18,32,0.84)" }}>
                                  <b>Referencia:</b> {r.referencia || "—"}
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  {carrierLogo && (
                                    <img src={carrierLogo} alt={carrierName} style={{ height: 20, width: "auto" }} />
                                  )}
                                  <Typography sx={{ color: "rgba(11,18,32,0.78)" }}>
                                    <b>Compañía:</b> {carrierName}
                                  </Typography>
                                </Stack>

                                <Typography sx={{ color: "rgba(11,18,32,0.78)" }}>
                                  <b>Tipo:</b> {tipo}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={1} mt={1.6} flexWrap="wrap">
                                <Tooltip title="Vista previa">
                                  <IconButton onClick={() => verVistaPrevia(r.id)} sx={iconBtnSx}>
                                    <FiPrinter />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Descargar PDF">
                                  <IconButton onClick={() => descargarTicket(r.id)} sx={iconBtnSx}>
                                    <FiDownload />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Enviar WhatsApp">
                                  <IconButton onClick={() => abrirModalEnvio(r)} sx={iconBtnSxPrimary}>
                                    <FiSend />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Box>
                          </motion.div>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ color: "rgba(11,18,32,0.70)", fontWeight: 800 }}>
                        No hay recargas para este filtro.
                      </Typography>
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={thSx}>Fecha</TableCell>
                      <TableCell sx={thSx}>Producto</TableCell>
                      <TableCell sx={thSx}>Referencia</TableCell>
                      <TableCell sx={thSx}>Monto</TableCell>
                      <TableCell sx={thSx}>Compañía</TableCell>
                      <TableCell sx={thSx}>Tipo</TableCell>
                      <TableCell sx={thSx}>Estado</TableCell>
                      <TableCell sx={thSx}>Opciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {recargasFiltradas.map((r) => {
                      const chip = statusChip(r.status);
                      const carrierName = r.producto?.carrier?.Nombre || "Sin compañía";
                      const carrierLogo = r.producto?.carrier?.Logotipo;
                      const codigo = r.producto?.Codigo || "N/A";
                      const tipo =
                        codigo.startsWith("TEL") || codigo.startsWith("MOV")
                          ? "Tiempo Aire"
                          : "Paquete";

                      return (
                        <TableRow
                          key={r.id}
                          hover
                          sx={{
                            "&:hover td": { background: "rgba(0,123,255,0.03)" },
                            transition: "background .2s ease",
                          }}
                        >
                          <TableCell>{format(parseISO(r.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                          <TableCell>{codigo}</TableCell>
                          <TableCell>{r.referencia}</TableCell>
                          <TableCell>{moneyMXN(r.monto)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {carrierLogo && (
                                <img src={carrierLogo} alt={carrierName} style={{ height: 20, width: "auto" }} />
                              )}
                              <span>{carrierName}</span>
                            </Stack>
                          </TableCell>
                          <TableCell>{tipo}</TableCell>
                          <TableCell>
                            <Chip
                              label={chip.label || "—"}
                              size="small"
                              sx={{
                                fontWeight: 950,
                                borderRadius: 2,
                                background: chip.bg,
                                border: `1px solid ${chip.bd}`,
                                color: chip.fg,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Vista previa">
                                <IconButton onClick={() => verVistaPrevia(r.id)} sx={iconBtnSx}>
                                  <FiPrinter />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Descargar PDF">
                                <IconButton onClick={() => descargarTicket(r.id)} sx={iconBtnSx}>
                                  <FiDownload />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Enviar WhatsApp">
                                <IconButton onClick={() => abrirModalEnvio(r)} sx={iconBtnSxPrimary}>
                                  <FiSend />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Modal WhatsApp */}
          <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 950 }}>Enviar ticket por WhatsApp</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                fullWidth
                label="Teléfono (10 dígitos)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                margin="dense"
                type="tel"
                sx={fieldSx}
              />
              <Typography sx={{ mt: 1, color: "rgba(11,18,32,0.65)", fontSize: 13 }}>
                Asegúrate de incluir solo números (10 dígitos).
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setModalOpen(false)}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, color: "#0b1220" }}
              >
                Cancelar
              </Button>
              <Button
                onClick={enviarTicket}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2,
                  color: "#fff",
                  background: BLUE_GRADIENT,
                  boxShadow: "0 12px 25px rgba(0, 86, 210, 0.18)",
                  "&:hover": { filter: "brightness(1.05)" },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Enviar"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal vista previa */}
          <Dialog open={modalVistaPrevia} onClose={() => setModalVistaPrevia(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 950 }}>Vista previa del ticket</DialogTitle>
            <DialogContent dividers>
              {ticketBlobUrl && (
                <iframe
                  src={ticketBlobUrl}
                  title="Vista previa"
                  width="100%"
                  height="420px"
                  style={{ border: "none", borderRadius: 12 }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setModalVistaPrevia(false)}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, color: "#0b1220" }}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => document.querySelector("iframe")?.contentWindow?.print()}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2,
                  color: "#fff",
                  background: BLUE_GRADIENT,
                  boxShadow: "0 12px 25px rgba(0, 86, 210, 0.18)",
                  "&:hover": { filter: "brightness(1.05)" },
                }}
              >
                Imprimir
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </LayoutOne>
  );
};

export default withAuth(HistorialRecargas);