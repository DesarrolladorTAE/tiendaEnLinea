import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";

import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";

import { useAreasWorkers } from "../../hooks/useAreasWorkers";
import RestrictionAlert from "../../components/areas-workers/RestrictionAlert";
import AreasDialog from "../../components/areas-workers/AreasDialog";
import WorkerDialog from "../../components/areas-workers/WorkerDialog";
import WorkersTable from "../../components/areas-workers/WorkersTable";
import WorkersMobileCards from "../../components/areas-workers/WorkersMobileCards";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const PLAN_NAMES = {
  1: "Plan Demo",
  2: "Plan Negocio",
  3: "Plan Profesional",
  4: "Plan Avanzado",
};

const ALLOWED_PLAN_IDS = [3, 4];

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

export default function AreasWorkersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { selectedBranch } = useAdminUi();
  const { tienda, tiendaLoading } = useTienda();

  const branchId = selectedBranch?.id ? Number(selectedBranch.id) : null;

  const [openAreasDialog, setOpenAreasDialog] = useState(false);
  const [openWorkerDialog, setOpenWorkerDialog] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const planId = useMemo(() => {
    return Number(
      tienda?.plan_id ||
        tienda?.subscription?.plan_id ||
        tienda?.store_plan?.plan_id ||
        0
    );
  }, [tienda]);

  const nombrePlanActual = useMemo(() => {
    if (planId === 2) return "Plan Negocio";
    if (planId === 3) return "Plan Profesional";
    if (planId === 4) return "Plan Avanzado";
    return PLAN_NAMES[planId] || "Sin plan asignado";
  }, [planId]);

  const canManage = useMemo(() => {
    return ALLOWED_PLAN_IDS.includes(planId);
  }, [planId]);

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
    canManage,
  });

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 4,
            border: `1px solid ${alpha("#000", 0.08)}`,
            overflow: "hidden",
            boxShadow: `0 12px 34px ${alpha("#000", 0.04)}`,
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Stack
              direction={isMobile ? "column" : "row"}
              alignItems={isMobile ? "flex-start" : "center"}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={1.2} sx={{ width: "100%" }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.5,
                      bgcolor: alpha(COLORS.accent, 0.22),
                      border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GroupsRoundedIcon sx={{ color: COLORS.black }} />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 900, color: COLORS.black, lineHeight: 1.1 }}
                    >
                      Áreas y Trabajadores
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Administra personal, horarios, datos fiscales y asignación por punto de venta.
                    </Typography>
                  </Box>

                  <Button
                    startIcon={<ArrowBackRoundedIcon />}
                    variant="outlined"
                    sx={sxBtnOutlined}
                  >
                    Volver
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    label={
                      branchId
                        ? `Sucursal: ${selectedBranch?.name || `#${branchId}`}`
                        : "Sin sucursal"
                    }
                    variant="outlined"
                    sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                  />

                  <Chip
                    label={`Plan actual: ${nombrePlanActual}`}
                    variant="outlined"
                    sx={{ fontWeight: 900, borderColor: alpha("#000", 0.15) }}
                  />

                  <Chip
                    label={`${areas.length} área(s)`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: alpha(COLORS.accent, 0.22),
                      border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                    }}
                  />

                  <Chip
                    label={`${workers.length} trabajador(es)`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: alpha("#000", 0.04),
                      border: `1px solid ${alpha("#000", 0.08)}`,
                    }}
                  />

                  {!canManage ? (
                    <Chip
                      icon={<LockRoundedIcon />}
                      label="Acceso restringido"
                      variant="outlined"
                      sx={{
                        fontWeight: 900,
                        borderColor: alpha(COLORS.danger, 0.25),
                        color: COLORS.danger,
                      }}
                    />
                  ) : null}
                </Stack>

                {!tiendaLoading && !canManage ? (
                  <RestrictionAlert nombrePlanActual={nombrePlanActual} />
                ) : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!branchId ? (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2.5,
              bgcolor: alpha("#000", 0.03),
              border: `1px solid ${alpha("#000", 0.08)}`,
            }}
          >
            Primero selecciona una sucursal para administrar áreas y trabajadores.
          </Alert>
        ) : (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha("#000", 0.08)}`,
              overflow: "hidden",
              boxShadow: `0 12px 34px ${alpha("#000", 0.04)}`,
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
              <Stack spacing={1.5}>
                {!canManage ? <RestrictionAlert nombrePlanActual={nombrePlanActual} /> : null}

                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha("#000", 0.07)}`,
                    bgcolor: alpha("#000", 0.012),
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", md: "center" }}
                      justifyContent="space-between"
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        sx={{ flex: 1 }}
                      >
                        <Button
                          onClick={fetchWorkers}
                          variant="outlined"
                          startIcon={<RefreshRoundedIcon />}
                          sx={sxBtnOutlined}
                        >
                          Recargar
                        </Button>

                        <Button
                          onClick={() => {
                            fetchAreas();
                            fetchPosLocations();
                            setOpenAreasDialog(true);
                          }}
                          variant="outlined"
                          startIcon={<ApartmentRoundedIcon />}
                          sx={sxBtnOutlined}
                        >
                          Administrar áreas
                        </Button>
                      </Stack>

                      <Button
                        onClick={() => {
                          setEditingWorker(null);
                          setOpenWorkerDialog(true);
                        }}
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        sx={sxBtnBlack}
                        disabled={!canManage}
                      >
                        Crear trabajador
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />

                {isMobile ? (
                  <WorkersMobileCards
                    workers={workers}
                    loading={loadingWorkers}
                    canManage={canManage}
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
                    canManage={canManage}
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
            </CardContent>
          </Card>
        )}

        <AreasDialog
          open={openAreasDialog}
          onClose={() => setOpenAreasDialog(false)}
          canManage={canManage}
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
          canManage={canManage}
          nombrePlanActual={nombrePlanActual}
          branchId={branchId}
          row={editingWorker}
          areas={areas}
          posLocations={posLocations}
          onSaved={handleSavedWorker}
        />
      </Container>
    </Box>
  );
}