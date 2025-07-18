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

const ModalDatosFiscales = ({ open, onClose, tienda }) => {
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
      const res = await axiosSuperadmin.get(`/admin/tiendas/${tienda.id}/fiscales`);
      setDatos(res.data);
    } catch (error) {
      console.error("Error al cargar datos fiscales", error);
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
      await axiosSuperadmin.put(`/admin/tiendas/${tienda.id}/fiscales`, datos);
      console.log("Datos fiscales actualizados correctamente");
      onClose();
    } catch (error) {
      console.error("Error al actualizar datos fiscales", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>📄 Datos fiscales – {tienda?.nombre || "Tienda"}</DialogTitle>
      <DialogContent dividers>
        {cargando || !datos ? (
          <CircularProgress />
        ) : (
          <>
            {(!datos.rfc && !datos.razon_social && !datos.domicilio_fiscal && !datos.codigo_regimen) && (
              <Typography color="warning.main" variant="body2" mb={2}>
                La tienda no cuenta con datos fiscales registrados. Puedes capturarlos a continuación.
              </Typography>
            )}

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="RFC"
                name="rfc"
                value={datos.rfc || ""}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Razón social"
                name="razon_social"
                value={datos.razon_social || ""}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Domicilio fiscal"
                name="domicilio_fiscal"
                value={datos.domicilio_fiscal || ""}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Código régimen"
                name="codigo_regimen"
                value={datos.codigo_regimen || ""}
                onChange={handleChange}
                fullWidth
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

export default ModalDatosFiscales;
