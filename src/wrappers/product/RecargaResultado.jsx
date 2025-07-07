import React, { useState } from "react";
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
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SmsIcon from "@mui/icons-material/Sms";
import GetAppIcon from "@mui/icons-material/GetApp";
import ReplayIcon from "@mui/icons-material/Replay";
import axios from "../../axiosConfig";

const RecargaResultado = ({ resultado, onClose, onReiniciar }) => {
  const transID = resultado?.transaccion?.transID;
  const numero = resultado?.transaccion?.referencia;
  const recargaId = resultado?.transaccion?.id;

  const [modalOpen, setModalOpen] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalVistaPrevia, setModalVistaPrevia] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");

  const imprimirTicket = async () => {
    try {
      const response = await axios.get(`/descargar-ticket/${recargaId}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setTicketBlobUrl(url);
      setModalVistaPrevia(true);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error cargando ticket",
        severity: "error",
      });
    }
  };

  const enviarTicket = async (numeroDestino) => {
    if (!numeroDestino.match(/^\d{10}$/)) {
      return setSnackbar({
        open: true,
        message: "Número inválido",
        severity: "error",
      });
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `/recargas/${recargaId}/enviar-ticket`,
        { telefono: numeroDestino }
      );
      if (data.success) {
        setSnackbar({
          open: true,
          message: "Enviado por WhatsApp",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "No se pudo enviar el ticket",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error al enviar ticket",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  const descargarTicket = async () => {
    try {
      const response = await axios.get(`/descargar-ticket/${recargaId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${recargaId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error al descargar",
        severity: "error",
      });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom textAlign="center">
        ✅ ¡Recarga exitosa!
      </Typography>

      <Box textAlign="center" mb={2}>
        <Typography>
          ID transacción: <strong>{transID}</strong>
        </Typography>
        <Typography>
          Número recargado: <strong>{numero}</strong>
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        justifyContent="center"
      >
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={imprimirTicket}
        >
          Imprimir
        </Button>

        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={descargarTicket}
        >
          Descargar
        </Button>

        <Button
          variant="outlined"
          startIcon={<SmsIcon />}
          onClick={() => setModalOpen(true)}
        >
          Enviar a otro número
        </Button>

        <Button
          variant="outlined"
          color="success"
          startIcon={<SmsIcon />}
          onClick={() => enviarTicket(numero)}
        >
          Enviar al recargado
        </Button>
      </Stack>

      <Box textAlign="center" mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          startIcon={<ReplayIcon />}
        >
          Salir
        </Button>
        <Button sx={{ ml: 2 }} variant="text" onClick={onReiniciar}>
          Hacer otra recarga
        </Button>
      </Box>

      {/* Modal WhatsApp otro número */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Enviar a otro número</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Teléfono (10 dígitos)"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            margin="dense"
            type="tel"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button
            onClick={() => enviarTicket(telefono)}
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal vista previa */}
      <Dialog
        open={modalVistaPrevia}
        onClose={() => setModalVistaPrevia(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vista previa del ticket</DialogTitle>
        <DialogContent dividers>
          {ticketBlobUrl && (
            <iframe
              src={ticketBlobUrl}
              title="Vista previa"
              width="100%"
              height="400px"
              style={{ border: "none" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalVistaPrevia(false)} color="secondary">
            Cerrar
          </Button>
          <Button
            onClick={() =>
              document.querySelector("iframe")?.contentWindow?.print()
            }
            color="primary"
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecargaResultado;
