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
  Stack,
  InputAdornment,
} from "@mui/material";
import axiosSuperadmin from "../../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../../utils/alerts";

const ModalDatosPersonales = ({ open, onClose, tienda }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ✅ URL base actual de tiendas
  const BASE_URL = "https://mitiendaenlineamx.com.mx/tienda/";

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
      // Solo números, máximo 10 dígitos
      const numeros = value.replace(/\D/g, "");
      value = numeros.length > 10 ? numeros.slice(-10) : numeros;
    }

    if (name === "slug") {
      // Solo letras, números y guiones
      value = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/^-+|-+$/g, "");
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
      const payload = { ...datos, slug: datos.slug.trim() };
      await axiosSuperadmin.put(
        `/admin/tiendas/${tienda.id}/personales`,
        payload
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

  // ✅ Copiar o abrir URL
  const fullURL = `${BASE_URL}${datos?.slug || ""}`;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(fullURL);
      showSuccess("✅ URL copiada al portapapeles");
    } catch {
      showError("No se pudo copiar la URL.");
    }
  };

  const handleIrSitio = () => {
    if (!datos?.slug) {
      showError("Agrega un slug antes de abrir la tienda.");
      return;
    }
    window.open(fullURL, "_blank");
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
            {/* Campo del slug */}
            <TextField
              fullWidth
              label="Slug de la tienda"
              name="slug"
              value={datos.slug || ""}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography color="text.secondary" fontSize="0.9rem">
                      {BASE_URL}
                    </Typography>
                  </InputAdornment>
                ),
              }}
              helperText="Solo se permiten letras, números y guiones (-)"
            />

            {/* Botones de acción */}
            <Stack direction="row" spacing={1} mt={1.5}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleIrSitio}
              >
                🌐 Ir al sitio
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleCopiar}>
                📋 Copiar URL
              </Button>
            </Stack>

            {/* Otros campos */}
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
                inputMode: "numeric",
                pattern: "[0-9]*",
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
