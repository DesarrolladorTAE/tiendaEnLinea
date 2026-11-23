import React from "react";
import { Box } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

const enabled = value => value === true || value === 1 || value === "1" || value === "true";
const amount = value => value == null || value === "" || !Number.isFinite(Number(value)) ? null : `$${Number(value).toFixed(2)}`;
const first = (...values) => values.find(value => value !== undefined && value !== null && value !== "");
const safeUrl = value => { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } };

export default function SaleDocumentPreview({ preview }) {
  const { config = {}, document: doc = {}, document_type: type, channel } = preview;
  const sale = doc.sale || {}, store = doc.store || {}, customer = doc.customer || {}, totals = doc.totals || {};
  const items = Array.isArray(doc.items) ? doc.items : [];
  const payments = Array.isArray(doc.payments) ? doc.payments : [];
  const thermal = type === "ticket", narrow = String(config.paper_size) === "58";
  const logo = config.show_logo == null || enabled(config.show_logo) ? safeUrl(config.logo_url || store.logo_url) : "";
  const qr = [{ key: "invoice", label: "Autofacturaci\u00f3n", url: safeUrl(doc.links?.invoice?.url), size: config.qr_factura_size }, { key: "site", label: "Visita nuestra tienda", url: safeUrl(doc.links?.site?.url), size: config.qr_sitio_size }].filter(item => item.url);
  const total = first(totals.total, totals.total_amount);
  const dateValue = first(sale.created_at, sale.date, sale.sold_at);
  const date = dateValue && !Number.isNaN(Date.parse(dateValue)) ? new Date(dateValue).toLocaleString("es-MX") : dateValue;
  return <Box aria-label="Vista previa del documento de venta" sx={{ width: "100%", maxWidth: thermal ? (narrow ? 232 : 320) : 510, mx: "auto", p: { xs: 1.5, sm: 2 }, pb: 3, bgcolor: "#fff", color: "#111", textAlign: "left", fontFamily: channel === "payload" ? '"Courier New", monospace' : "Arial, sans-serif", fontSize: thermal ? (narrow ? 10 : 11) : 12, lineHeight: 1.4, overflowWrap: "anywhere", boxShadow: "0 10px 25px #0002", borderTop: !thermal && /^#[\da-f]{6}$/i.test(config.accent_color || "") ? `5px solid ${config.accent_color}` : undefined, animation: "receiptIn .45s ease-out", "@keyframes receiptIn": { from: { opacity: 0, transform: "translateY(-16px)" }, to: { opacity: 1, transform: "translateY(0)" } }, "@media (prefers-reduced-motion: reduce)": { animation: "none" }, "& table": { width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "inherit" }, "& th, & td": { borderBottom: "1px dashed #ccc", padding: "5px 2px", verticalAlign: "top", overflowWrap: "anywhere" } }}>
    <Box sx={{ textAlign: "center" }}>
      {store.name && <strong>{store.name}</strong>}
      {logo && <Box component="img" src={logo} alt="Logo de la tienda" sx={{ display: "block", width: `${Math.min(90, Math.max(18, (Number(config.logo_max_width) || 384) / (narrow ? 384 : 576) * 100))}%`, maxWidth: "80%", maxHeight: 130, objectFit: "contain", mx: "auto", my: 1 }} />}
      {config.direccion && <Box sx={{ whiteSpace: "pre-line" }}>{config.direccion}</Box>}
    </Box>
    {!thermal && <Box sx={{ fontSize: 16, fontWeight: 900, mt: 2 }}>{config.title || (type === "nota_venta" ? "NOTA DE VENTA" : "COMPROBANTE")}</Box>}
    <Box sx={{ borderBlock: "1px dashed #888", my: 1, py: .75 }}>
      {sale.id != null && <strong>Venta #{sale.id}</strong>}{date && <Box>Fecha: {date}</Box>}{first(sale.pos_name, sale.pos_location?.name, doc.pos?.name) && <Box>POS: {first(sale.pos_name, sale.pos_location?.name, doc.pos?.name)}</Box>}
      {customer.name && (thermal || enabled(config.show_customer)) && <Box>Cliente: {customer.name}</Box>}
    </Box>
    {config.mensaje_1 && <Box sx={{ whiteSpace: "pre-line", textAlign: "center", my: 1 }}>{config.mensaje_1}</Box>}
    <Box component="table" aria-label="Productos de la venta"><colgroup><col style={{width:"40%"}}/><col style={{width:"12%"}}/><col style={{width:"24%"}}/><col style={{width:"24%"}}/></colgroup><thead><tr><th style={{textAlign:"left"}}>Producto</th><th>Cant.</th><th style={{textAlign:"right"}}>Precio</th><th style={{textAlign:"right"}}>Importe</th></tr></thead><tbody>{items.map((item, index) => { const quantity = first(item.quantity, item.qty); const price = first(item.unit_price, item.price, item.price_amount); const lineTotal = first(item.total, item.line_total, item.total_amount, item.subtotal, price != null && quantity != null ? Number(price) * Number(quantity) : null); return <tr key={item.id ?? index}><td>{first(item.name, item.product_name, item.description, item.display_name) || "Producto"}{enabled(config.show_sku) && item.sku && <Box>SKU: {item.sku}</Box>}{enabled(config.show_oe) && item.oe_number && <Box>OE: {item.oe_number}</Box>}</td><td style={{textAlign:"center"}}>{quantity}</td><td style={{textAlign:"right"}}>{amount(price)}</td><td style={{textAlign:"right"}}>{amount(lineTotal)}</td></tr>; })}</tbody></Box>
    <Box sx={{ mt: .5, "& > div": { display: "flex", justifyContent: "space-between", gap: 1, py: .35, borderBottom: "1px dashed #ddd" } }}>
      {enabled(config.mostrar_iva) && amount(first(totals.iva, totals.iva_total, totals.tax)) != null && <Box><span>IVA incluido</span><span>{amount(first(totals.iva, totals.iva_total, totals.tax))}</span></Box>}
      {amount(total) != null && <Box><strong>Total</strong><strong>{amount(total)}</strong></Box>}
      {payments.map((payment, index) => <Box key={payment.id ?? index}><span>{payment.method || "Pago"}</span><span>{amount(payment.amount)}</span></Box>)}
      {amount(first(totals.received, totals.cash_received)) != null && <Box><span>Recibido</span><span>{amount(first(totals.received, totals.cash_received))}</span></Box>}
      {amount(first(totals.change, totals.change_amount)) != null && <Box><span>Cambio</span><span>{amount(first(totals.change, totals.change_amount))}</span></Box>}
    </Box>
    {!!qr.length && <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mt: 2 }}>{qr.map(item => <Box key={item.key} sx={{ textAlign: "center" }}><QRCodeSVG value={item.url} size={Math.min(120, Math.max(60, Number(item.size || 7) * 12))} marginSize={1} title={item.label}/><Box>{item.label}</Box></Box>)}</Box>}
    {config.mensaje_2 && <Box sx={{ whiteSpace: "pre-line", textAlign: "center", mt: 2 }}>{config.mensaje_2}</Box>}
  </Box>;
}
