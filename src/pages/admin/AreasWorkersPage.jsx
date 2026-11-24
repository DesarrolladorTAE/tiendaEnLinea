import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Chip,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { Link } from "react-router-dom";
import AdminSectionOption, { adminSectionHeader, adminSectionPanel, adminSectionScope, adminSectionTitle } from "../../components/admin/AdminSectionOption";

import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";

import axiosClient from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";

import { useAreasWorkers } from "../../hooks/useAreasWorkers";
import { canAccessWorkers, storePlanId } from "../../utils/storePlan";
import AreasDialog from "../../components/areas-workers/AreasDialog";
import WorkerDialog from "../../components/areas-workers/WorkerDialog";
import WorkersTable from "../../components/areas-workers/WorkersTable";
import WorkersMobileCards from "../../components/areas-workers/WorkersMobileCards";
import ReporteTrabajadoresDialog from "../../components/reportes/ReporteTrabajadoresDialog";

const PLAN_NAMES = {
  1: "Plan Demo",
  2: "Plan Negocio",
  3: "Plan Profesional",
  4: "Plan Avanzado",
};

const outlinedAction = {
  borderColor: "#d6d7da", color: "#30343b",
  "&:hover": { borderColor: "#d5a000", bgcolor: "#fff8df" },
};

const primaryAction = {
  bgcolor: "#ffc107", color: "#17191c",
  "&:hover": { bgcolor: "#e0a800" },
};

export default function AreasWorkersPage() {
  const { tienda, tiendaLoading } = useTienda();
  const planId = storePlanId(tienda);
  if (tiendaLoading) return <Typography role="status">Consultando el plan de la tienda…</Typography>;
  if (!canAccessWorkers(planId)) {
    return (
      <Alert severity="warning">
        Trabajadores está disponible en los planes Demo, Profesional y Avanzado.
      </Alert>
    );
  }
  return <WorkersWorkspace nombrePlanActual={PLAN_NAMES[planId]} />;
}

