// src/components/ventas/FacturarVentaDialog.jsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Grid, Button, Chip, Typography, Divider, Paper,
  TextField, InputAdornment, MenuItem, Autocomplete, Alert,
  CircularProgress
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import axiosClientPOS from "../../config/axiosClientPOS";

// 👇 Util centralizado de catálogos y reglas
import {
  REGIMENES_FISCALES,
  USOS_CFDI,
  filtrarUsosPorRegimen,
  esPersonaMoral
} from "../../utils/cfdiCatalogos";

const emptyCliente = {
  nombre_alias: "",
  rfc: "",
  razon_social: "",
  codigo_postal_fiscal: "",
  regimen_codigo: "",
  email: "",
  telefono: "",
};

// Etiqueta robusta para Autocomplete
const getClienteLabel = (option) => {
  if (typeof option === "string") return option;
  if (!option || typeof option !== "object") return "";
  const name = option.nombre_alias || option.razon_social || "Cliente";
  const rfc = option.rfc || "RFC —";
  return `${name} · ${rfc}`;
};

export default function FacturarVentaDialog({
  open,
  onClose,
  venta,                 // { id, folio, fecha, total, tipoPago }
  clientes = [],         // opciones iniciales
  onSubmitFactura,       // async ({ ventaId, cliente_id?, cliente_nuevo?, usoCfdi })
  loading = false,       // loading externo (p.ej. clientes o timbrado)
  posLocationId,         // opcional: para ?pos_location_id=XX
}) {
  const [submitting, setSubmitting] = React.useState(false);

  // Autocomplete (cliente)
  const [clienteSel, setClienteSel] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState(clientes || []);
  const [loadingOpts, setLoadingOpts] = React.useState(false);

  // Form
  const [form, setForm] = React.useState(emptyCliente);
  const [errors, setErrors] = React.useState({});

  // Uso de CFDI seleccionado
  const [usoCfdiSel, setUsoCfdiSel] = React.useState("G03");

  const isLocked = !!clienteSel?.id; // bloquear inputs si hay cliente seleccionado

  // Reset al abrir
  React.useEffect(() => {
    if (!open) return;
    setClienteSel(null);
    setQuery("");
    setOptions(Array.isArray(clientes) ? clientes : []);
    setForm(emptyCliente);
    setErrors({});
    setSubmitting(false);
    setUsoCfdiSel("G03"); // default cada vez que abre
  }, [open, clientes]);

  // Rellenar / limpiar form según selección
  React.useEffect(() => {
    if (clienteSel?.id) {
      setForm({
        nombre_alias: clienteSel.nombre_alias || "",
        rfc: clienteSel.rfc || "",
        razon_social: clienteSel.razon_social || "",
        codigo_postal_fiscal: clienteSel.codigo_postal_fiscal || "",
        regimen_codigo: clienteSel.regimen_codigo || "",
        email: clienteSel.email || "",
        telefono: clienteSel.telefono || "",
      });
    } else {
      // limpiar totalmente si no hay cliente seleccionado
      setForm({ ...emptyCliente });
      setErrors({});
    }
  }, [clienteSel]);

  // Búsqueda remota de clientes
  React.useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!open) return;
      setLoadingOpts(true);
      try {
        const params = { q: query || "", limit: 20 };
        if (posLocationId) params.pos_location_id = posLocationId;
        const { data } = await axiosClientPOS.get("/clientes", { params, signal: controller.signal });
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setOptions(list);
      } catch {
        setOptions([]);
      } finally {
        setLoadingOpts(false);
      }
    };
    const t = setTimeout(run, 250);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query, open, posLocationId]);

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleNumeric = (key, maxLen) => (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, maxLen);
    setForm((f) => ({ ...f, [key]: digits }));
  };

  const validate = () => {
    const next = {};
    if (!form.nombre_alias?.trim()) next.nombre_alias = "El nombre es obligatorio.";
    if (form.telefono && form.telefono.length !== 10) next.telefono = "Debe contener 10 dígitos.";
    if (form.codigo_postal_fiscal && form.codigo_postal_fiscal.length !== 5) next.codigo_postal_fiscal = "Debe contener 5 dígitos.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Lista de USOS válidos según régimen (si no hay régimen, mostramos todo para que el usuario lo seleccione después)
  const usosDisponibles = React.useMemo(() => {
    const reg = (form.regimen_codigo || "").trim();
    if (!reg) return USOS_CFDI;
    return filtrarUsosPorRegimen(reg);
  }, [form.regimen_codigo]);

  // Si el uso elegido deja de ser válido al cambiar el régimen, lo reajustamos a uno válido (G03 si existe)
  React.useEffect(() => {
    if (!usoCfdiSel) return;
    const reg = (form.regimen_codigo || "").trim();
    if (!reg) return; // sin régimen no validamos aún
    const sigueSiendoValido = usosDisponibles.some(u => u.codigo === usoCfdiSel);
    if (!sigueSiendoValido) {
      const fallback = usosDisponibles.find(u => u.codigo === "G03")?.codigo || usosDisponibles[0]?.codigo;
      if (fallback) setUsoCfdiSel(fallback);
    }
  }, [form.regimen_codigo, usoCfdiSel, usosDisponibles]);

  const submit = async () => {
    try {
      setSubmitting(true);
      if (isLocked) {
        await onSubmitFactura?.({
          ventaId: venta?.id,
          cliente_id: clienteSel.id,
          usoCfdi: usoCfdiSel,
        });
      } else {
        if (!validate()) { setSubmitting(false); return; }
        const payloadCliente = {
          ...form,
          rfc: form.rfc?.toUpperCase().replace(/\s+/g, "") || null,
        };
        await onSubmitFactura?.({
          ventaId: venta?.id,
          cliente_nuevo: payloadCliente,
          usoCfdi: usoCfdiSel,
        });
      }
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  const esPM = esPersonaMoral(form.regimen_codigo);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: { overflow: "hidden", borderRadius: 3, boxShadow: 10 },
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

      <DialogContent
        dividers
        sx={{ bgcolor: "background.paper", p: { xs: 2, sm: 3 }, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
      >
        {/* Detalles de la venta */}
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

        {/* Aviso notorio */}
        <Alert severity={clienteSel?.id ? "info" : "warning"} sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}>
          {clienteSel?.id
            ? "Facturarás con los datos del cliente seleccionado. Los campos quedan bloqueados."
            : "No has seleccionado un cliente. Se CREARÁ un cliente nuevo con los datos que captures."}
        </Alert>

        {/* Autocomplete + Form */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Autocomplete
              options={Array.isArray(options) ? options : []}
              loading={loading || loadingOpts}
              value={clienteSel}
              onChange={(_, val) => {
                setClienteSel(val);
                if (!val) {
                  // limpiar cuando se da "x" o se borra selección
                  setForm({ ...emptyCliente });
                  setErrors({});
                  setQuery("");
                }
              }}
              onInputChange={(_, val) => setQuery(val || "")}
              getOptionLabel={getClienteLabel}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              clearOnBlur={false}
              disableClearable={false}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar cliente (opcional)"
                  placeholder="Nombre, razón social o RFC"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {(loading || loadingOpts) ? (
                          <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                  label="Régimen"
                  value={form.regimen_codigo || ""}
                  onChange={handleChange("regimen_codigo")}
                  fullWidth
                  disabled={isLocked}
                  helperText={form.regimen_codigo ? `Seleccionado: ${form.regimen_codigo}` : "Selecciona el régimen"}
                  SelectProps={{ displayEmpty: true }}
                >
                  {REGIMENES_FISCALES.map((r) => (
                    <MenuItem key={r.codigo} value={r.codigo}>{r.nombre}</MenuItem>
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
                  disabled={isLocked}
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

              {/* Email fiscal */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email (fiscal)"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  fullWidth
                  disabled={isLocked}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Uso de CFDI (filtrado por régimen) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Uso de CFDI"
                  value={usoCfdiSel}
                  onChange={(e) => setUsoCfdiSel(e.target.value)}
                  fullWidth
                  helperText={
                    form.regimen_codigo
                      ? (esPM
                        ? "Persona MORAL: ocultamos D01–D10 y opciones no permitidas."
                        : "Persona FÍSICA: verás deducciones personales cuando apliquen."
                        )
                      : "Selecciona primero el régimen para ver usos válidos."
                  }
                >
                  {(usosDisponibles.length ? usosDisponibles : USOS_CFDI).map((u) => (
                    <MenuItem key={u.codigo} value={u.codigo}>
                      {u.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="RFC en mayúsculas" size="small" color="primary" variant="outlined" />
              <Chip label="Teléfono 10 dígitos" size="small" color="success" variant="outlined" />
              <Chip label="C.P. 5 dígitos" size="small" color="info" variant="outlined" />
              <Chip label="Régimen guarda código" size="small" color="warning" variant="outlined" />
            </Box>
          </Stack>
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
            {submitting ? "Procesando…" : clienteSel?.id ? "Facturar con cliente" : "Crear cliente y facturar"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
