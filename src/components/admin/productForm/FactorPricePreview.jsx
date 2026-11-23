import React from "react";
import { calculateProfitPrice } from "../../../utils/productProfitFactor";

export default function FactorPricePreview({ cost, fallbackCost, fallbackLabel = "producto", factor, iva }) {
  const usesFallback = cost == null || String(cost).trim() === "";
  const chosenCost = usesFallback ? fallbackCost : cost;
  let result;
  try { result = calculateProfitPrice(chosenCost, factor, iva); } catch { result = null; }
  return <div className="mt-2 p-2 border border-info rounded" aria-live="polite" style={{ background: "rgba(13,202,240,.08)" }}>
    <small className="d-block text-info fw-bold">Precio estimado al guardar con factor {factor == null || factor === "" ? "--" : factor}%</small>
    {result ? <strong className="text-white">${result.price.toFixed(2)}</strong> : <small className="text-warning">Completa un costo y factor válidos para calcular.</small>}
    {usesFallback && <small className="d-block text-light">Usa el costo de {fallbackLabel} como respaldo.</small>}
    <small className="d-block text-light">El servidor confirmará el precio al guardar; las existencias no cambian.</small>
  </div>;
}
