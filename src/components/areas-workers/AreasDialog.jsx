import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
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
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";
import RestrictionAlert from "./RestrictionAlert";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
  success: "#1f8f4d",
};

const EMPTY_AREA = {
  id: null,
  branch_id: "",
  pos_location_id: "",
  name: "",
  description: "",
  is_active: true,
};

const sxBtnOutlined = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  borderColor: alpha("#000", 0.15),
  color: COLORS.black,
  bgcolor: "#fff",
  "&:hover": { bgcolor: alpha("#000", 0.03) },
};

const sxBtnBlack = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  bgcolor: COLORS.black,
  color: "#fff",
  "&:hover": { bgcolor: alpha(COLORS.black, 0.86) },
};

function StatusChip({ active }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.2,
        py: 0.4,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
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

export default function AreasDialog({
  open,
  onClose,
  canManage,
  nombrePlanActual,
  branchId,
  areas,
  posLocations,
  loadingAreas,
  loadingPosLocations,
  areaSearch,
  setAreaSearch,
  filterPosLocation,
  setFilterPosLocation,
  onRefresh,
  onSaved,
  onDelete,
  onToggleStatus,
}) {
  const [form, setForm] = useState(EMPTY_AREA);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({
        ...EMPTY_AREA,
        branch_id: branchId || "",
      });
    }
  }, [open, branchId]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (row) => {
    setForm({
      id: row?.id || null,
      branch_id: row?.branch_id || branchId || "",
      pos_location_id: row?.pos_location_id || "",
      name: row?.name || "",
      description: row?.description || "",
      is_active: typeof row?.is_active === "boolean" ? row.is_active : true,
    });
  };

  const resetForm = () => {
    setForm({
      ...EMPTY_AREA,
      branch_id: branchId || "",
    });
  };

  const handleSubmit = async () => {
    if (!canManage || saving) return;

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
      resetForm();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo guardar el área");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 900 }}>Administrar áreas</DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack spacing={2}>
          {!canManage ? <RestrictionAlert nombrePlanActual={nombrePlanActual} /> : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Buscar área"
                fullWidth
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
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
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                onClick={onRefresh}
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                sx={{ ...sxBtnOutlined, height: 56 }}
              >
                Recargar
              </Button>
            </Grid>
          </Grid>

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha("#000", 0.08)}`,
              boxShadow: `0 10px 24px ${alpha("#000", 0.03)}`,
            }}
          >
            <CardContent>
              <Typography sx={{ fontWeight: 900, mb: 1.5 }}>
                {form.id ? "Editar área" : "Nueva área"}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Punto de venta</InputLabel>
                    <Select
                      label="Punto de venta"
                      value={form.pos_location_id}
                      onChange={(e) => handleChange("pos_location_id", e.target.value)}
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {posLocations.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name || `Punto #${item.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nombre del área"
                    fullWidth
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estatus</InputLabel>
                    <Select
                      label="Estatus"
                      value={form.is_active ? 1 : 0}
                      onChange={(e) =>
                        handleChange("is_active", Number(e.target.value) === 1)
                      }
                    >
                      <MenuItem value={1}>Activo</MenuItem>
                      <MenuItem value={0}>Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Descripción"
                    fullWidth
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  onClick={resetForm}
                  variant="outlined"
                  sx={sxBtnOutlined}
                >
                  Limpiar
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={!canManage || saving}
                  variant="contained"
                  startIcon={
                    saving ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />
                  }
                  sx={sxBtnBlack}
                >
                  {saving
                    ? form.id
                      ? "Actualizando..."
                      : "Guardando..."
                    : form.id
                    ? "Actualizar"
                    : "Guardar"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Divider />

          {loadingAreas || loadingPosLocations ? (
            <Box sx={{ p: 1 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Skeleton variant="rounded" height={46} sx={{ borderRadius: 2.5 }} />
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha("#000", 0.07)}`,
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
                  {areas.map((row) => (
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
                                onClick={() => handleEdit(row)}
                                sx={{
                                  borderRadius: 2.2,
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
                                onClick={() => onToggleStatus(row)}
                                sx={{
                                  borderRadius: 2.2,
                                  border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
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
                                onClick={() => onDelete(row)}
                                sx={{
                                  borderRadius: 2.2,
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

                  {areas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                          No hay áreas registradas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Crea una nueva área para comenzar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
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
  );
}