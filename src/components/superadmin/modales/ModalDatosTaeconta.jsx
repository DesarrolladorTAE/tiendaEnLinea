import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  TextField,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axiosSuperadmin from "../../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../../utils/alerts";

const ModalDatosTaeconta = ({ open, onClose, tienda }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open && tienda?.id) {
      cargarDatos();
    }
  }, [open, tienda]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await axiosSuperadmin.get(`/admin/tiendas/${tienda.id}/taeconta`);
      setDatos(res.data);
    } catch (error) {
      console.error("Error al cargar datos de TAECONTA", error);
      showError("No se pudieron cargar los datos de TAECONTA.");
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    if (!datos?.correo_tae || !datos?.contra_tae) {
      showError("El correo y la contraseña son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      await axiosSuperadmin.put(`/admin/tiendas/${tienda.id}/taeconta`, datos);
      showSuccess("Datos de TAECONTA actualizados correctamente.");
      onClose();
    } catch (error) {
      console.error("Error al actualizar datos de TAECONTA", error);
      showError("Ocurrió un error al guardar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        🔐 Acceso TAECONTA – {tienda?.nombre || "Tienda"}
      </DialogTitle>
      <DialogContent dividers>
        {cargando || !datos ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {!datos.correo_tae && !datos.contra_tae && (
              <Typography color="warning.main" variant="body2" mb={2}>
                Esta tienda no tiene acceso TAECONTA registrado. Puedes capturarlo a continuación.
              </Typography>
            )}

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Correo de acceso"
                name="correo_tae"
                value={datos.correo_tae || ""}
                onChange={handleChange}
                fullWidth
                type="email"
              />
              <TextField
                label="Contraseña"
                name="contra_tae"
                value={datos.contra_tae || ""}
                onChange={handleChange}
                fullWidth
                type={showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleShowPassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          color="primary"
          disabled={guardando}
          startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalDatosTaeconta;

