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
  Stack,
  Chip,
  Avatar,
  InputAdornment,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MessageIcon from "@mui/icons-material/Message";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ImageIcon from "@mui/icons-material/Image";
import TuneIcon from "@mui/icons-material/Tune";
import SaveIcon from "@mui/icons-material/Save";
import PreviewIcon from "@mui/icons-material/Preview";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PlaceIcon from "@mui/icons-material/Place";

import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";
import ticketHelpContent from "../../utils/ticketHelpContent";
import ModalPDFPreview from "../../components/tickets/ModalPDFPreview";
import GateTaeconta from "../../components/auth/GateTaeconta";
import useReglaTaeconta from "../../hooks/useReglaTaeconta";
import { useAdminUi } from "../../context/AdminUiContext";

const SectionCollapse = ({
  sectionKey,
  icon,
  title,
  subtitle,
  children,
  sectionsOpen,
  toggleSection,
  theme,
}) => {
  const isOpen = sectionsOpen[sectionKey];

  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(15,23,42,0.08)",
        bgcolor: "background.paper",
        boxShadow: isOpen
          ? theme.palette.mode === "dark"
            ? "0 14px 32px rgba(0,0,0,.28)"
            : "0 14px 32px rgba(15,23,42,.08)"
          : "none",
        transition: "all .25s ease",
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 1.4, sm: 1.6 },
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(90deg, rgba(15,23,42,.96) 0%, rgba(30,41,59,.94) 100%)"
              : "linear-gradient(90deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
          borderBottom: isOpen ? "1px solid" : "none",
          borderColor: "divider",
        }}
      >
        <Box
          onClick={() => toggleSection(sectionKey)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            cursor: "pointer",
            width: "100%",
            userSelect: "none",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Avatar
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                bgcolor: "primary.main",
                color: "#fff",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 18px rgba(59,130,246,.28)"
                    : "0 8px 18px rgba(59,130,246,.18)",
              }}
            >
              {icon}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1rem", sm: "1.06rem" },
                  lineHeight: 1.2,
                  letterSpacing: 0.2,
                }}
              >
                {title}
              </Typography>

              {!!subtitle && (
                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.2,
                    fontSize: { xs: "0.79rem", sm: "0.86rem" },
                    lineHeight: 1.25,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>

          <IconButton
            size="small"
            tabIndex={-1}
            sx={{
              color: "primary.main",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,.05)"
                  : "rgba(15,23,42,.04)",
              border: "1px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,.08)"
                  : "rgba(15,23,42,.06)",
              flexShrink: 0,
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,.09)"
                    : "rgba(15,23,42,.06)",
              },
            }}
          >
            {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={isOpen} timeout={220}>
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 2.5 },
            pb: { xs: 2, sm: 2.5 },
            pt: 2,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(255,255,255,.01) 0%, rgba(255,255,255,.02) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,.45) 100%)",
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

