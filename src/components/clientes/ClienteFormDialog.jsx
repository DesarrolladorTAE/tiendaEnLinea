// src/components/clientes/ClienteFormDialog.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Stack,
  Button,
  Chip,
  Box,
  Typography,
  IconButton,
  Popover,
  Divider,
  Paper,
  InputAdornment,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

const empty = {
  nombre_alias: "",
  rfc: "",
  razon_social: "",
  codigo_postal_fiscal: "",
  regimen_codigo: "",
  email: "",
  telefono: "",
};

const regimenesFiscales = [
  { codigo: "601", nombre: "601 - General de Ley Personas Morales" },
  { codigo: "603", nombre: "603 - Personas Morales con Fines no Lucrativos" },
  {
    codigo: "605",
    nombre: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios",
  },
  { codigo: "606", nombre: "606 - Arrendamiento" },
  { codigo: "608", nombre: "608 - Demás ingresos" },
  {
    codigo: "610",
    nombre:
      "610 - Residentes en el Extranjero sin Establecimiento Permanente en México",
  },
  {
    codigo: "611",
    nombre: "611 - Ingresos por Dividendos (socios y accionistas)",
  },
  {
    codigo: "612",
    nombre:
      "612 - Personas Físicas con Actividades Empresariales y Profesionales",
  },
  { codigo: "614", nombre: "614 - Ingresos por intereses" },
  {
    codigo: "615",
    nombre: "615 - Régimen de los ingresos por obtención de premios",
  },
  { codigo: "616", nombre: "616 - Sin obligaciones fiscales" },
  {
    codigo: "620",
    nombre:
      "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  },
  { codigo: "621", nombre: "621 - Incorporación Fiscal" },
  {
    codigo: "622",
    nombre: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  },
  { codigo: "623", nombre: "623 - Opcional para Grupos de Sociedades" },
  { codigo: "624", nombre: "624 - Coordinados" },
  {
    codigo: "625",
    nombre:
      "625 - Actividades Empresariales con ingresos en Plataformas Tecnológicas",
  },
  { codigo: "626", nombre: "626 - Régimen Simplificado de Confianza" },
];

export default function ClienteFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // init con régimen vacío por defecto para "nuevo cliente"
  const init = useMemo(
    () => ({ ...empty, regimen_codigo: "", ...(initialValues || {}) }),
    [initialValues]
  );

  const [form, setForm] = useState(init);
  const [submitting, setSubmitting] = useState(false);
  const [anchorInfo, setAnchorInfo] = useState(null);
  const infoOpen = Boolean(anchorInfo);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    setForm(init);
    setErrors({});
    setSubmitting(false);
  }, [init, open]);

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleNumeric = (key, maxLen) => (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, maxLen);
    setForm((f) => ({ ...f, [key]: digits }));
  };

  const validate = () => {
    const next = {};
    if (!form.nombre_alias?.trim())
      next.nombre_alias = "El nombre es obligatorio.";
    if (form.telefono && form.telefono.length !== 10)
      next.telefono = "Debe contener 10 dígitos.";
    if (form.codigo_postal_fiscal && form.codigo_postal_fiscal.length !== 5)
      next.codigo_postal_fiscal = "Debe contener 5 dígitos.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      rfc: form.rfc?.toUpperCase().replace(/\s+/g, "") || null,
    };

    try {
      const maybePromise = onSubmit?.(payload);
      if (maybePromise && typeof maybePromise.then === "function") {
        setSubmitting(true);
        await maybePromise;
      }
      onClose?.(); // cerrar tras submit exitoso
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      keepMounted
      PaperProps={{
        sx: {
          // En mobile, ocupa toda la pantalla y permite scroll interno
          m: { xs: 0, sm: 2 },
          height: { xs: "100dvh", sm: "auto" },
          maxHeight: { xs: "100dvh", sm: "calc(100dvh - 64px)" },
          overflow: "hidden",
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: 10,
          bgcolor: "background.default",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          background: "linear-gradient(135deg, #1f2937 0%, #0ea5e9 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <PersonAddAlt1Icon />
        <DialogTitle
          sx={{
            p: 0,
            m: 0,
            flex: 1,
            fontWeight: 800,
            color: "white",
            fontSize: { xs: 18, sm: 22 },
          }}
        >
          {initialValues ? "Editar cliente" : "Nuevo cliente"}
        </DialogTitle>
        <Chip
          label="Datos para facturación"
          sx={{
            bgcolor: "rgba(255,255,255,0.16)",
            color: "white",
            fontWeight: 700,
            borderRadius: "16px",
            display: { xs: "none", sm: "inline-flex" },
          }}
        />
        <IconButton
          onClick={(e) => setAnchorInfo(e.currentTarget)}
          color="inherit"
          size="small"
          aria-label="Información del formulario"
        >
          <InfoOutlinedIcon />
        </IconButton>
      </Box>

      {/* Recuadro flotante tipo nube */}
      <Popover
        open={infoOpen}
        anchorEl={anchorInfo}
        onClose={() => setAnchorInfo(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            p: 2,
            maxWidth: 360,
            borderRadius: 3,
            boxShadow: 8,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              top: -8,
              right: 20,
              width: 16,
              height: 16,
              bgcolor: "background.paper",
              transform: "rotate(45deg)",
              boxShadow: 1,
            },
          },
        }}
      >
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={800}>
            ¿Para qué sirven estos datos?
          </Typography>
          <Typography variant="body2">
            Registra la información básica de tus clientes para emitir facturas,
            enviar comprobantes y mantener su historial de compras. El RFC se
            normaliza automáticamente y el régimen se guarda por código SAT.
          </Typography>
        </Stack>
      </Popover>

      <form onSubmit={handleSubmit}>
        <DialogContent
          dividers
          sx={{
            bgcolor: "background.paper",
            p: { xs: 2, sm: 3 },
            // Scroll en móviles
            overflowY: "auto",
            maxHeight: { xs: "calc(100dvh - 120px)", sm: "auto" },
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <BadgeIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={800}>
                Información del cliente
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  value={form.nombre_alias}
                  onChange={handleChange("nombre_alias")}
                  fullWidth
                  required
                  error={!!errors.nombre_alias}
                  helperText={errors.nombre_alias || ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="RFC"
                  value={form.rfc}
                  onChange={handleChange("rfc")}
                  fullWidth
                  inputProps={{
                    style: { textTransform: "uppercase" },
                    maxLength: 13,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Razón social"
                  value={form.razon_social}
                  onChange={handleChange("razon_social")}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="C.P. fiscal"
                  value={form.codigo_postal_fiscal}
                  onChange={handleNumeric("codigo_postal_fiscal", 5)}
                  fullWidth
                  inputMode="numeric"
                  placeholder="#####"
                  error={!!errors.codigo_postal_fiscal}
                  helperText={errors.codigo_postal_fiscal || "5 dígitos"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalPostOfficeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    inputProps: { maxLength: 5, pattern: "\\d*" },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Régimen "
                  value={form.regimen_codigo || ""}
                  onChange={handleChange("regimen_codigo")}
                  fullWidth
                  helperText={
                    form.regimen_codigo
                      ? `Seleccionado: ${form.regimen_codigo}`
                      : "Selecciona el régimen"
                  }
                >
                  {/* Opción vacía */}
                  <MenuItem value="">
                    <em>Sin régimen</em>
                  </MenuItem>

                  {regimenesFiscales.map((r) => (
                    <MenuItem key={r.codigo} value={r.codigo}>
                      {r.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Teléfono"
                  value={form.telefono}
                  onChange={handleNumeric("telefono", 10)}
                  fullWidth
                  inputMode="numeric"
                  placeholder="10 dígitos"
                  error={!!errors.telefono}
                  helperText={errors.telefono || "Solo números, 10 dígitos"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIphoneIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    inputProps: { maxLength: 10, pattern: "\\d*" },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email (fiscal)"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight={800}>
                Consideraciones Importantes
              </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>

              <div>
                <Chip
                  label="RFC en mayúsculas"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label="Teléfono a 10 dígitos"
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label="C.P. Fiscal Existente"
                  size="small"
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label="Régimen Correcto"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </div>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2 },
            position: isMobile ? "sticky" : "static",
            bottom: 0,
            bgcolor: "background.paper",
            borderTop: { xs: "1px solid", sm: "none" },
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ width: "100%", justifyContent: "flex-end" }}
          >
            <Button
              onClick={onClose}
              sx={{ textTransform: "none", borderRadius: 2 }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 800,
                px: 2.5,
                boxShadow: 6,
              }}
            >
              {submitting
                ? "Guardando…"
                : initialValues
                ? "Guardar cambios"
                : "Crear cliente"}
            </Button>
          </Stack>
        </DialogActions>
      </form>
    </Dialog>
  );
}
