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
} from "@mui/material";
import axiosSuperadmin from "../../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../../utils/alerts";

const ModalDatosPersonales = ({ open, onClose, tienda }) => {
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
      const res = await axiosSuperadmin.get(`/admin/tiendas/${tienda.id}/personales`);
      setDatos(res.data);
    } catch (error) {
      console.error("Error al cargar datos personales", error);
      showError("No se pudieron cargar los datos.");
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
      await axiosSuperadmin.put(`/admin/tiendas/${tienda.id}/personales`, datos);
      showSuccess("Datos personales actualizados correctamente.");
      onClose();
    } catch (error) {
      console.error("Error al actualizar", error);
      showError("Error al actualizar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>👤 Datos personales – {tienda?.nombre || "Tienda"}</DialogTitle>
      <DialogContent dividers>
        {cargando || !datos ? (
          <CircularProgress />
        ) : (
          <>
            <TextField
              fullWidth
              label="Slug"
              name="slug"
              value={datos.slug || ""}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={datos.email || ""}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Teléfono"
              name="phone_number"
              value={datos.phone_number || ""}
              onChange={handleChange}
              margin="normal"
            />
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

export default ModalDatosPersonales;
