import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import axiosClient from "../../config/axiosClient";
import {
  alertFromAxiosError,
  showConfirm,
  showSuccess,
} from "../../utils/alerts";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
  success: "#1f8f4d",
};

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

const EMPTY_AREA = {
  id: null,
  branch_id: "",
  pos_location_id: "",
  name: "",
  description: "",
  is_active: true,
};

function RestrictionAlert({ nombrePlanActual }) {
  return (
    <Alert
      severity="warning"
      sx={{
        borderRadius: 2,
        bgcolor: alpha(COLORS.accent, 0.10),
        border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
      }}
    >
      <b>Tu plan actual es {nombrePlanActual}.</b>
      <br />
      Esta función solo está disponible en <b>Plan Profesional</b> y{" "}
      <b>Plan Avanzado</b>.
      <br />
      Puedes visualizar la información, pero para crear, actualizar o eliminar
      áreas necesitas un plan compatible.
    </Alert>
  );
}

function StatusChip({ active }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        px: 1.2,
        py: 0.45,
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
        color: active ? COLORS.success : COLORS.danger,
        bgcolor: active
          ? alpha(COLORS.success, 0.10)
          : alpha(COLORS.danger, 0.10),
        border: `1px solid ${
          active ? alpha(COLORS.success, 0.25) : alpha(COLORS.danger, 0.25)
        }`,
      }}
    >
      {active ? "Activo" : "Inactivo"}
    </Box>
  );
}

