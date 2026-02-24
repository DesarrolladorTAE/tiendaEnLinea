import React, { useEffect, useMemo, useState } from "react";
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
  Collapse,
  Divider,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PaymentIcon from "@mui/icons-material/Payment";
import ContactsIcon from "@mui/icons-material/Contacts";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { useSelector, useDispatch } from "react-redux";
import { updateSaldo } from "../../store/slices/userSlice";
import axios from "../../axiosConfig";
import { motion } from "framer-motion";

const BLUE_GRADIENT =
  "linear-gradient(90deg, #00A8FF 0%, #007BFF 55%, #0056D2 100%)";

const fieldSx = {
  "& .MuiInputLabel-root": { color: "rgba(11,18,32,0.62)", fontWeight: 800 },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    background: "rgba(2,6,23,0.02)",
    "& fieldset": { borderColor: "rgba(15,23,42,0.14)" },
    "&:hover fieldset": { borderColor: "rgba(0,123,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(0,123,255,0.60)" },
  },
  "& .MuiFormHelperText-root": { fontWeight: 800 },
};

const RecargaForm = ({ carrier, productos, onNext, onCancel }) => {
  const [numero, setNumero] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  // ✅ “state con comillas” (espacio) para que el select se vea consistente en móvil
  const [productoSeleccionado, setProductoSeleccionado] = useState(" ");
  const [contactoSeleccionado, setContactoSeleccionado] = useState(" ");

  const [contactos, setContactos] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDetails, setShowDetails] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const saldo = Number(user?.saldo || 0);

  useEffect(() => {
    axios
      .get("/contacts")
      .then((res) => setContactos(res.data || []))
      .catch(() => setContactos([]));
  }, []);

  const productosFiltrados = useMemo(() => {
    return (productos || [])
      .filter((p) => p.Carrier === carrier?.Nombre)
      .sort((a, b) => (a.Monto || 0) - (b.Monto || 0));
  }, [productos, carrier]);

  const producto = useMemo(() => {
    if (!productoSeleccionado || productoSeleccionado === " ") return null;
    return productosFiltrados.find((p) => String(p.proID) === String(productoSeleccionado));
  }, [productosFiltrados, productoSeleccionado]);

  // ✅ En móvil, si ya hay producto seleccionado, abre detalles para que lo vea
  useEffect(() => {
    if (isMobile && producto) setShowDetails(true);
  }, [isMobile, producto]);

  const handleSubmit = () => {
    if (!producto) return;
    setLoading(true);

    onNext(
      { producto, numero, saldo },
      async ({ producto, numero }) => {
        const res = await axios.post("/recargar", {
          producto: producto.Codigo,
          referencia: numero,
        });

        const nuevoSaldo = saldo - producto.Monto;
        dispatch(updateSaldo(nuevoSaldo));
        localStorage.setItem("user", JSON.stringify({ ...user, saldo: nuevoSaldo }));

        return res.data;
      }
    );
  };

  const isDisabled =
    !productoSeleccionado ||
    productoSeleccionado === " " ||
    numero.length !== 10 ||
    confirmacion.length !== 10 ||
    numero !== confirmacion;

  return (
    <Box sx={{ position: "relative" }}>
      {/* ✅ Contenido scrolleable (los botones van fijos abajo) */}
      <DialogContent
        dividers
        sx={{
          px: { xs: 2, md: 4 },
          py: { xs: 2.2, md: 3 },
          background: "#fff",
          overflow: "visible",
          // ✅ deja espacio para el footer fijo
          pb: { xs: 12, md: 4 },
        }}
      >
        {/* top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.2,
            flexDirection: { xs: "column", sm: "row" },
            mb: 2.2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 950, color: "#0b1220", fontSize: 15 }}>
              Ingresa los datos de la recarga
            </Typography>
            <Typography sx={{ color: "rgba(11,18,32,0.62)", fontSize: 13 }}>
              Validamos el número y el monto antes de enviar.
            </Typography>
          </Box>

          <Chip
            label={`Saldo: $${saldo.toFixed(2)}`}
            sx={{
              fontWeight: 950,
              borderRadius: 999,
              background: saldo < 100 ? "rgba(244,67,54,0.10)" : "rgba(0,123,255,0.10)",
              border: `1px solid ${
                saldo < 100 ? "rgba(244,67,54,0.22)" : "rgba(0,123,255,0.22)"
              }`,
              color: saldo < 100 ? "#d32f2f" : "#0b5ed7",
              alignSelf: { xs: "flex-start", sm: "center" },
            }}
          />
        </Box>

        <Grid container spacing={2.2}>
          {/* Columna 1 */}
          <Grid item xs={12} md={6}>
            {/* ✅ SELECT MONTO FIX + PLACEHOLDER + value=" " */}
            <TextField
              select
              fullWidth
              label="Monto o Paquete"
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              variant="outlined"
              sx={{
                ...fieldSx,
                "& .MuiOutlinedInput-root": {
                  ...fieldSx["& .MuiOutlinedInput-root"],
                  height: 56,
                  alignItems: "center",
                },
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected || selected === " ") {
                    return (
                      <span style={{ color: "rgba(11,18,32,0.45)", fontWeight: 800 }}>
                        Selecciona un monto
                      </span>
                    );
                  }
                  const p = productosFiltrados.find((x) => String(x.proID) === String(selected));
                  return p?.Nombre && p?.Nombre !== "EMPTY" ? p.Nombre : `$${p?.Monto ?? ""}`;
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PaymentIcon sx={{ color: "rgba(11,18,32,0.55)" }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value=" ">
                <em>Selecciona un monto</em>
              </MenuItem>

              {productosFiltrados.map((p) => (
                <MenuItem key={p.proID} value={p.proID}>
                  {p.Nombre && p.Nombre !== "EMPTY" ? p.Nombre : `$${p.Monto}`}
                </MenuItem>
              ))}
            </TextField>

            {/* ✅ SELECT CONTACTO FIX + PLACEHOLDER + value=" " */}
            <Box mt={2}>
              <TextField
                select
                fullWidth
                label="Seleccionar contacto"
                value={contactoSeleccionado}
                onChange={(e) => {
                  const id = e.target.value;
                  const contacto = contactos.find((c) => String(c.id) === String(id));
                  setContactoSeleccionado(id);

                  if (contacto) {
                    const tel = String(contacto.phone || "").replace(/\D/g, "").slice(0, 10);
                    setNumero(tel);
                    setConfirmacion(tel);
                  }
                }}
                variant="outlined"
                sx={{
                  ...fieldSx,
                  "& .MuiOutlinedInput-root": {
                    ...fieldSx["& .MuiOutlinedInput-root"],
                    height: 56,
                    alignItems: "center",
                  },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected || selected === " ") {
                      return (
                        <span style={{ color: "rgba(11,18,32,0.45)", fontWeight: 800 }}>
                          Selecciona un contacto
                        </span>
                      );
                    }
                    const c = contactos.find((x) => String(x.id) === String(selected));
                    return c?.name || "Contacto";
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ContactsIcon sx={{ color: "rgba(11,18,32,0.55)" }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value=" ">
                  <em>Selecciona un contacto</em>
                </MenuItem>

                {contactos.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>

          {/* Columna 2 */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Número a recargar"
              fullWidth
              autoComplete="off"
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 10))}
              error={numero.length > 0 && numero.length < 10}
              helperText={numero.length > 0 && numero.length < 10 ? "Debe tener 10 dígitos" : ""}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", autoComplete: "off" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalPhoneIcon sx={{ color: "rgba(11,18,32,0.55)" }} />
                  </InputAdornment>
                ),
                sx: { height: 56 },
              }}
              sx={fieldSx}
              variant="outlined"
            />

            <Box mt={2}>
              <TextField
                type={showPass ? "text" : "password"}
                label="Confirmar número"
                fullWidth
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value.replace(/\D/g, "").slice(0, 10))}
                error={numero !== confirmacion && confirmacion.length === 10}
                helperText={
                  numero !== confirmacion && confirmacion.length === 10 ? "Los números no coinciden" : ""
                }
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", autoComplete: "new-password" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "rgba(11,18,32,0.55)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass(!showPass)}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid rgba(15,23,42,0.10)",
                          background: "rgba(2,6,23,0.02)",
                          "&:hover": { background: "rgba(2,6,23,0.06)" },
                        }}
                      >
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { height: 56 },
                }}
                sx={fieldSx}
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>

        {/* botón detalles móvil */}
        {isMobile && producto && (
          <Box mt={2.2} display="flex" justifyContent="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              startIcon={<InfoRoundedIcon />}
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
              {showDetails ? "Ocultar detalles" : "Mostrar detalles"}
            </Button>
          </Box>
        )}

        {/* Detalles premium */}
        {producto && (
          <Collapse in={!isMobile || showDetails}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  border: "1px solid rgba(15,23,42,0.10)",
                  boxShadow: "0 18px 45px rgba(2,6,23,0.06)",
                  background: "linear-gradient(180deg, rgba(0,123,255,0.05), rgba(0,168,255,0.02))",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 1.2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography sx={{ fontWeight: 950, color: "#0b1220" }}>
                    Detalles del producto
                  </Typography>

                  <Chip
                    label={`Costo: $${Number(producto.Monto || 0).toFixed(2)}`}
                    sx={{
                      fontWeight: 950,
                      borderRadius: 999,
                      background: "rgba(0,123,255,0.10)",
                      border: "1px solid rgba(0,123,255,0.22)",
                      color: "#0b5ed7",
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: "rgba(15,23,42,0.08)", mb: 1.6 }} />

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(11,18,32,0.78)", fontWeight: 800 }}
                    >
                      💵 Comisión:{" "}
                      <Box component="span" sx={{ fontWeight: 950, color: "#0b1220" }}>
                        ${Number(producto.suscrip || 0).toFixed(2)} MXN
                      </Box>
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(11,18,32,0.78)", fontWeight: 800 }}
                    >
                      ⏳ Vigencia:{" "}
                      <Box component="span" sx={{ fontWeight: 950, color: "#0b1220" }}>
                        {producto.Vigencia || "—"}
                      </Box>
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(11,18,32,0.78)", fontWeight: 800 }}
                    >
                      ℹ️ Descripción:{" "}
                      <Box component="span" sx={{ fontWeight: 900, color: "rgba(11,18,32,0.74)" }}>
                        {producto.Descripcion || "—"}
                      </Box>
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Collapse>
        )}
      </DialogContent>

      {/* ✅ FOOTER FIJO (móvil y desktop) */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 30,
          background: "#fff",
          borderTop: "1px solid rgba(15,23,42,0.08)",
          px: { xs: 2, md: 4 },
          py: 1.6,
        }}
      >
        <Typography
          sx={{
            fontSize: 12.5,
            color: "rgba(11,18,32,0.62)",
            fontWeight: 900,
            textAlign: "left",
            mb: 1,
          }}
        >
          Revisa tus datos antes de enviar.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              borderColor: "rgba(15,23,42,0.18)",
              color: "#0b1220",
              background: "rgba(2,6,23,0.02)",
              "&:hover": { background: "rgba(2,6,23,0.06)" },
              py: 1.05,
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            disabled={isDisabled || loading}
            onClick={handleSubmit}
            startIcon={loading ? <CircularProgress size={18} /> : null}
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 999,
              py: 1.05,
              background: BLUE_GRADIENT,
              boxShadow: "0 14px 28px rgba(0, 86, 210, 0.18)",
              "&:hover": { filter: "brightness(1.05)", transform: "translateY(-1px)" },
              "&.Mui-disabled": { opacity: 0.75, color: "#fff" },
            }}
          >
            {loading ? "Procesando..." : "Enviar recarga"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RecargaForm;