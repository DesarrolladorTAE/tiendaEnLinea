import React, { useMemo } from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

import AppVersionCompatibility from "./AppVersionCompatibility";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

export default function AppVersionFormDialog({
  open,
  editing,
  form,
  apps,
  platforms,
  printerTypes,
  saving,
  onClose,
  onChange,
  onTogglePrinterType,
  onSave,
}) {
  const selectedFileName = useMemo(() => form.file?.name || "", [form.file]);

  const appName = apps[0]?.name || "MTELMX POS";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          maxHeight: "92vh",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, md: 3 },
          py: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(BRAND.amber, 0.16),
                border: `1px solid ${alpha(BRAND.amber, 0.45)}`,
                color: BRAND.dark,
              }}
            >
              <AppsRoundedIcon />
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={900}>
                {editing ? "Editar versión" : "Nueva versión"}
              </Typography>

              <Typography color="text.secondary">
                Registra plataforma, compatibilidad y archivo instalador para{" "}
                <Box component="span" fontWeight={900} color="text.primary">
                  {appName}
                </Box>
                .
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={onClose} disabled={saving}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent
        sx={{
          p: { xs: 2, md: 3 },
          bgcolor: "#f6f7fb",
        }}
      >
        <Stack spacing={2.5}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(BRAND.amber, 0.16),
                  border: `1px solid ${alpha(BRAND.amber, 0.45)}`,
                }}
              >
                <AppsRoundedIcon fontSize="small" />
              </Box>

              <Box>
                <Typography fontWeight={900}>Datos principales</Typography>
                <Typography variant="body2" color="text.secondary">
                  Captura la versión, plataforma y fecha de lanzamiento.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 56,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: alpha(BRAND.amber, 0.08),
                  }}
                >
                  <AppsRoundedIcon fontSize="small" sx={{ color: BRAND.orange }} />

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1 }}
                    >
                      Aplicación
                    </Typography>
                    <Typography fontWeight={900} sx={{ lineHeight: 1.2 }}>
                      {appName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  label="Versión"
                  placeholder="1.0.0"
                  value={form.version}
                  onChange={(e) => onChange("version", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.5}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Plataforma"
                  value={form.platform}
                  onChange={(e) => onChange("platform", e.target.value)}
                >
                  {platforms.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2.5}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de lanzamiento"
                  value={form.release_date}
                  onChange={(e) => onChange("release_date", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    width: "fit-content",
                    px: 2,
                    py: 0.7,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: form.is_active
                      ? alpha("#16a34a", 0.06)
                      : alpha("#64748b", 0.06),
                  }}
                >
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                      <Switch
                        checked={form.is_active}
                        onChange={(e) => onChange("is_active", e.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: BRAND.orange,
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: BRAND.orange,
                          },
                        }}
                      />
                    }
                    label={form.is_active ? "Versión activa" : "Versión inactiva"}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <AppVersionCompatibility
            form={form}
            printerTypes={printerTypes}
            onTogglePrinterType={onTogglePrinterType}
          />

          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(BRAND.amber, 0.16),
                  border: `1px solid ${alpha(BRAND.amber, 0.45)}`,
                }}
              >
                <NotesRoundedIcon fontSize="small" />
              </Box>

              <Box>
                <Typography fontWeight={900}>Notas</Typography>
                <Typography variant="body2" color="text.secondary">
                  Agrega cambios, mejoras o instrucciones de instalación.
                </Typography>
              </Box>
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Notas de versión"
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
            />
          </Box>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(BRAND.amber, 0.16),
                  border: `1px solid ${alpha(BRAND.amber, 0.45)}`,
                }}
              >
                <InsertDriveFileRoundedIcon fontSize="small" />
              </Box>

              <Box>
                <Typography fontWeight={900}>Archivo instalador</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sube APK, EXE, instalador o paquete compatible.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Button
              component="label"
              fullWidth
              variant="outlined"
              startIcon={<CloudUploadRoundedIcon />}
              sx={{
                justifyContent: "flex-start",
                py: 1.4,
                borderRadius: 2,
                color: BRAND.dark,
                fontWeight: 900,
                borderColor: "divider",
                bgcolor: "#fff",
                "&:hover": {
                  borderColor: alpha(BRAND.orange, 0.55),
                  bgcolor: alpha(BRAND.amber, 0.08),
                },
              }}
            >
              Seleccionar archivo
              <input
                hidden
                type="file"
                onChange={(e) => onChange("file", e.target.files?.[0] || null)}
              />
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2 }}>
              {selectedFileName
                ? `Archivo seleccionado: ${selectedFileName}`
                : editing?.file_name
                ? `Archivo actual: ${editing.file_name}`
                : "No se ha seleccionado archivo."}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, md: 3 },
          py: 2,
          bgcolor: "#fff",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          variant="outlined"
          startIcon={<CloseRoundedIcon />}
          sx={{
            borderRadius: 2,
            fontWeight: 900,
            color: BRAND.dark,
            borderColor: "divider",
          }}
        >
          Cerrar
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || !form.app_id || !form.version || !form.platform}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 900,
            bgcolor: BRAND.dark,
            color: "#fff",
            boxShadow: "0 12px 28px rgba(0,0,0,.22)",
            "&:hover": {
              bgcolor: "#000",
            },
          }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  
  );
}