import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Grid, Pagination, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { getTourServices } from "../../services/tours/tourService";
import TourCard from "../../components/tours/TourCard";
import TourDeparturesPage from "./TourDeparturesPage";

const PAGE_SIZE = 12;

export default function ToursPage({ mode = "store", posBranchId, posLocationId, onBack }) {
  const { branchId: routeBranchId } = useParams();
  const { selectedBranch, setHideLayout } = useAdminUi();
  const navigate = useNavigate();
  const isStore = mode === "store";
  // POS always uses the branch supplied by its authenticated wrapper.
  const branchId = Number(isStore ? routeBranchId || selectedBranch?.id : posBranchId);
  const validBranch = Number.isSafeInteger(branchId) && branchId > 0;
  const [state, setState] = useState({ rows: [], loading: true, error: "" });
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedTour, setSelectedTour] = useState(null);

  useEffect(() => {
    if (isStore) setHideLayout(false);
    if (isStore && validBranch && !routeBranchId) {
      navigate(`/admin/branches/${branchId}/tours`, { replace: true });
    }
  }, [isStore, validBranch, branchId, routeBranchId, navigate, setHideLayout]);

  useEffect(() => {
    if (!validBranch) return;
    let active = true;
    const controller = new AbortController();
    setState({ rows: [], loading: true, error: "" });
    setPage(1);
    getTourServices({ branchId, mode, signal: controller.signal }).then((rows) => {
      if (active) setState({ rows, loading: false, error: "" });
    }).catch((error) => {
      if (!active) return;
      const status = error?.response?.status;
      const message = status === 403 ? "No tienes permiso para consultar los servicios de esta sucursal."
        : status === 404 ? "La sucursal o sus servicios no están disponibles."
        : status === 401 ? "Tu sesión expiró. Vuelve a iniciar sesión."
        : error?.response?.data?.message || error.message || "No se pudieron cargar los Tours.";
      setState({ rows: [], loading: false, error: message });
    });
    return () => { active = false; controller.abort(); };
  }, [branchId, mode, validBranch, revision]);

  const viewDepartures = (tour) => {
    if (isStore) navigate(`/admin/branches/${branchId}/tours/${tour.id}/departures`, { state: { tourName: tour.name } });
    else setSelectedTour(tour);
  };
  const back = onBack || (() => navigate("/admin/sucursales"));
  if (!validBranch) return <Alert severity="warning">{isStore ? "Selecciona una sucursal para ver Tours." : "El punto de venta no tiene una sucursal disponible. Vuelve a iniciar sesión."}<Button onClick={back}>Volver</Button></Alert>;

  if (!isStore && selectedTour) return <TourDeparturesPage mode="pos" posLocationId={posLocationId} posBranchId={posBranchId} posServiceId={selectedTour.id} tourName={selectedTour.name} onBack={() => setSelectedTour(null)} />;

  return <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, sm: 3 }, bgcolor: "#fff", color: "#171b20", borderRadius: 3 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} mb={3}>
      <Box><Typography variant="h4" fontWeight={900}>Tours</Typography><Typography color="text.secondary">Sucursal #{branchId}</Typography></Box>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        {isStore && <Button variant="contained" onClick={() => navigate(`/admin/services/new?branch_id=${branchId}&service_type=tour`, { state: { branch: { id: branchId } } })}>Crear Tour</Button>}
        <Button variant="outlined" onClick={back}>{isStore ? "Volver a sucursales" : "Volver al POS"}</Button>
      </Stack>
    </Stack>
    {state.loading ? <Stack alignItems="center" py={6}><CircularProgress aria-label="Cargando Tours" /></Stack>
      : state.error ? <Alert severity="error" action={<Button onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{state.error}</Alert>
      : !state.rows.length ? <Alert severity="info">Esta sucursal todavía no tiene servicios tipo tour.</Alert>
      : <><Grid container spacing={2}>{state.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((tour) => <Grid key={tour.id} size={{ xs: 12, sm: 6, lg: 4 }}><TourCard tour={tour} onViewDepartures={viewDepartures} /></Grid>)}</Grid>
        {state.rows.length > PAGE_SIZE && <Pagination sx={{ mt: 3 }} page={page} count={Math.ceil(state.rows.length / PAGE_SIZE)} onChange={(_, value) => setPage(value)} />}</>}

  </Box>;
}