function WorkersWorkspace({ nombrePlanActual }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const { selectedBranch } = useAdminUi();

  const branchId = selectedBranch?.id ? Number(selectedBranch.id) : null;

  const [openAreasDialog, setOpenAreasDialog] = useState(false);
  const [openWorkerDialog, setOpenWorkerDialog] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [openReporteDialog, setOpenReporteDialog] = useState(false);

  const hoy = new Date().toISOString().slice(0, 10);

  const [reportFilters, setReportFilters] = useState({
    worker_id: "todos",
    pos_location_id: "todos",
    fecha_inicio: hoy,
    fecha_fin: hoy,
  });

  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState("");

  const {
    loadingAreas,
    loadingWorkers,
    loadingPosLocations,
    areas,
    workers,
    posLocations,
    areaSearch,
    setAreaSearch,
    workerSearch,
    setWorkerSearch,
    filterPosLocation,
    setFilterPosLocation,
    filterAreaId,
    setFilterAreaId,
    fetchAreas,
    fetchWorkers,
    fetchPosLocations,
    handleDeleteArea,
    handleToggleArea,
    handleDeleteWorker,
    handleToggleWorker,
    handleSavedWorker,
    handleSavedAreaFromDialog,
  } = useAreasWorkers({
    branchId,
    canManage: true,
  });

  const buildReportParams = () => ({
    branch_id: branchId,
    worker_id: reportFilters.worker_id,
    pos_location_id: reportFilters.pos_location_id,
    fecha_inicio: reportFilters.fecha_inicio,
    fecha_fin: reportFilters.fecha_fin,
  });

  const handleBuscarReporte = async () => {
    if (!branchId) return;

    try {
      setReportLoading(true);
      setReportError("");

      const { data } = await axiosClient.get("/reportes/ventas-trabajadores", {
        params: buildReportParams(),
      });

      setReportData(data);
    } catch (error) {
      console.error("Error al consultar reporte:", error);
      setReportData(null);
      setReportError(
        error?.response?.data?.message ||
          "No fue posible consultar el reporte."
      );
    } finally {
      setReportLoading(false);
    }
  };

  const handleLimpiarReporte = () => {
    const hoyActual = new Date().toISOString().slice(0, 10);

    setReportFilters({
      worker_id: "todos",
      pos_location_id: "todos",
      fecha_inicio: hoyActual,
      fecha_fin: hoyActual,
    });

    setReportData(null);
    setReportError("");
  };

  const handleExportPdf = async () => {
    try {
      const response = await axiosClient.get(
        "/reportes/ventas-trabajadores/pdf",
        {
          params: buildReportParams(),
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_ventas_trabajador_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      try {
        const text = await error?.response?.data?.text?.();
        const json = text ? JSON.parse(text) : null;
        console.error("Error al exportar PDF:", json || error);
      } catch {
        console.error("Error al exportar PDF:", error);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axiosClient.get(
        "/reportes/ventas-trabajadores/excel",
        {
          params: buildReportParams(),
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_ventas_trabajador_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      try {
        const text = await error?.response?.data?.text?.();
        const json = text ? JSON.parse(text) : null;
        console.error("Error al exportar Excel:", json || error);
      } catch {
        console.error("Error al exportar Excel:", error);
      }
    }
  };

  return (
    <Box sx={{
      width: "100%", minWidth: 0, maxWidth: 1500, mx: "auto", pb: 3,
      "& .MuiButton-root": { textTransform: "none", fontWeight: 700, minHeight: 44, borderRadius: 2.5 },
      "& .MuiTypography-root": { overflowWrap: "anywhere" },
    }}>
      <Paper elevation={0} sx={adminSectionHeader}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={adminSectionTitle}>Áreas y trabajadores</Typography>
            <Typography sx={{ mt: 1, color: "#c7cbd1" }}>
              Administra personal, horarios, datos fiscales y asignaciones por punto de venta.
            </Typography>
          </Box>
          <Chip icon={<GroupsRoundedIcon />} sx={adminSectionScope}
            label={branchId ? selectedBranch?.name || `Sucursal #${branchId}` : "Sin sucursal"} />
        </Stack>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}
          sx={{ mt: 2, pt: 2, borderTop: "1px solid #3a3d42" }}>
          <Chip label={nombrePlanActual} size="small" sx={adminSectionScope} />
          <Chip label={`${areas.length} área(s)`} size="small" sx={adminSectionScope} />
          <Chip label={`${workers.length} trabajador(es)`} size="small" sx={adminSectionScope} />
        </Stack>
      </Paper>

      {!branchId ? (
        <Paper elevation={0} sx={adminSectionPanel}>
          <Alert severity="info" sx={{ mb: 2 }}>Selecciona una sucursal para administrar áreas y trabajadores.</Alert>
          <Button component={Link} to="/admin/sucursales" variant="outlined" startIcon={<ArrowBackRoundedIcon />} sx={outlinedAction}>
            Ir a mis sucursales
          </Button>
        </Paper>
      ) : (
        <>
          <Box role="group" aria-label="Acciones de trabajadores" sx={{
            display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5, mb: 2.5,
          }}>
            <AdminSectionOption icon={ApartmentRoundedIcon} label="Administrar áreas"
              description="Organiza las áreas y sus puntos de venta." opensDialog onClick={() => {
                fetchAreas();
                fetchPosLocations();
                setOpenAreasDialog(true);
              }} />
            <AdminSectionOption icon={AssessmentRoundedIcon} label="Reporte de trabajadores"
              description="Consulta y exporta las ventas por trabajador." opensDialog onClick={() => setOpenReporteDialog(true)} />
          </Box>
          <Paper elevation={0} sx={adminSectionPanel}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} gap={1.5} justifyContent="space-between" alignItems={{ md: "center" }}>
                <Typography component="h2" variant="h6" fontWeight={800}>Trabajadores</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                  <Button onClick={fetchWorkers} variant="outlined" startIcon={<RefreshRoundedIcon />} sx={outlinedAction}>Recargar</Button>
                  <Button onClick={() => { setEditingWorker(null); setOpenWorkerDialog(true); }}
                    variant="contained" disableElevation startIcon={<AddRoundedIcon />} sx={primaryAction}>
                    Crear trabajador
                  </Button>
                </Stack>
              </Stack>
              <Divider />
              {isMobile ? (
                <WorkersMobileCards
                  workers={workers}
                  loading={loadingWorkers}
                  canManage
                  workerSearch={workerSearch}
                  setWorkerSearch={setWorkerSearch}
                  filterPosLocation={filterPosLocation}
                  setFilterPosLocation={setFilterPosLocation}
                  filterAreaId={filterAreaId}
                  setFilterAreaId={setFilterAreaId}
                  posLocations={posLocations}
                  areas={areas}
                  onEdit={(row) => {
                    setEditingWorker(row);
                    setOpenWorkerDialog(true);
                  }}
                  onDelete={handleDeleteWorker}
                  onToggleStatus={handleToggleWorker}
                />
              ) : (
                <WorkersTable
                  workers={workers}
                  loading={loadingWorkers}
                  canManage
                  workerSearch={workerSearch}
                  setWorkerSearch={setWorkerSearch}
                  filterPosLocation={filterPosLocation}
                  setFilterPosLocation={setFilterPosLocation}
                  filterAreaId={filterAreaId}
                  setFilterAreaId={setFilterAreaId}
                  posLocations={posLocations}
                  areas={areas}
                  onEdit={(row) => {
                    setEditingWorker(row);
                    setOpenWorkerDialog(true);
                  }}
                  onDelete={handleDeleteWorker}
                  onToggleStatus={handleToggleWorker}
                />
              )}
            </Stack>
          </Paper>
        </>
      )}

      <AreasDialog
        open={openAreasDialog}
        onClose={() => setOpenAreasDialog(false)}
        canManage
        nombrePlanActual={nombrePlanActual}
        branchId={branchId}
        areas={areas}
        posLocations={posLocations}
        loadingAreas={loadingAreas}
        loadingPosLocations={loadingPosLocations}
        areaSearch={areaSearch}
        setAreaSearch={setAreaSearch}
        filterPosLocation={filterPosLocation}
        setFilterPosLocation={setFilterPosLocation}
        onRefresh={() => {
          fetchAreas();
          fetchPosLocations();
        }}
        onSaved={handleSavedAreaFromDialog}
        onDelete={handleDeleteArea}
        onToggleStatus={handleToggleArea}
      />

      <WorkerDialog
        open={openWorkerDialog}
        onClose={() => {
          setOpenWorkerDialog(false);
          setEditingWorker(null);
        }}
        canManage
        nombrePlanActual={nombrePlanActual}
        branchId={branchId}
        row={editingWorker}
        areas={areas}
        posLocations={posLocations}
        onSaved={handleSavedWorker}
      />

      <ReporteTrabajadoresDialog
        open={openReporteDialog}
        onClose={() => setOpenReporteDialog(false)}
        branchId={branchId}
        workers={workers}
        posLocations={posLocations}
        filters={reportFilters}
        setFilters={setReportFilters}
        onBuscar={handleBuscarReporte}
        onLimpiar={handleLimpiarReporte}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
        loading={reportLoading}
        reporteData={reportData}
        reporteError={reportError}
      />
    </Box>
  );
}