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
      const res = await axiosSuperadmin.get(
        `/admin/tiendas/${tienda.id}/personales`
      );
      setDatos(res.data);
    } catch (error) {
      console.error("Error al cargar datos personales", error);
      showError("No se pudieron cargar los datos personales.");
    } finally {
      setCargando(false);
    }
  };

const handleChange = (e) => {
  let { name, value } = e.target;

  if (name === "phone_number") {
    // Elimina todo lo que no sea número
    const numeros = value.replace(/\D/g, "");

    // Siempre tomar los últimos 10 dígitos si hay más de 10
    value = numeros.length > 10 ? numeros.slice(-10) : numeros;
  }

  setDatos((prev) => ({ ...prev, [name]: value }));
};

  const handleGuardar = async () => {
    if (!datos?.slug || !datos?.email || !datos?.phone_number) {
      showError("Todos los campos son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      await axiosSuperadmin.put(
        `/admin/tiendas/${tienda.id}/personales`,
        datos
      );
      showSuccess("Datos personales actualizados correctamente.");
      onClose();
    } catch (error) {
      console.error("Error al actualizar datos personales", error);
      showError("Error al actualizar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        👤 Datos personales – {tienda?.nombre || "Tienda"}
      </DialogTitle>
      <DialogContent dividers>
        {cargando || !datos ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={150}
          >
            <CircularProgress />
          </Box>
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
  inputProps={{
    maxLength: 10,
    inputMode: "numeric", // para abrir teclado numérico en móviles
    pattern: "[0-9]*",     // solo números
  }}
/>

          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          color="primary"
          disabled={guardando}
          startIcon={
            guardando ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalDatosPersonales;
