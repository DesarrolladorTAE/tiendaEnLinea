import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, MenuItem, Pagination, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { saveAs } from "file-saver";
import client from "../../config/axiosClient";
import { useTienda } from "../../context/TiendaContext";
import { useAdminUi } from "../../context/AdminUiContext";
import { useVehicleMutation, useVehicleRequest } from "../../components/vehicles/VehicleRecordFields";
import ModalPDFPreview from "../../components/tickets/ModalPDFPreview";
import FinancialReportResults from "../../components/FinancialReportResults";
import { fetchFinancialExcel, fetchFinancialReport, financialExportName, financialExportPath, financialReportRoot,
  localReportDate, reportDayOffset, reportError, reportSettings, saveReportSettings, validDistribution, validReportFilters } from "../../services/admin/financialReports";

const periods = { semanal: "weekly", mensual: "monthly", distribucion: "settings" };
const scopeFields = ["branch_id", "product_id", "category_id"];
const denied = (error) => [401, 403, 404].includes(error.response?.status);
const quiet = { __skipSupportIncident: true, __skipAuthRedirect: true };
const navItems = [["semanal", "Semanal"], ["mensual", "Mensual"], ["distribucion", "Distribución"]];
const settingsMessage = (settings) => ({ current_expenses_percent: String(settings.current_expenses_percent), savings_percent: String(settings.savings_percent) });

function RequestError({ error, retry }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    reportError(error).then((value) => { if (active) setMessage(value); });
    return () => { active = false; };
  }, [error]);
  return <Alert severity="error" action={retry && <Button onClick={retry}>Reintentar</Button>}>{message || "No se pudo cargar la información."}</Alert>;
}

export default function FinancialReportsPage({ view }) {
  const { tienda, tiendaLoading } = useTienda();
  const { setHideLayout } = useAdminUi();
  const [token, setToken] = useState(() => localStorage.getItem("AUTH_TOKEN"));
  useEffect(() => {
    setHideLayout(false);
    const update = () => setToken(localStorage.getItem("AUTH_TOKEN"));
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, [setHideLayout]);
  if (tiendaLoading) return <CircularProgress aria-label="Cargando tienda" />;
  if (!token || !tienda?.id) return <Alert severity="warning">Inicia sesión como tienda para consultar los reportes financieros.</Alert>;
  return <FinancialScope key={JSON.stringify([tienda.id, token])} storeId={tienda.id} view={view} />;
}

function FinancialScope({ storeId, view }) {
  const [query, setQuery] = useSearchParams();
  const settings = useVehicleRequest(reportSettings, "settings");
  const [updated, setUpdated] = useState(null);
  const active = updated ?? settings.data;
  const scope = Object.fromEntries(scopeFields.flatMap((key) => query.get(key) ? [[key, query.get(key)]] : []));
  return <Stack spacing={2} sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1480, mx: "auto" }}>
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} alignItems="center">
      <Button component={Link} to="/admin/reportes">Reportes</Button>
      {navItems.map(([name, title]) => <Button key={name} component={Link} variant={view === name ? "contained" : "outlined"}
        to={`${financialReportRoot}/${name}?${new URLSearchParams(scope)}`}>{title}</Button>)}
    </Stack>
    <Typography variant="h4" fontWeight={800}>{view === "semanal" ? "Reporte semanal" : view === "mensual" ? "Reporte mensual" : "Distribución de utilidad"}</Typography>
    {settings.loading && <CircularProgress aria-label="Consultando ajustes financieros" />}
    {settings.error && <RequestError error={settings.error} retry={settings.retry} />}
    {active && !settings.error && (view === "distribucion" ? <DistributionForm
      settings={active} onSave={setUpdated} onDenied={() => { setUpdated(null); settings.retry(); }} />
      : <PeriodView key={view} settings={active} storeId={storeId} period={periods[view]} query={query} setQuery={setQuery} />)}
  </Stack>;
}

