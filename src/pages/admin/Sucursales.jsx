import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
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
  Fade,
  Grow,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha, keyframes } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import { useNavigate } from "react-router-dom";

import axiosClient from "../../config/axiosClient";
import { showConfirm, showSuccess, alertFromAxiosError } from "../../utils/alerts";
import { useTienda } from "../../context/TiendaContext";
import { useAdminUi } from "../../context/AdminUiContext";

import BranchFormModal from "../../components/branches/BranchFormModal";
import BranchDetailsModal from "../../components/branches/BranchDetailsModal";

// ✅ NUEVO: modal de confirmación de pagos offline
import OfflinePaymentsModal from "../../components/offline/OfflinePaymentsModal";
import StoreHubNav from "../../components/admin/StoreHubNav";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const floatIn = keyframes`
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0px); opacity: 1; }
`;

// 🔧 Ajusta estos IDs si tus planes tienen otros valores.
const PLAN_LIMITS = {
  1: Infinity, // Demo
  2: 1,        // Negocio
  3: 3,        // Profesional
  4: Infinity, // Avanzado
};

const getBranchLimit = (planId) => {
  const n = Number(planId);
  return PLAN_LIMITS[n] ?? 1;
};

export default function Sucursales() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const { tienda, tiendaLoading, openPlanesModal } = useTienda();
  const { setHideLayout, setSelectedBranch } = useAdminUi();

  const storeId = tienda?.id ?? null;
  const planId = tienda?.plan_id ?? null;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // ✅ opcional (si quieres seguir teniendo modal de detalles)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // ✅ NUEVO: modal pagos offline
  const [offlineOpen, setOfflineOpen] = useState(false);

  // ✅ ocultar layout al entrar a sucursales
  useEffect(() => {
    setHideLayout(true);
    setSelectedBranch(null);

    return () => {
      setHideLayout(false);
      // setSelectedBranch(null); // opcional
    };
  }, [setHideLayout, setSelectedBranch]);

  const limit = useMemo(() => getBranchLimit(planId), [planId]);
  const used = rows?.length ?? 0;
  const canCreate = limit === Infinity ? true : used < limit;

  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((b) => {
      const name = (b?.name || "").toLowerCase();
      const code = (b?.code || "").toLowerCase();
      const city = (b?.city || "").toLowerCase();
      return name.includes(s) || code.includes(s) || city.includes(s);
    });
  }, [rows, q]);

  const fetchBranches = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/branches", {
        params: { store_id: storeId },
      });
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar las sucursales");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (tiendaLoading) return;
    if (!storeId) return;
    fetchBranches();
  }, [tiendaLoading, storeId, fetchBranches]);

  const handleOpenCreate = () => setCreateOpen(true);
  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    localStorage.removeItem("STORE_SLUG");
    sessionStorage.removeItem("ADMIN_SELECTED_BRANCH");
    navigate("/login-register", { replace: true });
  };

  const handleOpenEdit = (branch) => {
    setSelected(branch);
    setEditOpen(true);
  };

  // ✅ NUEVO: seleccionar sucursal y navegar a productos
  const handleSelectBranch = (branch) => {
    if (!branch?.id) return;

    setSelectedBranch(branch);
    setHideLayout(false);

    navigate(`/admin/products?branch_id=${branch.id}`, {
      state: { branch },
    });
  };

  // ✅ opcional: seguir usando detalle modal si lo quieres
  const handleOpenDetailsModal = (branch) => {
    setSelected(branch);
    setDetailsOpen(true);
  };

  const handleDelete = async (branch) => {
    const ok = await showConfirm(
      "¿Estás seguro de eliminar esta sucursal? Se eliminará toda la información habida y por haber.",
      "Sí, eliminar"
    );
    if (!ok) return;

    try {
      await axiosClient.delete(`/branches/${branch.id}`, {
        params: { delete_warehouses: 1 },
      });
      await showSuccess("Sucursal eliminada");
      fetchBranches();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar la sucursal");
    }
  };

  const header = (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3, px: { xs: 2, sm: 2.5 }, py: 1.5, borderRadius: 3, background: "rgba(255,255,255,.88)", border: "1px solid rgba(233,78,27,.1)", boxShadow: "0 10px 30px rgba(78,42,11,.07)", backdropFilter: "blur(10px)" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box component="img" src="/assets/logo1.png" alt="Logo" sx={{ width: { xs: 48, sm: 58 }, height: { xs: 48, sm: 58 }, objectFit: "contain", borderRadius: 1 }} />

        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 950, color: "#202020", letterSpacing: "-.025em", lineHeight: 1.1 }}>
            Hola{tienda?.name ? `, ${tienda.name}` : ""}
          </Typography>
          <Typography variant="body2" sx={{ color: "#71717a", mt: 0.25, display: { xs: "none", sm: "block" } }}>
            Panel principal de tu tienda
          </Typography>
        </Box>
      </Stack>
      <Button onClick={handleLogout} variant="outlined" startIcon={<LogoutRoundedIcon />} sx={{ borderColor: alpha(COLORS.danger, .28), color: COLORS.danger, bgcolor: "#fff", borderRadius: 2, px: { xs: 1.25, sm: 2 }, minWidth: { xs: 0, sm: 145 }, textTransform: "none", fontWeight: 850, "&:hover": { borderColor: COLORS.danger, bgcolor: alpha(COLORS.danger, .06) } }}>Cerrar sesión</Button>
    </Stack>
  );

  const planBanner =
    !tiendaLoading && storeId ? (
      <Fade in={!canCreate} timeout={350}>
        <Box sx={{ mb: 2, display: canCreate ? "none" : "block" }}>
          <Alert
            icon={<BoltRoundedIcon />}
            severity="warning"
            sx={{
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.18),
              color: COLORS.black,
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              "& .MuiAlert-icon": { color: COLORS.danger },
            }}
            action={
              <Button
                onClick={openPlanesModal}
                variant="contained"
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: COLORS.danger,
                  "&:hover": { bgcolor: alpha(COLORS.danger, 0.85) },
                  borderRadius: 2,
                }}
              >
                Subir de plan
              </Button>
            }
          >
            Alcanzaste el límite de sucursales para tu plan.
            {limit !== Infinity ? ` (${used}/${limit})` : ""} Sube al siguiente plan para crear más.
          </Alert>
        </Box>
      </Fade>
    ) : null;

  return (
    <Box sx={{ background: "radial-gradient(circle at 10% 0%, rgba(249,178,51,.14), transparent 34%), radial-gradient(circle at 95% 15%, rgba(233,78,27,.1), transparent 28%), #fffaf2", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        {header}
        <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 3.25 }}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 24 }, p: { xs: 2, md: 2.25 }, borderRadius: 3, bgcolor: "rgba(255,255,255,.7)", border: "1px solid rgba(32,32,32,.07)" }}><StoreHubNav /></Box>
          </Grid>
          <Grid size={{ xs: 12, md: 8.75 }}>
            {planBanner}

            <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ lg: "flex-end" }} spacing={2} mb={2}>
              <Box><Typography variant="h5" sx={{ fontWeight: 900, color: "#202020" }}>Tus sucursales</Typography><Typography variant="body2" sx={{ color: "#71717a" }}>Selecciona una para administrar sus productos, servicios y operación.</Typography></Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", lg: "auto" } }}>
                <Button onClick={() => setOfflineOpen(true)} variant="outlined" startIcon={<ReceiptLongRoundedIcon />} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 850, borderColor: alpha(COLORS.black, .2), color: COLORS.black }}>Pagos offline</Button>
                <Button onClick={handleOpenCreate} disabled={!canCreate} variant="contained" startIcon={<AddRoundedIcon />} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 850, bgcolor: COLORS.black, "&:hover": { bgcolor: alpha(COLORS.black, .84) } }}>Nueva sucursal</Button>
              </Stack>
            </Stack>

            <TextField value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, código o ciudad…" size="small" fullWidth sx={{ mb: 2, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2.5 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} />

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha("#000", 0.08)}`,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                icon={<StorefrontRoundedIcon />}
                label={loading ? "Cargando…" : `${filtered.length} sucursal(es)`}
                sx={{
                  fontWeight: 800,
                  bgcolor: alpha(COLORS.accent, 0.22),
                  border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                }}
              />
              <Chip
                icon={<WarehouseRoundedIcon />}
                label={limit === Infinity ? "Sin límite" : `Límite: ${limit}`}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {loading ? (
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
                  No hay sucursales
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Crea tu primera sucursal para empezar.
                </Typography>

                <Button
                  onClick={handleOpenCreate}
                  disabled={!canCreate}
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
                  Crear sucursal
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.2}>
                {filtered.map((b, idx) => {
                  const subtitle = [b?.city, b?.state].filter(Boolean).join(", ");
                  const address = [b?.address_line1, b?.neighborhood].filter(Boolean).join(" · ");
                  const counts = `${b?.warehouses_count ?? 0} almacén(es) • ${b?.pos_locations_count ?? 0} POS`;

                  return (
                    <Grow in key={b.id} timeout={200 + idx * 40}>
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
                            <LocationOnRoundedIcon sx={{ color: COLORS.black }} />
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 240 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
                                {b?.name || "Sucursal sin nombre"}
                              </Typography>

                              {b?.code ? (
                                <Chip
                                  size="small"
                                  label={b.code}
                                  sx={{ fontWeight: 800, bgcolor: alpha(COLORS.black, 0.06) }}
                                />
                              ) : null}

                              {b?.is_active === false ? (
                                <Chip size="small" label="Inactiva" color="default" />
                              ) : (
                                <Chip size="small" label="Activa" sx={{ bgcolor: alpha("#2e7d32", 0.12) }} />
                              )}
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                              {subtitle || "Sin ciudad/estado"} {address ? ` • ${address}` : ""}
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              {counts}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
                            <Tooltip title="Seleccionar sucursal (ir a productos)">
                              <IconButton
                                onClick={() => handleSelectBranch(b)}
                                sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.08)}` }}
                              >
                                <VisibilityRoundedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar">
                              <IconButton
                                onClick={() => handleOpenEdit(b)}
                                sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.08)}` }}
                              >
                                <EditRoundedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Eliminar">
                              <IconButton
                                onClick={() => handleDelete(b)}
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
          </Grid>
        </Grid>

        <BranchFormModal
          open={createOpen}
          mode="create"
          storeId={storeId}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            fetchBranches();
          }}
        />

        <BranchFormModal
          open={editOpen}
          mode="edit"
          storeId={storeId}
          branch={selected}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            fetchBranches();
          }}
        />

        <BranchDetailsModal
          open={detailsOpen}
          branchId={selected?.id}
          onClose={() => setDetailsOpen(false)}
          onChanged={() => fetchBranches()}
        />

        {/* ✅ NUEVO: Modal de Pagos Offline */}
        <OfflinePaymentsModal
          open={offlineOpen}
          onClose={() => setOfflineOpen(false)}
        />
      </Container>
    </Box>
  );
}
