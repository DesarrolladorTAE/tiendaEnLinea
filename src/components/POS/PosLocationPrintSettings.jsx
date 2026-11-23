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
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import CableRoundedIcon from "@mui/icons-material/CableRounded";
import axiosClientPOS from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";
import PosAvailableApps from "./PosAvailableApps";
import { posHeaderButton, posHeaderChip, posMobileCard, posSectionHeader, posSectionIcon, posSectionTitle } from "./posSectionStyles";

const APP_OPTIONS = [
  { value: "windows_usb", label: "Windows USB" },
  { value: "windows_ip", label: "Windows IP / LAN" },
  { value: "android_usb", label: "Android USB" },
  { value: "android_ip", label: "Android IP / LAN" },
  { value: "ios_ip", label: "iPhone IP / LAN" },
  { value: "ios_ble", label: "iPhone Bluetooth BLE" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function PosLocationPrintSettings({ posLocationId }) {
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
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: 1500, mx: "auto" }}>
      <Box>
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #dce3ec" }}>
          <Box sx={{ ...posSectionHeader, mb: 0, borderRadius: 0 }}>
            <Stack direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={posSectionIcon}><SettingsSuggestRoundedIcon /></Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h2" sx={posSectionTitle}>Configuración del punto de venta</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: "#c7cbd1 !important" }}>Configura la aplicación que recibe los tickets del POS.</Typography>
                </Box>
              </Stack>
              <Chip label={form.is_enabled ? "Módulo activo" : "Módulo inactivo"} sx={{ ...posHeaderChip, alignSelf: { xs: "start", sm: "center" } }} />
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 2.5, md: 4 } }}>
            {!posLocationId && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                No se recibió el ID del punto de venta.
              </Alert>
            )}

            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 3fr) minmax(0, 2fr)" },
              alignItems: "start",
              gap: { xs: 2.5, lg: 3 },
            }}>
              <Stack spacing={2.5} sx={{ minWidth: 0 }}>
                <Paper elevation={0} sx={{ ...posMobileCard, p: { xs: 2, md: 3 }, bgcolor: "#f8fbff" }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CableRoundedIcon sx={{ color: "#785900" }} />
                      <Typography component="h3" fontWeight={850} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>Impresión de tickets</Typography>
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
                    <Divider />
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
                      label="Enviar el ticket automáticamente después de cada venta"
                    />

                    <Alert
                      severity="success"
                      sx={{
                        borderRadius: 3,
                        fontSize: { xs: "0.85rem", md: "0.92rem" },
                        lineHeight: 1.35,
                      }}
                    >
                      El ticket se enviará a la aplicación seleccionada.
                    </Alert>
                  </Stack>
                </Paper>
                <Button
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
                    alignSelf: { sm: "flex-start" },
                    py: 1.5,
                    px: { xs: 2, md: 5 },
                    ...posHeaderButton,
                  }}
                >
                  {saving ? "Guardando..." : "Guardar configuración"}
                </Button>
              </Stack>
              <PosAvailableApps />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
