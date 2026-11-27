import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, MenuItem, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";
import client from "../../config/axiosClientPOS";
import { useVehicleRequest } from "../vehicles/VehicleRecordFields";
import { productStock } from "../../utils/productInventory";
import { compatibilityLabels, findPOSVehicleProduct, positivePOSId, vehicleSearchParams } from "../../utils/posVehicle";
import ProductCard from "./ProductCard";
import ProductsGrid from "./ProductsGrid";

export default function VehicleProductSearch({ terminal, records, order, scannedSku, categories, cardProps }) {
  const [contextMode, setContextMode] = useState(order && (!order.vehicle_id || records) ? "order" : "manual");
  const [vehicle, setVehicle] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (!scannedSku) return;
    setFilters((current) => ({ ...current, sku: scannedSku.code }));
    setPage(1); setSelected(null);
  }, [scannedSku]);
  const base = { branch_id: terminal.branch_id };
  const catalog = (path, params) => (signal) => client.get(path, { params: { ...base, ...params }, signal }).then(({ data }) => data.data);
  const manual = contextMode === "manual";
  const brands = useVehicleRequest(catalog("/vehicle-brands"), manual ? "brands" : null);
  const models = useVehicleRequest(catalog("/vehicle-models", { brand_id: filters.brand_id }), manual && filters.brand_id ? filters.brand_id : null);
  const years = useVehicleRequest(catalog("/vehicle-years", { brand_id: filters.brand_id, model_id: filters.model_id }),
    manual && filters.model_id ? filters.model_id : null);
  const warehouseScope = useVehicleRequest(async (signal) => {
    const { data } = await client.get("/my-products-by-pos1", {
      params: { pos_location_id: terminal.id, page: 1, per_page: 1 }, signal,
    });
    if (Number(data.pos?.id) !== Number(terminal.id) || Number(data.branch_id) !== Number(terminal.branch_id) ||
        Number(data.store_id) !== Number(terminal.store_id)) throw new Error("Catálogo fuera del contexto de la terminal.");
    const all = data.pos.allowed_warehouses;
    return Array.isArray(all) ? all.filter((row) =>
      [terminal.warehouse_ids, data.warehouse_ids].every((ids) => !Array.isArray(ids) || ids.some((id) => Number(id) === Number(row.id)))) : [];
  }, "warehouse-scope");
  const context = contextMode === "order" ? { service_order_id: order?.id } : contextMode === "record" ? { vehicle_id: vehicle } : {};
  const allowedYear = !filters.year || (/^\d{4}$/.test(filters.year) && Number(filters.year) >= 1886 && Number(filters.year) <= 2200);
  const params = vehicleSearchParams(filters, context, page);
  const key = (manual ? allowedYear : positivePOSId(context.service_order_id ?? context.vehicle_id)) ? JSON.stringify(params) : null;
  const results = useVehicleRequest(async (signal) => {
    const { data } = await client.get("/products/search-by-vehicle", { params, signal });
    if (!Array.isArray(data?.data) || !Number.isSafeInteger(data.last_page)) throw new Error("Respuesta de búsqueda no reconocida.");
    return data;
  }, key);
  const product = useVehicleRequest((signal) => findPOSVehicleProduct(client, terminal, selected, filters.warehouse_id, signal),
    selected && key && results.data ? JSON.stringify([terminal.store_id, terminal.branch_id, terminal.id, key, selected]) : null);
  const productStatus = product.error?.response?.status;
  const productAccessMessage = {
    401: "La sesión del punto de venta venció. Inicia sesión en la terminal.",
    403: "La terminal no tiene permiso para consultar este producto.",
    404: "El producto ya no está disponible en el catálogo autorizado de esta terminal.",
  }[productStatus];
  const productCardProps = { ...cardProps, onAdd: (item) => cardProps.onAdd(item, product.data) };
  const set = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value,
      ...(field === "brand_id" ? { model_id: "", year: "" } : {}),
      ...(field === "model_id" ? { year: "" } : {}),
    }));
    setPage(1); setSelected(null);
  };
  const changeContext = (next) => {
    if (next !== contextMode && order && cardProps.cart.length &&
      !window.confirm("La venta sigue asociada a esta orden. ¿Cambiar el contexto de búsqueda conservando el carrito?")) return;
    setContextMode(next); setPage(1); setSelected(null);
  };
  const field = (id, label, maximum = 191) => <TextField size="small" label={label} value={filters[id] ?? ""}
    onChange={(e) => set(id, e.target.value)} slotProps={{ htmlInput: { maxLength: maximum } }} />;
  const select = (id, label, items, labelOf = (row) => row.name) => <TextField select size="small" label={label}
    value={filters[id] ?? ""} onChange={(e) => set(id, e.target.value)}>
    <MenuItem value="">{id === "classification" ? "Según contexto" : "Todos"}</MenuItem>
    {(items ?? []).map((row) => <MenuItem key={row.id} value={String(row.id)}>{labelOf(row)}</MenuItem>)}
  </TextField>;
  return <Stack component={Paper} variant="outlined" spacing={2} sx={{ p: 2 }}>
    <Typography variant="h6">Refacciones por vehículo</Typography>
    <TextField select size="small" label="Contexto vehicular" value={contextMode} onChange={(e) => changeContext(e.target.value)}>
      <MenuItem value="manual">Marca, modelo y año</MenuItem>
      {records && <MenuItem value="record">Expediente autorizado</MenuItem>}
      {order && (!order.vehicle_id || records) && <MenuItem value="order">Orden {order.order_code ?? order.id}</MenuItem>}
    </TextField>
    {contextMode === "record" && <TextField label="ID del expediente" size="small" value={vehicle}
      onChange={(e) => { setVehicle(e.target.value); setPage(1); setSelected(null); }} />}
    {contextMode === "order" && <Alert severity="info">Se usa el contexto histórico que valida Laravel para esta orden.</Alert>}
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
      {manual && <>{select("brand_id", "Marca vehicular", brands.data)}{select("model_id", "Modelo", models.data)}
        {years.data?.length && years.data.every((year) => Number.isInteger(year))
          ? select("year", "Año", years.data.map((year) => ({ id: year, name: year })))
          : field("year", "Año", 4)}</>}
      {field("name", "Nombre")}{field("sku", "SKU")}{field("barcode", "Código de barras")}{field("commercial_brand", "Marca comercial", 120)}
      {select("category_id", "Categoría", categories)}
      {select("stock_status", "Existencias", [{ id: "in_stock", name: "Con existencias" }, { id: "out_of_stock", name: "Sin existencias" }])}
      {select("warehouse_id", "Almacén", warehouseScope.data)}
      {select("classification", "Compatibilidad", Object.entries(compatibilityLabels).map(([id, name]) => ({ id, name })))}
    </Box>
    <Button sx={{ alignSelf: "start" }} onClick={() => { setFilters({}); setPage(1); setSelected(null); }}>Limpiar filtros de producto</Button>
    {!allowedYear && <Alert severity="warning">Selecciona un año entre 1886 y 2200.</Alert>}
    {[brands, models, years, results, warehouseScope].filter((request) => request.error).map((request, index) =>
      <Alert key={index} severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>
        {[403, 404].includes(request.error.response?.status) ? "El contexto o recurso no está autorizado para esta terminal."
          : request.error.response?.data?.message ?? request.error.message}
      </Alert>)}
    {results.loading && <CircularProgress size={24} aria-label="Buscando refacciones" />}
    {results.data?.data.length === 0 && <Alert severity="info">Sin resultados para esta selección.</Alert>}
    {(results.data?.data ?? []).map((item) => <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {item.image && <Box component="img" src={typeof item.image === "string" ? item.image : cardProps.getProductImage(item)} alt="" sx={{ width: 60, height: 60, objectFit: "contain" }} />}
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700}>{item.name}</Typography>
          <Typography variant="body2">{item.sku} {item.commercial_brand && `· ${item.commercial_brand}`}</Typography>
          <Chip size="small" label={compatibilityLabels[item.compatibility_status] ?? compatibilityLabels.unknown} />
          {item.year_unconfirmed && <Typography variant="caption" display="block">Año no confirmado</Typography>}
          {(item.matching_compatibilities ?? []).map((match) => <Typography key={match.id} variant="body2">
            {match.vehicle_brand} {match.vehicle_model} · {match.year_from ?? "Sin inicio"}–{match.year_to ?? "Sin fin"}
          </Typography>)}
          <Typography variant="body2">Disponible: {item.available_stock ?? "Sin confirmar"}</Typography>
          <Typography variant="body2">{item.price == null ? "Precio al elegir variante o almacén" : `Precio preliminar: $${item.price}`}</Typography>
          {(item.variant_options ?? []).map((variant) => <Typography key={variant.id} variant="caption" display="block">{variant.name || variant.sku}</Typography>)}
        </Box>
        <Button disabled={item.in_stock !== true} onClick={() => {
          if (!["compatible", "universal"].includes(item.compatibility_status) && !window.confirm("La compatibilidad no está confirmada. ¿Continuar con la selección?")) return;
          setSelected(item.id);
        }}>Seleccionar</Button>
      </Stack>
      {selected === item.id && product.error && <Alert severity="error" action={!productAccessMessage && <Button onClick={product.retry}>Reintentar detalle</Button>}>
        {productAccessMessage ?? product.error.response?.data?.message ?? product.error.message}
      </Alert>}
      {selected === item.id && (product.loading ? <CircularProgress size={24} aria-label="Consultando catálogo POS" />
        : product.data && productStock(product.data, { activeOnly: true }) > 0
          ? (cardProps.classic ? <ProductCard product={product.data} {...productCardProps} />
            : <ProductsGrid products={[product.data]} {...productCardProps} />)
          : !product.error && <Alert severity="warning">El catálogo POS no confirmó existencias autorizadas para este producto.</Alert>)}
    </Paper>)}
    {results.data?.last_page > 1 && <Pagination page={page} count={results.data.last_page} onChange={(_, next) => { setPage(next); setSelected(null); }} />}
  </Stack>;
}

