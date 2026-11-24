import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
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
  Alert,
  useMediaQuery,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  Menu,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import axiosClient from "../../config/axiosClient";
import useLimitePOS from "../../hooks/useLimitePOS";
import { useAdminUi } from "../../context/AdminUiContext";

import {
  showSuccess,
  alertFromAxiosError,
} from "../../utils/alerts";

import AssignWarehousesDialog from "./modals/AssignWarehousesDialog";
import AdminCashDialog from "../../components/cash/AdminCashDialog";
import POSModulesDialog from "../../components/adminpos/POSModulesDialog";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";

import { adminSectionDialog, adminSectionHeader, adminSectionPanel, adminSectionPrimaryAction, adminSectionScope, adminSectionTitle } from "../../components/admin/AdminSectionOption";

const terminalsGrid = {
  display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
  gap: 2,
};

const outlinedAction = {
  color: "#30343b", borderColor: "#d6d7da",
  "&:hover": { borderColor: "#d5a000", bgcolor: "#fff8df" },
};

const interfaceLabel = (value) => value === "clasico" ? "Clásico · tarjetas" : "Actual · navegación superior";

const generarCodigo = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * ✅ Copiar a portapapeles (robusto)
 */
const copyToClipboard = async (text, trigger) => {
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

  const ta = document.createElement("textarea");
  try {
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.style.opacity = "0";

    const container = trigger?.closest('[role="dialog"]') ?? document.body;
    container.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    return document.execCommand("copy");
  } catch (_) {
    return false;
  } finally {
    ta.remove();
    trigger?.focus();
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
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
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

  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [accessPos, setAccessPos] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [terminalMenu, setTerminalMenu] = useState(null);

  useEffect(() => {
    if (!isDesktop) setTerminalMenu(null);
  }, [isDesktop]);
  const [pinVisible, setPinVisible] = useState(false);

  // ✅ almacenes para selector
  const [warehouses, setWarehouses] = useState([]);

  // ✅ modal asignaciones
  const [assignOpen, setAssignOpen] = useState(false);
  const [cashPos, setCashPos] = useState(null);
  const [modulesPos, setModulesPos] = useState(null);
  const [modulesRevision, setModulesRevision] = useState(0);
  const [cashVisibility, setCashVisibility] = useState(null);
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
      return name.includes(s) || code.includes(s);
    });
  }, [rows, q]);

  const terminalIds = rows.map(({ id }) => String(id)).filter((id) => /^\d+$/.test(id)).join(",");
  const visibilityKey = `${terminalIds}:${modulesRevision}`;
  const visibleCashIds = cashVisibility?.key === visibilityKey ? cashVisibility.ids : null;

  useEffect(() => {
    if (!terminalIds) return;
    const controller = new AbortController();
    const requests = terminalIds.split(",").map(async (id) => {
      const { data } = await axiosClient.get("/pos/modules/enabled", {
        params: { pos_location_id: id },
        signal: controller.signal,
      });
      return Array.isArray(data?.data) && data.data.some(({ key, visible }) => key === "cash" && visible === true)
        ? id
        : null;
    });
    void Promise.allSettled(requests).then((results) => {
      if (controller.signal.aborted) return;
      setCashVisibility({
        key: visibilityKey,
        ids: new Set(results.filter(({ status }) => status === "fulfilled").map(({ value }) => value).filter(Boolean)),
      });
    });
    return () => controller.abort();
  }, [terminalIds, visibilityKey]);

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
    navigate("/admin/prueba/pos", { state: { pos, branchName: activeBranch?.name } });
  };

  const handleCopyAccess = async (pos, trigger) => {
    if (!pos.access_code) return;
    const copied = await copyToClipboard(buildAccessMessage({
      branchName: activeBranch?.name || "Sucursal",
      posCode: pos.code || "POS",
      accessCode: pos.access_code,
    }), trigger);
    setAccessStatus(copied ? { severity: "success", message: "Accesos copiados." }
      : { severity: "error", message: "No se pudieron copiar los accesos." });
  };

  const openEditor = (pos = null) => {
    if (!activeBranch?.id || (!pos && rows.length >= (Number(limite) || 10))) return;
    setSaveError("");
    setDeleteConfirm(false);
    setPinVisible(false);
    setEditor({
      original: pos,
      name: pos?.name ?? "",
      access_code: pos ? String(pos.access_code ?? "") : generarCodigo(),
      interface_design: pos?.interface_design === "clasico" ? "clasico" : "actual",
    });
  };

  const setEditorField = (field, value) => {
    setSaveError("");
    setEditor(previous => ({ ...previous, [field]: value }));
  };

  const saveTerminal = async (event) => {
    event.preventDefault();
    if (saving || !editor || !activeBranch?.id || !editor.name.trim()) return;
    const { original, access_code, interface_design } = editor;
    const name = editor.name.trim();
    const pinChanged = !original || access_code !== String(original.access_code ?? "");
    if (pinChanged && !/^\d{6}$/.test(access_code)) {
      setSaveError("El PIN debe tener seis dígitos.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      if (original) {
        const changes = {};
        if (name !== original.name || pinChanged) {
          changes.branch_id = activeBranch.id;
          changes.name = name;
          if (pinChanged) changes.access_code = access_code;
        }
        if (interface_design !== (original.interface_design ?? "actual")) changes.interface_design = interface_design;
        if (Object.keys(changes).length) {
          const { data } = await axiosClient.put(`/pos/${original.id}`, changes);
          const updated = data?.pos ?? data?.data;
          setRows(previous => previous.map(row => row.id === original.id ? { ...row, ...changes, ...updated } : row));
        }
      } else {
        const payload = { name, access_code, interface_design };
        let response;
        try {
          response = await axiosClient.post(`/branches/${activeBranch.id}/pos`, payload);
        } catch (error) {
          if (error?.response?.status !== 404) throw error;
          response = await axiosClient.post("/store/pos", { ...payload, branch_id: activeBranch.id });
        }
        const saved = response.data?.pos ?? response.data?.data ?? response.data;
        if (saved?.id) setRows(previous => [...previous, { ...payload, branch_id: activeBranch.id, ...saved }]);
        else await fetchPOS({ silent: true });
      }
      setEditor(null);
      await showSuccess(original ? "Punto de venta actualizado" : "Punto de venta creado");
    } catch (error) {
      setSaveError(error?.response?.data?.message || "No se pudo guardar el punto de venta.");
    } finally {
      setSaving(false);
    }
  };

  const openAccess = (pos) => {
    setPinVisible(false);
    setAccessStatus(null);
    setAccessPos(pos);
  };

  const eliminarPunto = async (id) => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await axiosClient.delete(`/pos/${id}`);
      setEditor(null);
      setRows(previous => previous.filter(pos => pos.id !== id));
      await showSuccess("Punto de venta eliminado");
    } catch (error) {
      setSaveError(error?.response?.data?.message || "No se pudo eliminar el punto de venta.");
    } finally {
      setSaving(false);
    }
  };

  const closeEditor = () => {
    if (saving) return;
    if (deleteConfirm) {
      setDeleteConfirm(false);
      setSaveError("");
    } else {
      setEditor(null);
    }
  };

  // ---------------- Asignaciones (modal) ----------------

  const openAssignDialog = (pos) => {
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

  const canCreate = Boolean(activeBranch?.id) && !loading && rows.length < (Number(limite) || 10);
  const togglePin = (
    <InputAdornment position="end">
      <IconButton aria-label={pinVisible ? "Ocultar PIN" : "Mostrar PIN"} onClick={() => setPinVisible(value => !value)} edge="end">
        {pinVisible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{
      width: "100%", maxWidth: 1500, minWidth: 0, mx: "auto", pb: 3,
      "& .MuiButton-root": { minHeight: 44, textTransform: "none", fontWeight: 700, borderRadius: 2.5 },
      "& .MuiIconButton-root": { minWidth: 44, minHeight: 44 },
      "& .MuiTypography-root": { overflowWrap: "anywhere" },
    }}>
      <Paper elevation={0} sx={adminSectionHeader}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={adminSectionTitle}>Puntos de venta</Typography>
            <Typography sx={{ mt: 1, color: "#c7cbd1" }}>Administra tus terminales, accesos y módulos por sucursal.</Typography>
          </Box>
          <Chip icon={<LocationOnRoundedIcon />} sx={adminSectionScope}
            label={activeBranch?.name || (activeBranch?.id ? `Sucursal #${activeBranch.id}` : "Sin sucursal")} />
        </Stack>
      </Paper>

      {!activeBranch?.id ? (
        <Paper elevation={0} sx={adminSectionPanel}>
          <Alert severity="info" sx={{ mb: 2 }}>Selecciona una sucursal para ver sus puntos de venta.</Alert>
          <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/admin/sucursales")} sx={outlinedAction}>
            Ir a mis sucursales
          </Button>
        </Paper>
      ) : (
        <>
          <Paper elevation={0} sx={{ ...adminSectionPanel, mb: 2.5 }}>
            <Stack gap={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} gap={1.25}>
                <TextField size="small" fullWidth label="Buscar punto de venta" placeholder="Nombre o código" value={q}
                  onChange={event => setQ(event.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />
                <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ flexShrink: 0 }}>
                  <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => fetchPOS({ silent: false })} disabled={loading} sx={outlinedAction}>Recargar</Button>
                  <Button variant="contained" disableElevation startIcon={<AddRoundedIcon />} onClick={() => openEditor()}
                    disabled={!canCreate} sx={adminSectionPrimaryAction}>Nuevo POS</Button>
                </Stack>
              </Stack>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip icon={<StorefrontRoundedIcon />} label={`${rows.length} punto(s) de venta`} size="small" variant="outlined" />
                <Chip label={`Límite: ${Number(limite) || 10}`} size="small" variant="outlined" />
              </Stack>
            </Stack>
          </Paper>

          {loading ? (
            <Box role="status" aria-label="Cargando puntos de venta" sx={terminalsGrid}>
              {[1, 2, 3].map(item => <Skeleton key={item} variant="rounded" sx={{ height: { xs: 230, md: 205 } }} />)}
            </Box>
          ) : filtered.length === 0 ? (
            <Paper elevation={0} sx={{ ...adminSectionPanel, textAlign: "center" }}>
              <Typography component="h2" variant="h6" fontWeight={800}>
                {q.trim() ? "No se encontraron puntos de venta" : "No hay puntos de venta registrados"}
              </Typography>
              {!q.trim() && <Typography variant="body2" color="text.secondary">Crea una terminal para empezar a operar en esta sucursal.</Typography>}
            </Paper>
          ) : (
            <Box sx={terminalsGrid}>
              {filtered.map(pos => {
                const warehouseCount = pos.warehouses_count ?? pos.warehouse_ids?.length ?? 0;
                const warehouseNames = Array.isArray(pos.warehouses) ? pos.warehouses.map(item => item.name).filter(Boolean).join(", ") : "";
                return (
                  <Card component="article" key={pos.id} variant="outlined" sx={{
                    borderRadius: 3, minWidth: 0, display: "flex",
                    ...(isDesktop && { borderTop: "3px solid #ffc107", boxShadow: "0 4px 14px #17191c0a" }),
                  }}>
                    <CardContent sx={{ p: 2, width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Stack gap={1.5} sx={{ minWidth: 0 }}>
                        <Stack direction="row" gap={1.25} alignItems="center">
                          <Box sx={{ display: "grid", placeItems: "center", width: 42, height: 42, flexShrink: 0, borderRadius: 2, bgcolor: "#fff3cd", color: "#684c00" }}>
                            <PointOfSaleOutlinedIcon />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography component="h2" fontWeight={800}>{pos.name?.trim() || "POS sin nombre"}</Typography>
                            <Typography variant="body2" color="text.secondary">{interfaceLabel(pos.interface_design)}</Typography>
                          </Box>
                          {isDesktop ? (
                            <IconButton aria-label={`Acciones de ${pos.name || "POS"}`} aria-haspopup="menu"
                              aria-expanded={terminalMenu?.pos.id === pos.id}
                              onClick={event => setTerminalMenu({ pos, anchor: event.currentTarget })}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                              <MoreHorizRoundedIcon />
                            </IconButton>
                          ) : (
                            <IconButton aria-label={`Editar ${pos.name || "POS"}`} onClick={() => openEditor(pos)}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          <Chip size="small" variant="outlined" icon={<BadgeOutlinedIcon />} label={pos.code || "Sin código"} sx={{ maxWidth: "100%" }} />
                          <Chip size="small" variant="outlined" icon={<WarehouseRoundedIcon />} label={`${warehouseCount} almacén(es)`} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {warehouseNames || "Sin almacenes asignados"} · Inventario sin almacén {pos.show_unassigned_products ? "incluido" : "excluido"}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mt: "auto" }} />
                      <Box sx={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0, 1fr)" : "repeat(auto-fit, minmax(min(100%, 132px), 1fr))", gap: 1 }}>
                        <Button variant="contained" disableElevation startIcon={<LoginRoundedIcon />} onClick={() => iniciarSesionPOS(pos)} sx={adminSectionPrimaryAction}>Iniciar sesión</Button>
                        {!isDesktop && <>
                          <Button variant="outlined" startIcon={<VpnKeyRoundedIcon />} onClick={() => openAccess(pos)} sx={outlinedAction}>Accesos</Button>
                          <Button variant="outlined" startIcon={<WarehouseRoundedIcon />} onClick={() => openAssignDialog(pos)} sx={outlinedAction}>Asignar almacenes</Button>
                          <Button variant="outlined" startIcon={<TuneRoundedIcon />} onClick={() => setModulesPos(pos)} sx={outlinedAction}>Módulos de este POS</Button>
                          {visibleCashIds?.has(String(pos.id)) && <Button variant="outlined" startIcon={<PointOfSaleOutlinedIcon />} onClick={() => setCashPos(pos)} sx={outlinedAction}>Caja</Button>}
                        </>}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </>
      )}

      <Menu anchorEl={terminalMenu?.anchor} open={Boolean(terminalMenu)} onClose={() => setTerminalMenu(null)}
        slotProps={{ list: { "aria-label": "Acciones del punto de venta" } }}>
        {terminalMenu && [
          { label: "Editar", Icon: EditRoundedIcon, action: openEditor },
          { label: "Accesos", Icon: VpnKeyRoundedIcon, action: openAccess },
          { label: "Asignar almacenes", Icon: WarehouseRoundedIcon, action: openAssignDialog },
          { label: "Módulos de este POS", Icon: TuneRoundedIcon, action: setModulesPos },
          ...(visibleCashIds?.has(String(terminalMenu.pos.id)) ? [{ label: "Caja", Icon: PointOfSaleOutlinedIcon, action: setCashPos }] : []),
        ].map(({ label, Icon, action }) => (
          <MenuItem key={label} onClick={() => {
            setTerminalMenu(null);
            action(terminalMenu.pos);
          }}>
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>{label}
          </MenuItem>
        ))}
      </Menu>

      {editor && (
        <Dialog open onClose={closeEditor} fullWidth maxWidth="sm" sx={adminSectionDialog} aria-labelledby="pos-editor-title">
          <DialogTitle id="pos-editor-title">{deleteConfirm ? "Eliminar punto de venta" : editor.original ? "Editar punto de venta" : "Nuevo punto de venta"}</DialogTitle>
          <DialogContent dividers>
            {deleteConfirm ? (
              <Stack gap={1.5}>
                {saveError && <Alert severity="error">{saveError}</Alert>}
                <Typography>¿Eliminar <strong>{editor.original.name}</strong>?</Typography>
                <Alert severity="warning">Se perderán las ventas, el historial, los cortes y otros registros asociados. Esta acción es definitiva.</Alert>
              </Stack>
            ) : <Stack component="form" id="pos-editor-form" onSubmit={saveTerminal} gap={2} sx={{ pt: 0.5 }}>
              {saveError && <Alert severity="error">{saveError}</Alert>}
              <TextField label="Nombre del punto de venta" required autoFocus fullWidth disabled={saving} value={editor.name}
                onChange={event => setEditorField("name", event.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><StorefrontRoundedIcon /></InputAdornment> } }} />
              <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} alignItems={{ sm: "center" }}>
                <TextField label="PIN de acceso" fullWidth disabled={saving} value={editor.access_code} type={pinVisible ? "text" : "password"}
                  onChange={event => setEditorField("access_code", event.target.value)} autoComplete="new-password"
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 6 },
                    input: { startAdornment: <InputAdornment position="start"><VpnKeyRoundedIcon /></InputAdornment>, endAdornment: togglePin },
                  }} />
                <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={saving}
                  onClick={() => { setEditorField("access_code", generarCodigo()); setPinVisible(true); }} sx={{ ...outlinedAction, flexShrink: 0 }}>
                  Generar PIN
                </Button>
              </Stack>
              <TextField select fullWidth disabled={saving} label="Interfaz del punto de venta" value={editor.interface_design}
                onChange={event => setEditorField("interface_design", event.target.value)}>
                <MenuItem value="actual">Actual - navegación superior</MenuItem>
                <MenuItem value="clasico">Clásico - tarjetas</MenuItem>
              </TextField>
            </Stack>}
          </DialogContent>
          <DialogActions disableSpacing>
            {!deleteConfirm && editor.original && (
              <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} disabled={saving} sx={{ mr: "auto" }}
                onClick={() => { setSaveError(""); setDeleteConfirm(true); }}>Eliminar</Button>
            )}
            <Button onClick={closeEditor} disabled={saving}>Cancelar</Button>
            {deleteConfirm ? (
              <Button variant="contained" color="error" onClick={() => eliminarPunto(editor.original.id)} disabled={saving}>
                {saving ? "Eliminando…" : "Eliminar definitivamente"}
              </Button>
            ) : (
              <Button type="submit" form="pos-editor-form" variant="contained" startIcon={<SaveRoundedIcon />}
                disabled={saving || !editor.name.trim()} sx={adminSectionPrimaryAction}>
                {saving ? "Guardando…" : editor.original ? "Guardar cambios" : "Crear punto de venta"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {accessPos && (
        <Dialog open onClose={() => setAccessPos(null)} fullWidth maxWidth="xs" sx={adminSectionDialog} aria-labelledby="pos-access-title">
          <DialogTitle id="pos-access-title">Accesos del punto de venta</DialogTitle>
          <DialogContent dividers>
            <Stack gap={2} sx={{ pt: 0.5 }}>
              {accessStatus && <Alert severity={accessStatus.severity}>{accessStatus.message}</Alert>}
              <Typography fontWeight={800}>{accessPos.name || "Punto de venta"}</Typography>
              <TextField label="Código POS" value={accessPos.code || ""} fullWidth
                slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start"><BadgeOutlinedIcon /></InputAdornment> } }} />
              <TextField label="PIN de acceso" value={accessPos.access_code || ""} fullWidth type={pinVisible ? "text" : "password"}
                slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start"><VpnKeyRoundedIcon /></InputAdornment>, endAdornment: togglePin } }} />
            </Stack>
          </DialogContent>
          <DialogActions disableSpacing>
            <Button onClick={() => setAccessPos(null)}>Cerrar</Button>
            <Button variant="contained" startIcon={<ContentCopyRoundedIcon />} onClick={event => handleCopyAccess(accessPos, event.currentTarget)}
              disabled={!accessPos.access_code} sx={adminSectionPrimaryAction}>Copiar accesos</Button>
          </DialogActions>
        </Dialog>
      )}

        {/* ✅ Modal de asignación */}
        {cashPos && visibleCashIds?.has(String(cashPos.id)) && <AdminCashDialog key={cashPos.id} pos={cashPos} onClose={() => setCashPos(null)} />}
        {modulesPos && <POSModulesDialog key={modulesPos.id} pos={modulesPos} onClose={() => setModulesPos(null)} onSaved={() => setModulesRevision((value) => value + 1)} />}
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
    </Box>
  );
}
