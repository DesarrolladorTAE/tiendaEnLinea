import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  Modal,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  InputAdornment,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import PrintIcon from "@mui/icons-material/Print";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ImageIcon from "@mui/icons-material/Image";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TuneIcon from "@mui/icons-material/Tune";
import SaveIcon from "@mui/icons-material/Save";
import PreviewIcon from "@mui/icons-material/Preview";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";
import ticketHelpContent from "../../utils/ticketHelpContent";
import ModalPDFPreview from "../../components/tickets/ModalPDFPreview";

import GateTaeconta from "../../components/auth/GateTaeconta";
import useReglaTaeconta from "../../hooks/useReglaTaeconta";
import { useAdminUi } from "../../context/AdminUiContext";

const TicketEditForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    direccion: "",
    mensaje_1: "",
    mensaje_2: "",
    qr_factura: false,
    qr_sitio: false,
    mostrar_iva: true,
    printer_ip: "",
    printer_port: "",
    paper_size: "80",
    chars_per_line: "48",
    qr_factura_size: "7",
    qr_sitio_size: "7",
    logo_max_width: "384",
    logo: null,
    logo_preview: "",
    eliminar_logo: false,
  });

  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [openHelp, setOpenHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = "https://mitiendaenlineamx.com.mx";
  const { allowed, loading: gateLoading } = useReglaTaeconta();
  const { selectedBranch } = useAdminUi();
  const branchId = selectedBranch?.id ?? null;

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);

      try {
        const res = await axiosClient.get("/ticket-view", {
          params: { branch_id: branchId },
        });

        const ticket = res.data;

        setFormData((prev) => ({
          ...prev,
          direccion: ticket.direccion || "",
          mensaje_1: ticket.mensaje_1 || "",
          mensaje_2: ticket.mensaje_2 || "",
          qr_factura: allowed ? !!ticket.qr_factura : false,
          qr_sitio: !!ticket.qr_sitio,
          mostrar_iva:
            ticket.mostrar_iva !== undefined ? !!ticket.mostrar_iva : true,
          printer_ip: ticket.printer_ip || "",
          printer_port:
            ticket.printer_port !== null && ticket.printer_port !== undefined
              ? String(ticket.printer_port)
              : "",
          paper_size: String(ticket.paper_size ?? 80),
          chars_per_line: String(ticket.chars_per_line ?? 48),
          qr_factura_size: String(ticket.qr_factura_size ?? 7),
          qr_sitio_size: String(ticket.qr_sitio_size ?? 7),
          logo_max_width: String(ticket.logo_max_width ?? 384),
          logo_preview: ticket.logo
            ? `${API_BASE}/storage/${ticket.logo}?t=${Date.now()}`
            : "",
          logo: null,
          eliminar_logo: false,
        }));

        setIsDirty(false);
      } catch (error) {
        console.error("❌ Error al cargar ticket:", error?.response?.data || error);

        setFormData((prev) => ({
          ...prev,
          direccion: "",
          mensaje_1: "",
          mensaje_2: "",
          qr_factura: false,
          qr_sitio: false,
          mostrar_iva: true,
          printer_ip: "",
          printer_port: "",
          paper_size: "80",
          chars_per_line: "48",
          qr_factura_size: "7",
          qr_sitio_size: "7",
          logo_max_width: "384",
          logo: null,
          logo_preview: "",
          eliminar_logo: false,
        }));

        showError(
          "❌ No has personalizado tu ticket. Revisa la guía y comienza ahora."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [allowed, branchId]);

  useEffect(() => {
    if (!allowed && formData.qr_factura) {
      setFormData((prev) => ({ ...prev, qr_factura: false }));
    }
  }, [allowed, formData.qr_factura]);

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    setIsDirty(true);

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (type === "file") {
      const file = files?.[0];

      if (file && file.size > 3 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logo: "El logo no debe superar los 3MB.",
        }));
        return;
      }

      setErrors((prev) => ({ ...prev, logo: null }));

      setFormData((prev) => ({
        ...prev,
        logo: file || null,
        logo_preview: file ? URL.createObjectURL(file) : prev.logo_preview,
        eliminar_logo: false,
      }));
      return;
    }

    if (name === "paper_size") {
      const nextPaper = String(value);

      setFormData((prev) => ({
        ...prev,
        paper_size: nextPaper,
        chars_per_line: nextPaper === "58" ? "32" : "48",
        qr_factura_size: nextPaper === "58" ? "5" : "7",
        qr_sitio_size: nextPaper === "58" ? "5" : "7",
        logo_max_width: nextPaper === "58" ? "256" : "384",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (formData.mensaje_1.length > 25) {
      newErrors.mensaje_1 = "Máximo 25 caracteres.";
    }

    if (formData.mensaje_2.length > 25) {
      newErrors.mensaje_2 = "Máximo 25 caracteres.";
    }

    if (formData.direccion.length > 100) {
      newErrors.direccion = "Máximo 100 caracteres.";
    }

    const ip = (formData.printer_ip || "").trim();
    const port = (formData.printer_port || "").trim();

    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    if (ip && !ipv4Regex.test(ip)) {
      newErrors.printer_ip = "Ingresa una IP válida. Ejemplo: 192.168.1.100";
    }

    if (port) {
      const portNumber = Number(port);
      if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
        newErrors.printer_port = "Ingresa un puerto válido entre 1 y 65535.";
      }
    }

    const paperSize = Number(formData.paper_size);
    if (![58, 80].includes(paperSize)) {
      newErrors.paper_size = "Selecciona 58 mm u 80 mm.";
    }

    const charsPerLine = Number(formData.chars_per_line);
    if (!Number.isInteger(charsPerLine) || charsPerLine < 16 || charsPerLine > 64) {
      newErrors.chars_per_line = "Debe estar entre 16 y 64.";
    }

    const qrFacturaSize = Number(formData.qr_factura_size);
    if (!Number.isInteger(qrFacturaSize) || qrFacturaSize < 1 || qrFacturaSize > 16) {
      newErrors.qr_factura_size = "Debe estar entre 1 y 16.";
    }

    const qrSitioSize = Number(formData.qr_sitio_size);
    if (!Number.isInteger(qrSitioSize) || qrSitioSize < 1 || qrSitioSize > 16) {
      newErrors.qr_sitio_size = "Debe estar entre 1 y 16.";
    }

    const logoMaxWidth = Number(formData.logo_max_width);
    if (!Number.isInteger(logoMaxWidth) || logoMaxWidth < 64 || logoMaxWidth > 1024) {
      newErrors.logo_max_width = "Debe estar entre 64 y 1024.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showError("Corrige los errores antes de guardar.");
      return;
    }

    setIsSubmitting(true);

    const safeData = {
      ...formData,
      qr_factura: allowed ? formData.qr_factura : false,
      printer_ip: (formData.printer_ip || "").trim(),
      printer_port: (formData.printer_port || "").trim(),
    };

    const form = new FormData();
    form.append("_method", "PUT");

    if (branchId !== null && branchId !== undefined && branchId !== "") {
      form.append("branch_id", String(branchId));
    }

    Object.entries(safeData).forEach(([key, value]) => {
      if (key === "logo_preview") return;

      if (key === "logo") {
        if (value) form.append(key, value);
      } else if (typeof value === "boolean") {
        form.append(key, value ? "1" : "0");
      } else {
        form.append(key, value ?? "");
      }
    });

    form.append("eliminar_logo", safeData.eliminar_logo ? "1" : "0");

    try {
      await axiosClient.post("/ticket", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const res = await axiosClient.get("/ticket-view", {
        params: { branch_id: branchId },
      });

      const ticket = res.data;

      setFormData((prev) => ({
        ...prev,
        direccion: ticket.direccion || "",
        mensaje_1: ticket.mensaje_1 || "",
        mensaje_2: ticket.mensaje_2 || "",
        qr_factura: allowed ? !!ticket.qr_factura : false,
        qr_sitio: !!ticket.qr_sitio,
        mostrar_iva:
          ticket.mostrar_iva !== undefined ? !!ticket.mostrar_iva : true,
        printer_ip: ticket.printer_ip || "",
        printer_port:
          ticket.printer_port !== null && ticket.printer_port !== undefined
            ? String(ticket.printer_port)
            : "",
        paper_size: String(ticket.paper_size ?? 80),
        chars_per_line: String(ticket.chars_per_line ?? 48),
        qr_factura_size: String(ticket.qr_factura_size ?? 7),
        qr_sitio_size: String(ticket.qr_sitio_size ?? 7),
        logo_max_width: String(ticket.logo_max_width ?? 384),
        logo: null,
        logo_preview: ticket.logo
          ? `${API_BASE}/storage/${ticket.logo}?t=${Date.now()}`
          : "",
        eliminar_logo: false,
      }));

      setIsDirty(false);
      showSuccess("✅ Ticket actualizado correctamente");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("❌ Error al actualizar ticket:", error?.response?.data || error);
      showError(
        error?.response?.data?.message || "❌ Error al actualizar el ticket."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHelpSection = () => (
    <Modal open={openHelp} onClose={() => setOpenHelp(false)}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          m: "auto",
          width: { xs: "92%", sm: "88%", md: 620 },
          maxHeight: "82vh",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={700}>
            ℹ️ Guía para personalizar el ticket
          </Typography>
        </Box>

        <Box sx={{ p: 3, overflowY: "auto", maxHeight: "calc(82vh - 72px)" }}>
          {Object.entries(ticketHelpContent).map(([key, section]) => (
            <Box key={key} mb={2.5}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {section.title}
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {section.details.map((line, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">{line}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  );

  const SectionCard = ({ icon, title, subtitle, children }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography fontWeight={800}>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );

  if (loading || gateLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="260px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          bgcolor: "#fff",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2,
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <ReceiptLongIcon color="primary" />
                <Typography variant="h5" fontWeight={800}>
                  Configuración de ticket
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                Personaliza impresión, QR, logo y formato visual de tu ticket.
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                <Chip
                  size="small"
                  label={
                    branchId
                      ? `Sucursal #${branchId}`
                      : "Sin sucursal seleccionada"
                  }
                  color={branchId ? "primary" : "default"}
                  variant={branchId ? "filled" : "outlined"}
                />
                <Chip
                  size="small"
                  label={`${formData.paper_size} mm`}
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Tooltip title="Ver recomendaciones">
              <IconButton
                onClick={() => setOpenHelp(true)}
                sx={{
                  bgcolor: "#1976d2",
                  "&:hover": { bgcolor: "#1565c0" },
                  color: "#fff",
                  width: 48,
                  height: 48,
                  boxShadow: 3,
                }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <SectionCard
                  icon={<ReceiptLongIcon fontSize="small" />}
                  title="Contenido del ticket"
                  subtitle="Texto principal que verá el cliente"
                >
                  <Stack spacing={2}>
                    <TextField
                      label="Dirección"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={3}
                      inputProps={{ maxLength: 100 }}
                      helperText={
                        errors.direccion || `${formData.direccion.length}/100 caracteres`
                      }
                      error={!!errors.direccion}
                    />

                    <TextField
                      label="Mensaje 1"
                      name="mensaje_1"
                      value={formData.mensaje_1}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ maxLength: 25 }}
                      helperText={
                        errors.mensaje_1 || `${formData.mensaje_1.length}/25 caracteres`
                      }
                      error={!!errors.mensaje_1}
                    />

                    <TextField
                      label="Mensaje 2"
                      name="mensaje_2"
                      value={formData.mensaje_2}
                      onChange={handleChange}
                      fullWidth
                      inputProps={{ maxLength: 25 }}
                      helperText={
                        errors.mensaje_2 || `${formData.mensaje_2.length}/25 caracteres`
                      }
                      error={!!errors.mensaje_2}
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="mostrar_iva"
                          checked={formData.mostrar_iva}
                          onChange={handleChange}
                        />
                      }
                      label="Mostrar desglose de IVA"
                    />
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard
                  icon={<SettingsEthernetIcon fontSize="small" />}
                  title="Impresora TCP/IP"
                  subtitle="Configuración opcional para impresora en red"
                >
                  <Stack spacing={2}>
                    <TextField
                      label="IP de impresora"
                      name="printer_ip"
                      value={formData.printer_ip}
                      onChange={handleChange}
                      fullWidth
                      placeholder="192.168.1.100"
                      helperText={errors.printer_ip || "Opcional"}
                      error={!!errors.printer_ip}
                    />

                    <TextField
                      label="Puerto"
                      name="printer_port"
                      value={formData.printer_port}
                      onChange={handleChange}
                      fullWidth
                      placeholder="9100"
                      helperText={errors.printer_port || "Opcional"}
                      error={!!errors.printer_port}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    />
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard
                  icon={<PrintIcon fontSize="small" />}
                  title="Formato de impresión"
                  subtitle="Ajustes para 58 mm y 80 mm"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Tamaño de papel"
                        name="paper_size"
                        value={formData.paper_size}
                        onChange={handleChange}
                        fullWidth
                        helperText={errors.paper_size || "58 mm o 80 mm"}
                        error={!!errors.paper_size}
                      >
                        <MenuItem value="58">58 mm</MenuItem>
                        <MenuItem value="80">80 mm</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Caracteres por línea"
                        name="chars_per_line"
                        value={formData.chars_per_line}
                        onChange={handleChange}
                        fullWidth
                        helperText={errors.chars_per_line || "32 o 48 aprox."}
                        error={!!errors.chars_per_line}
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      border: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Al cambiar el tamaño del papel, se sugieren valores automáticos
                      para QR, caracteres y ancho del logo.
                    </Typography>
                  </Box>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard
                  icon={<QrCode2Icon fontSize="small" />}
                  title="QR y logo"
                  subtitle="Control visual para impresión"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Tamaño QR factura"
                        name="qr_factura_size"
                        value={formData.qr_factura_size}
                        onChange={handleChange}
                        fullWidth
                        helperText={errors.qr_factura_size || "Entre 1 y 16"}
                        error={!!errors.qr_factura_size}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Tamaño QR sitio"
                        name="qr_sitio_size"
                        value={formData.qr_sitio_size}
                        onChange={handleChange}
                        fullWidth
                        helperText={errors.qr_sitio_size || "Entre 1 y 16"}
                        error={!!errors.qr_sitio_size}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Ancho máximo del logo"
                        name="logo_max_width"
                        value={formData.logo_max_width}
                        onChange={handleChange}
                        fullWidth
                        helperText={errors.logo_max_width || "Ej. 256 o 384"}
                        error={!!errors.logo_max_width}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">px</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <GateTaeconta
                      fallback={
                        <Tooltip title="Requiere plan y complemento de Taeconta activos">
                          <span>
                            <FormControlLabel
                              control={<Checkbox checked={false} disabled />}
                              label="QR Factura (facturación SAT)"
                            />
                          </span>
                        </Tooltip>
                      }
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="qr_factura"
                            checked={formData.qr_factura}
                            onChange={handleChange}
                          />
                        }
                        label="QR Factura (facturación SAT)"
                      />
                    </GateTaeconta>

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="qr_sitio"
                          checked={formData.qr_sitio}
                          onChange={handleChange}
                        />
                      }
                      label="QR Sitio web"
                    />
                  </Stack>
                </SectionCard>
              </Grid>

              <Grid item xs={12}>
                <SectionCard
                  icon={<ImageIcon fontSize="small" />}
                  title="Logo del ticket"
                  subtitle="Sube y previsualiza el logo de impresión"
                >
                  <Stack spacing={2}>
                    {formData.logo_preview && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "grey.50",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          gutterBottom
                        >
                          Vista previa del logo
                        </Typography>
                        <img
                          src={formData.logo_preview}
                          alt="Vista previa"
                          style={{
                            maxWidth: "100%",
                            width: 260,
                            maxHeight: 150,
                            objectFit: "contain",
                            borderRadius: 12,
                          }}
                        />
                      </Box>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          sx={{ minHeight: 44 }}
                        >
                          Subir nuevo logo
                          <input
                            type="file"
                            name="logo"
                            hidden
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={handleChange}
                          />
                        </Button>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Button
                          variant="text"
                          color="error"
                          fullWidth
                          startIcon={<DeleteOutlineIcon />}
                          sx={{ minHeight: 44 }}
                          onClick={() => {
                            const confirmado = window.confirm(
                              "¿Estás seguro de que deseas eliminar el logo actual?"
                            );

                            if (confirmado) {
                              setFormData((prev) => ({
                                ...prev,
                                logo: null,
                                logo_preview: "",
                                eliminar_logo: true,
                              }));
                              setIsDirty(true);
                              showSuccess(
                                "✅ Logo marcado para eliminación. Guarda cambios para aplicar."
                              );
                            }
                          }}
                          disabled={!formData.logo_preview && !formData.logo}
                        >
                          Eliminar logo actual
                        </Button>
                      </Grid>
                    </Grid>

                    {errors.logo && (
                      <Typography color="error" fontSize={13}>
                        {errors.logo}
                      </Typography>
                    )}
                  </Stack>
                </SectionCard>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="flex-end"
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!isDirty || isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                sx={{ minWidth: 180, minHeight: 44, borderRadius: 2.5 }}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setOpen(true)}
                disabled={isDirty || isSubmitting}
                startIcon={<PreviewIcon />}
                sx={{ minWidth: 180, minHeight: 44, borderRadius: 2.5 }}
              >
                Vista previa
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {renderHelpSection()}

      <ModalPDFPreview
        open={open}
        onClose={() => setOpen(false)}
        endpoint={
          branchId !== null && branchId !== undefined && branchId !== ""
            ? `/ticket/preview?branch_id=${branchId}`
            : "/ticket/preview"
        }
        nombreArchivo="ticket-preview.pdf"
      />
    </>
  );
};

export default TicketEditForm;