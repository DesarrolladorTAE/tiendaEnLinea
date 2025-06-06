import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import PaymentIcon from "@mui/icons-material/Payment";
import ContactsIcon from "@mui/icons-material/Contacts";
import LockIcon from "@mui/icons-material/Lock";
import { useDispatch, useSelector } from "react-redux";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import { updateSaldo } from "../../store/slices/userSlice";

const ModalCarrier = ({ isOpen, onClose, carrier, productos }) => {
  const [numero, setNumero] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [contactos, setContactos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
  const saldo = Number(user?.saldo || 0);
  const isBajoSaldo = saldo < 100;

  useEffect(() => {
    if (isOpen) {
      axios
        .get("/contacts")
        .then((res) => setContactos(res.data))
        .catch(() => toast.error("Error al cargar contactos"));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setNumero("");
      setConfirmacion("");
      setProductoSeleccionado("");
    }
  }, [isOpen]);

  const handleRecarga = async () => {
    const producto = productos.find(p => p.proID === parseInt(productoSeleccionado));
    if (!producto) return toast.warning("Selecciona un producto");
    if (numero.length !== 10 || confirmacion.length !== 10) return toast.error("Son 10 dígitos");
    if (numero !== confirmacion) return toast.error("Los números no coinciden");
    if (producto.Monto > saldo) return toast.error("Saldo insuficiente");

    setIsLoading(true);
    try {
      const res = await axios.post("/recargar", {
        producto: producto.Codigo,
        referencia: numero,
      });

      const nuevoSaldo = saldo - producto.Monto;
      dispatch(updateSaldo(nuevoSaldo));
      localStorage.setItem("user", JSON.stringify({ ...user, saldo: nuevoSaldo }));
      toast.success(`✅ Recarga exitosa\nID: ${res.data.transaccion.transID}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error en la recarga");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Recarga a {carrier?.Nombre}
        <Box component="img" src={carrier?.Logotipo} alt={carrier?.Nombre} sx={{ height: 40, float: "right" }} />
      </DialogTitle>

      <DialogContent dividers>
        <Typography
          variant="body2"
          color={isBajoSaldo ? "error" : "primary"}
          gutterBottom
        >
          Saldo Disponible: ${saldo.toFixed(2)}
        </Typography>

        <Grid container spacing={2}>
          {/* Monto */}
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Monto"
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              InputProps={{
                startAdornment: <PaymentIcon sx={{ mr: 1 }} />,
                sx: { height: 56 },
              }}
            >
              {productos
                .filter((p) => p.Carrier === carrier.Nombre)
                .sort((a, b) => a.Monto - b.Monto)
                .map((p) => (
                  <MenuItem key={p.proID} value={p.proID}>
                    ${p.Monto}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

          {/* Contacto */}
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Contacto"
              value=""
              onChange={(e) => {
                setNumero(e.target.value);
                setConfirmacion(e.target.value);
              }}
              InputProps={{
                startAdornment: <ContactsIcon sx={{ mr: 1 }} />,
                sx: { height: 56 },
              }}
            >
              {contactos.map((c) => (
                <MenuItem key={c.id} value={c.phone}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Número */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Número"
              fullWidth
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 10))}
              InputProps={{
                startAdornment: <LocalPhoneIcon sx={{ mr: 1 }} />,
                sx: { height: 56 },
              }}
              error={numero.length > 0 && numero.length < 10}
              helperText={numero.length > 0 && numero.length < 10 ? "Debe tener 10 dígitos" : ""}
            />
          </Grid>

          {/* Confirmar Número */}
          <Grid item xs={12} md={3}>
            <TextField
              type="password"
              label="Confirmar Número"
              fullWidth
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value.replace(/\D/g, "").slice(0, 10))}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1 }} />,
                sx: { height: 56 },
              }}
              error={numero !== confirmacion && confirmacion.length === 10}
              helperText={numero !== confirmacion && confirmacion.length === 10 ? "Los números no coinciden" : ""}
            />
          </Grid>
        </Grid>

        {productoSeleccionado && (
          <Box mt={3} p={2} bgcolor="#f9f9f9" borderRadius={2}>
            <Typography variant="body2">
              <strong>💰 Costo:</strong> ${productos.find(p => p.proID === parseInt(productoSeleccionado)).Monto}
            </Typography>
            <Typography variant="body2">
              <strong>💵 Comisión:</strong> ${productos.find(p => p.proID === parseInt(productoSeleccionado)).suscrip}.00 MXN
            </Typography>
            <Typography variant="body2">
              <strong>⏳ Vigencia:</strong> {productos.find(p => p.proID === parseInt(productoSeleccionado)).Vigencia}
            </Typography>
            <Typography variant="body2">
              <strong>ℹ️ Descripción:</strong> {productos.find(p => p.proID === parseInt(productoSeleccionado)).Descripcion}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleRecarga}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? "Procesando..." : "Enviar Recarga"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalCarrier;