function AreaFormDialog({ open, onClose, onSaved, row, branchId, posLocations, canManage }) {
  const [form, setForm] = useState(EMPTY_AREA);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setForm({
        id: row?.id || null,
        branch_id: row?.branch_id || branchId || "",
        pos_location_id: row?.pos_location_id || "",
        name: row?.name || "",
        description: row?.description || "",
        is_active: typeof row?.is_active === "boolean" ? row.is_active : true,
      });
    } else {
      setForm({
        ...EMPTY_AREA,
        branch_id: branchId || "",
      });
    }
  }, [row, branchId, open]);

  const handleSubmit = async () => {
    if (!canManage) return;

    setSaving(true);
    try {
      const payload = {
        branch_id: form.branch_id || null,
        pos_location_id: form.pos_location_id || null,
        name: form.name,
        description: form.description || null,
        is_active: Boolean(form.is_active),
      };

      const { data } = form.id
        ? await axiosClient.put(`/work-areas/${form.id}`, payload)
        : await axiosClient.post(`/work-areas`, payload);

      await showSuccess(form.id ? "Área actualizada" : "Área creada");
      onSaved(data?.data || data);
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar el área");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {form.id ? "Editar área" : "Nueva área"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Punto de venta</InputLabel>
            <Select
              label="Punto de venta"
              value={form.pos_location_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pos_location_id: e.target.value }))
              }
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {posLocations.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name || `Punto #${item.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Nombre del área"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <TextField
            label="Descripción"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <FormControl fullWidth>
            <InputLabel>Estatus</InputLabel>
            <Select
              label="Estatus"
              value={form.is_active ? 1 : 0}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: Number(e.target.value) === 1,
                }))
              }
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={sxBtnOutlined}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canManage || saving}
          variant="contained"
          sx={sxBtnBlack}
        >
          {form.id ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function WorkAreasManagerDialog({
  open,
  onClose,
  canManage,
  branchId,
  nombrePlanActual,
  posLocations,
  areas,
  setAreas,
}) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPosLocation, setFilterPosLocation] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const fetchAreas = async () => {
    if (!branchId) {
      setAreas([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/work-areas`, {
        params: {
          branch_id: branchId,
          pos_location_id: filterPosLocation || undefined,
          search: search || undefined,
          paginate: false,
        },
      });

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setAreas(list);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar las áreas");
      setAreas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAreas();
    }
  }, [open, branchId, filterPosLocation]);

  const handleDelete = async (row) => {
    if (!canManage) return;

    const ok = await showConfirm(
      `¿Eliminar el área "${row?.name || "Área"}"?`,
      "Sí, eliminar"
    );
    if (!ok) return;

    try {
      await axiosClient.delete(`/work-areas/${row.id}`);
      setAreas((prev) => prev.filter((x) => Number(x.id) !== Number(row.id)));
      await showSuccess("Área eliminada");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo eliminar el área");
    }
  };

  const handleToggle = async (row) => {
    if (!canManage) return;

    try {
      const { data } = await axiosClient.patch(`/work-areas/${row.id}/toggle-status`);
      const fresh = data?.data || row;

      setAreas((prev) =>
        prev.map((x) => (Number(x.id) === Number(row.id) ? fresh : x))
      );

      await showSuccess("Estado actualizado");
    } catch (err) {
      alertFromAxiosError(err, "No se pudo actualizar el estado");
    }
  };

  const filteredAreas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return areas;

    return areas.filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      const description = String(item?.description || "").toLowerCase();
      return name.includes(term) || description.includes(term);
    });
  }, [areas, search]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 900 }}>
          Administrar áreas
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            {!canManage ? (
              <RestrictionAlert nombrePlanActual={nombrePlanActual} />
            ) : null}

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ flex: 1 }}>
                <TextField
                  label="Buscar área"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                />

                <FormControl sx={{ minWidth: 240 }}>
                  <InputLabel>Punto de venta</InputLabel>
                  <Select
                    label="Punto de venta"
                    value={filterPosLocation}
                    onChange={(e) => setFilterPosLocation(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {posLocations.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name || `Punto #${item.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  onClick={fetchAreas}
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  sx={sxBtnOutlined}
                >
                  Recargar
                </Button>

                <Button
                  onClick={() => {
                    setEditingArea(null);
                    setOpenForm(true);
                  }}
                  disabled={!canManage}
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  sx={sxBtnBlack}
                >
                  Crear área
                </Button>
              </Stack>
            </Stack>

            <Divider />

            {loading ? (
              <Box sx={{ p: 1 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Skeleton variant="rounded" height={44} sx={{ borderRadius: 2 }} />
                  </Box>
                ))}
              </Box>
            ) : filteredAreas.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  No hay áreas registradas
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Crea un área para organizar mejor a tus trabajadores.
                </Typography>
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
                      <TableCell>Área</TableCell>
                      <TableCell>Punto de venta</TableCell>
                      <TableCell>Estatus</TableCell>
                      <TableCell sx={{ width: 180 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredAreas.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 900 }}>
                            {row.name || `Área #${row.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.description || "Sin descripción"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {row?.pos_location?.name ||
                            row?.posLocation?.name ||
                            "Sin asignar"}
                        </TableCell>

                        <TableCell>
                          <StatusChip active={Boolean(row.is_active)} />
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={0.8}>
                            <Tooltip title="Editar">
                              <span>
                                <IconButton
                                  disabled={!canManage}
                                  onClick={() => {
                                    setEditingArea(row);
                                    setOpenForm(true);
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha("#000", 0.10)}`,
                                    bgcolor: "#fff",
                                  }}
                                >
                                  <EditRoundedIcon />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Cambiar estado">
                              <span>
                                <IconButton
                                  disabled={!canManage}
                                  onClick={() => handleToggle(row)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
                                    color: COLORS.black,
                                    bgcolor: alpha(COLORS.accent, 0.08),
                                  }}
                                >
                                  <ToggleOnRoundedIcon />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Eliminar">
                              <span>
                                <IconButton
                                  disabled={!canManage}
                                  onClick={() => handleDelete(row)}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(COLORS.danger, 0.25)}`,
                                    color: COLORS.danger,
                                    bgcolor: alpha(COLORS.danger, 0.03),
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={sxBtnOutlined}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <AreaFormDialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingArea(null);
        }}
        onSaved={(saved) => {
          setAreas((prev) => {
            const list = Array.isArray(prev) ? [...prev] : [];
            const idx = list.findIndex((x) => Number(x.id) === Number(saved?.id));
            if (idx >= 0) list[idx] = saved;
            else list.unshift(saved);
            return list;
          });

          setOpenForm(false);
          setEditingArea(null);
        }}
        row={editingArea}
        branchId={branchId}
        posLocations={posLocations}
        canManage={canManage}
      />
    </>
  );
}