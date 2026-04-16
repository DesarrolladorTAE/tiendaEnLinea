import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CodeIcon from "@mui/icons-material/Code";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import axios from "axios";

// 👇 importa tus alerts
import {
  showApiSuccess,
  showApiErrors,
  alertFromAxiosError,
} from "../../utils/alerts"; // ajusta la ruta si este archivo está en otra carpeta

const api = axios.create({
  baseURL: "https://mitiendaenlineamx.com.mx/api",
});

const USOS_CFDI = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
];

const REGIMENES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  {
    value: "625",
    label:
      "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

const EMPTY_FORM = {
  rfc: "",
  razon_social: "",
  codigo_postal_fiscal: "",
  regimen_codigo: "",
  email: "",
  telefono: "",
  uso_cfdi: "G03",
};

function money(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(num);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeClientToForm(client) {
  if (!client) return EMPTY_FORM;

  return {
    rfc: client.rfc || "",
    razon_social: client.razon_social || client.nombre_alias || "",
    codigo_postal_fiscal: client.codigo_postal_fiscal || "",
    regimen_codigo: client.regimen_codigo || "",
    email: client.email || "",
    telefono: client.telefono || "",
    uso_cfdi: client.uso_cfdi || "G03",
  };
}

function fieldSx() {
  return {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: "#fff",
    },
  };
}

async function downloadFile(url, filename) {
  try {
    const response = await axios.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename || "archivo");

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Error al descargar:", error);
  }
}

function InfoRow({ icon, label, value, strong = false }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="flex-start">
      <Box sx={{ mt: "2px", color: "text.secondary" }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography fontWeight={strong ? 700 : 500}>{value || "-"}</Typography>
      </Box>
    </Stack>
  );
}

