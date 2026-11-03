import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Pagination, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { destinationLabel, inventoryKey, transferQuantityInput, transferCollection, transferError, transfersApi, validateTransferItems } from "../../services/admin/inventoryTransfers";
import { warehouseDialogStyles, warehouseGrid, warehousePanel } from "./warehouseStyles";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

const active = row => ![false, 0, "0"].includes(row.is_active);
const name = row => row.product_name || row.product?.name || row.name || `Producto #${row.product_id}`;
function TransferProductImage({ row, compact = false }) {
  const image = row.variant?.image_url || row.image_url || row.product_image_url || row.thumbnail_url || row.product?.image_url
    || row.primary_image?.image_url || row.product?.primary_image?.image_url
    || row.images?.[0]?.image_url || row.product?.images?.[0]?.image_url;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  return <Box sx={{ width: compact ? 40 : "100%", height: compact ? 40 : 130, flexShrink: 0, bgcolor: "#f7f7f5", borderRadius: 2, display: "grid", placeItems: "center", overflow: "hidden" }}>
    {image && !failed ? <Box component="img" src={image} alt={name(row)} loading="lazy" onError={() => setFailed(true)} sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1, boxSizing: "border-box" }} /> : <Inventory2OutlinedIcon aria-label="Producto sin imagen" sx={{ color: "#a1a1aa", fontSize: compact ? 28 : 40 }} />}
  </Box>;
}
export default function NewInventoryTransferDialog({ branch, branches, onClose, onSaved }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const storageKey = `inventory-transfer:pending:${branch.id}`;
  const [attempt, setAttempt] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { return null; } });
  const [destination, setDestination] = useState(""); const [warehouse, setWarehouse] = useState(null);
  const [warehouses, setWarehouses] = useState([]); const [destinationLoading, setDestinationLoading] = useState(false);
  const [sourceWarehouses, setSourceWarehouses] = useState([]); const [source, setSource] = useState("");
  const [destinationProducts, setDestinationProducts] = useState([]); const [productsLoading, setProductsLoading] = useState(false); const [productsError, setProductsError] = useState("");
  const [notes, setNotes] = useState(""); const [query, setQuery] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [items, setItems] = useState([]); const [catalog, setCatalog] = useState({ loading: true, rows: [], lastPage: 1 });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [review, setReview] = useState(false); const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    transfersApi.warehouses(branch.id, controller.signal).then(rows => { if (!controller.signal.aborted) setSourceWarehouses(rows.filter(active)); }).catch(e => { if (!controller.signal.aborted) setError(transferError(e)); });
    return () => controller.abort();
  }, [branch.id]);
  useEffect(() => {
    const controller = new AbortController(); setWarehouses([]); setWarehouse(null);
    if (!destination) return () => controller.abort();
    setDestinationLoading(true);
    transfersApi.warehouses(destination, controller.signal).then(rows => { if (!controller.signal.aborted) setWarehouses(rows.filter(active)); }).catch(e => { if (!controller.signal.aborted) setError(transferError(e)); }).finally(() => { if (!controller.signal.aborted) setDestinationLoading(false); });
    return () => controller.abort();
  }, [destination]);
  useEffect(() => {
    const controller = new AbortController(); setCatalog({ loading: true, rows: [], lastPage: 1 });
    transfersApi.availability({ branch_id: branch.id, ...(source ? { warehouse_id: source } : {}), q: search, page, per_page: 12 }, controller.signal).then(body => {
      if (!controller.signal.aborted) setCatalog({ ...transferCollection(body, "availability"), loading: false });
    }).catch(e => { if (!controller.signal.aborted) { setError(transferError(e)); setCatalog({ loading: false, rows: [], lastPage: 1 }); } });
    return () => controller.abort();
  }, [branch.id, source, search, page]);
  useEffect(() => {
    const controller = new AbortController(); setDestinationProducts([]); setProductsError("");
    setItems(prev => prev.map(({ destination_product_id, destination_variant_id, ...row }) => row));
    if (!destination) { setProductsLoading(false); return () => controller.abort(); }
    setProductsLoading(true);
    transfersApi.destinationProducts(destination, warehouse !== null, controller.signal).then(rows => { if (!controller.signal.aborted) setDestinationProducts(rows); }).catch(e => { if (!controller.signal.aborted) setProductsError(transferError(e)); }).finally(() => { if (!controller.signal.aborted) setProductsLoading(false); });
    return () => controller.abort();
  }, [destination, warehouse !== null]);
  const makeBody = () => {
    if (!destination || Number(destination) === Number(branch.id) || (warehouse !== null && !warehouses.some(w => String(w.id) === String(warehouse)))) throw new Error("Selecciona otra sucursal y un destino válido.");
    for (const row of items) {
      if (!row.destination_product_id) continue;
      const product = destinationProducts.find(product => Number(product.id) === Number(row.destination_product_id));
      if (!product || (row.variant_id && !product.variants?.some(variant => Number(variant.id) === Number(row.destination_variant_id)))) throw new Error("Revisa el producto y la variante elegidos en destino.");
    }
    return { source_branch_id: Number(branch.id), destination_branch_id: Number(destination), destination_warehouse_id: warehouse === null ? null : Number(warehouse), notes: notes.trim(), items: validateTransferItems(items, { destinationGeneral: warehouse === null }) };
  };
  const send = async () => {
    if (pending.current) return;
    let submission = attempt;
    try {
      if (!submission) {
        submission = { key: crypto.randomUUID(), body: makeBody(), previewItems: items };
        // Persist before the request. An ambiguous response must keep the exact key and body.
        sessionStorage.setItem(storageKey, JSON.stringify(submission)); setAttempt(submission);
      }
    } catch (e) { setError(transferError(e)); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      await transfersApi.create(submission.body, submission.key);
      sessionStorage.removeItem(storageKey); onSaved();
    } catch (e) {
      setError(transferError(e));
      if ([400, 401, 403, 404, 422].includes(e.response?.status)) { sessionStorage.removeItem(storageKey); setAttempt(null); setReview(false); }
    } finally { pending.current = false; setBusy(false); }
  };
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="lg" onClose={busy ? undefined : onClose} sx={warehouseDialogStyles}>
    <DialogTitle>Nuevo traspaso de inventario</DialogTitle>
    <DialogContent><Stack spacing={2}>
      <Alert severity="warning">Al confirmar, se descontará del origen y quedará en tránsito. El destino recibirá las existencias al aceptar el envío completo.</Alert>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      {attempt ? <>
        <Alert severity="info">Hay un envío por confirmar. Reintentar conservará la misma solicitud y no duplicará la salida. También puedes cerrar y consultar el historial.</Alert>
        <Typography>Origen: sucursal #{attempt.body.source_branch_id} → destino: sucursal #{attempt.body.destination_branch_id} · {destinationLabel(attempt.body)}</Typography>
        {attempt.body.items.map(row => {
          const preview = attempt.previewItems?.find(item => inventoryKey(item) === inventoryKey(row)) || row;
          return <Box key={inventoryKey(row)} sx={warehousePanel}><Stack direction="row" spacing={1.5} alignItems="center"><TransferProductImage row={preview} compact /><Box sx={{ minWidth: 0 }}><Typography fontWeight={700}>{name(preview)}</Typography><Typography variant="body2">{preview.variant_name || (row.variant_id ? `Variante #${row.variant_id}` : "Producto simple")} · Cantidad: {row.quantity}</Typography></Box></Stack></Box>;
        })}
      </> : <>
        <Box component="fieldset" disabled={busy || review} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "minmax(0,1fr) minmax(290px,.7fr)" }, gap: 2.5, alignItems: "start" }}>
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Typography fontWeight={800}>Origen: {branch.name || `Sucursal #${branch.id}`}</Typography>
          <Box sx={{ ...warehouseGrid, gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" } }}>
            <TextField size="small" select fullWidth label="Sucursal destino" disabled={busy || review} value={destination} onChange={e => { setDestination(e.target.value); setError(""); }}>{branches.filter(b => Number(b.id) !== Number(branch.id) && active(b)).map(b => <MenuItem key={b.id} value={b.id}>{b.name || `Sucursal #${b.id}`}</MenuItem>)}</TextField>
            <TextField size="small" select fullWidth label="Inventario destino" SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }} value={warehouse ?? ""} disabled={!destination || destinationLoading || busy || review} onChange={e => setWarehouse(e.target.value === "" ? null : Number(e.target.value))}><MenuItem value="">Inventario general / Sin almacén</MenuItem>{warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}</TextField>
          </Box>
          {destinationLoading && <CircularProgress size={22} />}
          {destination && !destinationLoading && !warehouses.length && <Alert severity="warning">La sucursal destino no tiene almacenes activos; puedes recibir en inventario general.</Alert>}
          <TextField size="small" label="Observaciones del envío" value={notes} onChange={e => setNotes(e.target.value)} multiline minRows={2} />
          <Typography variant="h6" fontWeight={800}>Selecciona las existencias de origen</Typography>
          <Stack direction={{ xs: "column", lg: "row" }} gap={1}>
            <TextField size="small" select label="Almacén origen" sx={{ minWidth: { lg: 180 } }} value={source} onChange={e => { setSource(e.target.value); setPage(1); }}><MenuItem value="">Todos, incluido inventario global</MenuItem>{sourceWarehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}</TextField>
            <TextField size="small" fullWidth label="Nombre, SKU, OE o variante" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setSearch(query.trim()); setPage(1); } }} />
            <Button variant="outlined" onClick={() => { setSearch(query.trim()); setPage(1); }}>Buscar</Button>
          </Stack>
          {catalog.loading ? <CircularProgress /> : <Box component="ul" aria-label="Productos disponibles para traspaso" sx={{ listStyle: "none", m: 0, p: 0 }}>{catalog.rows.map(row => {
            const selected = items.some(item => inventoryKey(item) === inventoryKey(row));
            return <Box component="li" key={inventoryKey(row)} sx={{ display: "grid", gridTemplateColumns: { xs: "40px minmax(0,1fr)", sm: "40px minmax(0,1fr) auto" }, alignItems: "center", gap: 1, py: 1.25, borderBottom: "1px solid #e3e4e7", bgcolor: selected ? "#fffbee" : "transparent" }}>
              <TransferProductImage row={row} compact />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} sx={{ fontSize: 13, lineHeight: 1.3, overflowWrap: "anywhere" }}>{name(row)}</Typography>
                <Typography variant="caption" sx={{ display: "block", fontSize: 11, lineHeight: 1.4 }}>{row.variant_name || row.variant?.name || "Producto simple"} · SKU: {row.sku || row.product?.sku || "—"} · OE: {row.oe || "—"}</Typography>
                <Typography variant="caption" sx={{ display: "block", fontSize: 11, lineHeight: 1.4 }}>{row.source_warehouse_name || row.warehouse?.name || (row.source_warehouse_id ? `Almacén #${row.source_warehouse_id}` : "Inventario global")} · Disponible: <strong>{row.available}</strong></Typography>
              </Box>
              <Button size="small" sx={{ gridColumn: { xs: "2 / -1", sm: "auto" }, justifySelf: "start", minHeight: "32px !important", px: 1.25 }} variant={selected ? "outlined" : "contained"} disabled={selected || items.length >= 200 || busy || review} onClick={() => setItems(prev => [...prev, { ...row, quantity: transferQuantityInput(row, "1", { destinationGeneral: warehouse === null }) ?? "" }])}>{selected ? "Agregado" : "Agregar"}</Button>
            </Box>;
          })}</Box>}
          {!catalog.loading && !catalog.rows.length && <Alert severity="info">No hay existencias transferibles con estos filtros.</Alert>}
          {catalog.lastPage > 1 && <Pagination page={page} count={catalog.lastPage} onChange={(_, next) => setPage(next)} size="small" />}
        </Stack>
        <Stack component="aside" aria-label="Resumen del traspaso" spacing={2} sx={{ ...warehousePanel, bgcolor: "#fffbee", borderColor: "#f0da8b", position: { md: "sticky" }, top: { md: 0 }, minWidth: 0 }}>
          <Box><Typography variant="h6" fontWeight={800}>Resumen del traspaso</Typography><Typography variant="body2">{items.length} de 200 partidas seleccionadas</Typography></Box>
          {destination && <Typography variant="body2" fontWeight={700}>Destino: {branches.find(b => String(b.id) === String(destination))?.name} · {warehouse === null ? "Inventario general / Sin almacén" : warehouses.find(w => Number(w.id) === Number(warehouse))?.name}</Typography>}
          <Typography variant="caption">Puedes elegir una ficha compatible en destino o dejar la vinculación automática por SKU. Los productos existentes conservan su modo de inventario.</Typography>
          {productsError && <Alert severity="warning">No se pudo consultar el catálogo destino: {productsError}. Puedes usar la vinculación automática por SKU.</Alert>}
          {!items.length && <Typography variant="body2" color="text.secondary">Agrega productos del catálogo para preparar tu envío.</Typography>}
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, maxHeight: { md: "60dvh" }, overflowY: { md: "auto" } }}>
          {items.map(row => <Box component="li" key={inventoryKey(row)} sx={{ py: 1.25, borderBottom: "1px solid #e8ddb5", "&:last-child": { borderBottom: 0 }, minWidth: 0 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "40px minmax(0,1fr)", sm: "40px minmax(0,1fr) auto" }, gap: 1, alignItems: "center" }}>
              <TransferProductImage row={row} compact />
              <Box sx={{ minWidth: 0 }}><Typography fontWeight={700} sx={{ fontSize: 13, lineHeight: 1.3 }}>{name(row)}</Typography><Typography variant="caption" sx={{ display: "block", fontSize: 11, lineHeight: 1.3, mt: .25 }}>{row.variant_name || row.variant?.name} · {row.source_warehouse_name || (row.source_warehouse_id ? `Almacén #${row.source_warehouse_id}` : "Global")} · Disp. {row.available}</Typography></Box>
              <Stack direction="row" alignItems="center" spacing={.25} sx={{ gridColumn: { xs: "2 / -1", sm: "auto" } }}>
                <TextField size="small" label="Cant." value={row.quantity} disabled={busy || review} inputProps={{ inputMode: "decimal", min: 0, max: row.available, "aria-label": `Cantidad de ${name(row)}`, title: `Disponible: ${row.available}` }} sx={{ width: 76, "& input": { px: 1, py: 1, fontSize: 13 } }} onKeyDown={e => { if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && !/[0-9.,]/.test(e.key)) e.preventDefault(); }} onChange={e => {
                  const quantity = transferQuantityInput(row, e.target.value, { destinationGeneral: warehouse === null });
                  if (quantity !== null) setItems(prev => prev.map(item => inventoryKey(item) === inventoryKey(row) ? { ...item, quantity } : item));
                }} />
                <IconButton size="small" aria-label={`Quitar ${name(row)}`} title="Quitar producto" color="error" disabled={busy || review} onClick={() => setItems(prev => prev.filter(item => inventoryKey(item) !== inventoryKey(row)))}><CloseRoundedIcon fontSize="small" /></IconButton>
              </Stack>
            </Box>
            <Box component="details" sx={{ ml: "48px", mt: .5, "& summary": { cursor: "pointer", fontSize: 11, color: "#665000" } }}>
              <Box component="summary">{row.destination_product_id ? "Producto destino seleccionado" : "Cambiar producto destino"}</Box>
              <Stack spacing={1} sx={{ pt: 1 }}>
            <TextField size="small" select fullWidth label="Producto destino (opcional)" SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }} value={row.destination_product_id || ""} disabled={!destination || productsLoading || busy || review} onChange={e => setItems(prev => prev.map(item => inventoryKey(item) === inventoryKey(row) ? { ...item, destination_product_id: e.target.value === "" ? undefined : Number(e.target.value), destination_variant_id: undefined } : item))}>
              <MenuItem value="">Automático por SKU al aceptar</MenuItem>
              {destinationProducts.filter(product => row.variant_id ? product.variants?.length > 0 : ![true, 1, "1"].includes(product.has_variants) && !product.variants?.length).map(product => <MenuItem key={product.id} value={product.id}>{product.name} · {product.sku || `#${product.id}`}</MenuItem>)}
            </TextField>
            {row.variant_id && row.destination_product_id && <TextField size="small" select fullWidth label="Variante destino" value={row.destination_variant_id || ""} disabled={busy || review} onChange={e => setItems(prev => prev.map(item => inventoryKey(item) === inventoryKey(row) ? { ...item, destination_variant_id: Number(e.target.value) } : item))}>{destinationProducts.find(product => Number(product.id) === Number(row.destination_product_id))?.variants?.map(variant => <MenuItem key={variant.id} value={variant.id}>{variant.name || variant.sku || `Variante #${variant.id}`}</MenuItem>)}</TextField>}
              </Stack>
            </Box>
          </Box>)}
          </Box>
        </Stack>
        </Box></Box>
        {review && <Alert severity="warning">Revisa destino y cantidades. Confirma únicamente cuando la mercancía esté lista para enviarse. La salida se registra inmediatamente.</Alert>}
      </>}
    </Stack></DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Cerrar</Button>{review && !attempt && <Button disabled={busy} onClick={() => setReview(false)}>Editar</Button>}<Button variant="contained" disabled={busy || (!attempt && (!items.length || !destination || destinationLoading))} onClick={() => { if (attempt || review) send(); else { try { makeBody(); setError(""); setReview(true); } catch (e) { setError(transferError(e)); } } }}>{busy ? "Enviando…" : attempt ? "Reintentar mismo envío" : review ? "Confirmar y enviar" : "Revisar envío"}</Button></DialogActions>
  </Dialog>;
}
