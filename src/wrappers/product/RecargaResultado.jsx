import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Chip,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import PrintIcon from "@mui/icons-material/Print";
import SmsIcon from "@mui/icons-material/Sms";
import GetAppIcon from "@mui/icons-material/GetApp";
import ReplayIcon from "@mui/icons-material/Replay";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import axios from "../../axiosConfig";
import { motion } from "framer-motion";

const BLUE_GRADIENT =
  "linear-gradient(90deg, #00A8FF 0%, #007BFF 55%, #0056D2 100%)";

const getApiErrorMessage = (err) => {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  if (data?.errors && typeof data.errors === "object") {
    const msgs = Object.values(data.errors).flat().filter(Boolean);
    if (msgs.length) return msgs.join("\n");
  }
  return data?.message || data?.error || err?.message || "Ocurrió un error inesperado.";
};

const RecargaResultado = ({ resultado, onClose, onReiniciar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const transID = resultado?.transaccion?.transID || "—";
  const numero = resultado?.transaccion?.referencia || "";
  const recargaId = resultado?.transaccion?.id;

  const [modalOpen, setModalOpen] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [modalVistaPrevia, setModalVistaPrevia] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");
  const iframeRef = useRef(null);

  const closeSnack = () => setSnackbar((p) => ({ ...p, open: false }));

  const safeRecargaId = useMemo(() => {
    return recargaId ?? null;
  }, [recargaId]);

  // ✅ Limpieza de URL blob para evitar memory leaks
  useEffect(() => {
    return () => {
      if (ticketBlobUrl) URL.revokeObjectURL(ticketBlobUrl);
    };
  }, [ticketBlobUrl]);

  const openPreviewWithTicket = async () => {
    if (!safeRecargaId) {
      setSnackbar({ open: true, message: "No se encontró el ID de la recarga.", severity: "error" });
      return;
    }

    try {
      setLoadingTicket(true);

      const response = await axios.get(`/descargar-ticket/${safeRecargaId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });

      if (ticketBlobUrl) URL.revokeObjectURL(ticketBlobUrl);
      const url = URL.createObjectURL(blob);

      setTicketBlobUrl(url);
      setModalVistaPrevia(true);
    } catch (err) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(err) || "Error cargando ticket",
        severity: "error",
      });
    } finally {
      setLoadingTicket(false);
    }
  };

  const enviarTicket = async (numeroDestino) => {
    if (!safeRecargaId) {
      setSnackbar({ open: true, message: "No se encontró el ID de la recarga.", severity: "error" });
      return;
    }

    const clean = String(numeroDestino || "").replace(/\D/g, "").slice(0, 10);

    if (!clean.match(/^\d{10}$/)) {
      setSnackbar({ open: true, message: "Número inválido (10 dígitos)", severity: "error" });
      return;
    }

    setLoadingSend(true);
    try {
      const { data } = await axios.post(`/recargas/${safeRecargaId}/enviar-ticket`, {
        telefono: clean,
      });

      if (data?.success) {
        setSnackbar({
          open: true,
          message: `Ticket enviado por WhatsApp ✅ (${clean})`,
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: data?.message || "No se pudo enviar el ticket",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(err) || "Error al enviar ticket",
        severity: "error",
      });
    } finally {
      setLoadingSend(false);
      setModalOpen(false);
    }
  };

  const descargarTicket = async () => {
    if (!safeRecargaId) {
      setSnackbar({ open: true, message: "No se encontró el ID de la recarga.", severity: "error" });
      return;
    }

    try {
      setLoadingTicket(true);

      const response = await axios.get(`/descargar-ticket/${safeRecargaId}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${safeRecargaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: "Ticket descargado ✅", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: getApiErrorMessage(err) || "Error al descargar",
        severity: "error",
      });
    } finally {
      setLoadingTicket(false);
    }
  };

  const printPreview = () => {
    try {
      iframeRef.current?.contentWindow?.print?.();
    } catch {
      setSnackbar({ open: true, message: "No se pudo imprimir la vista previa.", severity: "error" });
    }
  };

  const closePreview = () => {
    setModalVistaPrevia(false);
    // opcional: limpiar url para ahorrar memoria
    // if (ticketBlobUrl) URL.revokeObjectURL(ticketBlobUrl);
    // setTicketBlobUrl("");
  };

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        background: "#fff",
      }}
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        {/* Card principal */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid rgba(15,23,42,0.10)",
            boxShadow: "0 22px 55px rgba(2,6,23,0.10)",
            overflow: "hidden",
            position: "relative",
            background: "#fff",
          }}
        >
          {/* glow */}
          <Box
            sx={{
              position: "absolute",
              inset: -220,
              pointerEvents: "none",
              opacity: 0.85,
              background:
                "radial-gradient(closest-side at 25% 25%, rgba(0,123,255,0.16), transparent 60%)," +
                "radial-gradient(closest-side at 80% 35%, rgba(0,168,255,0.12), transparent 60%)," +
                "radial-gradient(closest-side at 50% 95%, rgba(0,86,210,0.10), transparent 70%)",
              filter: "blur(2px)",
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1, p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 950,
                    color: "#0b1220",
                    fontSize: { xs: 18, md: 20 },
                    lineHeight: 1.1,
                  }}
                >
                  ✅ ¡Recarga exitosa!
                </Typography>
                <Typography sx={{ mt: 0.6, color: "rgba(11,18,32,0.62)", fontWeight: 800 }}>
                  Tu ticket ya está disponible para imprimir, descargar o enviar por WhatsApp.
                </Typography>
              </Box>

              <Chip
                label="Completado"
                sx={{
                  fontWeight: 950,
                  borderRadius: 999,
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.22)",
                  color: "#166534",
                }}
              />
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(15,23,42,0.08)" }} />

            {/* Datos */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.2,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  border: "1px solid rgba(15,23,42,0.10)",
                  background: "rgba(2,6,23,0.02)",
                }}
              >
                <Typography sx={{ fontSize: 12.5, color: "rgba(11,18,32,0.62)", fontWeight: 900 }}>
                  ID transacción
                </Typography>
                <Typography sx={{ mt: 0.3, fontWeight: 950, color: "#0b1220" }}>
                  {transID}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  border: "1px solid rgba(15,23,42,0.10)",
                  background: "rgba(2,6,23,0.02)",
                }}
              >
                <Typography sx={{ fontSize: 12.5, color: "rgba(11,18,32,0.62)", fontWeight: 900 }}>
                  Número recargado
                </Typography>
                <Typography sx={{ mt: 0.3, fontWeight: 950, color: "#0b1220" }}>
                  {numero || "—"}
                </Typography>
              </Paper>
            </Box>

            {/* Acciones premium (grid responsive) */}
            <Box
              sx={{
                mt: 2.4,
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                gap: 1.2,
              }}
            >
              <Button
                variant="outlined"
                onClick={openPreviewWithTicket}
                disabled={loadingTicket}
                startIcon={loadingTicket ? <CircularProgress size={18} /> : <PrintIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2.5,
                  borderColor: "rgba(15,23,42,0.18)",
                  color: "#0b1220",
                  background: "rgba(2,6,23,0.02)",
                  "&:hover": { background: "rgba(2,6,23,0.06)" },
                }}
              >
                Imprimir
              </Button>

              <Button
                variant="outlined"
                onClick={descargarTicket}
                disabled={loadingTicket}
                startIcon={loadingTicket ? <CircularProgress size={18} /> : <GetAppIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2.5,
                  borderColor: "rgba(15,23,42,0.18)",
                  color: "#0b1220",
                  background: "rgba(2,6,23,0.02)",
                  "&:hover": { background: "rgba(2,6,23,0.06)" },
                }}
              >
                Descargar
              </Button>

              <Button
                variant="outlined"
                onClick={() => setModalOpen(true)}
                startIcon={<SmsIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2.5,
                  borderColor: "rgba(15,23,42,0.18)",
                  color: "#0b1220",
                  background: "rgba(2,6,23,0.02)",
                  "&:hover": { background: "rgba(2,6,23,0.06)" },
                }}
              >
                Otro número
              </Button>

              <Button
                variant="contained"
                onClick={() => enviarTicket(numero)}
                disabled={loadingSend || !numero}
                startIcon={loadingSend ? <CircularProgress size={18} /> : <WhatsAppIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 2.5,
                  background: BLUE_GRADIENT,
                  boxShadow: "0 14px 28px rgba(0,86,210,0.18)",
                  "&:hover": { filter: "brightness(1.05)", transform: "translateY(-1px)" },
                  "&.Mui-disabled": { opacity: 0.7, color: "#fff" },
                }}
              >
                Enviar al recargado
              </Button>
            </Box>

            {/* Footer acciones */}
            <Box
              sx={{
                mt: 2.8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                variant="contained"
                onClick={onClose}
                startIcon={<ReplayIcon />}
                fullWidth={isMobile}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  background: BLUE_GRADIENT,
                  boxShadow: "0 14px 28px rgba(0,86,210,0.18)",
                  "&:hover": { filter: "brightness(1.05)", transform: "translateY(-1px)" },
                }}
              >
                Salir
              </Button>

              <Button
                variant="text"
                onClick={onReiniciar}
                fullWidth={isMobile}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  color: "#0b5ed7",
                }}
              >
                Hacer otra recarga
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Modal WhatsApp otro número (premium) */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: "1px solid rgba(15,23,42,0.10)",
            boxShadow: "0 26px 70px rgba(2,6,23,0.18)",
            overflow: "hidden",
            background: "#fff",
          },
        }}
      >
        <DialogTitle sx={{ p: 2.2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <Box>
              <Typography sx={{ fontWeight: 950, color: "#0b1220" }}>Enviar a otro número</Typography>
              <Typography sx={{ color: "rgba(11,18,32,0.62)", fontWeight: 800, fontSize: 13 }}>
                Ingresa un teléfono de 10 dígitos.
              </Typography>
            </Box>

            <IconButton
              onClick={() => setModalOpen(false)}
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(15,23,42,0.10)",
                background: "rgba(2,6,23,0.02)",
                "&:hover": { background: "rgba(2,6,23,0.06)" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2.2, pb: 1.5 }}>
          <TextField
            autoFocus
            fullWidth
            label="Teléfono (10 dígitos)"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
            margin="dense"
            type="tel"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            sx={{
              "& .MuiInputLabel-root": { color: "rgba(11,18,32,0.62)", fontWeight: 800 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.2,
                background: "rgba(2,6,23,0.02)",
                "& fieldset": { borderColor: "rgba(15,23,42,0.14)" },
                "&:hover fieldset": { borderColor: "rgba(0,123,255,0.35)" },
                "&.Mui-focused fieldset": { borderColor: "rgba(0,123,255,0.60)" },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2.2, pb: 2.2 }}>
          <Button
            onClick={() => setModalOpen(false)}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              borderColor: "rgba(15,23,42,0.18)",
              color: "#0b1220",
              background: "rgba(2,6,23,0.02)",
              "&:hover": { background: "rgba(2,6,23,0.06)" },
            }}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => enviarTicket(telefono)}
            variant="contained"
            disabled={loadingSend}
            startIcon={loadingSend ? <CircularProgress size={18} /> : <WhatsAppIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              background: BLUE_GRADIENT,
              boxShadow: "0 14px 28px rgba(0,86,210,0.18)",
              "&:hover": { filter: "brightness(1.05)", transform: "translateY(-1px)" },
              "&.Mui-disabled": { opacity: 0.75, color: "#fff" },
            }}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vista previa premium */}
      <Dialog
        open={modalVistaPrevia}
        onClose={closePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            overflow: "hidden",
            border: "1px solid rgba(15,23,42,0.10)",
            boxShadow: "0 26px 70px rgba(2,6,23,0.18)",
            background: "#fff",
          },
        }}
      >
        <DialogTitle sx={{ p: 2.2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <Box>
              <Typography sx={{ fontWeight: 950, color: "#0b1220" }}>Vista previa del ticket</Typography>
              <Typography sx={{ color: "rgba(11,18,32,0.62)", fontWeight: 800, fontSize: 13 }}>
                Puedes imprimir desde aquí.
              </Typography>
            </Box>

            <IconButton
              onClick={closePreview}
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(15,23,42,0.10)",
                background: "rgba(2,6,23,0.02)",
                "&:hover": { background: "rgba(2,6,23,0.06)" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, background: "#fff" }}>
          {ticketBlobUrl ? (
            <iframe
              ref={iframeRef}
              src={ticketBlobUrl}
              title="Vista previa"
              width="100%"
              height={isMobile ? "520px" : "620px"}
              style={{ border: "none", display: "block" }}
            />
          ) : (
            <Box p={3}>
              <Typography sx={{ fontWeight: 900, color: "rgba(11,18,32,0.70)" }}>
                No hay ticket para mostrar.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.2, py: 2 }}>
          <Button
            onClick={closePreview}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              borderColor: "rgba(15,23,42,0.18)",
              color: "#0b1220",
              background: "rgba(2,6,23,0.02)",
              "&:hover": { background: "rgba(2,6,23,0.06)" },
            }}
          >
            Cerrar
          </Button>

          <Button
            onClick={printPreview}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              background: BLUE_GRADIENT,
              boxShadow: "0 14px 28px rgba(0,86,210,0.18)",
              "&:hover": { filter: "brightness(1.05)", transform: "translateY(-1px)" },
            }}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnack}>
        <Alert onClose={closeSnack} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecargaResultado;