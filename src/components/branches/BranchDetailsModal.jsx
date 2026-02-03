import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  IconButton,
  Divider,
  Chip,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import axiosClient from "../../config/axiosClient";
import { showConfirm, showSuccess, alertFromAxiosError } from "../../utils/alerts";

const COLORS = { accent: "#f9b233", black: "#000000", danger: "#e94e1b" };

function WarehouseInlineForm({ open, initial, onCancel, onSave, saving }) {
  const [w, setW] = useState({
    name: "",
    code: "",
    type: "",
    is_default: false,
    is_active: true,
    use_branch_address: true,
    address_line1: "",
    address_line2: "",
    neighborhood: "",
    city: "",
    state: "",
    postal_code: "",
    country: "MX",
    lat: "",
    lng: "",
  });

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setW({
        name: initial?.name ?? "",
        code: initial?.code ?? "",
        type: initial?.type ?? "",
        is_default: Boolean(initial?.is_default),
        is_active: initial?.is_active ?? true,
        use_branch_address: initial?.use_branch_address ?? true,

        address_line1: initial?.address_line1 ?? "",
        address_line2: initial?.address_line2 ?? "",
        neighborhood: initial?.neighborhood ?? "",
        city: initial?.city ?? "",
        state: initial?.state ?? "",
        postal_code: initial?.postal_code ?? "",
        country: initial?.country ?? "MX",
        lat: initial?.lat ?? "",
        lng: initial?.lng ?? "",
      });
    } else {
      setW({
        name: "",
        code: "",
        type: "",
        is_default: false,
        is_active: true,
        use_branch_address: true,
        address_line1: "",
        address_line2: "",
        neighborhood: "",
        city: "",
        state: "",
        postal_code: "",
        country: "MX",
        lat: "",
        lng: "",
      });
    }
  }, [open, initial]);

  const set = (k) => (e) => setW((p) => ({ ...p, [k]: e.target.value }));

  if (!open) return null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${alpha("#000", 0.08)}`,
        bgcolor: alpha(COLORS.accent, 0.06),
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Nombre del almacén" value={w.name} onChange={set("name")} fullWidth />
            <TextField label="Código" value={w.code} onChange={set("code")} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Tipo (main, returns…)" value={w.type} onChange={set("type")} fullWidth />
            <TextField
              label="¿Default? (true/false)"
              value={String(w.is_default)}
              onChange={(e) => setW((p) => ({ ...p, is_default: e.target.value === "true" }))}
              fullWidth
            />
            <TextField
              label="¿Activo? (true/false)"
              value={String(w.is_active)}
              onChange={(e) => setW((p) => ({ ...p, is_active: e.target.value === "true" }))}
              fullWidth
            />
          </Stack>

          <TextField
            label="Usar dirección de sucursal (true/false)"
            value={String(w.use_branch_address)}
            onChange={(e) => setW((p) => ({ ...p, use_branch_address: e.target.value === "true" }))}
            fullWidth
          />

          {!w.use_branch_address ? (
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
                Dirección del almacén (override)
              </Typography>

              <TextField label="Calle y número" value={w.address_line1} onChange={set("address_line1")} fullWidth />
              <TextField label="Interior / referencias" value={w.address_line2} onChange={set("address_line2")} fullWidth />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField label="Colonia" value={w.neighborhood} onChange={set("neighborhood")} fullWidth />
                <TextField label="Ciudad" value={w.city} onChange={set("city")} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField label="Estado" value={w.state} onChange={set("state")} fullWidth />
                <TextField label="CP" value={w.postal_code} onChange={set("postal_code")} fullWidth />
                <TextField label="País" value={w.country} onChange={set("country")} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField label="Lat" value={w.lat} onChange={set("lat")} fullWidth />
                <TextField label="Lng" value={w.lng} onChange={set("lng")} fullWidth />
              </Stack>
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onCancel} disabled={saving} variant="text" sx={{ textTransform: "none" }}>
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(w)}
              disabled={saving}
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} /> : <SaveRoundedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                bgcolor: COLORS.black,
                "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                borderRadius: 2,
              }}
            >
              {saving ? "Guardando…" : "Guardar almacén"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BranchDetailsModal({ open, branchId, onClose, onChanged }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [branch, setBranch] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [whLoading, setWhLoading] = useState(false);

  const [whFormOpen, setWhFormOpen] = useState(false);
  const [whEditing, setWhEditing] = useState(null);
  const [whSaving, setWhSaving] = useState(false);

  const title = useMemo(() => branch?.name || "Detalle de sucursal", [branch]);

  const fetchDetail = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/branches/${branchId}`);
      setBranch(data?.data ?? null);
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar el detalle de la sucursal");
      setBranch(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    if (!branchId) return;
    setWhLoading(true);
    try {
      const { data } = await axiosClient.get(`/branches/${branchId}/warehouses`);
      setWarehouses(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar los almacenes");
      setWarehouses([]);
    } finally {
      setWhLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchDetail();
    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branchId]);

  const handleClose = () => {
    if (loading || whSaving) return;
    onClose?.();
  };

  const branchAddress = useMemo(() => {
    if (!branch) return "";
    const parts = [
      branch.address_line1,
      branch.address_line2,
      branch.neighborhood,
      branch.city,
      branch.state,
      branch.postal_code,
      branch.country,
    ].filter(Boolean);
    return parts.join(", ");
  }, [branch]);

  const handleNewWarehouse = () => {
    setWhEditing(null);
    setWhFormOpen(true);
  };

  const handleEditWarehouse = (w) => {
    setWhEditing(w);
    setWhFormOpen(true);
  };

  const handleSaveWarehouse = async (w) => {
    if (whSaving) return;
    setWhSaving(true);

    try {
      const payload = {
        ...w,
        lat: w.lat === "" ? null : Number(w.lat),
        lng: w.lng === "" ? null : Number(w.lng),
      };

      if (whEditing?.id) {
        await axiosClient.put(`/warehouses/${whEditing.id}`, payload);
        await showSuccess("Almacén actualizado");
      } else {
        await axiosClient.post(`/branches/${branchId}/warehouses`, payload);
        await showSuccess("Almacén creado");
      }

      setWhFormOpen(false);
      setWhEditing(null);
      await fetchWarehouses();
      onChanged?.();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar el almacén");
    } finally {
      setWhSaving(false);
    }
  };

  const handleDeleteWarehouse = async (w) => {
    const ok = await showConfirm(
      "¿Estás seguro de eliminar este almacén? Se eliminará toda la información habida y por haber.",
      "Sí, eliminar"
    );
    if (!ok) return;

    try {
      await axiosClient.delete(`/warehouses/${w.id}`);
      await showSuccess("Almacén eliminado");
      await fetchWarehouses();
      onChanged?.();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar el almacén");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack spacing={0.2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnRoundedIcon />
            <Typography sx={{ fontWeight: 900, color: COLORS.black }}>{title}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {branchAddress || "Sin dirección configurada"}
          </Typography>
        </Stack>

        <IconButton onClick={handleClose} disabled={loading || whSaving} sx={{ borderRadius: 2 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<WarehouseRoundedIcon />}
              label={whLoading ? "Cargando almacenes…" : `${warehouses.length} almacén(es)`}
              sx={{
                fontWeight: 900,
                bgcolor: alpha(COLORS.accent, 0.22),
                border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              }}
            />

            <Button
              onClick={handleNewWarehouse}
              disabled={whLoading || whSaving}
              variant="contained"
              startIcon={whSaving ? <CircularProgress size={18} /> : <AddRoundedIcon />}
              sx={{
                ml: "auto",
                textTransform: "none",
                fontWeight: 900,
                bgcolor: COLORS.black,
                "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                borderRadius: 2,
              }}
            >
              Nuevo almacén
            </Button>
          </Stack>

          <WarehouseInlineForm
            open={whFormOpen}
            initial={whEditing}
            saving={whSaving}
            onCancel={() => {
              if (whSaving) return;
              setWhFormOpen(false);
              setWhEditing(null);
            }}
            onSave={handleSaveWarehouse}
          />

          <Stack spacing={1.2}>
            {whLoading ? (
              <Stack alignItems="center" sx={{ py: 3 }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Cargando…
                </Typography>
              </Stack>
            ) : warehouses.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: `1px dashed ${alpha("#000", 0.2)}`,
                  bgcolor: alpha("#000", 0.02),
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
                    No hay almacenes en esta sucursal
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Crea el primero para empezar a manejar stock por sucursal.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              warehouses.map((w) => (
                <Card
                  key={w.id}
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    border: `1px solid ${alpha("#000", 0.08)}`,
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: `0 8px 28px ${alpha("#000", 0.10)}`,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <BoxIcon />

                    <Stack sx={{ flex: 1, minWidth: 240 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography sx={{ fontWeight: 900, color: COLORS.black }}>
                          {w?.name || "Almacén"}
                        </Typography>
                        {w?.is_default ? (
                          <Chip size="small" label="Default" sx={{ bgcolor: alpha(COLORS.accent, 0.25), fontWeight: 900 }} />
                        ) : null}
                        {w?.code ? <Chip size="small" label={w.code} variant="outlined" /> : null}
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {w?.type ? `Tipo: ${w.type}` : "Tipo: (sin definir)"} •{" "}
                        {w?.use_branch_address ? "Usa dirección de sucursal" : "Dirección propia"}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => handleEditWarehouse(w)}
                          disabled={whSaving}
                          sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.08)}` }}
                        >
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton
                          onClick={() => handleDeleteWarehouse(w)}
                          disabled={whSaving}
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
              ))
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading || whSaving} variant="text" sx={{ textTransform: "none" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BoxIcon() {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: "rgba(249,178,51,0.18)",
        border: "1px solid rgba(249,178,51,0.35)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <WarehouseRoundedIcon style={{ color: "#000" }} />
    </div>
  );
}
