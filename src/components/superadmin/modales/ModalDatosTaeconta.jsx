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
} from "@mui/material";
import axiosSuperadmin from "../../../config/axiosSuperadmin";

const ModalDatosTaeconta = ({ open, onClose, tienda }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

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
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await axiosSuperadmin.put(`/admin/tiendas/${tienda.id}/taeconta`, datos);
      console.log("Datos de TAECONTA actualizados correctamente");
      onClose();
    } catch (error) {
      console.error("Error al actualizar datos de TAECONTA", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        🔐 Acceso TAECONTA – {tienda?.nombre || "Tienda"}
      </DialogTitle>
      <DialogContent dividers>
        {cargando || !datos ? (
          <CircularProgress />
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
                type="password"
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
