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
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";
import ticketHelpContent from "../../utils/ticketHelpContent";
import ModalPDFPreview from "../../components/tickets/ModalPDFPreview";

// 👇 imports para el gate
import GateTaeconta from "../../components/auth/GateTaeconta";
import useReglaTaeconta from "../../hooks/useReglaTaeconta";

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
    logo: null,
    logo_preview: "",
    eliminar_logo: false,
  });

  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [openHelp, setOpenHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const API_BASE = "https://mitiendaenlineamx.com.mx";
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👇 estado del gate
  const { allowed, loading: gateLoading } = useReglaTaeconta();

  useEffect(() => {
    axiosClient
      .get("/ticket-view")
      .then((res) => {
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
          logo_preview: ticket.logo
            ? `${API_BASE}/storage/${ticket.logo}?t=${Date.now()}`
            : "",
          logo: null,
          eliminar_logo: false,
        }));
      })
      .catch(() => {
        showError(
          "❌ No haz personalizado tu Ticket para tus ventas. Revisa las especificaciones en el icono ---ℹ️---   😊 Empieza ahora."
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  useEffect(() => {
    if (!allowed && formData.qr_factura) {
      setFormData((prev) => ({ ...prev, qr_factura: false }));
    }
  }, [allowed, formData.qr_factura]);

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    setIsDirty(true);

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      const file = files[0];
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
        logo: file,
        logo_preview: URL.createObjectURL(file),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (formData.mensaje_1.length > 25)
      newErrors.mensaje_1 = "Máximo 25 caracteres.";

    if (formData.mensaje_2.length > 25)
      newErrors.mensaje_2 = "Máximo 25 caracteres.";

    if (formData.direccion.length > 100)
      newErrors.direccion = "Máximo 100 caracteres.";

    const ip = (formData.printer_ip || "").trim();
    const port = (formData.printer_port || "").trim();

    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    if (ip && !ipv4Regex.test(ip)) {
      newErrors.printer_ip = "Ingresa una IP válida. Ejemplo: 192.168.1.100";
    }

    if (port) {
      const portNumber = Number(port);
      if (
        !Number.isInteger(portNumber) ||
        portNumber < 1 ||
        portNumber > 65535
      ) {
        newErrors.printer_port =
          "Ingresa un puerto válido entre 1 y 65535.";
      }
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

      const res = await axiosClient.get("/ticket-view");
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
        logo: null,
        logo_preview: ticket.logo
          ? `${API_BASE}/storage/${ticket.logo}?t=${Date.now()}`
          : "",
        eliminar_logo: false,
      }));

      showSuccess("✅ Ticket actualizado correctamente");
      onSuccess?.();
      onClose?.();
      setIsDirty(false);
    } catch {
      showError("❌ Error al actualizar el ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHelpSection = () => (
    <Modal open={openHelp} onClose={() => setOpenHelp(false)}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 600,
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 3,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            bgcolor: "background.paper",
            zIndex: 2,
            p: 2,
            borderBottom: "1px solid #ddd",
          }}
        >
          <Typography variant="h6">
            ℹ️ Guía para personalizar el ticket
          </Typography>
        </Box>

        <Box sx={{ p: 3, overflowY: "auto" }}>
          {Object.entries(ticketHelpContent).map(([key, section]) => (
            <Box key={key} mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, bgcolor: "#fafafa" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            🧾 Editar Información del Ticket
          </Typography>
          <Tooltip title="Ver recomendaciones">
            <Box
              sx={{
                animation: "vibrate 1s infinite",
                "@keyframes vibrate": {
                  "0%": { transform: "rotate(0deg)" },
                  "20%": { transform: "rotate(-5deg)" },
                  "40%": { transform: "rotate(5deg)" },
                  "60%": { transform: "rotate(-4deg)" },
                  "80%": { transform: "rotate(4deg)" },
                  "100%": { transform: "rotate(0deg)" },
                },
              }}
            >
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
                <InfoIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <TextField
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            fullWidth
            margin="normal"
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
            margin="normal"
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
            margin="normal"
            inputProps={{ maxLength: 25 }}
            helperText={
              errors.mensaje_2 || `${formData.mensaje_2.length}/25 caracteres`
            }
            error={!!errors.mensaje_2}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Impresora térmica TCP/IP
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estos campos son opcionales. Si tu impresora está en red, puedes
            guardar su IP y puerto aquí. El puerto más común es 9100.
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
            gap={2}
          >
            <TextField
              label="IP de impresora"
              name="printer_ip"
              value={formData.printer_ip}
              onChange={handleChange}
              fullWidth
              placeholder="Ej. 192.168.1.100"
              helperText={errors.printer_ip || "Opcional"}
              error={!!errors.printer_ip}
            />

            <TextField
              label="Puerto"
              name="printer_port"
              value={formData.printer_port}
              onChange={handleChange}
              fullWidth
              placeholder="Ej. 9100"
              helperText={errors.printer_port || "Opcional"}
              error={!!errors.printer_port}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            />
          </Box>

          <Box display="flex" gap={3} mt={3} flexWrap="wrap">
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
              label="QR Sitio Web"
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
          </Box>

          {formData.logo_preview && (
            <Box textAlign="center" mt={3}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Vista previa del logo
              </Typography>
              <img
                src={formData.logo_preview}
                alt="Vista previa"
                style={{
                  width: 250,
                  maxHeight: 150,
                  objectFit: "contain",
                  borderRadius: 12,
                }}
              />
            </Box>
          )}

          <Button variant="outlined" component="label" fullWidth sx={{ my: 3 }}>
            Subir nuevo logo (JPG/PNG máx. 3MB)
            <input
              type="file"
              name="logo"
              hidden
              accept="image/png, image/jpeg"
              onChange={handleChange}
            />
          </Button>

          <Button
            variant="text"
            color="error"
            fullWidth
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

          {errors.logo && (
            <Typography color="error" fontSize={13}>
              {errors.logo}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box display="flex" gap={2}>
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!isDirty || isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
                sx={{ height: 40 }}
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => setOpen(true)}
                disabled={isDirty || isSubmitting}
                sx={{ height: 40 }}
              >
                Vista Previa
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {renderHelpSection()}

      <ModalPDFPreview
        open={open}
        onClose={() => setOpen(false)}
        endpoint="/ticket/preview"
        nombreArchivo="ticket-preview.pdf"
      />
    </>
  );
};

export default TicketEditForm;