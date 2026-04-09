import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CodeIcon from "@mui/icons-material/Code";
import axios from "axios";

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
  { value: "625", label: "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

const EMPTY_FORM = {
  nombre_alias: "",
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
    nombre_alias: client.nombre_alias || "",
    rfc: client.rfc || "",
    razon_social: client.razon_social || "",
    codigo_postal_fiscal: client.codigo_postal_fiscal || "",
    regimen_codigo: client.regimen_codigo || "",
    email: client.email || "",
    telefono: client.telefono || "",
    uso_cfdi: "G03",
  };
}

export default function PublicInvoicePage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [timbrando, setTimbrando] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  const [saleData, setSaleData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const invoice = saleData?.invoice || null;
  const yaFacturada =
    saleData?.invoice_status === "timbrada" || invoice?.status === "timbrada";

  const saleItems = useMemo(() => saleData?.items || [], [saleData]);

  async function loadSale() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setPreviewMessage("");

      const { data } = await api.get(`/facturacion-publica/${token}`);

      if (!data?.ok) {
        throw new Error(data?.message || "No se pudo cargar la venta.");
      }

      setSaleData(data.data);
      setForm((prev) => {
        const incoming = normalizeClientToForm(data.data?.client);
        return { ...prev, ...incoming, uso_cfdi: prev.uso_cfdi || "G03" };
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Ocurrió un error al cargar la información."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadSale();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "rfc" ? value.toUpperCase() : value,
    }));
  }

  async function handlePreview() {
    try {
      setPreviewLoading(true);
      setError("");
      setSuccess("");
      setPreviewMessage("");

      const { data } = await api.post(
        `/facturacion-publica/${token}/preview`,
        form
      );

      if (!data?.ok) {
        throw new Error(data?.message || "No se pudo generar la vista previa.");
      }

      setPreviewData(data.data);
      setPreviewMessage(data.message || "Vista previa generada correctamente.");
    } catch (err) {
      setPreviewData(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo generar la vista previa."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleTimbrar() {
    try {
      setTimbrando(true);
      setError("");
      setSuccess("");
      setPreviewMessage("");

      const { data } = await api.post(
        `/facturacion-publica/${token}/timbrar`,
        form
      );

      if (!data?.ok) {
        throw new Error(data?.message || "No se pudo timbrar la factura.");
      }

      setSuccess(data.message || "Factura timbrada correctamente.");
      setPreviewData(null);
      await loadSale();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "No se pudo timbrar la factura."
      );
    } finally {
      setTimbrando(false);
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          px: 2,
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
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ReceiptLongIcon />
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Facturación de compra
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Captura tus datos fiscales para generar tu factura.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Venta #${saleData?.sale_id ?? "-"}`}
                  color="default"
                />
                <Chip
                  label={yaFacturada ? "Facturada" : "Pendiente"}
                  color={yaFacturada ? "success" : "warning"}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!!error && <Alert severity="error">{error}</Alert>}
        {!!success && <Alert severity="success">{success}</Alert>}
        {!!previewMessage && <Alert severity="info">{previewMessage}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Resumen de la compra
                  </Typography>

                  <Stack spacing={1.2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tienda
                      </Typography>
                      <Typography fontWeight={600}>
                        {saleData?.store?.name || "-"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Fecha
                      </Typography>
                      <Typography>{formatDate(saleData?.created_at)}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Método de pago
                      </Typography>
                      <Typography>{saleData?.payment_method || "-"}</Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {money(saleData?.total_amount)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        IVA
                      </Typography>
                      <Typography>{money(saleData?.iva_total)}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Productos
                  </Typography>

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
                          p: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Typography fontWeight={700}>
                          {item.descripcion || item.product_name || "Producto"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cantidad: {item.quantity} · Total:{" "}
                          {money(item.total_price)}
                        </Typography>
                        {item.estado && (
                          <Typography variant="caption" color="text.secondary">
                            Estado: {item.estado}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {yaFacturada && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Factura generada
                    </Typography>

                    <Stack spacing={1.2}>
                      <Typography>
                        <strong>Folio:</strong> {invoice?.folio || "-"}
                      </Typography>
                      <Typography>
                        <strong>Serie:</strong> {invoice?.serie || "-"}
                      </Typography>
                      <Typography sx={{ wordBreak: "break-all" }}>
                        <strong>UUID:</strong> {invoice?.uuid || "-"}
                      </Typography>
                      <Typography>
                        <strong>Timbrada:</strong>{" "}
                        {formatDate(invoice?.timbrado_at)}
                      </Typography>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ pt: 1 }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<PictureAsPdfIcon />}
                          href={invoice?.pdf_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          disabled={!invoice?.pdf_url}
                        >
                          Ver PDF
                        </Button>

                        <Button
                          variant="outlined"
                          startIcon={<CodeIcon />}
                          href={invoice?.xml_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          disabled={!invoice?.xml_url}
                        >
                          Ver XML
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Datos fiscales
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre o alias"
                      name="nombre_alias"
                      value={form.nombre_alias}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="RFC"
                      name="rfc"
                      value={form.rfc}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Razón social"
                      name="razon_social"
                      value={form.razon_social}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Código postal fiscal"
                      name="codigo_postal_fiscal"
                      value={form.codigo_postal_fiscal}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      select
                      SelectProps={{ native: true }}
                      label="Régimen fiscal"
                      name="regimen_codigo"
                      value={form.regimen_codigo}
                      onChange={handleChange}
                    >
                      <option value="">Selecciona una opción</option>
                      {REGIMENES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="email"
                      label="Correo electrónico"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      select
                      SelectProps={{ native: true }}
                      label="Uso CFDI"
                      name="uso_cfdi"
                      value={form.uso_cfdi}
                      onChange={handleChange}
                    >
                      {USOS_CFDI.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {!yaFacturada && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ mt: 3 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handlePreview}
                      disabled={previewLoading || timbrando}
                    >
                      {previewLoading ? "Generando vista previa..." : "Vista previa"}
                    </Button>

                    <Button
                      variant="contained"
                      onClick={handleTimbrar}
                      disabled={timbrando}
                    >
                      {timbrando ? "Timbrando..." : "Facturar"}
                    </Button>
                  </Stack>
                )}

                {previewData && !yaFacturada && (
                  <Box sx={{ mt: 4 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Vista previa
                    </Typography>

                    <Stack spacing={1}>
                      {previewData.items?.map((item) => (
                        <Box
                          key={item.sale_item_id}
                          sx={{
                            p: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                          }}
                        >
                          <Typography fontWeight={700}>
                            {item.descripcion}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cantidad: {item.cantidad} · Total: {money(item.total)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Clave SAT: {item.clave_producto_sat} · Unidad:{" "}
                            {item.clave_unidad_sat}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}