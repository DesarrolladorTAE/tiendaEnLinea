import React, { useEffect, useState } from "react";
import { useTienda } from "../../context/TiendaContext";
import useBranchCatalogSettings from "../../hooks/useBranchCatalogSettings";
import AccordionSection from "../admin/productForm/AccordionSection";
import axiosClient from "../../config/axiosClient";

function VehicleRow({ row, index, branchId, brands, update, remove }) {
  const [models, setModels] = useState([]);
  const brand = brands.find(b => b.name === row.vehicle_brand);
  useEffect(() => {
    setModels([]);
    if (!brand?.id) return;
    const controller = new AbortController();
    axiosClient.get("/vehicle-models", { params: { branch_id: branchId, brand_id: brand.id }, signal: controller.signal }).then(({ data }) => { if (!controller.signal.aborted) setModels(data.data || []); }).catch(() => {});
    return () => controller.abort();
  }, [brand?.id, branchId]);
  return <div className="border border-secondary rounded p-3 mb-3">
    <div className="row g-3">
      <div className="col-md-6"><label className="form-label" htmlFor={`vehicle-brand-${index}`}>Marca</label><input id={`vehicle-brand-${index}`} className="form-control" maxLength={120} aria-required="true" list="vehicle-brand-options" value={row.vehicle_brand || ""} onChange={e => update({ vehicle_brand: e.target.value, vehicle_model: "", year_from: null, year_to: null })} /></div>
      <div className="col-md-6"><label className="form-label" htmlFor={`vehicle-model-${index}`}>Modelo</label><input id={`vehicle-model-${index}`} className="form-control" maxLength={120} aria-required="true" list={`vehicle-model-options-${index}`} value={row.vehicle_model || ""} onChange={e => update({ vehicle_model: e.target.value, year_from: null, year_to: null })} /><datalist id={`vehicle-model-options-${index}`}>{models.map(m => <option key={m.id} value={m.name} />)}</datalist></div>
      {[['year_from', 'Año inicial'], ['year_to', 'Año final']].map(([key, label]) => <div className="col-md-6" key={key}><label className="form-label" htmlFor={`vehicle-${key}-${index}`}>{label} (opcional)</label><input className="form-control" id={`vehicle-${key}-${index}`} type="number" step="any" value={row[key] ?? ""} onChange={e => update({ [key]: e.target.value === "" ? null : e.target.value })} /></div>)}
    </div><button className="btn btn-outline-danger btn-sm mt-3" type="button" onClick={remove}>Quitar vehículo {index + 1}</button>
  </div>;
}
export default function VehicleCompatibilitySection({ branchId, watch, setValue, isEdit }) {
  const { tienda } = useTienda();
  const allowed = Number(tienda?.id) === 566;
  const { settings, loading, error, retry } = useBranchCatalogSettings(branchId, allowed);
  const rows = watch("vehicle_compatibilities");
  const [brands, setBrands] = useState([]);
  const canEdit = Boolean(settings?.vehicle_feature_available && settings?.vehicle_compatibilities_enabled);
  useEffect(() => {
    setBrands([]);
    if (!canEdit) return;
    const controller = new AbortController();
    axiosClient.get("/vehicle-brands", { params: { branch_id: branchId }, signal: controller.signal }).then(({ data }) => { if (!controller.signal.aborted) setBrands(data.data || []); }).catch(() => {});
    return () => controller.abort();
  }, [canEdit, branchId]);
  if (!allowed) return null;
  if (error) return <div className="alert alert-warning">{error} <button type="button" className="btn btn-sm btn-outline-dark" onClick={retry}>Reintentar</button></div>;
  if (loading || !canEdit) return null;
  const change = value => setValue("vehicle_compatibilities", value, { shouldDirty: true });
  return <AccordionSection title="🚘 Vehículos (opcional)">
    <p>Registra los vehículos compatibles. Puedes elegir una marca o modelo existente o escribir uno nuevo. Un año vacío deja ese extremo sin límite.</p>
    <datalist id="vehicle-brand-options">{brands.map(b => <option key={b.id} value={b.name} />)}</datalist>
    {isEdit && !Array.isArray(rows) ? <div className="alert alert-warning">Las compatibilidades todavía no están disponibles. Vuelve a cargar el producto antes de editarlas.</div> : <>
      {!(rows || []).length && <p className="text-info">Sin compatibilidades registradas</p>}
      {(rows || []).map((row, index) => <VehicleRow key={index} row={row} index={index} branchId={branchId} brands={brands} update={patch => change(rows.map((r, i) => i === index ? { ...r, ...patch } : r))} remove={() => change(rows.filter((_, i) => i !== index))} />)}
      <button type="button" className="btn btn-outline-info" disabled={(rows || []).length >= 100} onClick={() => change([...(rows || []), { vehicle_brand: "", vehicle_model: "", year_from: null, year_to: null }])}>Agregar vehículo</button>
      <small className="d-block mt-2">Máximo 100. Quitar todos y guardar elimina las compatibilidades; no significa que el producto sea universal.</small>
    </>}
  </AccordionSection>;
}
