import React, { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
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

  const openEditor = () => {
    setDraft(factor === "" || factor == null ? "" : String(factor));
    setOpen(true);
  };

  return <div className="col-12 mb-3">
    <div className={`rounded-3 border p-3 ${byFactor ? "border-info" : "border-secondary"}`} style={{ background: byFactor ? "rgba(13,202,240,.08)" : "rgba(255,255,255,.025)" }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="form-check mb-0">
          <input id="product-price-by-factor" type="checkbox" className="form-check-input" checked={byFactor} disabled={disabled || (!available && !byFactor)} onChange={event => {
            setValue("price_mode", event.target.checked ? "factor" : "manual", { shouldDirty: true });
            setValue("factor_preview_enabled", event.target.checked);
            if (!event.target.checked) setOpen(false);
          }} />
          <label className="form-check-label fw-semibold" htmlFor="product-price-by-factor">Usar factor de utilidad</label>
          {byFactor && factor !== "" && factor != null && <span className="badge bg-info text-dark ms-2">{factor}%</span>}
        </div>
        <button type="button" className="btn btn-sm btn-outline-info" disabled={!byFactor || !available} onClick={openEditor}>Configurar factor</button>
      </div>
      {!available && !byFactor && <small className="d-block text-warning mt-2">Primero captura el costo de compra.</small>}
      {byFactor && (factor === "" || factor == null) && <small className="d-block text-info mt-2">Configura el factor para calcular el precio.</small>}
    </div>
    {byFactor && (!validPurchaseCost(cost) || iva === "") && <div className="text-warning mt-1">Completa el costo de compra y la tasa de IVA antes de guardar, o vuelve al precio manual.</div>}
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" aria-labelledby="profit-factor-title">
      <DialogTitle id="profit-factor-title">Precio por factor de utilidad</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">El factor es el porcentaje que aumentas al costo de compra para obtener el precio final, que ya incluye IVA. No es un multiplicador ni el porcentaje de margen sobre el precio de venta.</Typography>
          <Typography variant="body2">Por ejemplo: costo $100 + factor 45% = precio final $145. Con IVA de 16%, su base sin IVA es $125.</Typography>
          <TextField label="Factor de utilidad (%)" value={draft} onChange={event => setDraft(event.target.value)} inputProps={{ inputMode: "decimal" }} helperText="De 0 a 999999.9999; máximo cuatro decimales." autoFocus />
          {preview ? <Alert severity="info">Costo: {money(cost)}<br />Precio final: <strong>{money(preview.price)}</strong><br />Base sin IVA: ${preview.base_price.toFixed(6)}</Alert> : <Alert severity="warning">{error}</Alert>}
          <Typography variant="caption" color="text.secondary">Aplica al precio general. Los precios propios de variantes y almacenes se conservan. Este cálculo se aplica al guardar; los cambios futuros del costo no recalculan el precio automáticamente.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>Cancelar</Button><Button variant="contained" disabled={!preview || !available} onClick={apply}>Usar este factor</Button></DialogActions>
    </Dialog>
  </div>;
}
