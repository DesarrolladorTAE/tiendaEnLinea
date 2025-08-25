import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  useMediaQuery,
  useTheme,
  Typography,
  Box,
  Stack,
  Divider,
  CircularProgress, // 👈 spinner sin @mui/lab
} from "@mui/material";

const IMG_SLOTS = 10;

export default function ModalPlanProfesional({
  open,
  onClose,
  onSubmit,
  storeId,
  defaultValues = {}, // { logo, img_portada, titulo_1, descripcion, imagen_1..10, facebook, instagram, twitter, tiktok } (o { carrusel:{...} })
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Archivos
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [imageFiles, setImageFiles] = useState(Array(IMG_SLOTS).fill(null));

  // Flags de borrado
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [removeGallery, setRemoveGallery] = useState(Array(IMG_SLOTS).fill(false));

  // Campos de texto
  const [titulo1, setTitulo1] = useState(defaultValues.titulo_1 || "");
  const [descripcion, setDescripcion] = useState(defaultValues.descripcion || "");
  const [facebook, setFacebook] = useState(defaultValues.facebook || "");
  const [instagram, setInstagram] = useState(defaultValues.instagram || "");
  const [twitter, setTwitter] = useState(defaultValues.twitter || "");
  const [tiktok, setTiktok] = useState(defaultValues.tiktok || "");

  // Loading del botón Guardar
  const [saving, setSaving] = useState(false);

  // 🔄 Sincroniza estados cuando abras el modal o cambien los defaults
  useEffect(() => {
    if (!open) return;
    setTitulo1(defaultValues.titulo_1 || "");
    setDescripcion(defaultValues.descripcion || "");
    setFacebook(defaultValues.facebook || "");
    setInstagram(defaultValues.instagram || "");
    setTwitter(defaultValues.twitter || "");
    setTiktok(defaultValues.tiktok || "");

    // limpia archivos y flags al abrir con nuevos defaults
    setLogoFile(null);
    setCoverFile(null);
    setImageFiles(Array(IMG_SLOTS).fill(null));
    setRemoveLogo(false);
    setRemoveCover(false);
    setRemoveGallery(Array(IMG_SLOTS).fill(false));
    setSaving(false);
  }, [open, defaultValues]);

  // Helpers para leer existentes (soporta plano o anidado en carrusel)
  const getExisting = (key) =>
    defaultValues?.[key] ?? defaultValues?.carrusel?.[key] ?? "";

  // Previews: archivo nuevo > existente > vacío; si hay flag de remove => vacío
  const logoPreview = useMemo(() => {
    if (removeLogo) return "";
    return logoFile ? URL.createObjectURL(logoFile) : defaultValues.logo || "";
  }, [logoFile, defaultValues.logo, removeLogo]);

  const coverPreview = useMemo(() => {
    if (removeCover) return "";
    return coverFile
      ? URL.createObjectURL(coverFile)
      : defaultValues.img_portada || "";
  }, [coverFile, defaultValues.img_portada, removeCover]);

  const galleryPreviews = useMemo(
    () =>
      Array.from({ length: IMG_SLOTS }).map((_, i) => {
        if (removeGallery[i]) return "";
        const file = imageFiles[i];
        if (file) return URL.createObjectURL(file);
        return getExisting(`imagen_${i + 1}`);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imageFiles, defaultValues, removeGallery]
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

    // si subes nueva, desmarca borrado
    if (file) {
      const rm = [...removeGallery];
      rm[idx] = false;
      setRemoveGallery(rm);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setRemoveLogo(true);
  };

  const clearCover = () => {
    setCoverFile(null);
    setRemoveCover(true);
  };

  const clearGalleryItem = (idx) => {
    const next = [...imageFiles];
    next[idx] = null;
    setImageFiles(next);

    const rm = [...removeGallery];
    rm[idx] = true;
    setRemoveGallery(rm);
  };

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    if (storeId) fd.append("id_store", storeId);

    // archivos nuevos
    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("img_portada", coverFile);

    // flags de borrado
    if (removeLogo) fd.append("remove_logo", "1");
    if (removeCover) fd.append("remove_img_portada", "1");

    // textos
    fd.append("titulo_1", titulo1);
    fd.append("descripcion", descripcion);
    fd.append("facebook", facebook);
    fd.append("instagram", instagram);
    fd.append("twitter", twitter);
    fd.append("tiktok", tiktok);

    // galería
    imageFiles.forEach((file, i) => {
      const n = i + 1;
      if (file) fd.append(`imagen_${n}`, file);
      if (removeGallery[i]) fd.append(`remove_imagen_${n}`, "1");
    });

    try {
      await onSubmit?.(fd);
      onClose?.(); // descomenta si quieres cerrar al guardar
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
    >
      <DialogTitle>🚀 Configurar — Plan Avanzado</DialogTitle>

      <DialogContent dividers>
        {/* PRESENTACIÓN */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>
            🪪 Presentación
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sube tu <b>logo</b> y la <b>imagen de portada</b> (se mostrarán en
            la cabecera).
          </Typography>

          <Grid container spacing={2}>
            {/* LOGO (círculo fijo) */}
            <Grid item xs={12} md={5}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Logo
                </Typography>
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
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ p: 2, textAlign: "center" }}
                    >
                      Sin logo
                    </Typography>
                  )}
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    disabled={saving}
                    onClick={() => setRemoveLogo(false)}
                  >
                    {logoPreview ? "Cambiar logo" : "Subir logo"}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {(defaultValues.logo || logoFile) && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={clearLogo}
                      fullWidth
                      disabled={saving}
                    >
                      Quitar
                    </Button>
                  )}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  Recomendado: PNG/JPG cuadrado. Se recorta en círculo.
                </Typography>
              </Stack>
            </Grid>

            {/* PORTADA (alto fijo para evitar saltos) */}
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Imagen de portada
                </Typography>

                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: { xs: 180, sm: 220, md: 280 }, // 👈 alto fijo
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "2px dashed",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Vista previa portada"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        Sin imagen de portada
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    disabled={saving}
                    onClick={() => setRemoveCover(false)}
                  >
                    {coverPreview ? "Cambiar portada" : "Subir portada"}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCoverFile(e.target.files?.[0] || null)
                      }
                    />
                  </Button>
                  {(defaultValues.img_portada || coverFile) && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={clearCover}
                      fullWidth
                      disabled={saving}
                    >
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
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>
            🙋 Conóceme
          </Typography>

          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Título 1"
              fullWidth
              value={titulo1}
              onChange={(e) => setTitulo1(e.target.value)}
              disabled={saving}
            />

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={10}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={saving}
              inputProps={{ maxLength: 20000 }}
              sx={{
                "& .MuiInputBase-root": { alignItems: "flex-start" },
                "& .MuiInputBase-inputMultiline": { overflow: "auto" },
              }}
            />
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="caption" color="text.secondary">
                Máx. 20,000 caracteres
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {descripcion.length}/20000
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* GALERÍA (tamaño fijo para cada ítem) */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>
            🖼️ Galería (10 imágenes)
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Array.from({ length: IMG_SLOTS }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      width: "100%",
                      height: { xs: 180, sm: 200, md: 220 }, // 👈 alto fijo
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    {galleryPreviews[i] ? (
                      <img
                        src={galleryPreviews[i]}
                        alt={`Vista previa imagen ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block",
                          pointerEvents: "none",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Sin imagen
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      fullWidth
                      disabled={saving}
                      onClick={() => {
                        const rm = [...removeGallery];
                        rm[i] = false;
                        setRemoveGallery(rm);
                      }}
                    >
                      {galleryPreviews[i]
                        ? `Cambiar imagen ${i + 1}`
                        : `Subir imagen ${i + 1}`}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          onImageChange(i, e.target.files?.[0] || null)
                        }
                      />
                    </Button>
                    {(getExisting(`imagen_${i + 1}`) || imageFiles[i]) && (
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => clearGalleryItem(i)}
                        fullWidth
                        disabled={saving}
                      >
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
          <Typography variant="h6" fontWeight={800}>
            🌐 Mis redes
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Facebook"
                fullWidth
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Instagram"
                fullWidth
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Twitter (X)"
                fullWidth
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="TikTok"
                fullWidth
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                disabled={saving}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
