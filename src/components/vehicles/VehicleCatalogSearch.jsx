import React, { useEffect, useMemo, useState } from "react";
import { getPublicVehicleResource } from "../../services/public/storefrontService";
import { Alert, Box, Button, CircularProgress, FormControlLabel, MenuItem, Pagination, Stack, Switch, TextField, Typography } from "@mui/material";
import ShopProducts from "../../wrappers/product/ShopProducts";
function useVehicleList(base, resource, params, enabled, revision) {
  const [state, setState] = useState({ rows: [], loading: false, error: "", open: false });
  const key = JSON.stringify(params);
  useEffect(() => {
    if (!enabled) { setState({ rows: [], loading: false, error: "", open: false }); return; }
    const controller = new AbortController();
    setState({ rows: [], loading: true, error: "", open: false });
    getPublicVehicleResource(base, resource, { params: JSON.parse(key), signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ rows: data.data || [], loading: false, error: "", open: Boolean(data.has_open_ranges) });
    }).catch(() => { if (!controller.signal.aborted) setState({ rows: [], loading: false, error: "No se pudieron cargar los filtros del vehículo.", open: false }); });
    return () => controller.abort();
  }, [base, resource, key, enabled, revision]);
  return state;
}
export default function VehicleCatalogSearch({ branchSlug, shopProps }) {
  const base = branchSlug;
  const [filters, setFilters] = useState({ brand_id: "", model_id: "", year: "", category_id: "", without_vehicle_compatibilities: false });
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ rows: [], total: 0, pages: 1, loading: true, error: "" });
  const brands = useVehicleList(base, "vehicle-brands", {}, !filters.without_vehicle_compatibilities, revision);
  const models = useVehicleList(base, "vehicle-models", { brand_id: filters.brand_id }, Boolean(filters.brand_id), revision);
  const years = useVehicleList(base, "vehicle-years", { brand_id: filters.brand_id, model_id: filters.model_id }, Boolean(filters.model_id), revision);
  const validYear = filters.year === "" || (Number.isInteger(Number(filters.year)) && Number(filters.year) >= 1886 && Number(filters.year) <= 2200);
  const parts = useVehicleList(base, "vehicle-part-types", { ...(filters.brand_id ? { brand_id: filters.brand_id } : {}), ...(filters.model_id ? { model_id: filters.model_id } : {}), ...(filters.year && validYear ? { year: filters.year } : {}) }, validYear, revision);
  const change = (key, value) => {
    setPage(1);
    setFilters(previous => ({ ...previous, ...(key === "brand_id" ? { model_id: "", year: "", category_id: "" } : key === "model_id" ? { year: "", category_id: "" } : key === "year" ? { category_id: "" } : key === "without_vehicle_compatibilities" ? { brand_id: "", model_id: "", year: "", category_id: "" } : {}), [key]: value }));
  };
  const requestParams = useMemo(() => ({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== false)), page, per_page: 20 }), [filters, page]);
  const requestKey = JSON.stringify(requestParams);
  useEffect(() => {
    if (!validYear) { setResult({ rows: [], total: 0, pages: 1, loading: false, error: "Introduce un año entero entre 1886 y 2200." }); return; }
    const controller = new AbortController();
    setResult({ rows: [], total: 0, pages: 1, loading: true, error: "" });
    const timeout = setTimeout(() => {
      const params = JSON.parse(requestKey);
      if (params.without_vehicle_compatibilities) params.without_vehicle_compatibilities = 1;
      getPublicVehicleResource(base, "search-by-vehicle", { params, signal: controller.signal }).then(({ data }) => {
        if (!controller.signal.aborted) setResult({ rows: data.data || [], total: Number(data.total) || 0, pages: Number(data.last_page) || 1, loading: false, error: "" });
      }).catch(err => { if (!controller.signal.aborted) setResult({ rows: [], total: 0, pages: 1, loading: false, error: err.response?.data?.message || "No se pudieron buscar los productos. Intenta de nuevo." }); });
    }, 250);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [base, requestKey, validYear, revision]);
  const select = (key, label, options, disabled = false) => <TextField select size="small" label={label} value={filters[key]} disabled={disabled} onChange={e => change(key, e.target.value)} sx={{ minWidth: { xs: "100%", sm: 160 }, flex: 1 }}><MenuItem value="">Todos</MenuItem>{options.map(item => <MenuItem key={item.id ?? item} value={item.id ?? item}>{item.name ?? item}</MenuItem>)}</TextField>;
  const filtersError = brands.error || models.error || years.error || parts.error;
  return <Box sx={{ mt: 2 }}>
    <Box sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", color: "#172033" }}>
      <Typography fontWeight={800} sx={{ mb: 2 }}>Encuentra refacciones para tu vehículo</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {select("brand_id", "Marca", brands.rows, filters.without_vehicle_compatibilities || brands.loading)}
        {select("model_id", "Modelo", models.rows, !filters.brand_id || models.loading)}
        {years.open ? <TextField size="small" label="Año" type="number" value={filters.year} onChange={e => change("year", e.target.value)} inputProps={{ min: 1886, max: 2200, step: 1 }} error={!validYear} sx={{ minWidth: 140, flex: 1 }} /> : select("year", "Año", years.rows, !filters.model_id || years.loading)}
        {select("category_id", "Tipo de refacción", parts.rows, parts.loading)}
      </Stack>
      {years.open && <Typography variant="caption">Hay compatibilidades con rangos abiertos. Puedes introducir el año de tu vehículo.</Typography>}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" sx={{ mt: 1 }}><FormControlLabel control={<Switch checked={filters.without_vehicle_compatibilities} onChange={e => change("without_vehicle_compatibilities", e.target.checked)} />} label="Sin compatibilidades registradas" /><Button onClick={() => { setFilters({ brand_id: "", model_id: "", year: "", category_id: "", without_vehicle_compatibilities: false }); setPage(1); }}>Limpiar filtros</Button></Stack>
      {filters.without_vehicle_compatibilities && <Alert severity="info">La ausencia de compatibilidades puede significar que el producto está pendiente de clasificar; no certifica compatibilidad universal.</Alert>}
      {filtersError && <Alert severity="warning">{filtersError} <Button onClick={() => setRevision(v => v + 1)}>Reintentar</Button></Alert>}
    </Box>
    {result.loading ? <Box role="status" sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /><Typography>Buscando productos…</Typography></Box> : result.error ? <Alert severity="error" sx={{ mt: 2 }}>{result.error}<Button onClick={() => setRevision(v => v + 1)}>Reintentar</Button></Alert> : <>
      <Typography sx={{ mt: 2 }}>{result.total} productos encontrados</Typography>
      {!result.rows.length && <Alert severity="info" sx={{ mt: 2 }}>No hay productos con los filtros seleccionados.</Alert>}
      <ShopProducts {...shopProps} products={result.rows} variantSearchActive={false} />
      {result.pages > 1 && <Pagination aria-label="Páginas de resultados por vehículo" count={result.pages} page={page} onChange={(_, value) => setPage(value)} sx={{ display: "flex", justifyContent: "center", my: 3 }} />}
    </>}
  </Box>;
}
