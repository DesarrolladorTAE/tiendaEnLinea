import React, { useEffect, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { calculateProfitPrice, validPurchaseCost } from "../../../utils/productProfitFactor";

const money = value => Number(value).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function ProfitFactorControl({ watch, setValue, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const cost = watch("costo_compra");
  const iva = watch("iva");
  const factor = watch("profit_factor");
  const byFactor = watch("price_mode") === "factor";
  const previewEnabled = watch("factor_preview_enabled") === true;
  const available = validPurchaseCost(cost) && !disabled;
  const highlighted = byFactor || open;
  let preview, error;
  try { preview = calculateProfitPrice(cost, draft, iva); } catch (err) { error = err.message; }

  // This is only a preview; saving always uses the server's confirmed values.
  useEffect(() => {
    if (!byFactor || !previewEnabled) return;
    try {
      const result = calculateProfitPrice(cost, factor, iva);
      setValue("price", result.price.toFixed(2), { shouldDirty: true });
      setValue("base_price", result.base_price.toFixed(6), { shouldDirty: true });
    } catch { /* Keep the last preview; submit validates again. */ }
  }, [byFactor, previewEnabled, cost, factor, iva, setValue]);

  const apply = () => {
    if (!preview || !available) return;
    setValue("profit_factor", String(preview.profit_factor), { shouldDirty: true });
    setValue("price_mode", "factor", { shouldDirty: true });
    setValue("factor_preview_enabled", true);
    setOpen(false);
  };

  const openEditor = (value = factor) => {
    setDraft(value == null ? "" : String(value));
    setOpen(true);
  };

  return <div className="col-12 mb-3">
    <div className={`rounded-3 border p-3 ${highlighted ? "border-info" : "border-secondary"}`} style={{ background: highlighted ? "rgba(13,202,240,.08)" : "rgba(255,255,255,.025)" }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="form-check mb-0">
          <input id="product-price-by-factor" type="checkbox" className="form-check-input" checked={byFactor} disabled={disabled || (!available && !byFactor)} onChange={event => {
            if (event.target.checked && Number(factor ?? 0) === 0) {
              openEditor("");
              return;
            }
            setValue("price_mode", event.target.checked ? "factor" : "manual", { shouldDirty: true });
            setValue("factor_preview_enabled", event.target.checked);
            if (!event.target.checked) setOpen(false);
          }} />
          <label className="form-check-label fw-semibold" htmlFor="product-price-by-factor">Usar factor de utilidad</label>
          {byFactor && factor !== "" && factor != null && <span className="badge bg-info text-dark ms-2">{factor}%</span>}
        </div>
        <button type="button" className="btn btn-sm btn-outline-info" disabled={!byFactor || !available} onClick={() => openEditor()}>Configurar factor</button>
      </div>
      {byFactor && <small className="d-block text-info mt-2">Al guardar se aplicará este factor al producto, sus variantes y cada almacén usando su propio costo. Los precios por almacén son estimados hasta guardar; las existencias no cambian.</small>}
      {!available && !byFactor && <small className="d-block text-warning mt-2">Primero captura el costo de compra.</small>}
      {byFactor && (factor === "" || factor == null) && <small className="d-block text-info mt-2">Configura el factor para calcular el precio.</small>}
    </div>
    {byFactor && previewEnabled && (!validPurchaseCost(cost) || iva === "") && <div className="text-warning mt-1">Completa el costo de compra y la tasa de IVA para calcular el precio.</div>}
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" aria-labelledby="profit-factor-title" PaperProps={{ sx: { bgcolor: "#24282c", color: "#fff", border: "1px solid #495057", borderRadius: 3 } }}>
      <DialogTitle className="text-white" sx={{ color: "#fff !important" }} id="profit-factor-title">Cambiar factor de utilidad</DialogTitle>
      <DialogContent>
        {watch("name") && <p className="fw-semibold mb-3 text-white">{watch("name")}</p>}
        <label htmlFor="product-form-profit-factor" className="small mb-1">Factor de utilidad (%)</label>
        <input id="product-form-profit-factor" className="form-control form-control-sm bg-secondary text-light" value={draft} onChange={event => setDraft(event.target.value)} inputMode="decimal" aria-describedby="product-form-profit-factor-help" autoFocus />
        <small id="product-form-profit-factor-help" className="d-block text-info mt-1">Porcentaje de aumento sobre el costo de compra. El precio final ya incluye IVA.</small>
        {preview ? (
          <small className="d-block mt-2">Costo de compra: {money(cost)}<br />Nuevo precio: <strong>{money(preview.price)}</strong><br />Base sin IVA: ${preview.base_price.toFixed(6)}</small>
        ) : draft.trim() && (
          <small className="d-block text-warning mt-1" role="alert">{error}</small>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <button type="button" className="btn btn-sm btn-success" disabled={!preview || !available} onClick={apply}>Usar este factor</button>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setOpen(false)}>Cancelar</button>
      </DialogActions>
    </Dialog>
  </div>;
}
