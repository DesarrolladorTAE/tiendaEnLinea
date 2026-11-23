import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Tooltip,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

import axiosClient from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";
import {
  showConfirm,
  showSuccess,
  alertFromAxiosError,
} from "../../utils/alerts";

import WhiteLabelEditorDialog from "./modals/WhiteLabelEditorDialog";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
  success: "#2e7d32",
};

const PLAN_NAMES = {
  1: "Plan Demo",
  2: "Plan Negocio",
  3: "Plan Profesional",
  4: "Plan Avanzado",
};

const PLAN_DEMO_ID = 1;
const PLAN_AVANZADO_ID = 4;
const WHITE_LABEL_COMPLEMENT_ID = 3;

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

export default function WhiteLabelSite() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const { selectedBranch } = useAdminUi();
  const { tiendaLoading, tienda } = useTienda();

  const branchId = selectedBranch?.id ? Number(selectedBranch.id) : null;

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const [openEditor, setOpenEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [misComplementos, setMisComplementos] = useState([]);
  const [loadingComplementos, setLoadingComplementos] = useState(true);

  const planId = useMemo(() => {
    return Number(
      tienda?.plan_id ||
        tienda?.subscription?.plan_id ||
        tienda?.store_plan?.plan_id ||
        0
    );
  }, [tienda]);

  const nombrePlanActual = useMemo(() => {
    return PLAN_NAMES[planId] || "Sin plan asignado";
  }, [planId]);

  useEffect(() => {
    let cancelled = false;

    const fetchMisComplementos = async () => {
      setLoadingComplementos(true);
      try {
        const { data } = await axiosClient.get("/mis-complementos");
        const raw = data?.data ?? data ?? [];
        const list = Array.isArray(raw) ? raw : [];

        if (!cancelled) {
          setMisComplementos(list);
        }
      } catch (_) {
        if (!cancelled) {
          setMisComplementos([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingComplementos(false);
        }
      }
    };

    fetchMisComplementos();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasWhiteLabelComplement = useMemo(() => {
    return misComplementos.some((item) => {
      const complementoId = Number(
        item?.complemento_id ||
          item?.id ||
          item?.complemento?.id ||
          item?.complemento?.complemento_id ||
          0
      );

      return complementoId === WHITE_LABEL_COMPLEMENT_ID;
    });
  }, [misComplementos]);

  const canUseWhiteLabel = useMemo(() => {
    return (
      planId === PLAN_DEMO_ID ||
      (planId === PLAN_AVANZADO_ID && hasWhiteLabelComplement)
    );
  }, [planId, hasWhiteLabelComplement]);

  const handleRequestUpgrade = useCallback(async () => {
    const ok = await showConfirm(
      `Tu plan actual es ${nombrePlanActual}.\n\nPara usar Marca Blanca necesitas:\n Plan Avanzado + complemento 💎 Plantilla premium de catálogo.`,
      "Ver planes / complementos"
    );

    if (ok) {
      navigate("/admin/membresia");
    }
  }, [navigate, nombrePlanActual]);

  const fetchSites = useCallback(
    async (opts = { silent: false }) => {
      if (!branchId) {
        setSites([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data } = await axiosClient.get("/admin/white-label/site", {
          params: { branch_id: branchId },
        });

        const list = Array.isArray(data?.sites)
          ? data.sites
          : Array.isArray(data?.data)
          ? data.data
          : data?.site
          ? [data.site]
          : [];

        setSites(list);

        if (!opts.silent) {
          await showSuccess("Sitios actualizados");
        }
      } catch (err) {
        alertFromAxiosError(
          err,
          "No se pudieron cargar los sitios de Marca Blanca"
        );
        setSites([]);
      } finally {
        setLoading(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    if (!branchId) {
      setSites([]);
      setLoading(false);
      return;
    }

    fetchSites({ silent: true });
  }, [branchId, fetchSites]);

  const handleCreate = async () => {
    if (!canUseWhiteLabel) {
      await handleRequestUpgrade();
      return;
    }

    setEditingId(null);
    setOpenEditor(true);
  };

  const handleEdit = async (id) => {
    if (!canUseWhiteLabel) {
      await handleRequestUpgrade();
      return;
    }

    setEditingId(Number(id));
    setOpenEditor(true);
  };

  const handleDelete = async (row) => {
    const ok = await showConfirm(
      `¿Eliminar este sitio de Marca Blanca?\n\n${
        row?.site_name || "Sitio"
      }\n\nEsta acción no se puede deshacer.`,
      "Sí, eliminar"
    );

    if (!ok) return;

    try {
      await axiosClient.delete("/admin/white-label/site", {
        params: {
          id: row.id,
          branch_id: branchId,
        },
      });

      setSites((prev) => prev.filter((x) => Number(x.id) !== Number(row.id)));
      await showSuccess("Sitio eliminado");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar");
    }
  };

  const handleCopy = async (text) => {
    const ok = await copyToClipboard(text);

    if (!ok) {
      return alertFromAxiosError(
        {
          response: {
            data: {
              message: "No se pudo copiar al portapapeles.",
            },
          },
        },
        "No se pudo copiar"
      );
    }

    await showSuccess("Copiado");
  };

  const sxBtnOutlined = {
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 900,
    borderColor: alpha("#000", 0.15),
    color: COLORS.black,
    bgcolor: "#fff",
    "&:hover": {
      bgcolor: alpha("#000", 0.03),
    },
  };

  const sxBtnBlack = {
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 900,
    bgcolor: COLORS.black,
    color: "#fff",
    "&:hover": {
      bgcolor: alpha(COLORS.black, 0.85),
    },
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${alpha("#000", 0.08)}`,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack
              direction={isMobile ? "column" : "row"}
              alignItems={isMobile ? "flex-start" : "center"}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={0.8} sx={{ width: "100%" }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: alpha(COLORS.accent, 0.22),
                      border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <StorefrontRoundedIcon sx={{ color: COLORS.black }} />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 900,
                        color: COLORS.black,
                        lineHeight: 1.1,
                      }}
                    >
                      Marca Blanca
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Administra los sitios por sucursal y edita su información
                      y categorías.
                    </Typography>
                  </Box>

                  <Button
                    onClick={() => navigate("/admin/sucursales")}
                    startIcon={<ArrowBackRoundedIcon />}
                    variant="outlined"
                    sx={sxBtnOutlined}
                  >
                    Sucursales
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={
                      branchId
                        ? `Sucursal: ${selectedBranch?.name || `#${branchId}`}`
                        : "Sin sucursal"
                    }
                    variant="outlined"
                    sx={{
                      fontWeight: 900,
                      borderColor: alpha("#000", 0.15),
                    }}
                  />

                  <Chip
                    label={`Plan actual: ${nombrePlanActual}`}
                    variant="outlined"
                    sx={{
                      fontWeight: 900,
                      borderColor: alpha("#000", 0.15),
                    }}
                  />

                  <Chip
                    label={loading ? "Cargando…" : `${sites.length} sitio(s)`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: alpha(COLORS.accent, 0.22),
                      border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                    }}
                  />

                  {!canUseWhiteLabel ? (
                    <Chip
                      icon={<LockRoundedIcon />}
                      label="Acceso restringido"
                      variant="outlined"
                      sx={{
                        fontWeight: 900,
                        borderColor: alpha(COLORS.danger, 0.25),
                        color: COLORS.danger,
                      }}
                    />
                  ) : null}

                  {tiendaLoading || loadingComplementos ? (
                    <Chip
                      label="Validando acceso…"
                      variant="outlined"
                      sx={{
                        fontWeight: 900,
                        borderColor: alpha("#000", 0.15),
                      }}
                    />
                  ) : null}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!branchId ? (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              bgcolor: alpha("#000", 0.03),
              border: `1px solid ${alpha("#000", 0.08)}`,
            }}
          >
            Primero selecciona una sucursal para ver los sitios de Marca Blanca.
          </Alert>
        ) : (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha("#000", 0.08)}`,
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Stack spacing={0.3}>
                  <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
                    Sitios configurados
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Da clic en Editar para abrir los formularios y categorías.
                  </Typography>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    onClick={() => fetchSites({ silent: false })}
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    sx={sxBtnOutlined}
                  >
                    Recargar
                  </Button>

                  <Button
                    onClick={handleCreate}
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={sxBtnBlack}
                  >
                    Crear nuevo
                  </Button>
                </Stack>
              </Stack>

              {!canUseWhiteLabel ? (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(COLORS.accent, 0.1),
                    border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
                  }}
                >
                  Esta función no está disponible con tu plan actual.
                  <br />
                  <b>Tu plan actual:</b> {nombrePlanActual}
                  <br />
                  <b>Para usar Marca Blanca necesitas:</b>
                  <br />• <b>Plan Avanzado</b> +{" "}
                  <b>💎 Plantilla premium de catálogo</b>
                </Alert>
              ) : null}

              <Divider sx={{ my: 1.2 }} />

              {loading ? (
                <Box sx={{ p: 1 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Skeleton
                        variant="rounded"
                        height={44}
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : sites.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 900, color: COLORS.black }}
                  >
                    No hay sitios de Marca Blanca
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Crea uno para comenzar a configurar la información y
                    categorías.
                  </Typography>

                  <Button
                    onClick={handleCreate}
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={{ mt: 2, ...sxBtnBlack }}
                  >
                    Crear nuevo
                  </Button>
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha("#000", 0.06)}`,
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: alpha("#000", 0.02),
                          "& th": { fontWeight: 900 },
                        }}
                      >
                        <TableCell>Sitio</TableCell>
                        <TableCell>Base URL</TableCell>
                        <TableCell>Tienda URL</TableCell>
                        <TableCell>Paginado</TableCell>
                        <TableCell sx={{ width: 180 }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {sites.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 900 }}>
                              {row.site_name || `Sitio #${row.id}`}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                              ID: {row.id} · Activo:{" "}
                              {row.is_active ? "Sí" : "No"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {row.public_base_url || "—"}
                            </Typography>

                            {row.public_base_url ? (
                              <Button
                                size="small"
                                onClick={() => handleCopy(row.public_base_url)}
                                startIcon={
                                  <ContentCopyRoundedIcon fontSize="small" />
                                }
                                sx={{
                                  mt: 0.5,
                                  textTransform: "none",
                                  fontWeight: 900,
                                  borderRadius: 2,
                                }}
                              >
                                Copiar
                              </Button>
                            ) : null}
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {row.storefront_url || "—"}
                            </Typography>

                            {row.storefront_url ? (
                              <Button
                                size="small"
                                onClick={() => handleCopy(row.storefront_url)}
                                startIcon={
                                  <ContentCopyRoundedIcon fontSize="small" />
                                }
                                sx={{
                                  mt: 0.5,
                                  textTransform: "none",
                                  fontWeight: 900,
                                  borderRadius: 2,
                                }}
                              >
                                Copiar
                              </Button>
                            ) : null}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={
                                row.pagination_enabled
                                  ? "Activo"
                                  : "Desactivado"
                              }
                              size="small"
                              sx={{
                                fontWeight: 900,
                                bgcolor: row.pagination_enabled
                                  ? alpha(COLORS.success, 0.12)
                                  : alpha(COLORS.danger, 0.12),
                                color: row.pagination_enabled
                                  ? COLORS.success
                                  : COLORS.danger,
                                border: `1px solid ${
                                  row.pagination_enabled
                                    ? alpha(COLORS.success, 0.25)
                                    : alpha(COLORS.danger, 0.25)
                                }`,
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={0.8}>
                              <Tooltip title="Editar">
                                <IconButton
                                  onClick={() => handleEdit(row.id)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha("#000", 0.1)}`,
                                    bgcolor: "#fff",
                                    "&:hover": {
                                      bgcolor: alpha("#000", 0.03),
                                    },
                                  }}
                                >
                                  <EditRoundedIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Eliminar">
                                <IconButton
                                  onClick={() => handleDelete(row)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(
                                      COLORS.danger,
                                      0.25
                                    )}`,
                                    color: COLORS.danger,
                                    bgcolor: alpha(COLORS.danger, 0.03),
                                    "&:hover": {
                                      bgcolor: alpha(COLORS.danger, 0.06),
                                    },
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        <WhiteLabelEditorDialog
          open={Boolean(openEditor)}
          onClose={() => {
            setOpenEditor(false);
            setEditingId(null);
          }}
          branchId={branchId}
          siteId={editingId}
          canUse={canUseWhiteLabel}
          onRequestUpgrade={handleRequestUpgrade}
          onSaved={(savedSite) => {
            setSites((prev) => {
              const list = Array.isArray(prev) ? prev.slice() : [];
              const idx = list.findIndex(
                (x) => Number(x.id) === Number(savedSite?.id)
              );

              if (idx >= 0) {
                list[idx] = savedSite;
              } else {
                list.unshift(savedSite);
              }

              return list;
            });

            setOpenEditor(false);
            setEditingId(null);
          }}
        />
      </Container>
    </Box>
  );
}