const TicketEditForm = ({ onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const [sectionsOpen, setSectionsOpen] = useState({
    direccion: false,
    mensajes: false,
    opciones: false,
    logo: false,
    tecnica: false,
  });

  const API_BASE = "https://mitiendaenlineamx.com.mx";
  const { allowed, loading: gateLoading } = useReglaTaeconta(null, {
    ignorePOS: true,
  });
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

        showError("❌ No has personalizado tu ticket todavía.");
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

  const toggleSection = (key) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    setIsDirty(true);

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (formData.mensaje_1.length > 125) {
      newErrors.mensaje_1 = "Máximo 125 caracteres.";
    }

    if (formData.mensaje_2.length > 125) {
      newErrors.mensaje_2 = "Máximo 125 caracteres.";
    }

    if (formData.direccion.length > 300) {
      newErrors.direccion = "Máximo 300 caracteres.";
    }

    const ip = (formData.printer_ip || "").trim();
    const port = (formData.printer_port || "").trim();

    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    if (ip && !ipv4Regex.test(ip)) {
      newErrors.printer_ip = "Ingresa una IP válida.";
    }

    if (port) {
      const portNumber = Number(port);
      if (
        !Number.isInteger(portNumber) ||
        portNumber < 1 ||
        portNumber > 65535
      ) {
        newErrors.printer_port = "Puerto inválido.";
      }
    }

    if (![58, 80].includes(Number(formData.paper_size))) {
      newErrors.paper_size = "Selecciona 58 u 80.";
    }

    if (
      Number(formData.chars_per_line) < 16 ||
      Number(formData.chars_per_line) > 64
    ) {
      newErrors.chars_per_line = "Entre 16 y 64.";
    }

    if (
      Number(formData.qr_factura_size) < 1 ||
      Number(formData.qr_factura_size) > 16
    ) {
      newErrors.qr_factura_size = "Entre 1 y 16.";
    }

    if (
      Number(formData.qr_sitio_size) < 1 ||
      Number(formData.qr_sitio_size) > 16
    ) {
      newErrors.qr_sitio_size = "Entre 1 y 16.";
    }

    if (
      Number(formData.logo_max_width) < 64 ||
      Number(formData.logo_max_width) > 1024
    ) {
      newErrors.logo_max_width = "Entre 64 y 1024.";
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

      setIsDirty(false);
      showSuccess("✅ Ticket actualizado correctamente");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      showError(
        error?.response?.data?.message || "❌ Error al actualizar el ticket.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const premiumFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.92)",
      transition: "all .2s ease",
      "& fieldset": {
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.10)"
            : "rgba(15,23,42,0.10)",
      },
      "&:hover fieldset": {
        borderColor: theme.palette.primary.main,
      },
      "&.Mui-focused": {
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 0 0 4px rgba(59,130,246,.18)"
            : "0 0 0 4px rgba(59,130,246,.12)",
      },
    },
    "& .MuiFormHelperText-root": {
      mx: 0.5,
    },
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

  if (loading || gateLoading) {
    return (
      <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.2, sm: 2, md: 3 },
          borderRadius: { xs: 3, sm: 4, md: 5 },
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(15,23,42,0.08)",
          bgcolor: "background.paper",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 20px 50px rgba(0,0,0,.25)"
              : "0 20px 50px rgba(15,23,42,.06)",
        }}
      >
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <ReceiptLongIcon color="primary" />
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800}>
                  Personaliza tu TIcket
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.7 }}
              >
                Personaliza tu ticket con una vista más elegante, clara y
                moderna.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
            >
              <Tooltip title="Ver recomendaciones">
                <IconButton
                  onClick={() => setOpenHelp(true)}
                  sx={{
                    bgcolor: "primary.main",
                    color: "#fff",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <SectionCollapse
              sectionKey="direccion"
              icon={<PlaceIcon fontSize="small" />}
              title="Dirección"
              subtitle="Texto principal del encabezado"
              sectionsOpen={sectionsOpen}
              toggleSection={toggleSection}
              theme={theme}
            >
              <TextField
                label="Dirección del ticket"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                inputProps={{ maxLength: 300 }}
                helperText={
                  errors.direccion ||
                  `${formData.direccion.length}/300 caracteres`
                }
                error={!!errors.direccion}
                sx={premiumFieldSx}
              />
            </SectionCollapse>

            <SectionCollapse
              sectionKey="mensajes"
              icon={<MessageIcon fontSize="small" />}
              title="Mensajes"
              subtitle="Textos antes y después del contenido del QR"
              sectionsOpen={sectionsOpen}
              toggleSection={toggleSection}
              theme={theme}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 1.3,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,.06)"
                          : "rgba(15,23,42,.06)",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,.02)"
                          : "rgba(248,250,252,.72)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 1,
                        color: "text.secondary",
                        fontWeight: 700,
                        letterSpacing: 0.3,
                      }}
                    >
                      MENSAJE SUPERIOR
                    </Typography>

                    <TextField
                      label="Mensaje 1"
                      name="mensaje_1"
                      value={formData.mensaje_1}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      inputProps={{ maxLength: 125 }}
                      helperText={
                        errors.mensaje_1 ||
                        `${formData.mensaje_1.length}/125 caracteres`
                      }
                      error={!!errors.mensaje_1}
                      sx={{
                        ...premiumFieldSx,
                        "& .MuiOutlinedInput-root": {
                          ...premiumFieldSx["& .MuiOutlinedInput-root"],
                          minHeight: { xs: 132, md: 145 },
                        },
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 1.3,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,.06)"
                          : "rgba(15,23,42,.06)",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,.02)"
                          : "rgba(248,250,252,.72)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 1,
                        color: "text.secondary",
                        fontWeight: 700,
                        letterSpacing: 0.3,
                      }}
                    >
                      MENSAJE INFERIOR
                    </Typography>

                    <TextField
                      label="Mensaje 2"
                      name="mensaje_2"
                      value={formData.mensaje_2}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      inputProps={{ maxLength: 125 }}
                      helperText={
                        errors.mensaje_2 ||
                        `${formData.mensaje_2.length}/125 caracteres`
                      }
                      error={!!errors.mensaje_2}
                      sx={{
                        ...premiumFieldSx,
                        "& .MuiOutlinedInput-root": {
                          ...premiumFieldSx["& .MuiOutlinedInput-root"],
                          minHeight: { xs: 132, md: 145 },
                        },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </SectionCollapse>

            <SectionCollapse
              sectionKey="opciones"
              icon={<ToggleOnIcon fontSize="small" />}
              title="Opciones rápidas"
              subtitle="Activa o desactiva funciones del ticket"
              sectionsOpen={sectionsOpen}
              toggleSection={toggleSection}
              theme={theme}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    lg: "1fr 1fr 1fr",
                  },
                  gap: 1.2,
                }}
              >
                <Tooltip
                  title={allowed ? "" : "Requiere plan y complemento Taeconta"}
                >
                  <span>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="qr_factura"
                          checked={!!formData.qr_factura}
                          onChange={handleChange}
                          disabled={!allowed}
                        />
                      }
                      label="QR factura SAT"
                      sx={{
                        m: 0,
                        px: 1.2,
                        py: 1,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        width: "100%",
                        bgcolor: "background.default",
                      }}
                    />
                  </span>
                </Tooltip>

                <FormControlLabel
                  control={
                    <Checkbox
                      name="qr_sitio"
                      checked={formData.qr_sitio}
                      onChange={handleChange}
                    />
                  }
                  label="QR sitio web"
                  sx={{
                    m: 0,
                    px: 1.2,
                    py: 1,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                    width: "100%",
                    bgcolor: "background.default",
                  }}
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
                  sx={{
                    m: 0,
                    px: 1.2,
                    py: 1,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                    width: "100%",
                    bgcolor: "background.default",
                  }}
                />
              </Box>
            </SectionCollapse>

            <SectionCollapse
              sectionKey="logo"
              icon={<ImageIcon fontSize="small" />}
              title="Logo"
              subtitle="Sube, visualiza y ajusta el logo del ticket"
              sectionsOpen={sectionsOpen}
              toggleSection={toggleSection}
              theme={theme}
            >
              <Grid container spacing={2.5} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Ancho máximo del logo"
                    name="logo_max_width"
                    value={formData.logo_max_width}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.logo_max_width}
                    helperText={errors.logo_max_width || "Ej. 256 o 384"}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">px</InputAdornment>
                      ),
                    }}
                    sx={premiumFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={7}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="flex-start"
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ minHeight: 46, borderRadius: 2.5 }}
                      fullWidth={isMobile}
                    >
                      Subir logo
                      <input
                        type="file"
                        hidden
                        name="logo"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                        onChange={handleChange}
                      />
                    </Button>

                    <Button
                      color="error"
                      variant="text"
                      startIcon={<DeleteOutlineIcon />}
                      sx={{ minHeight: 46, borderRadius: 2.5 }}
                      fullWidth={isMobile}
                      disabled={!formData.logo_preview && !formData.logo}
                      onClick={() => {
                        const confirmado = window.confirm(
                          "¿Eliminar el logo actual?",
                        );
                        if (confirmado) {
                          setFormData((prev) => ({
                            ...prev,
                            logo: null,
                            logo_preview: "",
                            eliminar_logo: true,
                          }));
                          setIsDirty(true);
                          showSuccess("✅ Logo marcado para eliminación.");
                        }
                      }}
                    >
                      Eliminar logo
                    </Button>
                  </Stack>
                </Grid>

                {formData.logo_preview && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: "1px dashed",
                        borderColor: "divider",
                        textAlign: "center",
                        bgcolor: "action.hover",
                      }}
                    >
                      <img
                        src={formData.logo_preview}
                        alt="Vista previa"
                        style={{
                          maxWidth: "100%",
                          width: 220,
                          maxHeight: 140,
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  </Grid>
                )}

                {errors.logo && (
                  <Grid item xs={12}>
                    <Typography color="error" fontSize={13}>
                      {errors.logo}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </SectionCollapse>

            <SectionCollapse
              sectionKey="tecnica"
              icon={<TuneIcon fontSize="small" />}
              title="Configuración técnica"
              subtitle="Papel, líneas, QR y conexión"
              sectionsOpen={sectionsOpen}
              toggleSection={toggleSection}
              theme={theme}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Tamaño de papel"
                    name="paper_size"
                    value={formData.paper_size}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.paper_size}
                    helperText={errors.paper_size || "58 mm u 80 mm"}
                    sx={premiumFieldSx}
                  >
                    <MenuItem value="58">58 mm</MenuItem>
                    <MenuItem value="80">80 mm</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Caracteres por línea"
                    name="chars_per_line"
                    value={formData.chars_per_line}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.chars_per_line}
                    helperText={errors.chars_per_line || "32 o 48 aprox."}
                    sx={premiumFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Tamaño QR factura"
                    name="qr_factura_size"
                    value={formData.qr_factura_size}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.qr_factura_size}
                    helperText={errors.qr_factura_size || "1 a 16"}
                    sx={premiumFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Tamaño QR sitio"
                    name="qr_sitio_size"
                    value={formData.qr_sitio_size}
                    onChange={handleChange}
                    fullWidth
                    error={!!errors.qr_sitio_size}
                    helperText={errors.qr_sitio_size || "1 a 16"}
                    sx={premiumFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="IP impresora"
                    name="printer_ip"
                    value={formData.printer_ip}
                    onChange={handleChange}
                    fullWidth
                    placeholder="192.168.1.100"
                    error={!!errors.printer_ip}
                    helperText={errors.printer_ip || "Opcional"}
                    sx={premiumFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Puerto"
                    name="printer_port"
                    value={formData.printer_port}
                    onChange={handleChange}
                    fullWidth
                    placeholder="9100"
                    error={!!errors.printer_port}
                    helperText={errors.printer_port || "Opcional"}
                    sx={premiumFieldSx}
                  />
                </Grid>
              </Grid>
            </SectionCollapse>

            <Divider sx={{ my: 2.5 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="flex-end"
            >
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                sx={{
                  minWidth: { xs: "100%", sm: 190 },
                  minHeight: 48,
                  borderRadius: 3,
                  fontWeight: 800,
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>

              <Button
                variant="outlined"
                onClick={() => setOpen(true)}
                disabled={isDirty || isSubmitting}
                startIcon={<PreviewIcon />}
                sx={{
                  minWidth: { xs: "100%", sm: 190 },
                  minHeight: 48,
                  borderRadius: 3,
                  fontWeight: 700,
                }}
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