function DistributionForm({ settings, onSave, onDenied }) {
  const initial = settingsMessage(settings);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(false);
  const mutation = useVehicleMutation();
  const valid = validDistribution(draft.current_expenses_percent, draft.savings_percent);
  const changed = Object.keys(initial).some((key) => initial[key] !== draft[key]);
  const submit = (event) => {
    event.preventDefault();
    if (!valid || !changed) return;
    mutation.run(async (signal) => {
      setError(null);
      try {
        const result = await saveReportSettings(draft, signal);
        if (!signal.aborted) { onSave(result); setNotice(true); }
      } catch (failure) {
        if (!signal.aborted) { setError(failure); if (denied(failure)) onDenied(); }
      }
    });
  };
  return <Card component="form" variant="outlined" onSubmit={submit} sx={{ p: 2 }}>
    <Stack spacing={2}>
      <Typography>Configuración de toda la tienda. La asignación predeterminada es 60% para gastos corrientes y 40% para ahorro.</Typography>
      <Alert severity="info">Distribución administrativa. Guardar los porcentajes actualiza la configuración de la tienda. Los importes asignados aparecen en el reporte semanal o mensual que corresponda.</Alert>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {[["current_expenses_percent", "Gastos corrientes (%)"], ["savings_percent", "Ahorro (%)"]].map(([key, label]) =>
          <TextField key={key} label={label} value={draft[key]} disabled={mutation.busy}
            onChange={(e) => { setDraft({ ...draft, [key]: e.target.value }); setNotice(false); }}
            slotProps={{ htmlInput: { inputMode: "decimal" } }} />)}
      </Stack>
      {!valid && <Alert severity="warning">Ingresa dos porcentajes que sumen exactamente 100.</Alert>}
      {error && <RequestError error={error} />}
      {notice && <Alert severity="success">Distribución guardada.</Alert>}
      <Button type="submit" variant="contained" disabled={!valid || !changed || mutation.busy} sx={{ alignSelf: "start" }}>Guardar distribución</Button>
      <Typography variant="body2">Base fiscal del costo · {({ net: "Neta", gross: "Bruta", unknown: "Por confirmar" })[settings.cost_tax_basis] ?? "No disponible"}</Typography>
      <Typography variant="body2">Caja fija, inversión y gastos realizados · No disponibles.</Typography>
    </Stack>
  </Card>;
}

function PeriodView({ settings, storeId, period, query, setQuery }) {
  const navigate = useNavigate();
  const weekly = period === "weekly";
  const today = localReportDate(settings.timezone);
  const start = reportDayOffset(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
  const params = weekly ? { from: query.get("from") ?? start, to: query.get("to") ?? reportDayOffset(start, 6) }
    : { year: query.get("year") ?? today.slice(0, 4), month: query.get("month") ?? String(Number(today.slice(5, 7))) };
  scopeFields.forEach((key) => { if (query.get(key)) params[key] = query.get(key); });
  const valid = validReportFilters(period, params);
  const page = weekly && /^[1-9]\d*$/.test(query.get("page") ?? "") ? Number(query.get("page")) : 1;
  const [blocked, setBlocked] = useState(null);
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([period, params, page, revision]);
  const request = useVehicleRequest(async (signal) => {
    const response = await fetchFinancialReport(period, weekly ? { ...params, page, per_page: 20 } : params, signal);
    const receivedBranch = response.branch?.id ?? null;
    if (Number(response.store?.id) !== Number(storeId) || String(receivedBranch) !== String(params.branch_id ?? null)) {
      throw new Error("El reporte no coincide con la tienda y sucursal seleccionadas.");
    }
    if (!response.report || response.kind !== (weekly ? "week" : "month") ||
        !(weekly ? Array.isArray(response.report.details) && response.report.summary && response.report.detail_pagination :
          Array.isArray(response.report.weeks) && response.report.totals)) throw new Error("El reporte recibido no tiene el formato esperado.");
    return response;
  }, valid && blocked?.key !== requestKey ? requestKey : null);
  const selectedFilters = Object.fromEntries(scopeFields.flatMap((key) => params[key] ? [[key, params[key]]] : []));
  const update = (values) => {
    const next = new URLSearchParams(query);
    next.delete("page");
    Object.entries(values).forEach(([key, value]) => { if (value !== "") next.set(key, value); else next.delete(key); });
    setBlocked(null);
    setQuery(next);
  };
  const pagination = request.data?.report.detail_pagination;
  return <>
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {weekly ? <>
            <TextField size="small" type="date" label="Desde" value={params.from} slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => update({ from: e.target.value })} />
            <TextField size="small" type="date" label="Hasta" value={params.to} slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => update({ to: e.target.value })} />
          </> : <>
            <TextField size="small" label="Año" value={params.year} onChange={(e) => update({ year: e.target.value })} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 4 } }} />
            <TextField size="small" select label="Mes" value={String(Number(params.month))} onChange={(e) => update({ month: e.target.value })} sx={{ minWidth: 155 }}>
              {Array.from({ length: 12 }, (_, index) => <MenuItem key={index} value={String(index + 1)}>
                {new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2000, index, 1)))}
              </MenuItem>)}
            </TextField>
          </>}
          <Typography variant="body2" color="text.secondary" alignSelf={{ md: "center" }}>{settings.timezone}</Typography>
        </Stack>
        <ReportCatalogFilters storeId={storeId} filters={params} update={update} />
      </Stack>
    </Card>
    {!valid && <Alert severity="warning">{weekly ? "Selecciona un intervalo válido de hasta siete días." : "Selecciona un mes y un año entre 2000 y 2200."}</Alert>}
    {request.loading && <CircularProgress aria-label="Cargando reporte" />}
    {(blocked?.key === requestKey || request.error) && <RequestError error={blocked?.key === requestKey ? blocked.error : request.error}
      retry={() => { setBlocked(null); setRevision((value) => value + 1); }} />}
    {request.data && <>
      <ReportExport key={JSON.stringify([period, params])} period={period} params={params}
        onDenied={(error) => setBlocked({ key: requestKey, error })} />
      <FinancialReportResults payload={request.data} settings={settings} openWeek={(week) =>
        navigate(`${financialReportRoot}/semanal?${new URLSearchParams({ ...selectedFilters, from: week.from, to: week.to })}`)} />
      {pagination && pagination.total > pagination.per_page && <Pagination aria-label="Páginas de partidas semanales"
        page={Number(pagination.current_page)} count={Math.ceil(pagination.total / pagination.per_page)} onChange={(_, next) => {
          const updated = new URLSearchParams(query);
          updated.set("page", String(next));
          setQuery(updated);
        }} />}
    </>}
  </>;
}

