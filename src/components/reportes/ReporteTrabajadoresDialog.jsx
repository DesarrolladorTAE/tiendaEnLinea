import React, { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";

import ReporteTrabajadoresResultados from "./ReporteTrabajadoresResultados";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
};

const sxBtnOutlined = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  borderColor: alpha("#000", 0.14),
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

function getWorkerFullName(worker) {
  return (
    `${worker?.first_name || ""} ${worker?.last_name || ""}`.trim() ||
    `#${worker?.id}`
  );
}

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function ReporteTrabajadoresDialog({
  open,
  onClose,
  branchId,
  workers = [],
  posLocations = [],
  filters,
  setFilters,
  onBuscar,
  onLimpiar,
  onExportPdf,
  onExportExcel,
  loading = false,
  reporteData = null,
  reporteError = "",
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const posOptions = useMemo(() => {
    return [
      { id: "todos", name: "Todos los puntos de venta" },
      ...posLocations.map((p) => ({
        id: p.id,
        name: p.name || p.label || `POS #${p.id}`,
      })),
    ];
  }, [posLocations]);

  const filteredWorkers = useMemo(() => {
    const selectedPosId = filters?.pos_location_id;

    if (!selectedPosId || selectedPosId === "todos") {
      return workers;
    }

    return workers.filter(
      (worker) => String(worker?.pos_location_id ?? "") === String(selectedPosId)
    );
  }, [workers, filters?.pos_location_id]);

  const workersOptions = useMemo(() => {
    return [
      {
        id: "todos",
        name: "Todos los trabajadores",
        profile_photo: null,
      },
      ...filteredWorkers.map((w) => ({
        id: w.id,
        name: getWorkerFullName(w),
        profile_photo: w.profile_photo || null,
        pos_location_id: w.pos_location_id ?? null,
      })),
    ];
  }, [filteredWorkers]);

  const selectedWorkerOption = useMemo(() => {
    return workersOptions.find(
      (worker) => String(worker.id) === String(filters?.worker_id ?? "todos")
    );
  }, [workersOptions, filters?.worker_id]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    setFilters((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      // Si cambia el punto de venta y el trabajador actual ya no pertenece a ese POS,
      // regresamos trabajador a "todos"
      if (field === "pos_location_id") {
        const nextWorkers =
          value === "todos"
            ? workers
            : workers.filter(
                (worker) =>
                  String(worker?.pos_location_id ?? "") === String(value)
              );

        const workerStillExists = nextWorkers.some(
          (worker) => String(worker.id) === String(prev.worker_id)
        );

        next.worker_id =
          prev.worker_id === "todos" || workerStillExists
            ? prev.worker_id
            : "todos";
      }

      return next;
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 4 },
          overflow: "hidden",
          border: { xs: "none", md: `1px solid ${alpha("#000", 0.08)}` },
          boxShadow: { xs: "none", md: `0 20px 50px ${alpha("#000", 0.18)}` },
          bgcolor: "#fff",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.75, md: 2 },
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: "#fff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: alpha(COLORS.accent, 0.22),
                border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <AssessmentRoundedIcon sx={{ color: COLORS.black }} />
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: COLORS.black,
                  lineHeight: 1.1,
                }}
              >
                Reporte de ventas por trabajador
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.3 }}
              >
                Filtra por fechas, trabajador y punto de venta.
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={onClose}
            sx={{
              border: `1px solid ${alpha("#000", 0.08)}`,
              bgcolor: "#fff",
              "&:hover": { bgcolor: alpha("#000", 0.03) },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: "#fff" }}>
        <Stack spacing={2}>
          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha("#000", 0.07)}`,
              bgcolor: alpha("#000", 0.012),
              p: { xs: 1.5, md: 2 },
            }}
          >
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={branchId ? `Sucursal #${branchId}` : "Sin sucursal"}
                    variant="outlined"
                    sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Configura los filtros para consultar y después exportar el
                  resultado.
                </Typography>
              </Stack>

              <Divider />

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="pos-label">Punto de venta</InputLabel>
                    <Select
                      labelId="pos-label"
                      label="Punto de venta"
                      value={filters?.pos_location_id ?? "todos"}
                      onChange={handleChange("pos_location_id")}
                    >
                      {posOptions.map((pos) => (
                        <MenuItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="worker-label">Trabajador</InputLabel>
                    <Select
                      labelId="worker-label"
                      label="Trabajador"
                      value={filters?.worker_id ?? "todos"}
                      onChange={handleChange("worker_id")}
                      renderValue={(selected) => {
                        const selectedWorker =
                          workersOptions.find(
                            (worker) => String(worker.id) === String(selected)
                          ) || selectedWorkerOption;

                        if (!selectedWorker) return "Todos los trabajadores";

                        if (selectedWorker.id === "todos") {
                          return "Todos los trabajadores";
                        }

                        return (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ minWidth: 0 }}
                          >
                            <Avatar
                              src={selectedWorker.profile_photo || undefined}
                              alt={selectedWorker.name}
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: 12,
                                fontWeight: 900,
                                bgcolor: alpha(COLORS.accent, 0.3),
                                color: COLORS.black,
                              }}
                            >
                              {getInitials(selectedWorker.name)}
                            </Avatar>

                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: COLORS.black,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {selectedWorker.name}
                            </Typography>
                          </Stack>
                        );
                      }}
                    >
                      {workersOptions.map((worker) => (
                        <MenuItem key={worker.id} value={worker.id}>
                          {worker.id === "todos" ? (
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {worker.name}
                            </Typography>
                          ) : (
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ minWidth: 0 }}
                            >
                              <Avatar
                                src={worker.profile_photo || undefined}
                                alt={worker.name}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  fontSize: 12,
                                  fontWeight: 900,
                                  bgcolor: alpha(COLORS.accent, 0.3),
                                  color: COLORS.black,
                                }}
                              >
                                {getInitials(worker.name)}
                              </Avatar>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: COLORS.black,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {worker.name}
                                </Typography>
                              </Box>
                            </Stack>
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha inicio"
                    type="date"
                    value={filters?.fecha_inicio || ""}
                    onChange={handleChange("fecha_inicio")}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha fin"
                    type="date"
                    value={filters?.fecha_fin || ""}
                    onChange={handleChange("fecha_fin")}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha("#000", 0.07)}`,
              bgcolor: "#fff",
              p: { xs: 1.25, md: 1.5 },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  onClick={onBuscar}
                  variant="contained"
                  startIcon={<SearchRoundedIcon />}
                  sx={sxBtnBlack}
                  disabled={loading || !branchId}
                >
                  {loading ? "Consultando..." : "Buscar"}
                </Button>

                <Button
                  onClick={onLimpiar}
                  variant="outlined"
                  startIcon={<CleaningServicesRoundedIcon />}
                  sx={sxBtnOutlined}
                  disabled={loading}
                >
                  Limpiar filtros
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  onClick={onExportPdf}
                  variant="outlined"
                  startIcon={<PictureAsPdfRoundedIcon />}
                  sx={sxBtnOutlined}
                  disabled={loading}
                >
                  Exportar PDF
                </Button>

                <Button
                  onClick={onExportExcel}
                  variant="outlined"
                  startIcon={<TableViewRoundedIcon />}
                  sx={sxBtnOutlined}
                  disabled={loading}
                >
                  Exportar Excel
                </Button>
              </Stack>
            </Stack>
          </Box>

          <ReporteTrabajadoresResultados
            loading={loading}
            data={reporteData}
            error={reporteError}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}