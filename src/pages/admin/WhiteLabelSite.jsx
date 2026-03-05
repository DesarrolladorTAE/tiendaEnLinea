import React, { useCallback, useEffect, useState } from "react";
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

import axiosClient from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";
import { showConfirm, showSuccess, alertFromAxiosError } from "../../utils/alerts";

import WhiteLabelEditorDialog from "./modals/WhiteLabelEditorDialog";

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

export default function WhiteLabelPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const { selectedBranch } = useAdminUi();
  const { tiendaLoading } = useTienda();
  const branchId = selectedBranch?.id ? Number(selectedBranch.id) : null;

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);

  // Dialog editor
  const [openEditor, setOpenEditor] = useState(false);
  const [editingId, setEditingId] = useState(null); // null => create

  const fetchSites = useCallback(
    async (opts = { silent: false }) => {
      if (!branchId) return;

      // si quieres que en silent no parpadee, usa esto:
      if (!opts.silent) setLoading(true);
      else setLoading(true); // déjalo así si quieres skeleton siempre

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
        if (!opts.silent) await showSuccess("Sitios actualizados");
      } catch (err) {
        alertFromAxiosError(err, "No se pudieron cargar los sitios de Marca Blanca");
        setSites([]);
      } finally {
        setLoading(false);
      }
    },
    [branchId]
  );

  useEffect(() => {
    if (!branchId) return;
    fetchSites({ silent: true });
  }, [branchId, fetchSites]);

  const handleCreate = () => {
    setEditingId(null);
    setOpenEditor(true);
  };

  const handleEdit = (id) => {
    setEditingId(Number(id));
    setOpenEditor(true);
  };

  const handleDelete = async (row) => {
    const ok = await showConfirm(
      `¿Eliminar este sitio de Marca Blanca?\n\n${row?.site_name || "Sitio"}\n\nEsta acción no se puede deshacer.`,
      "Sí, eliminar"
    );
    if (!ok) return;

    try {
      await axiosClient.delete(`/admin/white-label/site/${row.id}`, {
        params: { branch_id: branchId },
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
        { response: { data: { message: "No se pudo copiar al portapapeles." } } },
        "No se pudo copiar"
      );
    }
    await showSuccess("Copiado");
  };

  // estilos reutilizables (para que quede igual a tus dialogs)
  const sxBtnOutlined = {
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 900,
    borderColor: alpha("#000", 0.15),
    color: COLORS.black,
    bgcolor: "#fff",
    "&:hover": { bgcolor: alpha("#000", 0.03) },
  };

  const sxBtnBlack = {
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 900,
    bgcolor: COLORS.black,
    color: "#fff",
    "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        {/* Header tipo “card” como dialog */}
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
                      sx={{ fontWeight: 900, color: COLORS.black, lineHeight: 1.1 }}
                    >
                      Marca Blanca
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Administra los sitios por sucursal y edita su info + categorías.
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
                    sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                  />
                  <Chip
                    label={loading ? "Cargando…" : `${sites.length} sitio(s)`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: alpha(COLORS.accent, 0.22),
                      border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                    }}
                  />
                  {tiendaLoading ? (
                    <Chip
                      label="Cargando tienda…"
                      variant="outlined"
                      sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
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

              <Divider sx={{ my: 1.2 }} />

              {loading ? (
                <Box sx={{ p: 1 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Skeleton variant="rounded" height={44} sx={{ borderRadius: 2 }} />
                    </Box>
                  ))}
                </Box>
              ) : sites.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.black }}>
                    No hay sitios de Marca Blanca
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Crea uno para comenzar a configurar la información y categorías.
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
                              ID: {row.id} · Activo: {row.is_active ? "Sí" : "No"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">{row.public_base_url || "—"}</Typography>
                            {row.public_base_url ? (
                              <Button
                                size="small"
                                onClick={() => handleCopy(row.public_base_url)}
                                startIcon={<ContentCopyRoundedIcon fontSize="small" />}
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
                            <Typography variant="body2">{row.storefront_url || "—"}</Typography>
                            {row.storefront_url ? (
                              <Button
                                size="small"
                                onClick={() => handleCopy(row.storefront_url)}
                                startIcon={<ContentCopyRoundedIcon fontSize="small" />}
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
                            <Stack direction="row" spacing={0.8}>
                              <Tooltip title="Editar">
                                <IconButton
                                  onClick={() => handleEdit(row.id)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha("#000", 0.10)}`,
                                    bgcolor: "#fff",
                                    "&:hover": { bgcolor: alpha("#000", 0.03) },
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
                                    border: `1px solid ${alpha(COLORS.danger, 0.25)}`,
                                    color: COLORS.danger,
                                    bgcolor: alpha(COLORS.danger, 0.03),
                                    "&:hover": { bgcolor: alpha(COLORS.danger, 0.06) },
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


        {/* Editor (form + categorías) */}
        <WhiteLabelEditorDialog
          open={openEditor}
          onClose={() => {
            setOpenEditor(false);
            setEditingId(null);
          }}
          branchId={branchId}
          siteId={editingId}
          onSaved={(savedSite) => {
            setSites((prev) => {
              const list = Array.isArray(prev) ? prev.slice() : [];
              const idx = list.findIndex((x) => Number(x.id) === Number(savedSite?.id));
              if (idx >= 0) list[idx] = savedSite;
              else list.unshift(savedSite);
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