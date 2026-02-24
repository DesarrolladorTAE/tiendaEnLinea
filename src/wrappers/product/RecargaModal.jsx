import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
  Box
} from "@mui/material";
import { toast } from "react-toastify";
import axios from "../../axiosConfig";
import { useDispatch, useSelector } from "react-redux";
import { updateSaldo } from "../../store/slices/userSlice";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import PaymentIcon from "@mui/icons-material/Payment";

const RecargaModal = ({ open, onClose, producto, carrier }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const saldo = Number(user?.saldo) || 0;

  const [numero, setNumero] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [contactos, setContactos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [numeroCoincide, setNumeroCoincide] = useState(true);

  const resetForm = () => {
    setNumero("");
    setConfirmacion("");
    setNumeroCoincide(true);
    setProductoSeleccionado(null);
    setContactos([]);
  };

  useEffect(() => {
    if (open && producto) {
      setProductoSeleccionado(producto);
    }
  }, [open, producto]);

  useEffect(() => {
    if (open) {
      axios
        .get("/contacts")
        .then((res) => setContactos(res.data))
        .catch((err) => console.error("Error al obtener contactos", err));
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (numero.length === 10 && confirmacion.length === 10) {
      setNumeroCoincide(numero === confirmacion);
    }
  }, [numero, confirmacion]);

  const handleContactoSeleccionado = (e) => {
    const phone = e.target.value;
    setNumero(phone);
    setConfirmacion(phone);
    setNumeroCoincide(true);
  };

  const handleCerrar = () => {
    resetForm();
    onClose();
  };

  const handleRecarga = async () => {
    if (!productoSeleccionado) return;

    if (numero.length !== 10 || confirmacion.length !== 10) {
      return toast.error("Son 10 dígitos en ambos campos");
    }

    if (!numeroCoincide) {
      return toast.error("Los números no coinciden");
    }

    if (productoSeleccionado.price > saldo) {
      const mensaje =
        user?.role === "agent"
          ? "Saldo insuficiente. Solicita a tu administrador una recarga de saldo."
          : "Saldo insuficiente. Por favor, recarga tu saldo.";

      return toast.warning(mensaje);
    }

    setIsLoading(true);

    try {
      const res = await axios.post("/recargar", {
        producto: productoSeleccionado.id,
        referencia: numero,
      });

      const nuevaTransaccion = res.data.transaccion;
      const nuevoSaldo = saldo - productoSeleccionado.price;

      dispatch(updateSaldo(nuevoSaldo));
      localStorage.setItem("user", JSON.stringify({ ...user, saldo: nuevoSaldo }));

      toast.success("✅ Recarga exitosa");
      handleCerrar();
    } catch (err) {
      console.error(err);
      const mensajeBackend =
        err.response?.data?.detalle?.message ||
        err.response?.data?.message ||
        "Error desconocido";

      toast.error("❌ " + mensajeBackend);
      handleCerrar();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleCerrar} fullWidth maxWidth="sm">
      <DialogTitle>
        🔥 Populares 🔥{" "}
        <span style={{ color: "red", fontWeight: "bold" }}>
          {carrier?.Categoria || "Producto"}
        </span>{" "}
        {carrier?.Nombre && `- ${carrier.Nombre}`}
      </DialogTitle>

      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle2">
            Saldo disponible: ${saldo.toFixed(2)}
          </Typography>
        </Box>

        <TextField
          select
          label="Seleccionar contacto"
          fullWidth
          onChange={handleContactoSeleccionado}
          sx={{ mb: 2 }}
        >
          {contactos.map((c) => (
            <MenuItem key={c.id} value={c.phone}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Número"
          fullWidth
          autoComplete="off"
          value={numero}
          onChange={(e) =>
            setNumero(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          sx={{ mb: 2 }}
          inputProps={{
            inputMode: "numeric",
            pattern: "[0-9]*",
            autoComplete: "off",
          }}
          InputProps={{
            startAdornment: <LocalPhoneIcon sx={{ mr: 1 }} />,
          }}
        />

        <TextField
          label="Confirmar número"
          type="password"
          fullWidth
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) =>
            setConfirmacion(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          sx={{ mb: 1 }}
          error={!numeroCoincide}
          helperText={!numeroCoincide && "Los números no coinciden"}
          inputProps={{
            inputMode: "numeric",
            pattern: "[0-9]*",
            autoComplete: "new-password",
          }}
        />

        {productoSeleccionado && (
          <Box mt={2} p={2} bgcolor="#f9f9f9" borderRadius={2}>
            <Typography variant="body2">
              <strong>💰 Costo:</strong> ${productoSeleccionado.price}
            </Typography>
            <Typography variant="body2">
              <strong>⏳ Vigencia:</strong> {productoSeleccionado.vigencia}
            </Typography>
            <Typography variant="body2">
              <strong>💵 Comisión:</strong> ${productoSeleccionado.comision}.00 MXN
            </Typography>
            <Typography variant="body2">
              <strong>ℹ️ Descripción:</strong> {productoSeleccionado.descripcion}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCerrar} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRecarga}
          disabled={isLoading}
          startIcon={<PaymentIcon />}
        >
          {isLoading ? <CircularProgress size={20} /> : "Enviar Recarga"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecargaModal;
