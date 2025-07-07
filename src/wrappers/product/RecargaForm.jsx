import React, { useState, useEffect } from "react";
import {
  DialogContent,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import ContactsIcon from "@mui/icons-material/Contacts";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useSelector, useDispatch } from "react-redux";
import { updateSaldo } from "../../store/slices/userSlice";
import axios from "../../axiosConfig";
import useMediaQuery from "@mui/material/useMediaQuery";
import Collapse from "@mui/material/Collapse";
import { useTheme } from "@mui/material/styles";

const RecargaForm = ({ carrier, productos, onNext }) => {
  const [numero, setNumero] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [contactos, setContactos] = useState([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(""); // ID del contacto seleccionado
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [showDetails, setShowDetails] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const saldo = Number(user?.saldo || 0);

  useEffect(() => {
    axios.get("/contacts").then((res) => setContactos(res.data));
  }, []);

  const producto = productos.find(
    (p) => p.proID === parseInt(productoSeleccionado)
  );

  const handleSubmit = () => {
    if (!producto) return;
    setLoading(true);

    onNext(
      {
        producto,
        numero,
        saldo,
      },
      async ({ producto, numero }) => {
        const res = await axios.post("/recargar", {
          producto: producto.Codigo,
          referencia: numero,
        });

        const nuevoSaldo = saldo - producto.Monto;
        dispatch(updateSaldo(nuevoSaldo));
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, saldo: nuevoSaldo })
        );
        return res.data;
      }
    );
  };

  const isDisabled =
    !productoSeleccionado ||
    numero.length !== 10 ||
    confirmacion.length !== 10 ||
    numero !== confirmacion;

  return (
    <DialogContent dividers sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Typography
        variant="subtitle2"
        color={saldo < 100 ? "error" : "primary"}
        fontWeight="bold"
        mb={2}
      >
        Saldo Disponible: ${saldo.toFixed(2)}
      </Typography>

      <Grid container spacing={3}>
        {/* Primera columna */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Monto o Paquete"
            value={productoSeleccionado}
            onChange={(e) => setProductoSeleccionado(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PaymentIcon />
                </InputAdornment>
              ),
              sx: { height: 56 }, // <- aquí se corrige la altura
            }}
            SelectProps={{
              displayEmpty: true,
            }}
            sx={{ minHeight: 56 }}
            variant="outlined"
          >
            {productos
              .filter((p) => p.Carrier === carrier.Nombre)
              .sort((a, b) => a.Monto - b.Monto)
              .map((p) => (
                <MenuItem key={p.proID} value={p.proID}>
                  {p.Nombre && p.Nombre !== "EMPTY" ? p.Nombre : `$${p.Monto}`}
                </MenuItem>
              ))}
          </TextField>

          <Box mt={3}>
            <TextField
              select
              fullWidth
              label="Seleccionar contacto"
              value={contactoSeleccionado}
              onChange={(e) => {
                const id = e.target.value;
                const contacto = contactos.find((c) => c.id === id);
                if (contacto) {
                  setContactoSeleccionado(id);
                  setNumero(contacto.phone);
                  setConfirmacion(contacto.phone);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ContactsIcon />
                  </InputAdornment>
                ),
                sx: { height: 56 }, // <- aquí se corrige la altura
              }}
              SelectProps={{
                displayEmpty: true,
              }}
              sx={{ minHeight: 56 }}
              variant="outlined"
            >
              <MenuItem value="">Selecciona un contacto</MenuItem>
              {contactos.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Grid>

        {/* Segunda columna */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Número a recargar"
            fullWidth
            value={numero}
            onChange={(e) =>
              setNumero(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            error={numero.length > 0 && numero.length < 10}
            helperText={
              numero.length > 0 && numero.length < 10
                ? "Debe tener 10 dígitos"
                : ""
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalPhoneIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />

          <Box mt={3}>
            <TextField
              type={showPass ? "text" : "password"}
              label="Confirmar número"
              fullWidth
              value={confirmacion}
              onChange={(e) =>
                setConfirmacion(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              error={numero !== confirmacion && confirmacion.length === 10}
              helperText={
                numero !== confirmacion && confirmacion.length === 10
                  ? "Los números no coinciden"
                  : ""
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Box>
        </Grid>
      </Grid>

      {isMobile && producto && (
        <Box textAlign="left" mt={3}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Ocultar detalles" : "Mostrar detalles"}
          </Button>
        </Box>
      )}

      {producto && (
        <Collapse in={!isMobile || showDetails}>
          <Paper elevation={1} sx={{ mt: 2, p: 3, backgroundColor: "#f8f8f8" }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Detalles del producto seleccionado
            </Typography>
            <Typography variant="body2">
              💰 <strong>Costo:</strong> ${producto.Monto}
            </Typography>
            <Typography variant="body2">
              💵 <strong>Comisión:</strong> ${producto.suscrip}.00 MXN
            </Typography>
            <Typography variant="body2">
              ⏳ <strong>Vigencia:</strong> {producto.Vigencia}
            </Typography>
            <Typography variant="body2">
              ℹ️ <strong>Descripción:</strong> {producto.Descripcion}
            </Typography>
          </Paper>
        </Collapse>
      )}

      <Box textAlign="right" mt={4}>
        <Button
          variant="contained"
          color="primary"
          disabled={isDisabled || loading}
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Procesando..." : "Enviar Recarga"}
        </Button>
      </Box>
    </DialogContent>
  );
};

export default RecargaForm;
