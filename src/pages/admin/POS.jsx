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
  Grid,
  Collapse,
} from "@mui/material";
import { useTheme, alpha, keyframes } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";

import axiosClient from "../../config/axiosClient";
import useLimitePOS from "../../hooks/useLimitePOS";
import { useAdminUi } from "../../context/AdminUiContext";

import {
  showConfirm,
  showSuccess,
  alertFromAxiosError,
} from "../../utils/alerts";

import AssignWarehousesDialog from "./modals/AssignWarehousesDialog";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const floatIn = keyframes`
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0px); opacity: 1; }
`;

const generarCodigo = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * ✅ Copiar a portapapeles (robusto)
 */
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
    ta.setSelectionRange(0, ta.value.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

const buildAccessMessage = ({ branchName, posCode, accessCode }) => {
  return `🛒 ¡Tu nuevo Punto de Venta está listo para vender!

🏪 Sucursal: ${branchName}
👤 Usuario: ${posCode}
🔐 Contraseña: ${accessCode}

📍 Plataforma: MiTiendaEnLineaMX.com.mx
🔗 Accede desde: https://mitiendaenlineamx.com.mx/prueba/pos

⚡️ Ingresa con estos datos y comienza a registrar ventas en segundos.
#MiTiendaEnLineaMX 🚀`;
};

export default function POS() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { limitePermitido: limite } = useLimitePOS();
  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();

  const branchFromNav = location.state?.branch ?? null;
  const branchIdFromUrl = params.get("branch_id");

  const activeBranch = useMemo(() => {
    if (branchFromNav?.id) return branchFromNav;
    if (selectedBranch?.id) return selectedBranch;
    if (branchIdFromUrl) return { id: Number(branchIdFromUrl) };
    return null;
  }, [branchFromNav, selectedBranch, branchIdFromUrl]);

  useEffect(() => setHideLayout(false), [setHideLayout]);

  useEffect(() => {
    if (branchFromNav?.id) setSelectedBranch(branchFromNav);
  }, [branchFromNav, setSelectedBranch]);

  useEffect(() => {
    if (!activeBranch?.id) navigate("/admin/sucursales");
  }, [activeBranch?.id, navigate]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [visibles, setVisibles] = useState({});
  const [editando, setEditando] = useState({});
  const [openEdit, setOpenEdit] = useState({});

  // ✅ almacenes para selector
  const [warehouses, setWarehouses] = useState([]);

  // ✅ modal asignaciones
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPos, setAssignPos] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignWarehouseIds, setAssignWarehouseIds] = useState([]);
  const [assignShowUnassigned, setAssignShowUnassigned] = useState(true);

  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((p) => {
      const name = (p?.name || "").toLowerCase();
      const code = (p?.code || "").toLowerCase();
      const access = (p?.access_code || "").toLowerCase();
      return name.includes(s) || code.includes(s) || access.includes(s);
    });
  }, [rows, q]);

  const fetchPOS = useCallback(
    async (opts = { silent: false }) => {
      if (!activeBranch?.id) return;

      setLoading(true);
      try {
        const { data } = await axiosClient.get(`/branches/${activeBranch.id}/pos`);
        const list = Array.isArray(data?.list)
          ? data.list
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setRows(list);

        if (!opts.silent) await showSuccess("Puntos de venta actualizados");
      } catch (err) {
        // fallback /store/pos?branch_id=
        const status = err?.response?.status;
        if (status === 404) {
          try {
            const { data } = await axiosClient.get(`/store/pos`, {
              params: { branch_id: activeBranch.id },
            });
            const list = Array.isArray(data?.list)
              ? data.list
              : Array.isArray(data?.data)
                ? data.data
                : [];
            setRows(list);

            if (!opts.silent) await showSuccess("Puntos de venta actualizados");
          } catch (err2) {
            alertFromAxiosError(
              err2,
              "No se pudieron cargar los puntos de venta",
            );
            setRows([]);
          }
        } else {
          alertFromAxiosError(err, "No se pudieron cargar los puntos de venta");
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [activeBranch?.id],
  );

  const fetchWarehouses = useCallback(async () => {
    if (!activeBranch?.id) return;
    try {
      const { data } = await axiosClient.get(
        `/branches/${activeBranch.id}/warehouses`,
      );

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.list)
          ? data.list
          : [];

      setWarehouses(
        list.map((w) => ({
          id: Number(w.id),
          name: w?.name?.trim() ? w.name : `Almacén #${w.id}`,
        })),
      );
    } catch (_) {
      setWarehouses([]);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    if (!activeBranch?.id) return;
    fetchPOS({ silent: true });
    fetchWarehouses();
  }, [activeBranch?.id, fetchPOS, fetchWarehouses]);

  const iniciarSesionPOS = (pos) => {
    navigate("/admin/prueba/pos", { state: { pos } });
  };

  const toggleVisibilidad = (id) => {
    setVisibles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const actualizarCampo = (id, campo, valor) => {
    setRows((ps) => ps.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)));
    setEditando((e) => ({ ...e, [id]: true }));
  };

  const handleGenerate = async (id) => {
    const nuevo = generarCodigo();
    setRows((ps) => ps.map((p) => (p.id === id ? { ...p, access_code: nuevo } : p)));
    setEditando((e) => ({ ...e, [id]: true }));
    await showSuccess("Código de acceso generado (recuerda guardar)");
  };

  const handleCopyAccess = async (pos) => {
    const accessCode = pos?.access_code || "";
    if (!accessCode) {
      return alertFromAxiosError(
        { response: { data: { message: "Este POS no tiene contraseña." } } },
        "Este POS no tiene contraseña.",
      );
    }

    const msg = buildAccessMessage({
      branchName: activeBranch?.name || "Sucursal",
      posCode: pos?.code || "POS",
      accessCode,
    });

    const ok = await copyToClipboard(msg);
    if (!ok) {
      return alertFromAxiosError(
        {
          response: {
            data: {
              message:
                "No se pudo copiar al portapapeles. Intenta en HTTPS o en otro navegador.",
            },
          },
        },
        "No se pudo copiar al portapapeles.",
      );
    }

    await showSuccess("Accesos copiados al portapapeles");
  };

  const agregarPunto = async () => {
    const limiteNum = Number(limite) || 10;
    const reales = rows.filter((p) => !String(p.id).startsWith("new-")).length;

    if (reales >= limiteNum) {
      return alertFromAxiosError(
        { response: { data: { message: `Solo se permiten hasta ${limiteNum} puntos de venta.` } } },
        `Solo se permiten hasta ${limiteNum} puntos de venta.`,
      );
    }

    const tempId = `new-${Date.now()}`;
    setRows((ps) => [
      ...ps,
      {
        id: tempId,
        branch_id: activeBranch?.id,
        name: "",
        code: "",
        access_code: generarCodigo(),

        // ✅ defaults visuales en frontend
        show_unassigned_products: true,
        warehouse_ids: [],
        warehouses_count: 0,
        warehouses: [],
      },
    ]);

    setEditando((e) => ({ ...e, [tempId]: true }));
    setVisibles((v) => ({ ...v, [tempId]: true }));
    setOpenEdit((o) => ({ ...o, [tempId]: true }));

    await showSuccess("Nuevo POS agregado (completa el nombre y guarda)");
  };

  const guardarCambios = async (id) => {
    const punto = rows.find((p) => p.id === id);
    if (!punto) return;

    if (!punto?.name?.trim()) {
      return alertFromAxiosError(
        { response: { data: { message: "El nombre es obligatorio." } } },
        "El nombre es obligatorio.",
      );
    }

    try {
      if (String(id).startsWith("new-")) {
        try {
          const { data } = await axiosClient.post(`/branches/${activeBranch.id}/pos`, {
            name: punto.name,
            access_code: punto.access_code,
          });
          const saved = data?.pos ?? data?.data ?? data;
          setRows((ps) => ps.map((x) => (x.id === id ? saved : x)));
        } catch (err) {
          const status = err?.response?.status;
          if (status === 404) {
            const { data } = await axiosClient.post(`/store/pos`, {
              branch_id: activeBranch.id,
              name: punto.name,
              access_code: punto.access_code,
            });
            const saved = data?.pos ?? data?.data ?? data;
            setRows((ps) => ps.map((x) => (x.id === id ? saved : x)));
          } else {
            throw err;
          }
        }

        await showSuccess("POS creado correctamente");
      } else {
        await axiosClient.put(`/pos/${id}`, {
          branch_id: activeBranch.id,
          name: punto.name,
          access_code: punto.access_code,
        });
        await showSuccess("POS actualizado correctamente");
      }

      setEditando((e) => ({ ...e, [id]: false }));
      setOpenEdit((o) => ({ ...o, [id]: false }));
      fetchPOS({ silent: true });
    } catch (err) {
      alertFromAxiosError(err, "Error al guardar POS");
    }
  };

  const eliminarPunto = async (id) => {
    const ok = await showConfirm(
      "¿Estás seguro de eliminar este punto de venta?\n\nSe perderá la información relacionada (ventas, historial, cortes y cualquier registro asociado). Esta acción no se puede deshacer.",
      "Sí, eliminar definitivamente",
    );
    if (!ok) return;

    if (!String(id).startsWith("new-")) {
      try {
        await axiosClient.delete(`/pos/${id}`);
      } catch (err) {
        return alertFromAxiosError(err, "No se pudo eliminar el POS");
      }
    }

    setRows((ps) => ps.filter((p) => p.id !== id));
    await showSuccess("POS eliminado");
    fetchPOS({ silent: true });
  };

  // ---------------- Asignaciones (modal) ----------------

  const openAssignDialog = (pos) => {
    if (!pos || String(pos.id).startsWith("new-")) {
      return alertFromAxiosError(
        { response: { data: { message: "Primero guarda el POS para poder asignar almacenes." } } },
        "Primero guarda el POS para poder asignar almacenes.",
      );
    }

    setAssignPos(pos);
    setAssignWarehouseIds(Array.isArray(pos?.warehouse_ids) ? pos.warehouse_ids.map(Number) : []);
    setAssignShowUnassigned(!!pos?.show_unassigned_products);
    setAssignOpen(true);
  };

  const closeAssignDialog = () => {
    setAssignOpen(false);
    setAssignPos(null);
  };

  const saveAssignments = async () => {
    if (!assignPos?.id) return;

    setAssignLoading(true);
    try {
      await axiosClient.put(`/pos-locations/${assignPos.id}/assign-warehouses`, {
        warehouse_ids: assignWarehouseIds,
        show_unassigned_products: assignShowUnassigned,
      });

      const selected = warehouses
        .filter((w) => assignWarehouseIds.includes(Number(w.id)))
        .map((w) => ({ id: Number(w.id), name: w.name }));

      setRows((ps) =>
        ps.map((p) =>
          p.id === assignPos.id
            ? {
                ...p,
                warehouse_ids: assignWarehouseIds,
                warehouses_count: assignWarehouseIds.length,
                warehouses: selected,
                show_unassigned_products: assignShowUnassigned,
              }
            : p,
        ),
      );

      await showSuccess("Asignaciones guardadas");
      closeAssignDialog();
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron guardar asignaciones");
    } finally {
      setAssignLoading(false);
    }
  };

  const header = (
    <Stack
      direction={isMobile ? "column" : "row"}
      alignItems={isMobile ? "flex-start" : "center"}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Stack spacing={0.6} sx={{ width: "100%" }}>
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
            <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.black }}>
              Puntos de venta (POS)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeBranch?.name
                ? `Sucursal: ${activeBranch.name}`
                : activeBranch?.id
                  ? `Sucursal #${activeBranch.id}`
                  : "Selecciona una sucursal"}
            </Typography>
          </Box>

          <Tooltip title="Cambiar sucursal">
            <IconButton
              onClick={() => navigate("/admin/sucursales")}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha("#000", 0.08)}`,
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={1}
          alignItems="center"
          sx={{ width: "100%", mt: 1 }}
        >
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (nombre, código, access code)…"
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

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            sx={{ width: isMobile ? "100%" : "auto" }}
          >
            <Button
              onClick={() => fetchPOS({ silent: false })}
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                minWidth: isMobile ? "100%" : 160,
                borderColor: alpha("#000", 0.15),
                color: COLORS.black,
              }}
            >
              Recargar
            </Button>

            <Button
              onClick={agregarPunto}
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
              Nuevo POS
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        {header}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha("#000", 0.08)}`,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
              <Chip
                icon={<StorefrontRoundedIcon />}
                label={loading ? "Cargando…" : `${filtered.length} POS`}
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

              <Chip label={`Límite: ${limite}`} variant="outlined" sx={{ fontWeight: 800 }} />
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
                Primero selecciona una sucursal para ver sus puntos de venta.
              </Alert>
            ) : loading ? (
              <Grid container spacing={1.2}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Grid key={i} item xs={6} sm={6} md={4} lg={3}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${alpha("#000", 0.08)}`,
                        overflow: "hidden",
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Skeleton variant="rounded" width={42} height={42} />
                        <Skeleton sx={{ mt: 1 }} width="70%" />
                        <Skeleton width="55%" />
                        <Skeleton sx={{ mt: 1 }} variant="rounded" width="100%" height={36} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.black }}>
                  No hay puntos de venta
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Crea tu primer POS para operar ventas por sucursal.
                </Typography>

                <Button
                  onClick={agregarPunto}
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
                  Crear POS
                </Button>
              </Box>
            ) : (
              <Grid container spacing={1.2}>
                {filtered.map((pos, idx) => {
                  const isNew = String(pos.id).startsWith("new-");
                  const isEditing = !!editando[pos.id];
                  const isVisible = !!visibles[pos.id];
                  const isOpen = !!openEdit[pos.id];

                  const whCount =
                    typeof pos?.warehouses_count === "number"
                      ? pos.warehouses_count
                      : Array.isArray(pos?.warehouse_ids)
                        ? pos.warehouse_ids.length
                        : 0;

                  const whNames =
                    Array.isArray(pos?.warehouses) && pos.warehouses.length > 0
                      ? pos.warehouses.map((w) => w.name).join(", ")
                      : "";

                  return (
                    <Grid key={pos.id} item xs={6} sm={6} md={4} lg={3}>
                      <Grow in timeout={180 + idx * 35}>
                        <Card
                          elevation={0}
                          sx={{
                            height: "100%",
                            borderRadius: 3,
                            border: `1px solid ${alpha("#000", 0.1)}`,
                            backgroundColor: "#fff",
                            overflow: "hidden",
                            transition:
                              "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                            "&:hover": {
                              transform: "translateY(-3px)",
                              boxShadow: `0 12px 30px ${alpha("#000", 0.12)}`,
                              borderColor: alpha(COLORS.accent, 0.55),
                            },
                            animation: `${floatIn} 250ms ease`,
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Stack spacing={1.2}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    color: COLORS.black,
                                    fontSize: 18,
                                    flex: 1,
                                  }}
                                  noWrap
                                >
                                  {pos?.name?.trim() ? pos.name : "POS sin nombre"}
                                </Typography>

                                <Tooltip title={isOpen ? "Cerrar" : "Editar"}>
                                  <IconButton
                                    onClick={() =>
                                      setOpenEdit((o) => ({ ...o, [pos.id]: !o[pos.id] }))
                                    }
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {isOpen ? <CloseRoundedIcon /> : <EditRoundedIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Stack>

                              <Typography variant="body2" color="text.secondary" sx={{ mt: -0.3 }}>
                                <b>Usuario:</b> {pos?.code || "—"}
                              </Typography>

                              {/* ✅ Chips de asignación */}
                              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                <Chip
                                  size="small"
                                  icon={<WarehouseRoundedIcon />}
                                  label={`Almacenes: ${whCount}`}
                                  variant="outlined"
                                  sx={{ fontWeight: 800 }}
                                />

                                <Chip
                                  size="small"
                                  label={`Sin almacén: ${
                                    pos?.show_unassigned_products ? "ON" : "OFF"
                                  }`}
                                  sx={{
                                    fontWeight: 900,
                                    bgcolor: pos?.show_unassigned_products
                                      ? alpha("#2e7d32", 0.12)
                                      : alpha(COLORS.danger, 0.1),
                                    border: `1px solid ${
                                      pos?.show_unassigned_products
                                        ? alpha("#2e7d32", 0.28)
                                        : alpha(COLORS.danger, 0.25)
                                    }`,
                                  }}
                                />
                              </Stack>

                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                                <b>Asignados:</b>{" "}
                                {whNames ? whNames : "ninguno"}
                              </Typography>

                              <Button
                                onClick={() => openAssignDialog(pos)}
                                variant="outlined"
                                startIcon={<WarehouseRoundedIcon />}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 900,
                                  borderColor: alpha("#000", 0.18),
                                  color: COLORS.black,
                                  "&:hover": {
                                    bgcolor: alpha(COLORS.accent, 0.1),
                                  },
                                }}
                              >
                                Asignar almacenes
                              </Button>

                              <TextField
                                size="small"
                                label="Contraseña"
                                value={pos?.access_code ?? ""}
                                type={isVisible ? "text" : "password"}
                                fullWidth
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    backgroundColor: "#fff",
                                  },
                                }}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Tooltip title={isVisible ? "Ocultar" : "Mostrar"}>
                                        <IconButton
                                          onClick={() => toggleVisibilidad(pos.id)}
                                          size="small"
                                        >
                                          {isVisible ? (
                                            <VisibilityOffRoundedIcon />
                                          ) : (
                                            <VisibilityRoundedIcon />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    </InputAdornment>
                                  ),
                                }}
                              />

                              <Button
                                onClick={() => handleCopyAccess(pos)}
                                variant="outlined"
                                startIcon={<ContentCopyRoundedIcon />}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 900,
                                  borderColor: alpha("#000", 0.18),
                                  color: COLORS.black,
                                  "&:hover": {
                                    bgcolor: alpha(COLORS.accent, 0.1),
                                  },
                                }}
                              >
                                Copiar accesos
                              </Button>

                              <Button
                                onClick={() => iniciarSesionPOS(pos)}
                                variant="contained"
                                disabled={isNew || isEditing}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 900,
                                  bgcolor: "#2e7d32",
                                  "&:hover": { bgcolor: alpha("#2e7d32", 0.9) },
                                }}
                              >
                                Iniciar sesión
                              </Button>

                              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                <Button
                                  onClick={() => eliminarPunto(pos.id)}
                                  variant="outlined"
                                  startIcon={<DeleteOutlineRoundedIcon />}
                                  sx={{
                                    flex: 1,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 900,
                                    borderColor: alpha(COLORS.danger, 0.35),
                                    color: COLORS.danger,
                                    "&:hover": {
                                      bgcolor: alpha(COLORS.danger, 0.08),
                                    },
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </Stack>

                              {/* Panel de edición real */}
                              <Collapse in={isOpen} timeout={200}>
                                <Divider sx={{ my: 1.2 }} />

                                <Stack spacing={1}>
                                  <TextField
                                    size="small"
                                    label="Editar nombre"
                                    value={pos?.name ?? ""}
                                    onChange={(e) =>
                                      actualizarCampo(pos.id, "name", e.target.value)
                                    }
                                    fullWidth
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        backgroundColor: "#fff",
                                      },
                                    }}
                                  />

                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      onClick={() => handleGenerate(pos.id)}
                                      variant="outlined"
                                      startIcon={<VpnKeyRoundedIcon />}
                                      sx={{
                                        flex: 1,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 900,
                                        borderColor: alpha("#000", 0.18),
                                        color: COLORS.black,
                                      }}
                                    >
                                      Generar
                                    </Button>

                                    <Button
                                      onClick={() => guardarCambios(pos.id)}
                                      variant="contained"
                                      startIcon={<SaveRoundedIcon />}
                                      disabled={!isEditing || !pos?.name?.trim()}
                                      sx={{
                                        flex: 1,
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 900,
                                        bgcolor: COLORS.black,
                                        "&:hover": {
                                          bgcolor: alpha(COLORS.black, 0.85),
                                        },
                                      }}
                                    >
                                      Guardar
                                    </Button>
                                  </Stack>

                                  <Typography variant="caption" color="text.secondary">
                                    {isNew
                                      ? "Al guardar se crea el POS en la sucursal."
                                      : "Recuerda guardar si cambiaste el access code."}
                                  </Typography>
                                </Stack>
                              </Collapse>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* ✅ Modal de asignación */}
        <AssignWarehousesDialog
          open={assignOpen}
          onClose={closeAssignDialog}
          isMobile={isMobile}
          pos={assignPos}
          warehouses={warehouses}
          warehouseIds={assignWarehouseIds}
          setWarehouseIds={setAssignWarehouseIds}
          showUnassigned={assignShowUnassigned}
          setShowUnassigned={setAssignShowUnassigned}
          loading={assignLoading}
          onSave={saveAssignments}
        />
      </Container>
    </Box>
  );
}