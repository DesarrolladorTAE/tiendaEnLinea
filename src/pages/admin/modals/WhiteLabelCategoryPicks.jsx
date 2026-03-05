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
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
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

export default function WhiteLabelCategoryPicks({ branchId, canUse, onRequestUpgrade }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [picks, setPicks] = useState([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [asDefault, setAsDefault] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [catsRes, picksRes] = await Promise.all([
        axiosClient.get("/categories", { params: { branch_id: branchId, mode: "flat" } }),
        axiosClient.get("/admin/white-label/category-picks", { params: { branch_id: branchId } }),
      ]);

      const cats = Array.isArray(catsRes?.data?.categories) ? catsRes.data.categories : [];
      const p = Array.isArray(picksRes?.data?.picks) ? picksRes.data.picks : [];

      // Importante: categorías deben traer slug (ya lo ajustaste en controller)
      setCategories(cats);
      setPicks(p);
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar configuración de categorías");
      setCategories([]);
      setPicks([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    fetchAll();
  }, [branchId, fetchAll]);

  const pickedIds = useMemo(() => new Set(picks.map((x) => Number(x.category_id))), [picks]);

  const availableCategories = useMemo(() => {
    // puedes permitir repetir si quieres, pero normalmente no
    return categories.filter((c) => !pickedIds.has(Number(c.id)));
  }, [categories, pickedIds]);

  const maxReached = picks.length >= 3;

  const addPick = async () => {
    if (!canUse) {
      const ok = await showConfirm(
        "Tu plan/complemento no permite Marca Blanca.\n\nNecesitas Plan 4 (Avanzado) + complemento de Plantilla.",
        "Ver planes / complementos"
      );
      if (ok) onRequestUpgrade?.();
      return;
    }

    if (maxReached) {
      return alertFromAxiosError(
        { response: { data: { message: "Máximo 3 categorías." } } },
        "Máximo 3 categorías"
      );
    }

    const cid = Number(selectedCategoryId || 0);
    if (!cid) {
      return alertFromAxiosError(
        { response: { data: { message: "Selecciona una categoría." } } },
        "Falta categoría"
      );
    }

    setSaving(true);
    try {
      const { data } = await axiosClient.post("/admin/white-label/category-picks", {
        branch_id: branchId,
        category_id: cid,
        is_default: !!asDefault,
      });

      const pick = data?.pick;
      if (pick) {
        setPicks((p) => {
          // si marcaste default, backend ya apagó los demás, pero reflejamos:
          const next = !!pick.is_default
            ? p.map((x) => ({ ...x, is_default: false }))
            : p.slice();
          return [...next, pick].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
        });
        setSelectedCategoryId("");
        await showSuccess("Categoría agregada");
      } else {
        await fetchAll();
      }
    } catch (err) {
      alertFromAxiosError(err, "No se pudo agregar");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (pick) => {
    if (!canUse) return;

    setSaving(true);
    try {
      await axiosClient.put(`/admin/white-label/category-picks/${pick.id}`, {
        branch_id: branchId,
        is_default: true,
      });

      // refresh local
      setPicks((p) =>
        p.map((x) => ({ ...x, is_default: x.id === pick.id }))
      );

      await showSuccess("Categoría por defecto actualizada");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo actualizar default");
    } finally {
      setSaving(false);
    }
  };

  const removePick = async (pick) => {
    const ok = await showConfirm(
      "¿Eliminar esta categoría de Marca Blanca?\n\nYa no aparecerá como opción de QR / landing.",
      "Sí, eliminar"
    );
    if (!ok) return;

    setSaving(true);
    try {
      await axiosClient.delete(`/admin/white-label/category-picks/${pick.id}`, {
        params: { branch_id: branchId },
      });

      setPicks((p) => p.filter((x) => x.id !== pick.id));
      await showSuccess("Categoría eliminada");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar");
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
          Para configurar categorías de Marca Blanca necesitas <b>Plan 4 (Avanzado)</b> y el complemento <b>💎 Plantilla premium de catálogo</b>.
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Chip
          label={`Seleccionadas: ${picks.length}/3`}
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
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Typography sx={{ fontWeight: 900, color: COLORS.black, mb: 0.5 }}>
            Agregar categoría (máx 3)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Estas categorías se usan para construir URLs por slug y generar códigos QR.
          </Typography>

          <Grid container spacing={1.2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                label="Categoría"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                select
                fullWidth
                disabled={loading || saving || !canUse || maxReached}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
              >
                <MenuItem value="">
                  {maxReached ? "Máximo alcanzado" : "Selecciona…"}
                </MenuItem>
                {availableCategories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name} {c.slug ? `(${c.slug})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  onClick={() => setAsDefault((v) => !v)}
                  variant="outlined"
                  disabled={!canUse || loading || saving}
                  startIcon={asDefault ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    borderColor: alpha("#000", 0.18),
                    color: COLORS.black,
                    minWidth: 220,
                  }}
                >
                  {asDefault ? "Será default" : "No default"}
                </Button>

                <Button
                  onClick={addPick}
                  disabled={!canUse || loading || saving || maxReached}
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    bgcolor: COLORS.black,
                    "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                    minWidth: 170,
                  }}
                >
                  Agregar
                </Button>
              </Stack>
            </Grid>
          </Grid>

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
      ) : picks.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            bgcolor: alpha("#000", 0.03),
            border: `1px solid ${alpha("#000", 0.08)}`,
          }}
        >
          Aún no has seleccionado categorías. Agrega hasta 3.
        </Alert>
      ) : (
        <Grid container spacing={1.2}>
          {picks.map((p) => (
            <Grid item xs={12} md={6} key={p.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha("#000", 0.10)}`,
                  overflow: "hidden",
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 10px 26px ${alpha("#000", 0.10)}`,
                    borderColor: alpha(COLORS.accent, 0.55),
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 900, flex: 1 }}>
                      {p.category_name || "Categoría"}
                    </Typography>

                    <Chip
                      size="small"
                      label={p.is_default ? "DEFAULT" : "OPCIONAL"}
                      icon={p.is_default ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                      sx={{
                        fontWeight: 900,
                        bgcolor: p.is_default ? alpha(COLORS.accent, 0.22) : alpha("#000", 0.04),
                        border: `1px solid ${alpha("#000", 0.08)}`,
                      }}
                    />

                    <Tooltip title="Eliminar">
                      <IconButton
                        onClick={() => removePick(p)}
                        disabled={!canUse || saving}
                        sx={{ borderRadius: 2 }}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                    <b>Slug:</b> {p.category_slug || "—"}
                  </Typography>

                  <TextField
                    label="URL (para QR)"
                    value={p.category_url || ""}
                    fullWidth
                    disabled
                    sx={{
                      mt: 1.2,
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
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copiar URL">
                            <IconButton onClick={() => handleCopyUrl(p.category_url)} size="small">
                              <ContentCopyRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.2 }}>
                    <Button
                      onClick={() => setDefault(p)}
                      disabled={!canUse || saving || p.is_default}
                      variant="contained"
                      startIcon={<StarRoundedIcon />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 900,
                        bgcolor: COLORS.black,
                        "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                      }}
                    >
                      Hacer default
                    </Button>

                    <Button
                      onClick={() => handleCopyUrl(p.category_url)}
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
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}