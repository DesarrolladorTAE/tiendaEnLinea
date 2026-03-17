import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
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
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";
import RestrictionAlert from "./RestrictionAlert";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
  danger: "#e94e1b",
  success: "#1f8f4d",
};

const EMPTY_AREA = {
  id: null,
  branch_id: "",
  name: "",
  description: "",
  is_active: true,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    bgcolor: "#fff",
    minHeight: 54,
    "& fieldset": {
      borderColor: alpha("#000", 0.12),
    },
    "&:hover fieldset": {
      borderColor: alpha("#000", 0.2),
    },
    "&.Mui-focused fieldset": {
      borderColor: COLORS.accent,
      boxShadow: `0 0 0 3px ${alpha(COLORS.accent, 0.12)}`,
    },
  },
};

const sxBtnOutlined = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  borderColor: alpha("#000", 0.15),
  color: COLORS.black,
  bgcolor: "#fff",
  px: 2,
  "&:hover": { bgcolor: alpha("#000", 0.03) },
};

const sxBtnBlack = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  bgcolor: COLORS.black,
  color: "#fff",
  px: 2,
  "&:hover": { bgcolor: alpha(COLORS.black, 0.86) },
};

function Section({ title, subtitle, icon, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: COLORS.paper,
        border: `1px solid ${alpha("#000", 0.08)}`,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={0.6} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon ? (
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                bgcolor: alpha(COLORS.accent, 0.18),
                border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          ) : null}

          <Typography sx={{ fontWeight: 950, fontSize: 14 }}>
            {title}
          </Typography>
        </Stack>

        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>

      <Stack spacing={1.4}>{children}</Stack>
    </Paper>
  );
}

function StatusChip({ active }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 1.4,
        py: 0.55,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        color: active ? COLORS.success : COLORS.danger,
        bgcolor: active
          ? alpha(COLORS.success, 0.1)
          : alpha(COLORS.danger, 0.1),
        border: `1px solid ${
          active ? alpha(COLORS.success, 0.24) : alpha(COLORS.danger, 0.24)
        }`,
      }}
    >
      {active ? "Activo" : "Inactivo"}
    </Box>
  );
}

function MobileAreaCard({ row, canManage, onEdit, onToggleStatus, onDelete }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${alpha("#000", 0.08)}`,
        bgcolor: "#fff",
        p: 1.4,
      }}
    >
      <Stack spacing={1.2}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 950,
                fontSize: 15,
                lineHeight: 1.2,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {row.name || `Área #${row.id}`}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.4,
                lineHeight: 1.35,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {row.description || "Sin descripción"}
            </Typography>
          </Box>

          <StatusChip active={Boolean(row.is_active)} />
        </Stack>

        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
          <Tooltip title="Editar">
            <span>
              <IconButton
                disabled={!canManage}
                onClick={() => onEdit(row)}
                sx={{
                  borderRadius: 2.2,
                  border: `1px solid ${alpha("#000", 0.10)}`,
                  bgcolor: "#fff",
                }}
              >
                <EditRoundedIcon fontSize="small" />
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
                <ToggleOnRoundedIcon fontSize="small" />
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
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function AreasDialog({
  open,
  onClose,
  canManage,
  nombrePlanActual,
  branchId,
  areas,
  areaSearch,
  setAreaSearch,
  onRefresh,
  onSaved,
  onDelete,
  onToggleStatus,
  loadingAreas,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          border: fullScreen ? "none" : `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: COLORS.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: COLORS.paper,
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <BusinessCenterRoundedIcon sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1 }}>
              {form.id ? "Editar área" : "Nueva área"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra las áreas de tu sucursal de forma clara y ordenada.
            </Typography>
          </Box>

          <IconButton onClick={onClose} disabled={saving}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={1.5}>
          {!canManage ? (
            <RestrictionAlert nombrePlanActual={nombrePlanActual} />
          ) : null}

          <Section
            title="Formulario del área"
            subtitle="Captura la información principal del área."
            icon={<BusinessCenterRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              label="Nombre del área"
              fullWidth
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessCenterRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth sx={fieldSx}>
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

            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, mt: 1, alignSelf: "flex-start" }}>
                    <NotesRoundedIcon fontSize="small" />
                  </Box>
                ),
              }}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ pt: 0.5 }}
            >
              <Button
                onClick={resetForm}
                variant="outlined"
                sx={sxBtnOutlined}
                disabled={saving}
              >
                Limpiar
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!canManage || saving}
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : form.id ? (
                    <EditRoundedIcon />
                  ) : (
                    <AddRoundedIcon />
                  )
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
          </Section>

          <Section
            title="Listado de áreas"
            subtitle="Consulta, busca, edita, elimina o cambia el estatus de un área."
            icon={<ViewListRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Buscar área"
                  fullWidth
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ width: { xs: "100%", md: 220 } }}>
                <Button
                  fullWidth
                  onClick={onRefresh}
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  sx={{ ...sxBtnOutlined, minHeight: 54 }}
                >
                  Recargar
                </Button>
              </Box>
            </Stack>

            {loadingAreas ? (
              <Box>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Skeleton variant="rounded" height={46} sx={{ borderRadius: 2.5 }} />
                  </Box>
                ))}
              </Box>
            ) : areas.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha("#000", 0.08)}`,
                  bgcolor: "#fff",
                  py: 5,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>
                  No hay áreas registradas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Crea una nueva área para comenzar.
                </Typography>
              </Paper>
            ) : isMobile ? (
              <Stack spacing={1.2}>
                {areas.map((row) => (
                  <MobileAreaCard
                    key={row.id}
                    row={row}
                    canManage={canManage}
                    onEdit={handleEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                  />
                ))}
              </Stack>
            ) : (
              <TableContainer
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha("#000", 0.08)}`,
                  bgcolor: "#fff",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: alpha("#000", 0.03),
                        "& th": { fontWeight: 900 },
                      }}
                    >
                      <TableCell sx={{ width: "60%" }}>Área</TableCell>
                      <TableCell>Estatus</TableCell>
                      <TableCell sx={{ width: 180 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {areas.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 950,
                              fontSize: 14.5,
                              lineHeight: 1.25,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {row.name || `Área #${row.id}`}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 0.3,
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {row.description || "Sin descripción"}
                          </Typography>
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
                                  <EditRoundedIcon fontSize="small" />
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
                                  <ToggleOnRoundedIcon fontSize="small" />
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
                                  <DeleteOutlineRoundedIcon fontSize="small" />
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
          </Section>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: COLORS.paper,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          startIcon={<CloseRoundedIcon />}
          variant="outlined"
          sx={sxBtnOutlined}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
