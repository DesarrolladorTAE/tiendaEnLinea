// src/components/ventas/FacturarVentaDialog.jsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Grid, Button, Chip, Typography, Divider, Paper,
  TextField, InputAdornment, IconButton, MenuItem, Tabs, Tab, Autocomplete
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

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

const emptyCliente = {
  nombre_alias: "",
  rfc: "",
  razon_social: "",
  codigo_postal_fiscal: "",
  regimen_codigo: "",
  email: "",
  telefono: "",
};

export default function FacturarVentaDialog({
  open,
  onClose,
  venta,                 // { id, folio, fecha, total, tipoPago, ... }
  clientes = [],         // [{id, nombre_alias, razon_social, rfc, email, ...}]
  onSubmitFactura,       // async ({ ventaId, cliente_id? , cliente_nuevo? }) => {}
  loading = false,
}) {
  const [tab, setTab] = React.useState(0); // 0: registrado | 1: nuevo
  const [submitting, setSubmitting] = React.useState(false);

  // Selección cliente registrado
  const [clienteSel, setClienteSel] = React.useState(null);

  // Form cliente nuevo
  const [form, setForm] = React.useState(emptyCliente);
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (open) {
      setTab(0);
      setClienteSel(null);
      setForm(emptyCliente);
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleNumeric = (key, maxLen) => (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, maxLen);
    setForm((f) => ({ ...f, [key]: digits }));
  };

  const validateNuevo = () => {
    const next = {};
    if (!form.nombre_alias?.trim()) next.nombre_alias = "El nombre es obligatorio.";
    if (form.telefono && form.telefono.length !== 10) next.telefono = "Debe contener 10 dígitos.";
    if (form.codigo_postal_fiscal && form.codigo_postal_fiscal.length !== 5) next.codigo_postal_fiscal = "Debe contener 5 dígitos.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      if (tab === 0) {
        // Cliente registrado
        if (!clienteSel?.id) {
          setErrors({ clienteSel: "Selecciona un cliente" });
          setSubmitting(false);
          return;
        }
        await onSubmitFactura?.({
          ventaId: venta?.id,
          cliente_id: clienteSel.id,
        });
      } else {
        // Cliente nuevo
        if (!validateNuevo()) {
          setSubmitting(false);
          return;
        }
        const payloadCliente = {
          ...form,
          rfc: form.rfc?.toUpperCase().replace(/\s+/g, "") || null,
        };
        await onSubmitFactura?.({
          ventaId: venta?.id,
          cliente_nuevo: payloadCliente,
        });
      }
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: 3,
          boxShadow: 10,
        },
      }}
    >
      {/* Header degradado */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          background: "linear-gradient(135deg, #1f2937 0%, #0ea5e9 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <ReceiptLongIcon />
        <DialogTitle sx={{ p: 0, m: 0, flex: 1, fontWeight: 800, color: "white", fontSize: { xs: 18, sm: 22 } }}>
          Facturar venta
        </DialogTitle>
        <Chip
          label={venta?.folio ? `Folio ${venta.folio}` : "Venta"}
          sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "white", fontWeight: 700, borderRadius: "16px" }}
        />
      </Box>

      {/* Detalle de la venta */}
      <DialogContent
        dividers
        sx={{
          bgcolor: "background.paper",
          p: { xs: 2, sm: 3 },
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>
            Detalles de la venta
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}><Chip label={`Folio: ${venta?.folio ?? "—"}`} variant="outlined" /></Grid>
            <Grid item xs={12} sm={3}><Chip label={`Fecha: ${venta?.fecha ?? "—"}`} variant="outlined" /></Grid>
            <Grid item xs={12} sm={3}><Chip color="success" label={`Total: ${venta?.total ?? "—"}`} variant="outlined" /></Grid>
            <Grid item xs={12} sm={3}><Chip color="info" label={`Pago: ${venta?.tipoPago ?? "—"}`} variant="outlined" /></Grid>
          </Grid>
        </Paper>

        {/* Tabs: cliente registrado / nuevo */}
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}
          >
            <Tab label="Cliente registrado" />
            <Tab label="Nuevo cliente" />
          </Tabs>

          {/* Cliente registrado */}
          {tab === 0 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(o) =>
                    o ? `${o.nombre_alias || o.razon_social || "Cliente"} · ${o.rfc || "RFC —"}` : ""
                  }
                  value={clienteSel}
                  onChange={(_, val) => {
                    setClienteSel(val);
                    setErrors((e) => ({ ...e, clienteSel: undefined }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar cliente"
                      placeholder="Nombre, razón social o RFC"
                      error={!!errors.clienteSel}
                      helperText={errors.clienteSel}
                    />
                  )}
                />

                {clienteSel && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Seleccionado:</strong> {clienteSel.nombre_alias || clienteSel.razon_social} · {clienteSel.rfc || "RFC —"}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Cliente nuevo */}
          {tab === 1 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre"
                    value={form.nombre_alias}
                    onChange={handleChange("nombre_alias")}
                    required
                    error={!!errors.nombre_alias}
                    helperText={errors.nombre_alias || ""}
                    fullWidth
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
                    inputProps={{ style: { textTransform: "uppercase" }, maxLength: 13 }}
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
                    label="Régimen (código SAT)"
                    value={form.regimen_codigo || ""}
                    onChange={handleChange("regimen_codigo")}
                    fullWidth
                    helperText={form.regimen_codigo ? `Seleccionado: ${form.regimen_codigo}` : "Selecciona el régimen"}
                    SelectProps={{ displayEmpty: true }}
                  >
                    <MenuItem value="">
                      <em>Seleccione un régimen</em>
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

              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="RFC en mayúsculas" size="small" color="primary" variant="outlined" />
                <Chip label="Teléfono 10 dígitos" size="small" color="success" variant="outlined" />
                <Chip label="C.P. 5 dígitos" size="small" color="info" variant="outlined" />
                <Chip label="Régimen guarda código" size="small" color="warning" variant="outlined" />
              </Stack>
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose} sx={{ textTransform: "none", borderRadius: 2 }} disabled={submitting || loading}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            variant="contained"
            disabled={submitting || loading}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 800, px: 2.5, boxShadow: 6 }}
          >
            {submitting ? "Procesando…" : "Generar factura"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