export default function PublicInvoicePage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [timbrando, setTimbrando] = useState(false);

  const [error, setError] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  const [saleData, setSaleData] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: EMPTY_FORM,
  });

  const invoice = saleData?.invoice || null;
  const site = saleData?.site || null;

  const yaFacturada =
    saleData?.invoice_status === "timbrada" || invoice?.status === "timbrada";

  const saleItems = useMemo(() => saleData?.items || [], [saleData]);

  const previewValidation = useMemo(() => {
    const items = previewData?.items || [];

    if (!items.length) {
      return {
        valid: false,
        missing: [],
      };
    }

    const missing = items.filter(
      (item) => !item.clave_producto_sat || !item.clave_unidad_sat
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }, [previewData]);

  async function loadSale(showPopupOnError = false) {
    try {
      setLoading(true);
      setError("");
      setPreviewMessage("");

      const { data } = await api.get(`/facturacion-publica/${token}`);

      if (!data?.ok) {
        setError(data?.message || "No se pudo cargar la venta.");
        if (showPopupOnError) {
          showApiErrors(data, "No se pudo cargar la venta.");
        }
        return;
      }

      setSaleData(data.data);

      const incoming = normalizeClientToForm(data.data?.client);
      reset({
        ...EMPTY_FORM,
        ...incoming,
        uso_cfdi: incoming?.uso_cfdi || "G03",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Ocurrió un error al cargar la información.";

      setError(msg);

      if (showPopupOnError) {
        alertFromAxiosError(err, "Ocurrió un error al cargar la información");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadSale(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handlePreview(formData) {
    try {
      setTimbrando(true);
      setError("");
      setPreviewMessage("");
      clearErrors();

      if (!previewData) {
        setError("Primero genera la vista previa para validar la información.");
        showApiErrors(
          {
            mensaje: "Primero genera la vista previa para validar la información.",
          },
          "Validación requerida"
        );
        return;
      }

      if (!previewValidation.valid) {
        setError(
          "No se puede facturar porque hay productos sin clave SAT de producto o unidad."
        );
        showApiErrors(
          {
            mensaje:
              "No se puede facturar porque hay productos sin clave SAT de producto o unidad.",
          },
          "Información incompleta"
        );
        return;
      }

      const payload = {
        ...formData,
        nombre_alias: formData.razon_social || "",
        rfc: (formData.rfc || "").toUpperCase().trim(),
        razon_social: (formData.razon_social || "").trim(),
        codigo_postal_fiscal: (formData.codigo_postal_fiscal || "").trim(),
        regimen_codigo: (formData.regimen_codigo || "").trim(),
        email: (formData.email || "").trim(),
        telefono: (formData.telefono || "").trim(),
      };

      const { data } = await api.post(
        `/facturacion-publica/${token}/timbrar`,
        payload
      );

      if (!data?.ok) {
        showApiErrors(data, "No se pudo timbrar la factura.");
        return;
      }

      const resultInvoice = data?.data || data;

      showApiSuccess(data, "Factura timbrada correctamente.");
      setPreviewData(null);

      await loadSale(false);

      const folio = resultInvoice?.folio || saleData?.sale_id || "archivo";
      const serie = resultInvoice?.serie || "A";

      if (resultInvoice?.pdf_url) {
        await downloadFile(
          resultInvoice.pdf_url,
          `factura-${serie}-${folio}.pdf`
        );
      }

      if (resultInvoice?.xml_url) {
        await downloadFile(
          resultInvoice.xml_url,
          `factura-${serie}-${folio}.xml`
        );
      }
    } catch (err) {
      alertFromAxiosError(err, "No se pudo timbrar la factura");
    } finally {
      setTimbrando(false);
    }
  }

  async function handleTimbrar(formData) {
    try {
      setTimbrando(true);
      setError("");
      setPreviewMessage("");
      clearErrors();

      if (!previewData) {
        setError("Primero genera la vista previa para validar la información.");
        showApiErrors(
          {
            mensaje: "Primero genera la vista previa para validar la información.",
          },
          "Validación requerida"
        );
        return;
      }

      if (!previewValidation.valid) {
        setError(
          "No se puede facturar porque hay productos sin clave SAT de producto o unidad."
        );
        showApiErrors(
          {
            mensaje:
              "No se puede facturar porque hay productos sin clave SAT de producto o unidad.",
          },
          "Información incompleta"
        );
        return;
      }

      const payload = {
        ...formData,
        nombre_alias: formData.razon_social || "",
        rfc: (formData.rfc || "").toUpperCase().trim(),
        razon_social: (formData.razon_social || "").trim(),
        codigo_postal_fiscal: (formData.codigo_postal_fiscal || "").trim(),
        regimen_codigo: (formData.regimen_codigo || "").trim(),
        email: (formData.email || "").trim(),
        telefono: (formData.telefono || "").trim(),
      };

      const { data } = await api.post(
        `/facturacion-publica/${token}/timbrar`,
        payload
      );

      if (!data?.ok) {
        showApiErrors(data, "No se pudo timbrar la factura.");
        return;
      }

      const resultInvoice = data?.data || data;

      showApiSuccess(data, "Factura timbrada correctamente.");
      setPreviewData(null);

      await loadSale(false);

      const serie = resultInvoice?.serie || "A";
      const folio = resultInvoice?.folio || saleData?.sale_id || "archivo";

      if (resultInvoice?.pdf_url) {
        setTimeout(() => {
          downloadFile(resultInvoice.pdf_url, `factura-${serie}-${folio}.pdf`);
        }, 300);
      }

      if (resultInvoice?.xml_url) {
        setTimeout(() => {
          downloadFile(resultInvoice.xml_url, `factura-${serie}-${folio}.xml`);
        }, 700);
      }
    } catch (err) {
      alertFromAxiosError(err, "No se pudo timbrar la factura");
    } finally {
      setTimbrando(false);
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "75vh",
          display: "grid",
          placeItems: "center",
          px: 2,
          bgcolor: "#f6f8fb",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography>Cargando información de facturación...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error && !saleData) {
    return (
      <Container maxWidth="md" sx={{ py: 3, px: { xs: 1.5, sm: 2 } }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#f6f8fb",
        minHeight: "100vh",
        py: { xs: 1.5, md: 4 },
      }}
    >
      <Container
        maxWidth="xl"
        disableGutters
        sx={{
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Card
            sx={{
              width: "100%",
              borderRadius: { xs: 3.5, md: 5 },
              overflow: "hidden",
              boxShadow: "0 18px 50px rgba(15,23,42,.08)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 210, md: 280 },
                backgroundColor: "#0f172a",
                backgroundImage: site?.cover_url
                  ? `linear-gradient(to right, rgba(15,23,42,.82), rgba(15,23,42,.45)), url(${site.cover_url})`
                  : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                px: { xs: 2, md: 4 },
                py: { xs: 3, md: 4 },
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2.5}
                alignItems={{ xs: "center", md: "center" }}
                justifyContent="space-between"
                sx={{ width: "100%", textAlign: { xs: "center", md: "left" } }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems="center"
                >
                  <Avatar
                    src={site?.logo_url || ""}
                    alt={saleData?.store?.name || "Logo"}
                    variant="rounded"
                    sx={{
                      width: { xs: 76, md: 92 },
                      height: { xs: 76, md: 92 },
                      bgcolor: "white",
                      color: "text.primary",
                      borderRadius: 3,
                      boxShadow: "0 12px 30px rgba(0,0,0,.20)",
                    }}
                  >
                    <StorefrontRoundedIcon sx={{ fontSize: 38 }} />
                  </Avatar>

                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{
                        color: "#fff",
                        fontSize: { xs: "1.55rem", md: "2.3rem" },
                      }}
                    >
                      {site?.title || saleData?.store?.name || "Facturación"}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        color: "rgba(255,255,255,.86)",
                        maxWidth: 760,
                        mt: 0.8,
                      }}
                    >
                      {site?.description ||
                        "Captura tus datos fiscales para generar tu factura de forma rápida y segura."}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      justifyContent={{ xs: "center", md: "flex-start" }}
                      sx={{ mt: 1.8 }}
                    >
                      <Chip
                        label={`Venta #${saleData?.sale_id ?? "-"}`}
                        sx={{
                          bgcolor: alpha("#fff", 0.14),
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={yaFacturada ? "Facturada" : "Pendiente"}
                        color={yaFacturada ? "success" : "warning"}
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Card>

          {!!error && !!saleData && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {!!previewMessage && (
            <Alert
              severity={previewValidation.valid ? "success" : "warning"}
              sx={{ borderRadius: 3 }}
            >
              {previewMessage}
            </Alert>
          )}

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            alignItems="stretch"
            sx={{
              mx: 0,
              width: "100%",
            }}
          >
            <Grid item xs={12} lg={5} sx={{ display: "flex" }}>
              <Stack spacing={3} sx={{ width: "100%" }}>
                <Card
                  sx={{
                    width: "100%",
                    borderRadius: 4,
                    boxShadow: "0 10px 35px rgba(15,23,42,.05)",
                  }}
                >
                  <CardContent sx={{ p: { xs: 12, sm: 3.5, md: 4 } }}>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                      Resumen de la compra
                    </Typography>

                    <Stack spacing={2.2} sx={{ mt: 2 }}>
                      <InfoRow
                        icon={<StorefrontRoundedIcon fontSize="small" />}
                        label="Tienda"
                        value={saleData?.store?.name}
                        strong
                      />

                      <InfoRow
                        icon={<CalendarMonthRoundedIcon fontSize="small" />}
                        label="Fecha"
                        value={formatDate(saleData?.created_at)}
                      />

                      <InfoRow
                        icon={<PaymentsRoundedIcon fontSize="small" />}
                        label="Método de pago"
                        value={saleData?.payment_method || "-"}
                      />

                      <Divider />

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "#f8fafc",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Total pagado
                        </Typography>
                        <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                          {money(saleData?.total_amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                          IVA: {money(saleData?.iva_total)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    width: "100%",
                    borderRadius: 4,
                    boxShadow: "0 10px 35px rgba(15,23,42,.05)",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <ShoppingBagRoundedIcon />
                      <Typography variant="h6" fontWeight={800}>
                        Productos
                      </Typography>
                    </Stack>

                    <Stack spacing={1.5}>
                      {saleItems.length === 0 && (
                        <Typography color="text.secondary">
                          No hay productos en la venta.
                        </Typography>
                      )}

                      {saleItems.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            bgcolor: "#fff",
                          }}
                        >
                          <Typography fontWeight={700}>
                            {item.descripcion || item.product_name || "Producto"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                            Cantidad: {item.quantity} · Total: {money(item.total_price)}
                          </Typography>

                          {item.estado && (
                            <Chip
                              label={`Estado: ${item.estado}`}
                              size="small"
                              sx={{ mt: 1.1 }}
                            />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {yaFacturada && (
                  <Card
                    sx={{
                      width: "100%",
                      borderRadius: 4,
                      boxShadow: "0 10px 35px rgba(15,23,42,.05)",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <VerifiedRoundedIcon color="success" />
                        <Typography variant="h6" fontWeight={800}>
                          Factura generada
                        </Typography>
                      </Stack>

                      <Stack spacing={1.3}>
                        <Typography>
                          <strong>Folio:</strong> {invoice?.folio || "-"}
                        </Typography>
                        <Typography>
                          <strong>Serie:</strong> {invoice?.serie || "-"}
                        </Typography>
                        <Typography sx={{ wordBreak: "break-word" }}>
                          <strong>UUID:</strong> {invoice?.uuid || "-"}
                        </Typography>
                        <Typography>
                          <strong>Fecha de timbrado:</strong>{" "}
                          {formatDate(invoice?.timbrado_at)}
                        </Typography>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.5}
                          sx={{ pt: 1.5 }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() =>
                              downloadFile(
                                invoice?.pdf_url,
                                `factura-${invoice?.serie || "A"}-${invoice?.folio || saleData?.sale_id || "archivo"
                                }.pdf`
                              )
                            }
                            disabled={!invoice?.pdf_url}
                            sx={{ borderRadius: 3, py: 1.2 }}
                          >
                            Descargar PDF
                          </Button>

                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CodeIcon />}
                            onClick={() =>
                              downloadFile(
                                invoice?.xml_url,
                                `factura-${invoice?.serie || "A"}-${invoice?.folio || saleData?.sale_id || "archivo"
                                }.xml`
                              )
                            }
                            disabled={!invoice?.xml_url}
                            sx={{ borderRadius: 3, py: 1.2 }}
                          >
                            Descargar XML
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} lg={7} sx={{ display: "flex" }}>
              <Card
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: "0 10px 35px rgba(15,23,42,.05)",
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 2, sm: 2.5, md: 3 },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent={{ xs: "center", md: "flex-start" }}
                    sx={{ mb: 2 }}
                  >
                    <ReceiptLongIcon />
                    <Typography variant="h6" fontWeight={800}>
                      Datos fiscales
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 3,
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    Completa la información para generar tu factura correctamente.
                  </Typography>

                  <Box
                    component="form"
                    onSubmit={(e) => e.preventDefault()}
                    sx={{
                      width: "100%",
                      maxWidth: 720,
                      mx: "auto",
                    }}
                  >
                    <Stack spacing={2}>
                      <Controller
                        name="rfc"
                        control={control}
                        rules={{
                          required: "El RFC es obligatorio",
                          minLength: {
                            value: 12,
                            message: "El RFC parece incompleto",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="RFC"
                            error={!!errors.rfc}
                            helperText={errors.rfc?.message}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            sx={fieldSx()}
                          />
                        )}
                      />

                      <Controller
                        name="razon_social"
                        control={control}
                        rules={{ required: "La razón social es obligatoria" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Razón social"
                            error={!!errors.razon_social}
                            helperText={errors.razon_social?.message}
                            sx={fieldSx()}
                          />
                        )}
                      />

                      <Controller
                        name="codigo_postal_fiscal"
                        control={control}
                        rules={{
                          required: "El código postal fiscal es obligatorio",
                          pattern: {
                            value: /^\d{5}$/,
                            message: "Debe ser un código postal de 5 dígitos",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Código postal fiscal"
                            error={!!errors.codigo_postal_fiscal}
                            helperText={errors.codigo_postal_fiscal?.message}
                            sx={fieldSx()}
                          />
                        )}
                      />

                      <Controller
                        name="regimen_codigo"
                        control={control}
                        rules={{ required: "El régimen fiscal es obligatorio" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label="Régimen fiscal"
                            error={!!errors.regimen_codigo}
                            helperText={errors.regimen_codigo?.message}
                            sx={fieldSx()}
                          >
                            <MenuItem value="">Selecciona una opción</MenuItem>
                            {REGIMENES.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                      <Controller
                        name="email"
                        control={control}
                        rules={{
                          required: "El correo electrónico es obligatorio",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Ingresa un correo válido",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="email"
                            label="Correo electrónico"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            sx={fieldSx()}
                          />
                        )}
                      />

                      <Controller
                        name="telefono"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Teléfono"
                            sx={fieldSx()}
                          />
                        )}
                      />

                      <Controller
                        name="uso_cfdi"
                        control={control}
                        rules={{ required: "El uso CFDI es obligatorio" }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            label="Uso CFDI"
                            error={!!errors.uso_cfdi}
                            helperText={errors.uso_cfdi?.message}
                            sx={fieldSx()}
                          >
                            {USOS_CFDI.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Stack>

                    {!yaFacturada && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ mt: 3 }}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleSubmit(handlePreview)}
                          disabled={previewLoading || timbrando}
                          sx={{ borderRadius: 3, py: 1.25 }}
                        >
                          {previewLoading
                            ? "Generando vista previa..."
                            : "Vista previa"}
                        </Button>

                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleSubmit(handleTimbrar)}
                          disabled={timbrando || !previewData || !previewValidation.valid}
                          sx={{ borderRadius: 3, py: 1.25 }}
                        >
                          {timbrando ? "Timbrando..." : "Facturar"}
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  {previewData && !yaFacturada && (
                    <Box sx={{ mt: 4 }}>
                      <Divider sx={{ mb: 2.2 }} />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="h6" fontWeight={800}>
                          Vista previa
                        </Typography>

                        <Chip
                          icon={
                            previewValidation.valid ? (
                              <CheckCircleRoundedIcon />
                            ) : (
                              <ErrorOutlineRoundedIcon />
                            )
                          }
                          color={previewValidation.valid ? "success" : "warning"}
                          label={
                            previewValidation.valid
                              ? "Validación correcta"
                              : "Faltan claves SAT"
                          }
                        />
                      </Stack>

                      {!previewValidation.valid && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
                          Hay productos sin clave de producto SAT o clave de unidad SAT.
                          Corrige eso antes de facturar.
                        </Alert>
                      )}

                      <Stack spacing={1.5}>
                        {previewData.items?.map((item) => {
                          const okProducto = Boolean(item.clave_producto_sat);
                          const okUnidad = Boolean(item.clave_unidad_sat);

                          return (
                            <Box
                              key={item.sale_item_id}
                              sx={{
                                p: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                bgcolor: "#fafafa",
                              }}
                            >
                              <Typography fontWeight={700}>
                                {item.descripcion}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.6 }}
                              >
                                Cantidad: {item.cantidad} · Total: {money(item.total)}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 1 }}
                              >
                                <Chip
                                  size="small"
                                  color={okProducto ? "success" : "warning"}
                                  label={
                                    okProducto
                                      ? `Clave producto: ${item.clave_producto_sat}`
                                      : "Falta clave producto SAT"
                                  }
                                />

                                <Chip
                                  size="small"
                                  color={okUnidad ? "success" : "warning"}
                                  label={
                                    okUnidad
                                      ? `Clave unidad: ${item.clave_unidad_sat}`
                                      : "Falta clave unidad SAT"
                                  }
                                />
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}