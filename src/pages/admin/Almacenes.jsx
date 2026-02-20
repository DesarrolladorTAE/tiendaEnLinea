import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
  Card,
  CardContent,
  Divider,
  TextField,
  InputAdornment,
  Skeleton,
  Chip,
  Tooltip,
  Alert,
  Grow,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha, keyframes } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";

import axiosClient from "../../config/axiosClient";
import { showConfirm, showSuccess, alertFromAxiosError } from "../../utils/alerts";
import { useAdminUi } from "../../context/AdminUiContext";

import WarehouseFormModal from "../../components/warehouses/WarehouseFormModal";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const floatIn = keyframes`
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0px); opacity: 1; }
`;

const buildAddress = (w) => {
  const parts = [
    w?.address_line1,
    w?.address_line2,
    w?.neighborhood,
    w?.city,
    w?.state,
    w?.postal_code,
    w?.country,
  ].filter(Boolean);
  return parts.join(", ");
};

export default function Warehouses() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();

  const branchFromNav = location.state?.branch ?? null;
  const branchIdFromUrl = params.get("branch_id");

  const activeBranch = useMemo(() => {
    if (branchFromNav?.id) return branchFromNav;
    if (selectedBranch?.id) return selectedBranch;
    if (branchIdFromUrl) return { id: Number(branchIdFromUrl) };
    return null;
  }, [branchFromNav, selectedBranch, branchIdFromUrl]);

  useEffect(() => {
    setHideLayout(false);
  }, [setHideLayout]);

  useEffect(() => {
    if (branchFromNav?.id) setSelectedBranch(branchFromNav);
  }, [branchFromNav, setSelectedBranch]);

  useEffect(() => {
    if (!activeBranch?.id) navigate("/admin/sucursales");
  }, [activeBranch?.id, navigate]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((w) => {
      const name = (w?.name || "").toLowerCase();
      const code = (w?.code || "").toLowerCase();
      const city = (w?.city || "").toLowerCase();
      return name.includes(s) || code.includes(s) || city.includes(s);
    });
  }, [rows, q]);

  const fetchWarehouses = useCallback(async () => {
    if (!activeBranch?.id) return;

    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/branches/${activeBranch.id}/warehouses`);
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar los almacenes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    if (!activeBranch?.id) return;
    fetchWarehouses();
  }, [activeBranch?.id, fetchWarehouses]);

  const handleOpenCreate = () => {
    setSelected(null);
    setCreateOpen(true);
  };

  const handleOpenEdit = (w) => {
    setSelected(w);
    setEditOpen(true);
  };

  const handleDelete = async (w) => {
    const ok = await showConfirm(
      "¿Está seguro de eliminar este almacén? Se eliminará toda la información asociada.",
      "Sí, eliminar",
    );
    if (!ok) return;

    try {
      await axiosClient.delete(`/warehouses/${w.id}`);
      await showSuccess("Almacén eliminado");
      fetchWarehouses();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar el almacén");
    }
  };

  const goInventoryGlobal = () =>
    navigate("/admin/inventario", {
      state: { branch: activeBranch, scope: "global" },
    });

  const goBranches = () => navigate("/admin/sucursales");

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        {/* =======================
            1) ENCABEZADO (qué es qué)
           ======================= */}
        <Stack spacing={1.5} sx={{ mb: 2.25 }}>
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
              <WarehouseRoundedIcon sx={{ color: COLORS.black }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.black }}>
                Almacenes 
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.6 }}>
                {activeBranch?.name
                  ? `Sucursal activa: ${activeBranch.name}`
                  : activeBranch?.id
                    ? `Sucursal activa: #${activeBranch.id}`
                    : "Seleccione una sucursal"}
              </Typography>
            </Box>

            <Tooltip title="Cambiar sucursal">
              <IconButton
                onClick={goBranches}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* =======================
              2) ACCIONES (buscar + botones)
             ======================= */}
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            alignItems="stretch"
            sx={{ width: "100%" }}
          >
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar almacén (nombre, código o ciudad)…"
              size="small"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems="stretch">
              <Button
                onClick={goInventoryGlobal}
                variant="outlined"
                startIcon={<Inventory2RoundedIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                Inventario Sin Almacen
              </Button>

              <Button
                onClick={handleOpenCreate}
                variant="contained"
                startIcon={<AddRoundedIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  bgcolor: COLORS.black,
                  "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                  minWidth: isMobile ? "100%" : 190,
                }}
              >
                Nuevo almacén
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* =======================
            3) CONTENIDO (resumen + lista)
           ======================= */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha("#000", 0.08)}`,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
            {/* Resumen (chips) */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
              <Chip
                icon={<WarehouseRoundedIcon />}
                label={loading ? "Cargando…" : `${filtered.length} almacén(es)`}
                sx={{
                  fontWeight: 900,
                  bgcolor: alpha(COLORS.accent, 0.22),
                  border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                }}
              />

              {activeBranch?.id ? (
                <Chip
                  icon={<LocationOnRoundedIcon />}
                  label={activeBranch?.name ? activeBranch.name : `Sucursal #${activeBranch.id}`}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              ) : null}

              <Chip
                label="Tip: entra a un almacén para ver su inventario específico"
                variant="outlined"
                sx={{ fontWeight: 700, bgcolor: alpha("#000", 0.02) }}
              />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {!activeBranch?.id ? (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha("#000", 0.03),
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              >
                Primero seleccione una sucursal para ver sus almacenes.
              </Alert>
            ) : loading ? (
              <Stack spacing={1.2}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Skeleton variant="rounded" width={48} height={48} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="45%" />
                      <Skeleton width="70%" />
                    </Box>
                    <Skeleton variant="rounded" width={120} height={36} />
                  </Box>
                ))}
              </Stack>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.black }}>
                  No hay almacenes
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Cree su primer almacén para manejar stock por ubicación dentro de la sucursal.
                </Typography>

                <Button
                  onClick={handleOpenCreate}
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    bgcolor: COLORS.black,
                    "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                  }}
                >
                  Crear almacén
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.2}>
                {filtered.map((w, idx) => {
                  const addr = buildAddress(w);
                  const meta = [
                    w?.type ? `Tipo: ${w.type}` : "Tipo: (sin definir)",
                    w?.use_branch_address ? "Usa dirección de sucursal" : "Dirección propia",
                  ].join(" • ");

                  return (
                    <Grow in key={w.id} timeout={200 + idx * 40}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2.5,
                          border: `1px solid ${alpha("#000", 0.08)}`,
                          transition: "transform 150ms ease, box-shadow 150ms ease",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: `0 8px 28px ${alpha("#000", 0.1)}`,
                          },
                          animation: `${floatIn} 250ms ease`,
                        }}
                      >
                        <CardContent
                          sx={{
                            p: { xs: 1.5, md: 2 },
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: 2,
                              bgcolor: alpha(COLORS.accent, 0.22),
                              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            <WarehouseRoundedIcon sx={{ color: COLORS.black }} />
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 240 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
                                {w?.name || "Almacén sin nombre"}
                              </Typography>

                              {w?.is_default ? (
                                <Chip
                                  size="small"
                                  label="Default"
                                  sx={{ fontWeight: 900, bgcolor: alpha(COLORS.accent, 0.25) }}
                                />
                              ) : null}

                              {w?.code ? (
                                <Chip size="small" label={w.code} variant="outlined" />
                              ) : null}

                              {w?.is_active === false ? (
                                <Chip size="small" label="Inactivo" color="default" />
                              ) : (
                                <Chip size="small" label="Activo" sx={{ bgcolor: alpha("#2e7d32", 0.12) }} />
                              )}
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                              {meta}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              {addr || "Sin dirección configurada"}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
                            <Tooltip title="Ver inventario de este almacén">
                              <IconButton
                                onClick={() =>
                                  navigate("/admin/inventario", {
                                    state: { branch: activeBranch, warehouse: w },
                                  })
                                }
                                sx={{
                                  borderRadius: 2,
                                  border: `1px solid ${alpha("#000", 0.08)}`,
                                }}
                              >
                                <Inventory2RoundedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar">
                              <IconButton
                                onClick={() => handleOpenEdit(w)}
                                sx={{
                                  borderRadius: 2,
                                  border: `1px solid ${alpha("#000", 0.08)}`,
                                }}
                              >
                                <EditRoundedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Eliminar">
                              <IconButton
                                onClick={() => handleDelete(w)}
                                sx={{
                                  borderRadius: 2,
                                  border: `1px solid ${alpha(COLORS.danger, 0.35)}`,
                                  color: COLORS.danger,
                                  "&:hover": { bgcolor: alpha(COLORS.danger, 0.08) },
                                }}
                              >
                                <DeleteOutlineRoundedIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grow>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Modales */}
        <WarehouseFormModal
          open={createOpen}
          mode="create"
          branchId={activeBranch?.id}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            fetchWarehouses();
          }}
        />

        <WarehouseFormModal
          open={editOpen}
          mode="edit"
          branchId={activeBranch?.id}
          warehouse={selected}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            fetchWarehouses();
          }}
        />
      </Container>
    </Box>
  );
}