import React, { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { customerSalesError, searchCustomerSales, submitCustomerInvoice } from "../../services/public/customerSalesService";
import { REGIMENES_FISCALES, USOS_CFDI } from "../../utils/cfdiCatalogos";
import "./customer-sales.css";

const money = (value) => Number(value || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const truthy = (value) => value === true || value === 1 || value === "1";
const initialFiscal = { rfc: "", razon_social: "", codigo_postal_fiscal: "", regimen_codigo: "", email: "", uso_cfdi: "G03" };
const monthNow = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; };
const SALE_STATUSES = {
  paid: ["Pagada", "success"], pagada: ["Pagada", "success"], completed: ["Completada", "success"],
  credit: ["A crédito", "warning"], credit_paid: ["Crédito liquidado", "success"],
  pending: ["Pendiente de pago", "warning"], unpaid: ["Sin pagar", "warning"], partially_paid: ["Pago parcial", "warning"],
  cancelled: ["Cancelada", "error"], canceled: ["Cancelada", "error"], cancelada: ["Cancelada", "error"],
  refunded: ["Reembolsada", "info"], processing: ["En proceso", "info"], draft: ["Borrador", "info"],
};
const INVOICE_STATUSES = {
  stamped: ["Emitida", "success"], timbrada: ["Emitida", "success"], timbrado: ["Emitida", "success"], issued: ["Emitida", "success"], invoiced: ["Facturada", "success"],
  pending: ["Pendiente de facturar", "warning"], not_invoiced: ["Sin factura", "info"], none: ["Sin factura", "info"], not_issued: ["Sin factura", "info"],
  processing: ["En proceso", "info"], error: ["Error de facturación", "error"], failed: ["Error de facturación", "error"],
  cancelled: ["Cancelada", "error"], canceled: ["Cancelada", "error"], cancelada: ["Cancelada", "error"],
};

export default function CustomerSales({ storeSlug, colors = {}, storefrontTheme = {}, fontFamily, onBack }) {
  const parentTheme = useTheme();
  const mobile = useMediaQuery(parentTheme.breakpoints.down("md"));
  const localTheme = useMemo(() => createTheme({
    palette: {
      mode: storefrontTheme.mode === "dark" ? "dark" : "light",
      primary: { main: colors.accent || "#2563EB", contrastText: parentTheme.palette.getContrastText(colors.accent || "#2563EB") },
      background: { default: colors.background || "#fff", paper: colors.background || "#fff" },
      text: { primary: colors.text || "#111827", secondary: colors.text || "#111827" },
      divider: alpha(colors.text || "#111827", .16),
    },
    typography: { fontFamily: fontFamily || "Inter, Arial, sans-serif" },
    shape: { borderRadius: storefrontTheme.radiusValue ?? 16 },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 750, borderRadius: storefrontTheme.button_style === "pill" ? 99 : storefrontTheme.button_style === "square" ? 0 : storefrontTheme.radiusValue ?? 16 }, contained: { boxShadow: "none" } } },
      MuiTableCell: { styleOverrides: { root: { borderColor: `color-mix(in srgb, ${colors.text || "#111827"} 12%, transparent)` } } },
    },
  }), [parentTheme, colors, storefrontTheme, fontFamily]);
  const panelSx = { border: "1px solid", borderColor: "divider", borderRadius: `${storefrontTheme.radiusValue ?? 16}px`, overflow: "hidden", bgcolor: "background.paper", boxShadow: storefrontTheme.shadowValue || "none" };
  const [query, setQuery] = useState({ mes: monthNow(), tipo: "email", valor: "" });
  const [searched, setSearched] = useState(null);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sale, setSale] = useState(null);
  const [fiscal, setFiscal] = useState(initialFiscal);
  const [preview, setPreview] = useState(null);
  const [invoiceError, setInvoiceError] = useState("");

  async function search(body, page = 1) {
    setBusy(true); setError(""); setResults(null);
    try {
      const { data } = await searchCustomerSales(storeSlug, { ...body, page, per_page: 20 });
      setResults(data); setSearched(body);
    } catch (err) { setError(customerSalesError(err)); }
    finally { setBusy(false); }
  }
  function searchSubmit(event) {
    event.preventDefault();
    const body = { ...query, valor: query.valor.trim() };
    if (body.tipo === "rfc") body.valor = body.valor.toUpperCase();
    if (body.tipo === "rfc" && ["XAXX010101000", "XEXX010101000"].includes(body.valor)) { setError("Escribe tu RFC personal; no se permiten RFC genéricos."); return; }
    setNotice(""); void search(body);
  }
  async function invoice(event) {
    event.preventDefault(); setBusy(true); setInvoiceError("");
    try {
      const { data } = await submitCustomerInvoice(preview ? sale.factura_timbrar_url : sale.factura_preview_url, fiscal);
      if (data?.ok === false) { setInvoiceError(data.message || "No se pudo validar la factura."); return; }
      if (!preview) setPreview(data.data || data);
      else {
        setSale(null); setPreview(null);
        setNotice("Factura emitida. Consulta los comprobantes actualizados abajo.");
        await search(searched, results?.current_page || 1);
      }
    } catch (err) { setInvoiceError(customerSalesError(err)); setPreview(null); }
    finally { setBusy(false); }
  }
  const previewValid = preview?.items?.length > 0 && preview.items.every((item) => item.clave_producto_sat && item.clave_unidad_sat);
  const download = (url, label) => url ? <Button component="a" href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" startIcon={<DownloadRoundedIcon />} size="small">{label}</Button> : null;
  const formatDate = (value) => { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"; };
  const statusChip = (value, kind = "sale") => {
    const key = String(value || "").trim().toLowerCase();
    const [label, tone] = (kind === "invoice" ? INVOICE_STATUSES : SALE_STATUSES)[key]
      || (kind === "invoice" && !key ? ["Sin factura", "info"] : ["Estado no disponible", "primary"]);
    const palette = localTheme.palette[tone];
    return <Chip size="small" label={label} aria-label={`${kind === "invoice" ? "Factura" : "Venta"}: ${label}`} icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "currentColor" }} />} sx={{
      maxWidth: "100%", minHeight: 28, height: "auto", fontWeight: 750,
      color: localTheme.palette.mode === "dark" ? palette.light : palette.dark,
      bgcolor: alpha(palette.main, localTheme.palette.mode === "dark" ? .2 : .1), border: "1px solid", borderColor: alpha(palette.main, .3),
      "& .MuiChip-icon": { color: "inherit", ml: 1.25 }, "& .MuiChip-label": { whiteSpace: "normal", lineHeight: 1.35, py: .5 },
    }} />;
  };
  // A paid sale may be invoiced. Eligibility comes from the API, not status="paid".
  const invoiceActions = (item) => <Stack spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>{statusChip(item.invoice_status, "invoice")}{truthy(item.puede_facturar) && item.factura_preview_url && item.factura_timbrar_url ? <Button size="small" variant="outlined" disabled={busy} onClick={() => { setSale(item); setFiscal(initialFiscal); setPreview(null); setInvoiceError(""); }}>Generar factura</Button> : !item.factura_pdf_url && !item.factura_xml_url && <Typography variant="caption" sx={{ opacity: .65, maxWidth: mobile ? "100%" : 210 }}>La tienda no tiene habilitada la facturación de esta compra. Se requiere pago completo, periodo vigente y configuración fiscal válida.</Typography>}</Stack>;
  const documents = (item) => <Stack direction={mobile ? "row" : "column"} flexWrap="wrap" alignItems={mobile ? "center" : "flex-start"} gap={.5}>{download(item.ticket_pdf_url, "Ticket PDF")}{download(item.factura_pdf_url, "Factura PDF")}{download(item.factura_xml_url, "Factura XML")}{!item.ticket_pdf_url && !item.factura_pdf_url && !item.factura_xml_url && <Typography variant="caption" sx={{ opacity: .6 }}>Sin comprobantes disponibles</Typography>}</Stack>;
  const emptyState = <Stack alignItems="center" spacing={1.5} sx={{ px: 2, py: { xs: 4, md: 7 }, textAlign: "center" }}>{busy ? <CircularProgress size={30} /> : <ReceiptLongRoundedIcon sx={{ fontSize: 40, color: "primary.main", opacity: .5 }} />}<Typography fontWeight={750}>{busy ? "Buscando tus compras…" : results ? "No encontramos compras en este mes" : "Tus compras aparecerán aquí"}</Typography><Typography variant="body2" sx={{ opacity: .65 }}>{busy ? "Estamos consultando tu historial." : results ? "Revisa el mes y el dato registrado al comprar e intenta de nuevo." : "Completa los datos de arriba para consultar tu historial."}</Typography></Stack>;

  return <ThemeProvider theme={localTheme}><Stack spacing={3} sx={{ minWidth: 0, width: "100%", maxWidth: "100%", color: "text.primary", fontFamily: localTheme.typography.fontFamily, "& .MuiTypography-root": { fontFamily: "inherit" }, "& .MuiInputBase-root": { minWidth: 0 } }}>
    <Box><Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} sx={{ mb: 2 }}>Volver a la tienda</Button><Stack direction="row" spacing={2} alignItems="center"><Box sx={{ display: { xs: "none", sm: "grid" }, placeItems: "center", width: 64, height: 64, borderRadius: `${storefrontTheme.radiusValue ?? 16}px`, color: "primary.main", bgcolor: `color-mix(in srgb, ${colors.accent || "#2563EB"} 10%, transparent)` }}><ReceiptLongRoundedIcon fontSize="large" /></Box><Box><Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>ATENCIÓN AL CLIENTE</Typography><Typography component="h2" sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 900, lineHeight: 1.2 }}>Mis compras y facturación</Typography></Box></Stack><Typography sx={{ mt: 1.5, opacity: .75 }}>Tu historial de compras y comprobantes, en un solo lugar.</Typography></Box>
    <Box sx={panelSx}><Box sx={{ p: { xs: 2, md: 3 } }}><Typography fontWeight={850} sx={{ mb: .5 }}>Encuentra tus compras</Typography><Typography variant="body2" sx={{ mb: 2.5, opacity: .7 }}>Selecciona el mes y escribe el dato exacto que registraste al comprar.</Typography>
    <Box component="form" onSubmit={searchSubmit}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "180px 180px minmax(0, 1fr) auto" }, gap: 2, alignItems: "start", "& > *": { minWidth: 0, width: "100%" } }}>
      <TextField fullWidth required type="month" label="Mes de compra" value={query.mes} onChange={(e) => setQuery({ ...query, mes: e.target.value })} InputLabelProps={{ shrink: true }} />
      <TextField fullWidth select label="Buscar por" value={query.tipo} onChange={(e) => setQuery({ ...query, tipo: e.target.value, valor: "" })}><MenuItem value="email">Correo electrónico</MenuItem><MenuItem value="telefono">Teléfono</MenuItem><MenuItem value="rfc">RFC</MenuItem></TextField>
      <TextField required fullWidth label={{ email: "Correo electrónico", telefono: "Teléfono registrado", rfc: "RFC" }[query.tipo]} type={query.tipo === "email" ? "email" : "text"} value={query.valor} inputProps={query.tipo === "telefono" ? { pattern: "\\+?[0-9]{10,15}", maxLength: 16 } : query.tipo === "rfc" ? { minLength: 12, maxLength: 13 } : { maxLength: 254 }} onChange={(e) => setQuery({ ...query, valor: e.target.value })} />
      <Button type="submit" variant={storefrontTheme.button_style === "outline" ? "outlined" : "contained"} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <SearchRoundedIcon />} disabled={busy} sx={{ minHeight: 56, minWidth: 145, flexShrink: 0 }}>{busy ? "Buscando…" : "Buscar compras"}</Button>
    </Box></Box></Box><Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: `color-mix(in srgb, ${colors.accent || "#2563EB"} 4%, transparent)` }}><Typography variant="caption" sx={{ opacity: .75 }}>La consulta no verifica identidad por correo o SMS. Los enlaces vencen en 15 minutos; puedes renovarlos repitiendo la búsqueda.</Typography></Box></Box>
    {error && <Alert severity="error">{error}</Alert>}{notice && <Alert severity="success">{notice}</Alert>}
    <Box sx={panelSx} aria-busy={busy}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ p: { xs: 2, md: 3 } }}><Box><Typography component="h3" variant="h6" fontWeight={850}>Historial de compras</Typography><Typography variant="body2" sx={{ opacity: .65 }}>Solo se muestran compras asociadas a tus datos de cliente.</Typography></Box>{results && <Chip variant="outlined" color="primary" label={`${results.total} compras`} />}</Stack>
    {mobile ? <Box component="ul" aria-label="Resumen de compras y comprobantes" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {!busy && (results?.data || []).map((item) => <Box component="li" key={item.id} sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", overflowWrap: "anywhere" }}><Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Box sx={{ minWidth: 0 }}><Typography component="h4" fontWeight={850} color="primary">Compra #{item.id}</Typography><Typography variant="body2" sx={{ opacity: .7 }}>{formatDate(item.fecha)}</Typography></Box><Typography fontWeight={850} sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{money(item.total)}</Typography></Stack>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Typography variant="caption" sx={{ opacity: .7 }}>Pago / venta</Typography>{statusChip(item.status)}</Stack>
        <Box><Typography variant="caption" sx={{ display: "block", mb: .75, opacity: .7 }}>Facturación</Typography>{invoiceActions(item)}</Box>
        <Box><Typography variant="caption" sx={{ display: "block", mb: .5, opacity: .7 }}>Comprobantes</Typography>{documents(item)}</Box>
      </Stack></Box>)}
      {(busy || !results?.data?.length) && <Box component="li">{emptyState}</Box>}
    </Box> : <TableContainer><Table aria-label="Historial de compras y comprobantes" sx={{ width: "100%", tableLayout: "fixed", "& td": { overflowWrap: "anywhere" }, "& .MuiChip-root": { maxWidth: "100%" }, "& .MuiButton-root": { maxWidth: "100%", minWidth: 0, whiteSpace: "normal" } }}><TableHead sx={{ bgcolor: `color-mix(in srgb, ${colors.accent || "#2563EB"} 7%, transparent)`, "& th": { fontWeight: 800, py: 2 } }}><TableRow><TableCell sx={{ width: "10%" }}>Compra</TableCell><TableCell sx={{ width: "15%" }}>Fecha</TableCell><TableCell align="right" sx={{ width: "15%" }}>Total</TableCell><TableCell sx={{ width: "15%" }}>Estado</TableCell><TableCell sx={{ width: "24%" }}>Facturación</TableCell><TableCell sx={{ width: "21%" }}>Comprobantes</TableCell></TableRow></TableHead><TableBody>
      {!busy && (results?.data || []).map((item) => <TableRow key={item.id} sx={{ "&:hover": { bgcolor: `color-mix(in srgb, ${colors.accent || "#2563EB"} 3%, transparent)` }, "& td": { py: 2.5, verticalAlign: "top" } }}>
        <TableCell><Typography fontWeight={850} color="primary">#{item.id}</Typography></TableCell><TableCell>{formatDate(item.fecha)}</TableCell><TableCell align="right" sx={{ fontWeight: 850, fontVariantNumeric: "tabular-nums" }}>{money(item.total)}</TableCell><TableCell>{statusChip(item.status)}</TableCell>
        <TableCell>{invoiceActions(item)}</TableCell>
        <TableCell>{documents(item)}</TableCell>
      </TableRow>)}
      {(busy || !results?.data?.length) && <TableRow><TableCell colSpan={6} sx={{ p: 0 }}>{emptyState}</TableCell></TableRow>}
    </TableBody></Table></TableContainer>}
    {results?.last_page > 1 && <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}><Button disabled={busy || results.current_page <= 1} onClick={() => search(searched, results.current_page - 1)}>Anterior</Button><Typography variant="caption">Página {results.current_page} de {results.last_page}</Typography><Button disabled={busy || results.current_page >= results.last_page} onClick={() => search(searched, results.current_page + 1)}>Siguiente</Button></Stack>}
    </Box>
    <Dialog open={Boolean(sale)} onClose={busy ? undefined : () => setSale(null)} fullScreen={mobile} fullWidth maxWidth="md"><Box component="form" onSubmit={invoice} sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: mobile ? "100%" : undefined }}>
      <DialogTitle>Facturar compra #{sale?.id}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Typography>Captura tus datos como aparecen en tu constancia de situación fiscal. Revisa la vista previa antes de emitir el CFDI.</Typography>
        {[["rfc", "RFC"], ["razon_social", "Razón social"], ["codigo_postal_fiscal", "Código postal fiscal"], ["email", "Correo electrónico"]].map(([key, label]) => <TextField key={key} required disabled={busy} label={label} type={key === "email" ? "email" : "text"} value={fiscal[key]} inputProps={key === "codigo_postal_fiscal" ? { pattern: "[0-9]{5}", maxLength: 5 } : key === "rfc" ? { minLength: 12, maxLength: 13 } : { maxLength: 254 }} onChange={(e) => { setFiscal({ ...fiscal, [key]: key === "rfc" ? e.target.value.toUpperCase().trim() : e.target.value }); setPreview(null); }} />)}
        {[["regimen_codigo", "Régimen fiscal", REGIMENES_FISCALES], ["uso_cfdi", "Uso de CFDI", USOS_CFDI]].map(([key, label, options]) => <TextField key={key} required select disabled={busy} label={label} value={fiscal[key]} onChange={(e) => { setFiscal({ ...fiscal, [key]: e.target.value }); setPreview(null); }}>{options.map((option) => <MenuItem key={option.codigo} value={option.codigo}>{option.nombre}</MenuItem>)}</TextField>)}
        {invoiceError && <Alert severity="error">{invoiceError}</Alert>}
        {preview && <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}><Typography fontWeight={800}>Vista previa</Typography><Typography>{fiscal.razon_social} · {fiscal.rfc}</Typography>{preview.items?.map((item, index) => <Typography key={item.sale_item_id || index}>{item.descripcion} · {item.cantidad} · {money(item.total)}</Typography>)}<Typography fontWeight={800}>Total: {money(preview.total_neto ?? preview.total_venta)}</Typography><Alert severity={previewValid ? "info" : "warning"} sx={{ mt: 1 }}>{previewValid ? "Al confirmar se emitirá tu comprobante fiscal con estos datos." : "La venta contiene conceptos sin información fiscal completa. Contacta a la tienda."}</Alert></Box>}
      </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={() => setSale(null)}>Cerrar</Button><Button type="submit" variant="contained" disabled={busy || (Boolean(preview) && !previewValid)}>{busy ? "Procesando…" : preview ? "Confirmar y emitir CFDI" : "Validar y ver vista previa"}</Button></DialogActions>
    </Box></Dialog>
  </Stack></ThemeProvider>;
}