function ReportCatalogFilters({ storeId, filters, update }) {
  const [term, setTerm] = useState("");
  const [productPage, setProductPage] = useState(1);
  const branches = useVehicleRequest((signal) => client.get("/branches", { ...quiet, params: { store_id: storeId }, signal }).then(({ data }) => data.data), "branches");
  const categories = useVehicleRequest((signal) => client.get("/admin/categories", { ...quiet, signal }).then(({ data }) => {
    const rows = data.categories ?? data;
    return Array.isArray(rows) ? rows : rows?.data;
  }), "categories");
  const products = useVehicleRequest(async (signal) => {
    const { data } = await client.get("/products/search", { ...quiet, signal, params: {
      q: term.trim(), field: "all", branch_id: filters.branch_id, page: productPage, per_page: 20,
    } });
    const rows = data.products ?? data;
    const items = Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : rows?.data?.data;
    return { items, pages: Number((rows?.meta ?? data.meta ?? rows?.data?.meta ?? rows)?.last_page) || 1 };
  }, term.trim().length >= 2 && filters.branch_id ? JSON.stringify([filters.branch_id, term.trim(), productPage]) : null);
  const select = (key, label, empty, rows, clearProduct = false) => {
    const list = Array.isArray(rows) ? rows : [];
    return <TextField size="small" select label={label} value={filters[key] ?? ""} onChange={(e) => {
      if (clearProduct) { setTerm(""); setProductPage(1); }
      update({ [key]: e.target.value, ...(clearProduct ? { product_id: "" } : {}) });
    }}>
      <MenuItem value="">{empty}</MenuItem>
      {filters[key] && !list.some((row) => String(row.id) === filters[key]) && <MenuItem value={filters[key]}>ID {filters[key]}</MenuItem>}
      {list.map((row) => <MenuItem key={row.id} value={String(row.id)}>{row.sku ? `${row.sku} · ` : ""}{row.name}</MenuItem>)}
    </TextField>;
  };
  return <>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
      {select("branch_id", "Sucursal", "Toda la tienda", branches.data, true)}
      {select("category_id", "Categoría", "Todas las categorías", categories.data)}
      <TextField size="small" label="Buscar producto" disabled={!filters.branch_id} value={term} onChange={(e) => { setTerm(e.target.value); setProductPage(1); }}
        helperText={filters.branch_id ? products.loading ? "Buscando…" : "Nombre o SKU, desde dos caracteres" : "Elige una sucursal para buscar"} />
      {select("product_id", "Producto", "Todos los productos", products.data?.items)}
    </Box>
    {products.data?.pages > 1 && <Pagination aria-label="Páginas de productos" page={productPage} count={products.data.pages} onChange={(_, next) => setProductPage(next)} />}
    {!filters.branch_id && <TextField size="small" label="ID de producto para toda la tienda" value={filters.product_id ?? ""}
      onChange={(e) => update({ product_id: e.target.value })} slotProps={{ htmlInput: { inputMode: "numeric" } }} />}
    {[branches, categories, products].filter((request) => request.error).map((request, index) =>
      <RequestError key={index} error={request.error} retry={request.retry} />)}
  </>;
}

function ReportExport({ period, params, onDenied }) {
  const [pdf, setPdf] = useState(false);
  const [error, setError] = useState(null);
  const mutation = useVehicleMutation();
  const excel = () => mutation.run(async (signal) => {
    setError(null);
    try {
      const blob = await fetchFinancialExcel(period, params, signal);
      if (!signal.aborted) saveAs(blob, financialExportName(period, "excel", params));
    } catch (failure) {
      if (signal.aborted) return;
      if (denied(failure)) onDenied(failure);
      else setError(failure);
    }
  });
  return <Stack spacing={1}>
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
      <Button variant="outlined" onClick={() => setPdf(true)}>Vista previa PDF</Button>
      <Button variant="outlined" onClick={excel} disabled={mutation.busy}>{mutation.busy ? "Descargando Excel…" : "Descargar Excel"}</Button>
    </Stack>
    {error && <RequestError error={error} />}
    {pdf && <ModalPDFPreview open privateDocument validateSignature onAccessDenied={onDenied}
      endpoint={financialExportPath(period, "pdf", params)} nombreArchivo={financialExportName(period, "pdf", params)}
      onClose={() => setPdf(false)} title="Reporte financiero PDF" />}
  </Stack>;
}

