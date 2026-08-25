import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress, // 👈 spinner
} from "@mui/material";

const IMG_SLOTS = 6; // límite del Plan Profesional en el backend

export default function ModalPlanProfesional({
  open,
  onClose,
  onSubmit,
  storeId,
  defaultValues = {}, // { logo, img_portada, imagen_1..5 }
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

  // Loading “Guardar”
  const [saving, setSaving] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (!open) return;
    setLogoFile(null);
    setCoverFile(null);
    setImageFiles(Array(IMG_SLOTS).fill(null));
    setRemoveLogo(false);
    setRemoveCover(false);
    setRemoveGallery(Array(IMG_SLOTS).fill(false));
    setSaving(false);
  }, [open, defaultValues]);

  const getExisting = (key) =>
    defaultValues?.[key] ?? defaultValues?.carrusel?.[key] ?? "";

  // Previews
  const logoPreview = useMemo(() => {
    if (removeLogo) return "";
    return logoFile ? URL.createObjectURL(logoFile) : getExisting("logo");
  }, [logoFile, removeLogo, defaultValues]);

  const coverPreview = useMemo(() => {
    if (removeCover) return "";
    return coverFile ? URL.createObjectURL(coverFile) : getExisting("img_portada");
  }, [coverFile, removeCover, defaultValues]);

  const galleryPreviews = useMemo(
    () =>
      Array.from({ length: IMG_SLOTS }).map((_, i) => {
        if (removeGallery[i]) return "";
        const file = imageFiles[i];
        if (file) return URL.createObjectURL(file);
        return getExisting(`imagen_${i + 1}`);
      }),
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
  }, [logoFile, coverFile, imageFiles]); // eslint-disable-line

  const onImageChange = (idx, file) => {
    const next = [...imageFiles];
    next[idx] = file || null;
    setImageFiles(next);

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

    if (logoFile) fd.append("logo", logoFile);
    if (coverFile) fd.append("img_portada", coverFile);
    if (removeLogo) fd.append("remove_logo", "1");
    if (removeCover) fd.append("remove_img_portada", "1");

    imageFiles.forEach((file, i) => {
      const n = i + 1;
      if (file) fd.append(`imagen_${n}`, file);
      if (removeGallery[i]) fd.append(`remove_imagen_${n}`, "1");
    });

    try {
      await onSubmit?.(fd);
      // si quieres cerrar al terminar:
      // onClose?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>⭐ Configurar — Plan Profesional</DialogTitle>

      <DialogContent dividers>
        {/* LOGO (tamaño fijo 160x160) */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>🪪 Logo</Typography>
          <Stack spacing={1.5} alignItems="center" mt={1}>
            <Box
              sx={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                overflow: "hidden",
                bgcolor: "background.paper",
                border: "2px dashed",
                borderColor: "divider",
                display: "grid",
                placeItems: "center",
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block"
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">Sin logo</Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} width="100%">
              <Button component="label" variant="outlined" fullWidth disabled={saving} onClick={() => setRemoveLogo(false)}>
                {logoPreview ? "Cambiar logo" : "Subir logo"}
                <input hidden type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              </Button>
              {(getExisting("logo") || logoFile) && (
                <Button variant="text" color="error" onClick={clearLogo} fullWidth disabled={saving}>
                  Quitar
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* PORTADA (alto fijo por breakpoint) */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>🖼️ Imagen de portada</Typography>
          <Stack spacing={1.5} mt={1}>
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
                  alt="Portada preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block"
                  }}
                />
              ) : (
                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                  <Typography variant="body2" color="text.secondary">Sin imagen de portada</Typography>
                </Box>
              )}
            </Box>
            <Stack direction="row" spacing={1} width="100%">
              <Button component="label" variant="outlined" fullWidth disabled={saving} onClick={() => setRemoveCover(false)}>
                {coverPreview ? "Cambiar portada" : "Subir portada"}
                <input hidden type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              </Button>
              {(getExisting("img_portada") || coverFile) && (
                <Button variant="text" color="error" onClick={clearCover} fullWidth disabled={saving}>
                  Quitar
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* GALERÍA (cuadrados con alto fijo) */}
        <Box mb={2}>
          <Typography variant="h6" fontWeight={800}>📷 Galería (5 imágenes)</Typography>
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
                        alt={`Imagen ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block"
                        }}
                      />
                    ) : (
                      <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">Sin imagen</Typography>
                      </Box>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
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
                      {galleryPreviews[i] ? `Cambiar imagen ${i + 1}` : `Subir imagen ${i + 1}`}
                      <input hidden type="file" accept="image/*" onChange={(e) => onImageChange(i, e.target.files?.[0] || null)} />
                    </Button>
                    {(getExisting(`imagen_${i + 1}`) || imageFiles[i]) && (
                      <Button variant="text" color="error" onClick={() => clearGalleryItem(i)} fullWidth disabled={saving}>
                        Quitar
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>
            ))}
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
