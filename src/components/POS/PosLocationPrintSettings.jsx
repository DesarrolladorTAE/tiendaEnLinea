import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import CableRoundedIcon from "@mui/icons-material/CableRounded";
import AutoModeRoundedIcon from "@mui/icons-material/AutoModeRounded";
import axiosClientPOS from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";
import PosAvailableApps from "./PosAvailableApps";

const APP_OPTIONS = [
  { value: "windows_usb", label: "Windows USB" },
  { value: "windows_ip", label: "Windows IP / LAN" },
  { value: "android_usb", label: "Android USB" },
  { value: "android_ip", label: "Android IP / LAN" },
  { value: "ios_ip", label: "iPhone IP / LAN" },
  { value: "ios_ble", label: "iPhone Bluetooth BLE" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function PosLocationPrintSettings({ cambiarVista, posLocationId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    app_type: "",
    is_enabled: false,
    auto_send_payload: false,
  });

  const selectedApp = useMemo(
    () => APP_OPTIONS.find((item) => item.value === form.app_type),
    [form.app_type]
  );

  useEffect(() => {
    fetchSetting();
  }, [posLocationId]);

  const fetchSetting = async () => {
    if (!posLocationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data } = await axiosClientPOS.get(
        `/pos/print-settings/${posLocationId}`
      );

      if (data?.configured && data?.data) {
        setForm({
          app_type: data.data.app_type || "",
          is_enabled: Boolean(data.data.is_enabled),
          auto_send_payload: Boolean(data.data.auto_send_payload),
        });
      }
    } catch (error) {
      console.error(error);
      showError("No se pudo cargar la configuración del punto de venta.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!posLocationId) {
      showError("No se encontró el punto de venta.");
      return;
    }

    if (form.is_enabled && !form.app_type) {
      showError("Selecciona el tipo de aplicación.");
      return;
    }

    try {
      setSaving(true);

      await axiosClientPOS.post(`/pos/print-settings/${posLocationId}`, {
        app_type: form.app_type || null,
        is_enabled: form.is_enabled,
        auto_send_payload: form.auto_send_payload,
        config: null,
      });

      showSuccess("Configuración guardada correctamente.");
    } catch (error) {
      console.error(error);
      showError(
        error?.response?.data?.message || "No se pudo guardar la configuración."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        minHeight="65vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        p: { xs: 1.5, sm: 2.5, md: 4 },
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,.16), transparent 34%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1050, mx: "auto" }}>
        <Box sx={{ mb: { xs: 2, md: 3.5 }, display: "flex" }}>
          <Button
            fullWidth={isMobile}
            startIcon={<DashboardIcon />}
            onClick={() => cambiarVista("menu")}
            sx={{
              px: { xs: 2, md: 2.6 },
              py: 1.05,
              borderRadius: "14px",
              fontWeight: 900,
              fontSize: { xs: "0.82rem", sm: "0.88rem" },
              textTransform: "none",
              color: "#166534",
              bgcolor: "rgba(240,253,244,.95)",
              border: "1px solid rgba(22,101,52,.28)",
              boxShadow: "0 10px 24px rgba(22,101,52,.10)",
              letterSpacing: ".2px",
              "&:hover": {
                bgcolor: "#dcfce7",
                borderColor: "rgba(22,101,52,.42)",
                boxShadow: "0 14px 30px rgba(22,101,52,.16)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Regresar al Panel
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            borderRadius: { xs: 3, md: 5 },
            border: "1px solid rgba(37,99,235,.14)",
            boxShadow: {
              xs: "0 12px 34px rgba(15,23,42,.10)",
              md: "0 24px 70px rgba(15,23,42,.12)",
            },
            bgcolor: "#fff",
          }}
        >
          <Box
            sx={{
              p: { xs: 2.3, sm: 3, md: 4 },
              color: "#fff",
              background:
                "linear-gradient(135deg, #0f172a 0%, #1d4ed8 48%, #38bdf8 100%)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 2, sm: 2 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Box
                  sx={{
                    width: { xs: 50, md: 58 },
                    height: { xs: 50, md: 58 },
                    minWidth: { xs: 50, md: 58 },
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SettingsSuggestRoundedIcon
                    sx={{ fontSize: { xs: 30, md: 34 } }}
                  />
                </Box>

                <Box sx={{ maxWidth: "100%" }}>
                  <Typography
                    fontWeight={950}
                    color="white"
                    sx={{
                      fontSize: { xs: "1.45rem", sm: "1.85rem", md: "2.2rem" },
                      lineHeight: 1.08,
                      wordBreak: "break-word",
                    }}
                  >
                    Configuración del punto de venta
                  </Typography>

                  <Typography
                    sx={{
                      opacity: 0.92,
                      mt: 0.8,
                      color: "white",
                      fontSize: { xs: "0.9rem", md: "1rem" },
                      lineHeight: 1.35,
                    }}
                  >
                    Administra la aplicación principal que recibirá el payload de
                    impresión.
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={form.is_enabled ? "Módulo activo" : "Módulo inactivo"}
                sx={{
                  color: "#fff",
                  fontWeight: 900,
                  alignSelf: { xs: "flex-start", sm: "center" },
                  bgcolor: form.is_enabled
                    ? "rgba(34,197,94,.22)"
                    : "rgba(255,255,255,.18)",
                  border: "1px solid rgba(255,255,255,.35)",
                }}
              />
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 } }}>
            {!posLocationId && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                No se recibió el ID del punto de venta.
              </Alert>
            )}

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={12} sm={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: { xs: 3, md: 4 },
                    border: "1px solid #dbeafe",
                    bgcolor: "#f8fbff",
                    height: "100%",
                  }}
                >
                  <Stack spacing={{ xs: 2, md: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CableRoundedIcon sx={{ color: "#2563eb" }} />
                      <Typography
                        fontWeight={950}
                        sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
                      >
                        Conectividad principal
                      </Typography>
                    </Stack>

                    <FormControlLabel
                      sx={{
                        alignItems: "flex-start",
                        m: 0,
                        ".MuiFormControlLabel-label": {
                          pt: "8px",
                          fontSize: { xs: "0.92rem", md: "1rem" },
                        },
                      }}
                      control={
                        <Switch
                          checked={form.is_enabled}
                          onChange={(e) =>
                            handleChange("is_enabled", e.target.checked)
                          }
                        />
                      }
                      label="Activar módulo de conectividad"
                    />

                    <TextField
                      select
                      fullWidth
                      label="Tipo de aplicación"
                      value={form.app_type}
                      onChange={(e) => handleChange("app_type", e.target.value)}
                      disabled={!form.is_enabled}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="">Sin aplicación configurada</MenuItem>
                      {APP_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    {selectedApp && (
                      <Alert
                        severity="info"
                        sx={{
                          borderRadius: 3,
                          fontSize: { xs: "0.85rem", md: "0.92rem" },
                        }}
                      >
                        Aplicación seleccionada: <b>{selectedApp.label}</b>
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: { xs: 3, md: 4 },
                    border: "1px solid #dbeafe",
                    bgcolor: "#ffffff",
                    height: "100%",
                  }}
                >
                  <Stack spacing={{ xs: 2, md: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <AutoModeRoundedIcon sx={{ color: "#2563eb" }} />
                      <Typography
                        fontWeight={950}
                        sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
                      >
                        Automatización
                      </Typography>
                    </Stack>

                    <FormControlLabel
                      sx={{
                        alignItems: "flex-start",
                        m: 0,
                        ".MuiFormControlLabel-label": {
                          pt: "8px",
                          fontSize: { xs: "0.92rem", md: "1rem" },
                        },
                      }}
                      control={
                        <Switch
                          checked={form.auto_send_payload}
                          onChange={(e) =>
                            handleChange("auto_send_payload", e.target.checked)
                          }
                          disabled={!form.is_enabled}
                        />
                      }
                      label="Enviar payload automáticamente después de cada venta"
                    />

                    <Alert
                      severity="success"
                      sx={{
                        borderRadius: 3,
                        fontSize: { xs: "0.85rem", md: "0.92rem" },
                        lineHeight: 1.35,
                      }}
                    >
                      Al activar esta opción el POS enviará el ticket a la
                      aplicación configurada sin intervención manual.
                    </Alert>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
            <PosAvailableApps />
            <Button
              fullWidth={isMobile}
              variant="contained"
              size="large"
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveRoundedIcon />
                )
              }
              onClick={handleSubmit}
              disabled={saving || !posLocationId}
              sx={{
                mt: { xs: 3, md: 4 },
                py: 1.5,
                px: { xs: 2, md: 5 },
                borderRadius: 3,
                fontWeight: 950,
                fontSize: { xs: "0.86rem", md: "0.95rem" },
                background:
                  "linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #38bdf8 100%)",
                boxShadow: "0 16px 35px rgba(37,99,235,.32)",
              }}
            >
              {saving ? "Guardando..." : "Guardar configuración"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}