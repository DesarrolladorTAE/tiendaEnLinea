import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import client from "../../config/axiosClient";
import { calculateProfitPrice, hasProfitFactor, saveProductProfitFactor, validPurchaseCost } from "../../utils/productProfitFactor";

const money = value => Number(value).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function FactorEditorDialog({ productId, onClose, onSaved }) {
  const [product, setProduct] = useState(null);
  const [factor, setFactor] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setProduct(null); setFactor(""); setError("");
    client.get(`/admin/productos/${productId}`).then(({ data }) => {
      if (!active) return;
      const detail = data?.data ?? data;
      if (!detail || String(detail.id) !== String(productId)) throw new Error("No se pudo leer el producto.");
      setProduct(detail); setFactor(detail.profit_factor == null ? "" : String(detail.profit_factor));
    }).catch(err => { if (active) setError(err.response?.data?.message || err.message || "No se pudo cargar el producto."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId, revision]);

  let preview, validation;
  if (product) {
    try { preview = calculateProfitPrice(product.purchase_cost, factor, product.iva); }
    catch (err) { validation = err.message; }
  }
  const save = async () => {
    if (!preview || loading || submitting.current) return;
    submitting.current = true; setSaving(true); setError("");
    try {
      const updated = await saveProductProfitFactor(client, productId, factor);
      onSaved(productId, updated); onClose();
    } catch (err) {
      const details = err.response?.data;
      setError(details?.errors ? Object.values(details.errors).flat().join("\n") : details?.message || err.message || "No se pudo guardar el factor.");
    } finally { submitting.current = false; setSaving(false); }
  };

  return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby={`factor-dialog-title-${productId}`} PaperProps={{ sx: { bgcolor: "#24282c", color: "#fff", border: "1px solid #495057", borderRadius: 3 } }}>
    <DialogTitle className="text-white" sx={{ color: "#fff !important" }} id={`factor-dialog-title-${productId}`}>Cambiar factor de utilidad</DialogTitle>
    <DialogContent>
    {product && <p className="fw-semibold mb-3 text-white">{product.name || product.sku}</p>}
    {loading ? <small role="status">Cargando costo de compra…</small> : <>
      {error && <div role="alert" className="text-danger small mb-2">{error}</div>}
      {!product ? <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => setRevision(value => value + 1)}>Reintentar</button> : !validPurchaseCost(product.purchase_cost) ? <div className="small text-warning">Primero registra un costo de compra válido. <Link to={`edit/${productId}`}>Editar producto</Link></div> : <>
        <label htmlFor={`profit-factor-${productId}`} className="small mb-1">Factor de utilidad (%)</label>
        <input id={`profit-factor-${productId}`} className="form-control form-control-sm bg-secondary text-light" value={factor} onChange={event => setFactor(event.target.value)} disabled={saving} inputMode="decimal" autoFocus />
        <small className="d-block text-info mt-1">Porcentaje de aumento sobre el costo guardado. El precio final ya incluye IVA.</small>
        {preview ? <small className="d-block mt-2">Costo guardado: {money(product.purchase_cost)}<br />Nuevo precio: <strong>{money(preview.price)}</strong><br />Base sin IVA: ${preview.base_price.toFixed(6)}</small> : <small className="d-block text-warning mt-1">{validation}</small>}
      </>}
    </>}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
      <button type="button" className="btn btn-sm btn-success" onClick={save} disabled={!preview || loading || saving}>{saving ? "Guardando…" : "Guardar factor"}</button>
      <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose} disabled={saving}>Cancelar</button>
    </DialogActions>
  </Dialog>;
}

export default function ProductProfitFactorCell({ product, onSaved }) {
  const [editing, setEditing] = useState(false);
  return <><div className="d-flex align-items-center gap-2">
    <span>{hasProfitFactor(product) ? `${Number(product.profit_factor).toLocaleString("es-MX", { maximumFractionDigits: 4 })}%` : "Sin factor"}</span>
    <button type="button" className="btn btn-sm btn-outline-info" title="Cambiar factor de utilidad" aria-label={`Cambiar factor de utilidad de ${product.name || product.sku || product.id}`} onClick={() => setEditing(true)}><EditIcon fontSize="small" /></button>
  </div>
    {editing && <FactorEditorDialog productId={product.id} onSaved={onSaved} onClose={() => setEditing(false)} />}
  </>;
}
