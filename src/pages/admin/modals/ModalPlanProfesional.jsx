import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, useMediaQuery, useTheme,
  Typography, Box, Stack, Divider
} from "@mui/material";

const IMG_SLOTS = 10;

export default function ModalPlanProfesional({
  open,
  onClose,
  onSubmit,
  storeId,
  defaultValues = {} // { logo, img_portada, titulo_1, descripcion, imagen_1..10, facebook, instagram, twitter, tiktok }
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Archivos
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [imageFiles, setImageFiles] = useState(Array(IMG_SLOTS).fill(null));

  // Campos de texto
  const [titulo1, setTitulo1] = useState(defaultValues.titulo_1 || "");
  const [descripcion, setDescripcion] = useState(defaultValues.descripcion || "");
  const [facebook, setFacebook] = useState(defaultValues.facebook || "");
  const [instagram, setInstagram] = useState(defaultValues.instagram || "");
  const [twitter, setTwitter] = useState(defaultValues.twitter || "");
  const [tiktok, setTiktok] = useState(defaultValues.tiktok || "");

  // Previews: archivo nuevo > URL existente
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : defaultValues.logo || ""),
    [logoFile, defaultValues.logo]
  );

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : defaultValues.img_portada || ""),
    [coverFile, defaultValues.img_portada]
  );

  const galleryPreviews = useMemo(
    () =>
      imageFiles.map((file, i) =>
        file ? URL.createObjectURL(file) : defaultValues[`imagen_${i + 1}`] || ""
      ),
    [imageFiles, defaultValues]
  );

  // Limpieza de object URLs
  useEffect(() => {
    return () => {
      if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview);
      if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((url, i) => {
        if (imageFiles[i] && url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoFile, coverFile, imageFiles]);

  const onImageChange = (idx, file) => {
    const next = [...imageFiles];
    next[idx] = file || null;
    setImageFiles(next);
  };

  const clearLogo = () => setLogoFile(null);
  const clearCover = () => setCoverFile(null);
  const clearGalleryItem = (idx) => onImageChange(idx, null);

  const handleSave = () => {
    const fd = new FormData();
    if (storeId) fd.append("id_store", storeId);
    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("img_portada", coverFile);
    fd.append("titulo_1", titulo1);
    fd.append("descripcion", descripcion);
    imageFiles.forEach((file, i) => {
      if (file) fd.append(`imagen_${i + 1}`, file);
    });
    fd.append("facebook", facebook);
    fd.append("instagram", instagram);
    fd.append("twitter", twitter);
    fd.append("tiktok", tiktok);
    onSubmit?.(fd);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>⭐ Configurar — Plan Profesional</DialogTitle>

      <DialogContent dividers>
        {/* PRESENTACIÓN */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>🪪 Presentación</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sube tu <b>logo</b> y la <b>imagen de portada</b> (se mostrarán en la cabecera).
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
                    position: "relative",
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
                  <Button component="label" variant="outlined" fullWidth>
                    {logoPreview ? "Cambiar logo" : "Subir logo"}
                    <input hidden type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  </Button>
                  {logoPreview && (
                    <Button variant="text" color="error" onClick={clearLogo} fullWidth>Quitar</Button>
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
                  <Button component="label" variant="outlined" fullWidth>
                    {coverPreview ? "Cambiar portada" : "Subir portada"}
                    <input hidden type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                  </Button>
                  {coverPreview && (
                    <Button variant="text" color="error" onClick={clearCover} fullWidth>Quitar</Button>
                  )}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  Recomendado: 1920×1080 (16:9), JPG/JPEG/PNG.
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* CONÓCEME */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>🙋 Conóceme</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Título 1" fullWidth value={titulo1} onChange={(e) => setTitulo1(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                minRows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>


        <Divider sx={{ my: 2 }} />

        {/* GALERÍA */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>🖼️ Galería (10 imágenes)</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Array.from({ length: IMG_SLOTS }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      aspectRatio: "1 / 1",
                    }}
                  >
                    {galleryPreviews[i] ? (
                      <img
                        src={galleryPreviews[i]}
                        alt={`Vista previa imagen ${i + 1}`}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">Sin imagen</Typography>
                      </Box>
                    )}
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button component="label" variant="outlined" fullWidth>
                      {galleryPreviews[i] ? `Cambiar imagen ${i + 1}` : `Subir imagen ${i + 1}`}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) => onImageChange(i, e.target.files?.[0] || null)}
                      />
                    </Button>
                    {galleryPreviews[i] && (
                      <Button variant="text" color="error" onClick={() => clearGalleryItem(i)} fullWidth>
                        Quitar
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* MIS REDES */}
        <Box mb={1}>
          <Typography variant="h6" fontWeight={800}>🌐 Mis redes</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Facebook" fullWidth value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Instagram" fullWidth value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Twitter (X)" fullWidth value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="TikTok" fullWidth value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
