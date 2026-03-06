import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import axiosClient from "../../../config/axiosClient";
import {
  showConfirm,
  showSuccess,
  alertFromAxiosError,
} from "../../../utils/alerts";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const copyToClipboard = async (text) => {
  if (!text) return false;

  try {
    const isSecure =
      window.isSecureContext ||
      ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isSecure && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

const normalizeUrl = (url) => {
  const s = (url || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s : `${s}/`;
};

export default function WhiteLabelCategoryPicks({
  branchId,
  canUse,
  onRequestUpgrade,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [picks, setPicks] = useState([]);
  const [siteConfig, setSiteConfig] = useState(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    try {
      const [catsRes, picksRes, siteRes] = await Promise.all([
        axiosClient.get("/admin/categories", {
          params: { branch_id: branchId, mode: "flat" },
        }),
        axiosClient.get("/admin/white-label/category-picks", {
          params: { branch_id: branchId },
        }),
        axiosClient.get("/admin/white-label/site", {
          params: { branch_id: branchId },
        }),
      ]);

      const cats = Array.isArray(catsRes?.data?.categories)
        ? catsRes.data.categories
        : Array.isArray(catsRes?.data?.data)
        ? catsRes.data.data
        : Array.isArray(catsRes?.data)
        ? catsRes.data
        : [];

      const picksData = Array.isArray(picksRes?.data?.picks)
        ? picksRes.data.picks
        : Array.isArray(picksRes?.data?.data)
        ? picksRes.data.data
        : Array.isArray(picksRes?.data)
        ? picksRes.data
        : [];

      const site = siteRes?.data?.site ?? siteRes?.data?.data ?? null;

      setCategories(cats);
      setPicks(picksData);
      setSiteConfig(site);

      const currentDefault = picksData.find((x) => !!x.is_default) || picksData[0] || null;
      setSelectedCategoryId(currentDefault ? String(currentDefault.category_id) : "");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar configuración de categorías");
      setCategories([]);
      setPicks([]);
      setSiteConfig(null);
      setSelectedCategoryId("");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    fetchAll();
  }, [branchId, fetchAll]);

  const currentDefaultPick = useMemo(() => {
    return picks.find((x) => !!x.is_default) || picks[0] || null;
  }, [picks]);

  const currentDefaultCategoryId = currentDefaultPick
    ? Number(currentDefaultPick.category_id)
    : null;

  const categoryQueryKey = (siteConfig?.category_query_key || "cat").trim() || "cat";
  const storefrontUrl = normalizeUrl(siteConfig?.storefront_url || "");

  const buildCategoryUrl = useCallback(
    (category) => {
      if (!storefrontUrl || !category?.slug) return "";
      return `${storefrontUrl}?${categoryQueryKey}=${category.slug}`;
    },
    [storefrontUrl, categoryQueryKey]
  );

  const categoriesWithUrl = useMemo(() => {
    return (categories || []).map((cat) => ({
      ...cat,
      built_url: buildCategoryUrl(cat),
      is_default: Number(cat.id) === Number(currentDefaultCategoryId),
    }));
  }, [categories, buildCategoryUrl, currentDefaultCategoryId]);

  const saveDefaultCategory = async () => {
    if (!canUse) {
      const ok = await showConfirm(
        "Tu plan o complemento no permite Marca Blanca.\n\nNecesitas Plan 4 (Avanzado) + complemento de Plantilla.",
        "Ver planes / complementos"
      );
      if (ok) onRequestUpgrade?.();
      return;
    }

    const cid = Number(selectedCategoryId || 0);
    if (!cid) {
      return alertFromAxiosError(
        { response: { data: { message: "Selecciona una categoría default." } } },
        "Falta categoría"
      );
    }

    const selected = categories.find((c) => Number(c.id) === cid);
    if (!selected?.slug) {
      return alertFromAxiosError(
        { response: { data: { message: "La categoría seleccionada no tiene slug." } } },
        "Categoría inválida"
      );
    }

    if (!storefrontUrl) {
      return alertFromAxiosError(
        { response: { data: { message: "Primero guarda la URL de la tienda en Datos del sitio." } } },
        "Falta URL de tienda"
      );
    }

    const ok = await showConfirm(
      "Se reemplazará la categoría default actual por la nueva selección.",
      "Guardar default"
    );
    if (!ok) return;

    setSaving(true);
    try {
      if (Array.isArray(picks) && picks.length > 0) {
        await Promise.all(
          picks.map((pick) =>
            axiosClient.delete(`/admin/white-label/category-picks/${pick.id}`, {
              params: { branch_id: branchId },
            })
          )
        );
      }

      const { data } = await axiosClient.post("/admin/white-label/category-picks", {
        branch_id: branchId,
        category_id: cid,
        is_default: true,
      });

      const createdPick = data?.pick ?? null;

      if (createdPick) {
        setPicks([createdPick]);
      } else {
        await fetchAll();
      }

      await showSuccess("Categoría default guardada");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar la categoría default");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = async (url) => {
    const ok = await copyToClipboard(url);
    if (!ok) {
      return alertFromAxiosError(
        { response: { data: { message: "No se pudo copiar al portapapeles." } } },
        "No se pudo copiar"
      );
    }
    await showSuccess("URL copiada");
  };

  return (
    <Box>
      {!canUse ? (
        <Alert
          severity="warning"
          sx={{
            borderRadius: 2,
            bgcolor: alpha(COLORS.accent, 0.12),
            border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
            mb: 2,
          }}
        >
          Para configurar categoría default de Marca Blanca necesitas{" "}
          <b>Plan 4 (Avanzado)</b> y el complemento{" "}
          <b>💎 Plantilla premium de catálogo</b>.
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Chip
          label={currentDefaultPick ? "Default configurada" : "Sin default"}
          sx={{
            fontWeight: 900,
            bgcolor: alpha(COLORS.accent, 0.22),
            border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
          }}
        />

        <Button
          onClick={fetchAll}
          startIcon={<RefreshRoundedIcon />}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            borderColor: alpha("#000", 0.18),
            color: COLORS.black,
          }}
        >
          Recargar
        </Button>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          overflow: "hidden",
          mb: 2,
          bgcolor: "#fff",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography sx={{ fontWeight: 900, color: COLORS.black, mb: 0.5 }}>
            Categoría default
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Aquí solo se guarda una categoría default. Esa será la usada para tu landing o QR principal.
          </Typography>

          <Stack spacing={1.3}>
            <TextField
              label="Selecciona la categoría default"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              select
              fullWidth
              disabled={loading || saving || !canUse}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fff",
                },
              }}
            >
              <MenuItem value="">Selecciona una categoría</MenuItem>

              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.name} {c.slug ? `(${c.slug})` : ""}
                </MenuItem>
              ))}
            </TextField>

            <Button
              onClick={saveDefaultCategory}
              disabled={!canUse || loading || saving}
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                bgcolor: COLORS.black,
                px: 2,
                py: 1.2,
                "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
              }}
            >
              Guardar categoría default
            </Button>
          </Stack>

          {!canUse ? (
            <Button
              onClick={() => onRequestUpgrade?.()}
              variant="outlined"
              sx={{
                mt: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                borderColor: alpha("#000", 0.18),
                color: COLORS.black,
              }}
            >
              Ver planes / complementos
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Divider sx={{ my: 1.5 }} />

      {!storefrontUrl ? (
        <Alert
          severity="warning"
          sx={{
            borderRadius: 2,
            mb: 2,
            bgcolor: alpha(COLORS.accent, 0.10),
            border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
          }}
        >
          Primero guarda la <b>URL de la tienda</b> en “Datos del sitio” para poder armar las URLs de categorías.
        </Alert>
      ) : null}

      {loading ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            bgcolor: alpha("#000", 0.03),
            border: `1px solid ${alpha("#000", 0.08)}`,
          }}
        >
          Cargando categorías…
        </Alert>
      ) : categoriesWithUrl.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            bgcolor: alpha("#000", 0.03),
            border: `1px solid ${alpha("#000", 0.08)}`,
          }}
        >
          No hay categorías registradas para esta sucursal.
        </Alert>
      ) : isMobile ? (
        <Stack spacing={1.2}>
          <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
            Lista de categorías y URLs armadas
          </Typography>

          {categoriesWithUrl.map((cat) => (
            <Card
              key={cat.id}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${
                  cat.is_default
                    ? alpha(COLORS.accent, 0.55)
                    : alpha("#000", 0.10)
                }`,
                overflow: "hidden",
                bgcolor: cat.is_default ? alpha(COLORS.accent, 0.06) : "#fff",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 900, flex: 1 }}>
                      {cat.name || "Categoría"}
                    </Typography>

                    <Chip
                      size="small"
                      label={cat.is_default ? "DEFAULT" : "NORMAL"}
                      icon={
                        cat.is_default ? <StarRoundedIcon /> : <StarBorderRoundedIcon />
                      }
                      sx={{
                        fontWeight: 900,
                        bgcolor: cat.is_default
                          ? alpha(COLORS.accent, 0.22)
                          : alpha("#000", 0.04),
                        border: `1px solid ${alpha("#000", 0.08)}`,
                      }}
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    <b>Slug:</b> {cat.slug || "—"}
                  </Typography>

                  <TextField
                    label="URL armada"
                    value={cat.built_url || ""}
                    fullWidth
                    disabled
                    multiline
                    minRows={2}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: alpha("#000", 0.03),
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: cat.built_url ? (
                        <InputAdornment position="end">
                          <Tooltip title="Copiar URL">
                            <IconButton
                              onClick={() => handleCopyUrl(cat.built_url)}
                              size="small"
                            >
                              <ContentCopyRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                    }}
                  />

                  {cat.built_url ? (
                    <Button
                      onClick={() => handleCopyUrl(cat.built_url)}
                      variant="outlined"
                      startIcon={<ContentCopyRoundedIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 900,
                        borderColor: alpha("#000", 0.18),
                        color: COLORS.black,
                      }}
                    >
                      Copiar URL
                    </Button>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Box>
          <Typography sx={{ fontWeight: 900, color: COLORS.black, mb: 1.2 }}>
            Lista de categorías y URLs armadas
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha("#000", 0.08)}`,
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead
                sx={{
                  bgcolor: alpha("#000", 0.03),
                }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>URL armada</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 160 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {categoriesWithUrl.map((cat) => (
                  <TableRow
                    key={cat.id}
                    hover
                    sx={{
                      bgcolor: cat.is_default ? alpha(COLORS.accent, 0.05) : "transparent",
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 900 }}>
                        {cat.name || "Categoría"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {cat.slug || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={cat.is_default ? "DEFAULT" : "NORMAL"}
                        icon={
                          cat.is_default ? <StarRoundedIcon /> : <StarBorderRoundedIcon />
                        }
                        sx={{
                          fontWeight: 900,
                          bgcolor: cat.is_default
                            ? alpha(COLORS.accent, 0.22)
                            : alpha("#000", 0.04),
                          border: `1px solid ${alpha("#000", 0.08)}`,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: "break-all",
                          color: cat.built_url ? "text.primary" : "text.secondary",
                        }}
                      >
                        {cat.built_url || "No se pudo armar la URL"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {cat.built_url ? (
                        <Button
                          onClick={() => handleCopyUrl(cat.built_url)}
                          variant="outlined"
                          size="small"
                          startIcon={<ContentCopyRoundedIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 900,
                            borderColor: alpha("#000", 0.18),
                            color: COLORS.black,
                          }}
                        >
                          Copiar
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}