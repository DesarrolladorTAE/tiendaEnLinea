// src/components/ventas/FacturarVentaDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Grid,
  Button,
  Chip,
  Typography,
  Divider,
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";

import axiosClientPOS from "../../config/axiosClientPOS";

import {
  REGIMENES_FISCALES,
  USOS_CFDI,
  filtrarUsosPorRegimen,
  esPersonaMoral,
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

const getClienteLabel = (option) => {
  if (typeof option === "string") return option;
  if (!option || typeof option !== "object") return "";
  const name = option.nombre_alias || option.razon_social || "Cliente";
  const rfc = option.rfc || "RFC —";
  return `${name} · ${rfc}`;
};

function DataMiniCard({ icon, label, value, color = "primary" }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette[color].main, 0.12)}`,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette[color].main,
          0.1
        )} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette[color].main, 0.14),
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box minWidth={0}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "text.secondary",
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: ".96rem",
              lineHeight: 1.2,
              color: "text.primary",
              wordBreak: "break-word",
            }}
          >
            {value || "—"}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function FacturarVentaDialog({
  open,
  onClose,
  venta,
  clientes = [],
  onSubmitFactura,
  loading = false,
  posLocationId,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [submitting, setSubmitting] = React.useState(false);

  const [clienteSel, setClienteSel] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState(clientes || []);
  const [loadingOpts, setLoadingOpts] = React.useState(false);

  const [form, setForm] = React.useState(emptyCliente);
  const [errors, setErrors] = React.useState({});

  const [usoCfdiSel, setUsoCfdiSel] = React.useState("G03");

  const isLocked = !!clienteSel?.id;

  React.useEffect(() => {
    if (!open) return;
    setClienteSel(null);
    setQuery("");
    setOptions(Array.isArray(clientes) ? clientes : []);
    setForm(emptyCliente);
    setErrors({});
    setSubmitting(false);
    setUsoCfdiSel("G03");
  }, [open, clientes]);

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
      setForm({ ...emptyCliente });
      setErrors({});
    }
  }, [clienteSel]);

  React.useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      if (!open) return;
      setLoadingOpts(true);

      try {
        const params = { q: query || "", limit: 20 };
        if (posLocationId) params.pos_location_id = posLocationId;

        const { data } = await axiosClientPOS.get("/clientes", {
          params,
          signal: controller.signal,
        });

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setOptions(list);
      } catch {
        setOptions([]);
      } finally {
        setLoadingOpts(false);
      }
    };

    const t = setTimeout(run, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, open, posLocationId]);

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleNumeric = (key, maxLen) => (e) => {
    const digits = (e.target.value || "").replace(/\D/g, "").slice(0, maxLen);
    setForm((f) => ({ ...f, [key]: digits }));
  };

  const validate = () => {
    const next = {};

    if (!form.nombre_alias?.trim()) {
      next.nombre_alias = "El nombre es obligatorio.";
    }

    if (form.telefono && form.telefono.length !== 10) {
      next.telefono = "Debe contener 10 dígitos.";
    }

    if (
      form.codigo_postal_fiscal &&
      form.codigo_postal_fiscal.length !== 5
    ) {
      next.codigo_postal_fiscal = "Debe contener 5 dígitos.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const usosDisponibles = React.useMemo(() => {
    const reg = (form.regimen_codigo || "").trim();
    if (!reg) return USOS_CFDI;
    return filtrarUsosPorRegimen(reg);
  }, [form.regimen_codigo]);

  React.useEffect(() => {
    if (!usoCfdiSel) return;

    const reg = (form.regimen_codigo || "").trim();
    if (!reg) return;

    const sigueSiendoValido = usosDisponibles.some(
      (u) => u.codigo === usoCfdiSel
    );

    if (!sigueSiendoValido) {
      const fallback =
        usosDisponibles.find((u) => u.codigo === "G03")?.codigo ||
        usosDisponibles[0]?.codigo;

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
        if (!validate()) {
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
      onClose={submitting || loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      scroll="paper"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: { xs: 0, sm: 4 },
          boxShadow: 24,
          background:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.98)
              : "#fff",
        },
      }}
    >
      {/* Header premium */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5, md: 3 },
          py: { xs: 1.6, sm: 2 },
          color: "white",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #0ea5e9 100%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -35,
            top: -35,
            width: 130,
            height: 130,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: 50,
            bottom: -45,
            width: 110,
            height: 110,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.06)",
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ReceiptLongIcon />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DialogTitle
              sx={{
                p: 0,
                m: 0,
                color: "white",
                fontWeight: 900,
                lineHeight: 1.1,
                fontSize: { xs: "1.15rem", sm: "1.4rem" },
              }}
            >
              Facturar venta
            </DialogTitle>

            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.82)",
                mt: 0.4,
              }}
            >
              Selecciona un cliente existente o captura los datos fiscales para
              generar la factura.
            </Typography>
          </Box>

          <Chip
            label={venta?.folio ? `Folio ${venta.folio}` : "Venta"}
            sx={{
              bgcolor: "rgba(255,255,255,0.14)",
              color: "white",
              fontWeight: 800,
              borderRadius: 999,
              display: { xs: "none", sm: "inline-flex" },
            }}
          />

          <IconButton
            onClick={onClose}
            disabled={submitting || loading}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent
        dividers
        sx={{
          p: { xs: 1.5, sm: 2.5, md: 3 },
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.default, 0.38)
              : alpha("#f8fbff", 0.9),
        }}
      >
        <Stack spacing={2}>
          {/* Resumen de la venta */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.9)
                  : "#fff",
            }}
          >
            <Stack spacing={1.4}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <FactCheckRoundedIcon color="primary" fontSize="small" />
                Resumen de la venta
              </Typography>

              <Grid container spacing={1.4}>
                <Grid item xs={12} sm={6} md={3}>
                  <DataMiniCard
                    icon={<ReceiptLongIcon fontSize="small" />}
                    label="Folio"
                    value={venta?.folio ?? "—"}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DataMiniCard
                    icon={<CalendarTodayRoundedIcon fontSize="small" />}
                    label="Fecha"
                    value={venta?.fecha ?? "—"}
                    color="secondary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DataMiniCard
                    icon={<AttachMoneyRoundedIcon fontSize="small" />}
                    label="Total"
                    value={venta?.total ?? "—"}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DataMiniCard
                    icon={<PaymentsRoundedIcon fontSize="small" />}
                    label="Pago"
                    value={venta?.tipoPago ?? "—"}
                    color="info"
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Estado */}
          <Alert
            severity={clienteSel?.id ? "info" : "warning"}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              boxShadow: 0,
            }}
          >
            {clienteSel?.id
              ? "Facturarás con el cliente seleccionado. Los datos fiscales quedan bloqueados para evitar cambios accidentales."
              : "No has seleccionado un cliente. Se creará uno nuevo con los datos que captures y se usará para facturar esta venta."}
          </Alert>

          {/* Cliente + formulario */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.4 },
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.92)
                  : "#fff",
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.4,
                  }}
                >
                  <PersonSearchRoundedIcon color="primary" fontSize="small" />
                  Cliente y datos fiscales
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary" }}
                >
                  Busca un cliente ya registrado o captura su información fiscal
                  para generar la factura.
                </Typography>
              </Box>

              <Autocomplete
                options={Array.isArray(options) ? options : []}
                loading={loading || loadingOpts}
                value={clienteSel}
                onChange={(_, val) => {
                  setClienteSel(val);
                  if (!val) {
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
                    label="Buscar cliente existente"
                    placeholder="Nombre, razón social o RFC"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading || loadingOpts ? (
                            <CircularProgress
                              color="inherit"
                              size={18}
                              sx={{ mr: 1 }}
                            />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "background.paper",
                      },
                    }}
                  />
                )}
              />

              <Grid container spacing={1.6}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre o alias"
                    value={form.nombre_alias}
                    onChange={handleChange("nombre_alias")}
                    required
                    error={!!errors.nombre_alias}
                    helperText={errors.nombre_alias || " "}
                    fullWidth
                    disabled={isLocked}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
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
                    inputProps={{
                      style: { textTransform: "uppercase" },
                      maxLength: 13,
                    }}
                    helperText=" "
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
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
                    helperText=" "
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ApartmentRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
                    }}
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Régimen fiscal"
                    value={form.regimen_codigo || ""}
                    onChange={handleChange("regimen_codigo")}
                    fullWidth
                    disabled={isLocked}
                    helperText={
                      form.regimen_codigo
                        ? `Seleccionado: ${form.regimen_codigo}`
                        : "Selecciona el régimen"
                    }
                    SelectProps={{ displayEmpty: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
                    }}
                  >
                    {REGIMENES_FISCALES.map((r) => (
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
                    disabled={isLocked}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIphoneIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      inputProps: { maxLength: 10, pattern: "\\d*" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email fiscal"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    fullWidth
                    disabled={isLocked}
                    helperText=" "
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: isLocked
                          ? alpha(theme.palette.action.disabledBackground, 0.3)
                          : "background.paper",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Uso de CFDI"
                    value={usoCfdiSel}
                    onChange={(e) => setUsoCfdiSel(e.target.value)}
                    fullWidth
                    helperText={
                      form.regimen_codigo
                        ? esPM
                          ? "Persona moral: se muestran solo usos válidos."
                          : "Persona física: se muestran usos compatibles."
                        : "Selecciona primero el régimen para validar mejor los usos."
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "background.paper",
                      },
                    }}
                  >
                    {(usosDisponibles.length ? usosDisponibles : USOS_CFDI).map(
                      (u) => (
                        <MenuItem key={u.codigo} value={u.codigo}>
                          {u.nombre}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label="RFC en mayúsculas"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label="Teléfono 10 dígitos"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label="C.P. 5 dígitos"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label="Uso CFDI filtrado"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.96)
              : "#fff",
        }}
      >
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={1.2}
          sx={{ width: "100%", justifyContent: "flex-end" }}
        >
          <Button
            onClick={onClose}
            disabled={submitting || loading}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: 3,
              fontWeight: 800,
              px: 2.4,
              py: 1,
            }}
            fullWidth={fullScreen}
          >
            Cancelar
          </Button>

          <Button
            onClick={submit}
            variant="contained"
            disabled={submitting || loading}
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : <ReceiptLongIcon />
            }
            sx={{
              textTransform: "none",
              borderRadius: 3,
              fontWeight: 900,
              px: 2.6,
              py: 1,
              boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.24)}`,
            }}
            fullWidth={fullScreen}
          >
            {submitting
              ? "Procesando..."
              : clienteSel?.id
              ? "Facturar con cliente"
              : "Crear cliente y facturar"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}