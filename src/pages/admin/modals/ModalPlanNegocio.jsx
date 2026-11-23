import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Typography, useMediaQuery, useTheme, Box, Stack
} from "@mui/material";

export default function ModalPlanNegocio({
  open,
  onClose,
  onSubmit,
  storeId,
  defaultValues = {},  // { logo: 'https://...', img_portada: 'https://...' }
  saving = false       // 👈 nuevo: deshabilita acciones mientras guardas
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // Reset cuando abres el modal (muestra otra vez las URLs guardadas)
  useEffect(() => {
    if (open) {
      setLogoFile(null);
      setCoverFile(null);
    }
  }, [open]);

  // Previews: archivo nuevo → objectURL; si no, URL existente
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : defaultValues.logo || ""),
    [logoFile, defaultValues.logo]
  );
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : defaultValues.img_portada || ""),
    [coverFile, defaultValues.img_portada]
  );

  // Limpia object URLs al desmontar
  useEffect(() => {
    return () => {
      if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
      if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoFile, coverFile]);

  const handleSave = () => {
    const fd = new FormData();
    if (storeId) fd.append("id_store", storeId);
    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("img_portada", coverFile);
    onSubmit?.(fd);
  };

  const clearLogo = () => setLogoFile(null);
  const clearCover = () => setCoverFile(null);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>🏪 Configurar — Plan Negocio</DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Sube tu <b>logo</b> y la <b>imagen de portada</b> (se mostrarán arriba de tu sitio).
        </Typography>

        <Grid container spacing={2}>
          {/* LOGO */}
          <Grid item xs={12} md={5}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>Logo</Typography>

              <Box
                sx={{
                  width: { xs: 140, sm: 160, md: 180 },
                  height: { xs: 140, sm: 160, md: 180 },
                  borderRadius: "50%",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  border: "2px dashed",
                  borderColor: "divider",
                  mx: { xs: "auto", md: 0 },
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Vista previa del logo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                    Sin logo
                  </Typography>
                )}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button component="label" variant="outlined" fullWidth disabled={saving}>
                  {logoPreview ? "Cambiar logo" : "Subir logo"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {logoPreview && (
                  <Button variant="text" color="error" onClick={clearLogo} fullWidth disabled={saving}>
                    Quitar
                  </Button>
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Recomendado: PNG/JPG cuadrado. Se recorta en círculo.
              </Typography>
            </Stack>
          </Grid>

          {/* PORTADA */}
          <Grid item xs={12} md={7}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>Imagen de portada</Typography>

              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "2px dashed",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  aspectRatio: "16 / 9",
                }}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Vista previa portada"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                      Sin imagen de portada
                    </Typography>
                  </Box>
                )}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button component="label" variant="outlined" fullWidth disabled={saving}>
                  {coverPreview ? "Cambiar portada" : "Subir portada"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {coverPreview && (
                  <Button variant="text" color="error" onClick={clearCover} fullWidth disabled={saving}>
                    Quitar
                  </Button>
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Recomendado: 1920×1080 (16:9), JPG/JPEG/PNG.
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
