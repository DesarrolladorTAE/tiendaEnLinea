import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Tabs,
  Tab,
  Divider,
  Box,
  useMediaQuery,
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Alert,
  Paper,
  IconButton,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";

import axiosClient from "../../../config/axiosClient";
import { showSuccess, alertFromAxiosError } from "../../../utils/alerts";

import WhiteLabelCategoryPicks from "./WhiteLabelCategoryPicks";
import ColorPickerField from "./ColorPickerField";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

const normalizeUrl = (url) => {
  const s = (url || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s : `${s}/`;
};

function ImagePreviewCard({ label, url, type = "logo" }) {
  const hasImage = Boolean(url);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${alpha("#000", 0.08)}`,
        bgcolor: "#fff",
        p: 1.5,
      }}
    >
      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
          {label}
        </Typography>

        <Box
          sx={{
            minHeight: type === "favicon" ? 84 : 140,
            borderRadius: 2,
            border: `1px dashed ${alpha("#000", 0.15)}`,
            bgcolor: alpha("#000", 0.02),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            p: 1,
          }}
        >
          {hasImage ? (
            <Box
              component="img"
              src={url}
              alt={label}
              sx={{
                maxWidth: "100%",
                maxHeight: type === "favicon" ? 48 : 110,
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <Stack spacing={0.7} alignItems="center">
              <ImageRoundedIcon sx={{ color: alpha("#000", 0.35) }} />
              <Typography variant="caption" color="text.secondary">
                Sin imagen cargada
              </Typography>
            </Stack>
          )}
        </Box>

        {hasImage ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              wordBreak: "break-all",
              lineHeight: 1.3,
            }}
          >
            {url}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: COLORS.paper,
        border: `1px solid ${alpha("#000", 0.08)}`,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={0.4} sx={{ mb: 1.2 }}>
        <Typography sx={{ fontWeight: 950, fontSize: 14 }}>{title}</Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>

      <Stack spacing={1.2}>{children}</Stack>
    </Paper>
  );
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
  },
};

export default function WhiteLabelEditorDialog({
  open,
  onClose,
  branchId,
  siteId, // null => create
  onSaved,
  canUse = true,
  onRequestUpgrade = () => { },
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const isCreate = !siteId;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState(null);

  const [form, setForm] = useState({
    site_name: "",
    site_tagline: "",
    public_base_url: "",
    storefront_url: "",
    category_query_key: "cat",
    landing_mode: "default",

    site_logo_path: "",
    favicon_path: "",

    primary_color: "",
    secondary_color: "",

    contact_email: "",
    contact_phone: "",
    whatsapp_phone: "",
    facebook_url: "",
    instagram_url: "",
    tiktok_url: "",

    is_active: true,
  });

  const fillForm = useCallback((s) => {
    const v = s || {};
    setForm({
      site_name: v.site_name || "",
      site_tagline: v.site_tagline || "",
      public_base_url: v.public_base_url || "",
      storefront_url: v.storefront_url || "",
      category_query_key: v.category_query_key || "cat",
      landing_mode: v.landing_mode || "default",

      site_logo_path: v.site_logo_path || "",
      favicon_path: v.favicon_path || "",

      primary_color: v.primary_color || "",
      secondary_color: v.secondary_color || "",

      contact_email: v.contact_email || "",
      contact_phone: v.contact_phone || "",
      whatsapp_phone: v.whatsapp_phone || "",
      facebook_url: v.facebook_url || "",
      instagram_url: v.instagram_url || "",
      tiktok_url: v.tiktok_url || "",

      is_active: typeof v.is_active === "boolean" ? v.is_active : true,
    });
  }, []);

  const resetDialogState = useCallback(() => {
    setSite(null);
    setTab(0);
    setLoading(false);
    setSaving(false);
    fillForm(null);
  }, [fillForm]);

  const fetchSite = useCallback(async () => {
    if (!branchId) {
      setSite(null);
      fillForm(null);
      return;
    }

    if (!siteId) {
      setSite(null);
      fillForm(null);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosClient.get("/admin/white-label/site", {
        params: {
          branch_id: branchId,
          id: siteId,
        },
      });

      const s = data?.site ?? data?.data ?? null;
      setSite(s);
      fillForm(s);
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar el sitio");
      setSite(null);
      fillForm(null);
    } finally {
      setLoading(false);
    }
  }, [branchId, siteId, fillForm]);

  useEffect(() => {
    if (!open) return;
    setTab(0);
    fetchSite();
  }, [open, fetchSite]);

  useEffect(() => {
    if (!open) {
      resetDialogState();
    }
  }, [open, resetDialogState]);

  const onChange = (key) => (e) => {
    const value = e?.target?.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onChangeValue = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const derivedExample = useMemo(() => {
    const key = (form.category_query_key || "cat").trim() || "cat";
    const storefront = normalizeUrl(form.storefront_url);
    return storefront ? `${storefront}?${key}=accesorios` : "";
  }, [form.category_query_key, form.storefront_url]);

  const handleSave = async () => {
    if (!branchId) return;

    if (!canUse) {
      onRequestUpgrade?.();
      return;
    }

    if (!form.site_name.trim()) {
      return alertFromAxiosError(
        { response: { data: { message: "El nombre del sitio es obligatorio." } } },
        "Falta información"
      );
    }

    if (!form.public_base_url.trim() || !form.storefront_url.trim()) {
      return alertFromAxiosError(
        {
          response: {
            data: {
              message: "La URL pública y la URL de la tienda son obligatorias.",
            },
          },
        },
        "Falta información"
      );
    }

    const payload = {
      branch_id: branchId,
      ...form,
      public_base_url: normalizeUrl(form.public_base_url),
      storefront_url: normalizeUrl(form.storefront_url),
      category_query_key: (form.category_query_key || "cat").trim() || "cat",
      landing_mode: (form.landing_mode || "default").trim() || "default",
      is_active: !!form.is_active,
    };

    setSaving(true);
    try {
      let data;

      if (isCreate) {
        ({ data } = await axiosClient.post("/admin/white-label/sites", payload));
      } else {
        ({ data } = await axiosClient.put(`/admin/white-label/site/${siteId}`, payload));
      }

      const s = data?.site ?? data?.data ?? null;
      setSite(s);
      fillForm(s);
      onSaved?.(s);
      await showSuccess(isCreate ? "Sitio creado" : "Sitio actualizado");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async ({ file, kind }) => {
    if (!file) return;

    if (!canUse) {
      onRequestUpgrade?.();
      return;
    }

    const currentId = site?.id || siteId;
    if (!currentId) {
      return alertFromAxiosError(
        {
          response: {
            data: {
              message: "Primero guarda el sitio para generar el ID, y luego sube la imagen.",
            },
          },
        },
        "Primero guarda"
      );
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("branch_id", String(branchId));
      fd.append("site_id", String(currentId));
      fd.append("file", file);

      const url =
        kind === "favicon"
          ? "/admin/white-label/upload/favicon"
          : "/admin/white-label/upload/logo";

      const { data } = await axiosClient.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const path = data?.path || data?.url || "";
      const updatedSite = data?.site || null;

      if (!path) {
        throw {
          response: {
            data: {
              message: "El servidor no regresó el path de la imagen.",
            },
          },
        };
      }

      if (updatedSite) {
        setSite(updatedSite);
      }

      if (kind === "favicon") {
        setForm((prev) => ({ ...prev, favicon_path: path }));
        await showSuccess("Favicon subido ✅ ahora dale Guardar");
      } else {
        setForm((prev) => ({ ...prev, site_logo_path: path }));
        await showSuccess("Logo subido ✅ ahora dale Guardar");
      }
    } catch (err) {
      alertFromAxiosError(err, "No se pudo subir la imagen");
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
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          border: fullScreen ? "none" : `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: COLORS.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: COLORS.paper,
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <StorefrontRoundedIcon sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1 }}>
              {isCreate
                ? "Crear sitio de Marca Blanca"
                : `Editar sitio: ${site?.site_name || `#${siteId}`}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configura nombre, URLs, colores, logo y redes del sitio.
            </Typography>
          </Box>

          <IconButton onClick={onClose} disabled={saving}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {!canUse ? (
          <Alert
            severity="warning"
            sx={{
              borderRadius: 3,
              bgcolor: alpha(COLORS.accent, 0.12),
              border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
              mb: 2,
            }}
          >
            Esta función requiere tu plan o complemento de Marca Blanca.
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
          <Chip
            label={branchId ? `Sucursal #${branchId}` : "Sin sucursal"}
            variant="outlined"
            sx={{ fontWeight: 900, borderRadius: 2 }}
          />
          <Chip
            label={site?.id ? `ID del sitio: ${site.id}` : "Sin ID (aún)"}
            sx={{
              fontWeight: 950,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.22),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
            }}
          />
          {loading ? (
            <Chip
              label="Cargando..."
              variant="outlined"
              sx={{ fontWeight: 900, borderRadius: 2 }}
            />
          ) : null}

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={fetchSite}
            startIcon={<RefreshRoundedIcon />}
            variant="outlined"
            disabled={loading || !siteId}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              borderColor: alpha("#000", 0.15),
              color: COLORS.black,
              bgcolor: "#fff",
              "&:hover": { bgcolor: alpha("#000", 0.03) },
            }}
          >
            Recargar
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{
            mb: 1.5,
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 950,
              minHeight: 44,
            },
          }}
        >
          <Tab label="Datos del sitio" />
          <Tab label="Categorías (QR / landing)" disabled={!site?.id} />
        </Tabs>

        {tab === 0 ? (
          <Stack spacing={1.5}>
            <Section title="Básicos" subtitle="Lo que verá tu cliente en el encabezado del catálogo.">
              <TextField
                label="Nombre visible del sitio"
                value={form.site_name}
                onChange={onChange("site_name")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="Ej: Catálogo Central"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Slogan (opcional)"
                value={form.site_tagline}
                onChange={onChange("site_tagline")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="Ej: Encuentra lo que necesitas"
              />
            </Section>

            <Section title="URLs" subtitle="De aquí salen los links del QR y el catálogo.">
              <TextField
                label="URL pública (donde vivirá el catálogo)"
                value={form.public_base_url}
                onChange={onChange("public_base_url")}
                fullWidth
                disabled={!canUse || saving}
                placeholder="https://tusitio.com/"
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PublicRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Se guarda con / al final automáticamente."
              />

              <TextField
                label="URL de la tienda (donde ya se ven productos)"
                value={form.storefront_url}
                onChange={onChange("storefront_url")}
                fullWidth
                disabled={!canUse || saving}
                placeholder="https://tusitio.com/tienda/"
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="De aquí armamos los links de categoría."
              />

              <TextField
                label="Palabra clave para categoría"
                value={form.category_query_key}
                onChange={onChange("category_query_key")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                helperText="Ejemplo: cat → ?cat=accesorios"
              />

              <TextField
                label="Modo de landing"
                value={form.landing_mode}
                onChange={onChange("landing_mode")}
                select
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                helperText="Qué se muestra al abrir el catálogo"
              >
                <MenuItem value="default">Normal</MenuItem>
                <MenuItem value="categories">Lista de categorías</MenuItem>
                <MenuItem value="category">Una categoría (la default)</MenuItem>
              </TextField>

              <TextField
                label="¿Sitio activo?"
                value={form.is_active ? "1" : "0"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: e.target.value === "1",
                  }))
                }
                select
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
              >
                <MenuItem value="1">Sí (activo)</MenuItem>
                <MenuItem value="0">No (apagado)</MenuItem>
              </TextField>

              <Box>
                <TextField
                  label="Ejemplo de URL de categoría (para QR)"
                  value={derivedExample}
                  fullWidth
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: alpha("#000", 0.03),
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Si esto se ve bien, tu QR mandará a la categoría correcta.
                </Typography>
              </Box>
            </Section>

            <Section title="Imágenes" subtitle="Sube logo y favicon. Luego dale Guardar para fijarlo.">
              <Stack spacing={1.5}>
                <ImagePreviewCard
                  label="Vista previa del logo"
                  url={form.site_logo_path}
                  type="logo"
                />

                <Button
                  component="label"
                  disabled={!canUse || saving}
                  startIcon={<UploadRoundedIcon />}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    borderColor: alpha("#000", 0.18),
                    color: COLORS.black,
                    bgcolor: "#fff",
                    justifyContent: "flex-start",
                    "&:hover": { bgcolor: alpha("#000", 0.03) },
                  }}
                >
                  Subir logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      uploadImage({
                        file: e.target.files?.[0] || null,
                        kind: "logo",
                      })
                    }
                  />
                </Button>

                <Divider sx={{ my: 0.5 }} />

                <ImagePreviewCard
                  label="Vista previa del favicon"
                  url={form.favicon_path}
                  type="favicon"
                />

                <Button
                  component="label"
                  disabled={!canUse || saving}
                  startIcon={<UploadRoundedIcon />}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    borderColor: alpha("#000", 0.18),
                    color: COLORS.black,
                    bgcolor: "#fff",
                    justifyContent: "flex-start",
                    "&:hover": { bgcolor: alpha("#000", 0.03) },
                  }}
                >
                  Subir favicon
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      uploadImage({
                        file: e.target.files?.[0] || null,
                        kind: "favicon",
                      })
                    }
                  />
                </Button>

                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 2.5,
                    bgcolor: alpha("#000", 0.03),
                    border: `1px solid ${alpha("#000", 0.08)}`,
                  }}
                >
                  Tip: al subir una nueva imagen se mostrará aquí mismo como vista previa.
                </Alert>
              </Stack>
            </Section>

            <Section title="Colores" subtitle="Personaliza el estilo del catálogo.">
              <ColorPickerField
                label="Color principal"
                value={form.primary_color}
                onChange={onChangeValue("primary_color")}
                disabled={!canUse || saving}
                helperText="Botones y títulos principales"
                startIcon={<PaletteRoundedIcon fontSize="small" />}
              />

              <ColorPickerField
                label="Color secundario"
                value={form.secondary_color}
                onChange={onChangeValue("secondary_color")}
                disabled={!canUse || saving}
                helperText="Detalles y resaltados"
                startIcon={<PaletteRoundedIcon fontSize="small" />}
              />
            </Section>

            <Section title="Contacto" subtitle="Datos para mostrarlos en el catálogo.">
              <TextField
                label="Correo de contacto"
                value={form.contact_email}
                onChange={onChange("contact_email")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="ventas@tusitio.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Teléfono"
                value={form.contact_phone}
                onChange={onChange("contact_phone")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="7441234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIphoneRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="WhatsApp"
                value={form.whatsapp_phone}
                onChange={onChange("whatsapp_phone")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="7441234567"
                helperText="Solo número o el formato que uses en tu sistema"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIphoneRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Section>

            <Section title="Redes" subtitle="Links para que el cliente te encuentre rápido.">
              <TextField
                label="Facebook URL"
                value={form.facebook_url}
                onChange={onChange("facebook_url")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="https://facebook.com/..."
              />

              <TextField
                label="Instagram URL"
                value={form.instagram_url}
                onChange={onChange("instagram_url")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="https://instagram.com/..."
              />

              <TextField
                label="TikTok URL"
                value={form.tiktok_url}
                onChange={onChange("tiktok_url")}
                fullWidth
                disabled={!canUse || saving}
                sx={fieldSx}
                placeholder="https://tiktok.com/@..."
              />
            </Section>
          </Stack>
        ) : (
          <WhiteLabelCategoryPicks
            branchId={branchId}
            canUse={canUse}
            onRequestUpgrade={onRequestUpgrade}
          />
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: COLORS.paper,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          startIcon={<CloseRoundedIcon />}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            borderColor: alpha("#000", 0.15),
            color: COLORS.black,
            bgcolor: "#fff",
            "&:hover": { bgcolor: alpha("#000", 0.03) },
          }}
        >
          Cerrar
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={handleSave}
          disabled={saving || !canUse}
          startIcon={<SaveRoundedIcon />}
          variant="contained"
          sx={{
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 950,
            bgcolor: COLORS.black,
            px: 2.2,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.88) },
          }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}