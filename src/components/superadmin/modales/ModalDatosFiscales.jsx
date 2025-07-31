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
  MenuItem,
} from "@mui/material";
import axiosSuperadmin from "../../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../../utils/alerts";

const regimenesFiscales = [
  { codigo: "601", nombre: "601 - General de Ley Personas Morales" },
  { codigo: "603", nombre: "603 - Personas Morales con Fines no Lucrativos" },
  { codigo: "605", nombre: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { codigo: "606", nombre: "606 - Arrendamiento" },
  { codigo: "608", nombre: "608 - Demás ingresos" },
  { codigo: "610", nombre: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { codigo: "611", nombre: "611 - Ingresos por Dividendos (socios y accionistas)" },
  { codigo: "612", nombre: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { codigo: "614", nombre: "614 - Ingresos por intereses" },
  { codigo: "615", nombre: "615 - Régimen de los ingresos por obtención de premios" },
  { codigo: "616", nombre: "616 - Sin obligaciones fiscales" },
  { codigo: "620", nombre: "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { codigo: "621", nombre: "621 - Incorporación Fiscal" },
  { codigo: "622", nombre: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { codigo: "623", nombre: "623 - Opcional para Grupos de Sociedades" },
  { codigo: "624", nombre: "624 - Coordinados" },
  { codigo: "625", nombre: "625 - Actividades Empresariales con ingresos en Plataformas Tecnológicas" },
  { codigo: "626", nombre: "626 - Régimen Simplificado de Confianza" },
];

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
      showError("No se pudieron cargar los datos fiscales.");
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "domicilio_fac") {
      // Solo permitir números y hasta 5 caracteres
      value = value.replace(/\D/g, "").slice(0, 5);
    }

    setDatos({ ...datos, [name]: value });
  };

  const handleGuardar = async () => {
    if (!datos?.rfc || !datos?.razon_social || !datos?.domicilio_fac || !datos?.codigo_regimen) {
      showError("Todos los campos marcados son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      await axiosSuperadmin.put(`/admin/tiendas/${tienda.id}/fiscales`, datos);
      showSuccess("Datos fiscales actualizados correctamente.");
      onClose();
    } catch (error) {
      console.error("Error al actualizar datos fiscales", error);
      showError("Error al actualizar los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>📄 Datos fiscales – {tienda?.nombre || "Tienda"}</DialogTitle>
      <DialogContent dividers>
        {cargando || !datos ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {(!datos.rfc && !datos.razon_social && !datos.codigo_postal && !datos.codigo_regimen) && (
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
                name="domicilio_fac"
                value={datos.domicilio_fac || ""}
                onChange={handleChange}
                fullWidth
                inputProps={{ maxLength: 5 }}
              />

              <TextField
                select
                label="Régimen fiscal"
                name="codigo_regimen"
                value={datos.codigo_regimen || ""}
                onChange={handleChange}
                fullWidth
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 300 },
                    },
                  },
                }}
              >
                {regimenesFiscales.map((regimen) => (
                  <MenuItem key={regimen.codigo} value={regimen.codigo}>
                    {regimen.nombre}
                  </MenuItem>
                ))}
              </TextField>
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
