import React, { useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FiDownload, FiUploadCloud } from "react-icons/fi";
import { saveAs } from "file-saver";
import axiosClient from "../../config/axiosClient";
import useBranchCatalogSettings from "../../hooks/useBranchCatalogSettings";
import { useTienda } from "../../context/TiendaContext";
import ImportFileDropZone from "../common/ImportFileDropZone";
import ImportResultSummary from "./ImportResultSummary";
import { normalizeImportResult } from "./importResult.mjs";

export default function VehicleImportPanel({ mode, branch, onImported, onBusy }) {
  const { tienda } = useTienda();
  const compatibility = mode === "vehicles";
  const [file, setFile] = useState(null);
  const [strategy, setStrategy] = useState("upsert");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
  const input = useRef(null);
  const locked = useRef(false);
  const allowed = Number(tienda?.id) === 566;
  const { settings, loading: settingsLoading, error: settingsError, retry: retrySettings } = useBranchCatalogSettings(branch?.id, allowed);
  const canWrite = Boolean(settings?.vehicle_feature_available && settings?.vehicle_compatibilities_enabled);
  const color = compatibility ? "#0f766e" : "#6d28d9";
  const selectFile = (files) => {
    setNotice(""); setResult(null); setFile(null);
    const next = files[0];
    if (input.current) input.current.value = "";
    if (files.length !== 1 || !next?.size || next.size > (compatibility ? 20 : 2) * 1024 * 1024 || !/\.(xlsx|xls|csv)$/i.test(next.name)) {
      setNotice(`Selecciona un solo archivo .xlsx, .xls o .csv no vacío de máximo ${compatibility ? 20 : 2} MB.`); return;
    }
    setFile(next);
  };
  const run = async (action) => {
    if (!allowed || !branch?.id || locked.current) return;
    locked.current = true; setBusy(true); onBusy(true); setNotice("");
    try { await action(); }
    catch (error) {
      let data = error.response?.data;
      if (data instanceof Blob) { try { data = JSON.parse(await data.text()); } catch { data = null; } }
      setNotice(data?.message || "No se pudo completar la operación. Revisa la conexión y el catálogo antes de reintentar.");
      if (data && !(data instanceof Blob)) setResult({ ...normalizeImportResult(data, true, compatibility ? "compatibilidades" : "productos"), date: new Date().toISOString(), mode, filename: file?.name || "", branch: branch?.name || String(branch?.id), entity: compatibility ? "compatibilidades" : "productos" });
    } finally { locked.current = false; setBusy(false); onBusy(false); }
  };
  const download = (exporting = false) => run(async () => {
    const url = exporting ? "/vehicle-compatibilities/export" : compatibility ? "/vehicle-compatibilities/import/template" : "/products/import-with-vehicles/template";
    const { data } = await axiosClient.get(url, { responseType: "blob", params: exporting ? { branch_id: branch.id } : undefined });
    saveAs(data, exporting ? "compatibilidades.xlsx" : compatibility ? "plantilla-compatibilidades.xlsx" : "plantilla-productos-vehiculos.xlsx");
  });
  const submit = () => {
    if (!file || !canWrite) return;
    setResult(null);
    run(async () => {
      const data = new FormData();
      data.append("archivo", file); data.append("branch_id", String(branch.id));
      if (compatibility) data.append("mode", strategy);
      const response = await axiosClient.post(compatibility ? "/vehicle-compatibilities/import" : "/products/import-with-vehicles", data);
      const payload = response.data;
      const normalized = compatibility ? { ...payload, resumen: { ...payload.resumen, total: payload.resumen?.total_filas, creados: payload.resumen?.compatibilidades_creadas, actualizados: payload.resumen?.compatibilidades_actualizadas }, errores_validacion: payload.errores_validacion?.map(e => ({ ...e, motivo: `${e.celda || e.columna || ""}: ${e.motivo}` })) } : payload;
      setResult({ ...normalizeImportResult(normalized, false, compatibility ? "compatibilidades" : "productos"), entity: compatibility ? "compatibilidades" : "productos", date: new Date().toISOString(), mode: compatibility ? strategy : "Productos y vehículos", filename: file.name, branch: branch.name || `#${branch.id}` });
      setFile(null); if (input.current) input.current.value = "";

      try { await onImported?.(); } catch { setNotice("La importación terminó, pero no se pudo actualizar la tabla. Recarga el catálogo."); }
    });
  };
  if (!allowed) return null;
  return <Stack spacing={2} sx={{ pt: 2 }}>
    <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{compatibility ? "Compatibilidades vehiculares" : "Productos y vehículos"}</Typography>
    <Typography variant="body2">Sucursal de destino: <strong>{branch?.name || `#${branch?.id || "—"}`}</strong></Typography>
    {settingsLoading && <Typography role="status">Consultando permisos de la sucursal…</Typography>}
    {settingsError && <Alert severity="error">{settingsError}<Button onClick={retrySettings}>Reintentar</Button></Alert>}
    {settings && !canWrite && <Alert severity="info">La administración vehicular está deshabilitada para esta sucursal. Puedes habilitarla en la configuración del catálogo de tu sitio web.</Alert>}
    {!branch?.id && <Alert severity="warning">Selecciona una sucursal para continuar.</Alert>}
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: compatibility ? "#f0fdfa" : "#f5f3ff" }}>
      <Typography variant="body2">{compatibility ? "Asocia marca, modelo y años a productos existentes mediante su SKU. No modifica precios ni existencias. Usa la primera hoja, encabezados en fila 2 y datos desde fila 3; máximo 10,000 filas." : "Importa productos y vehículos juntos en un solo archivo de hasta 2 MB. Excel: primera hoja Productos, título en fila 1, encabezados en fila 2 y datos desde fila 3. CSV: encabezados en fila 1 y datos desde fila 2. No repitas el SKU; guárdalo como texto para conservar ceros iniciales."}</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>{compatibility ? "Puedes repetir SKU para distintos vehículos o rangos. Años opcionales entre 1886 y 2200; el año final debe ser mayor o igual al inicial." : "A:K contiene SKU, nombre, costo, precio de venta, precio base, existencias, categorías, descripciones, IVA y visible. Los precios se toman directamente del archivo, sin calcular utilidad ni crear almacenes. Usa IVA como 0.16, visible 1/0 y separa categorías por coma; completa las descripciones requeridas."}</Typography>
      {!compatibility && <><Typography variant="body2" sx={{ mt: 1 }}>L:O contiene marca, modelo y años; P admite hasta 100 compatibilidades adicionales en JSON para el mismo producto. Marca y modelo son obligatorios si llenas algún dato vehicular. Años enteros de 1886 a 2200, inicial menor o igual al final; extremos vacíos significan sin límite.</Typography><Typography variant="body2" sx={{ mt: 1 }}>Para productos sin compatibilidades registradas deja L:P vacías. Al actualizar, omitir o dejar vacías las columnas vehiculares conserva las relaciones actuales. Reimportar las mismas relaciones no las duplica.</Typography><Typography variant="body2" sx={{ mt: 1 }}>Ejemplo de JSON en P (como texto en Excel; entrecomillado y escapado en CSV):</Typography><Box component="pre" sx={{ fontSize: 12, whiteSpace: "pre-wrap", overflowWrap: "anywhere", m: 0, mt: 1 }}>{JSON.stringify([{ vehicle_brand: "Nissan", vehicle_model: "V-Drive", year_from: 2021, year_to: 2025 }])}</Box></>}
      <Typography variant="body2" sx={{ mt: 1 }}>Reemplaza los ejemplos por tus datos y consulta la hoja Instrucciones antes de importar.</Typography>
      <Button disabled={busy || !branch?.id} onClick={() => download()} startIcon={<FiDownload />} sx={{ color, textTransform: "none" }}>Descargar plantilla Excel</Button>
      {compatibility && <Button disabled={busy || !branch?.id} onClick={() => download(true)} startIcon={<FiDownload />} sx={{ color, textTransform: "none" }}>Exportar compatibilidades de esta sucursal</Button>}
    </Box>
    {compatibility && <>
      <TextField select label="Modo de importación" value={strategy} disabled={busy} onChange={e => { setStrategy(e.target.value); setResult(null); }}>
        <MenuItem value="upsert">Agregar y omitir relaciones idénticas</MenuItem>
        <MenuItem value="replace">Reemplazar compatibilidades de los SKU incluidos</MenuItem>
      </TextField>
      {strategy === "replace" && <Alert severity="warning">Se reconstruirán las compatibilidades de cada SKU válido del archivo. Incluye todas las que deseas conservar. Si una fila del SKU es inválida, se conserva todo su grupo anterior.</Alert>}
    </>}
    <ImportFileDropZone disabled={busy} onFiles={selectFile} color={color}>
      <Box sx={{ p: 3, border: "2px dashed #cbd5e1", borderRadius: 3, textAlign: "center" }}>
        <FiUploadCloud size={32} color={color} />
        <Typography sx={{ my: 1, overflowWrap: "anywhere" }}>{file?.name || "Selecciona o arrastra tu archivo"}</Typography>
        <input ref={input} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => selectFile(Array.from(e.target.files || []))} />
        <Button disabled={busy} onClick={() => input.current?.click()} sx={{ color, textTransform: "none" }}>Seleccionar archivo</Button>
      </Box>
    </ImportFileDropZone>
    {notice && <Alert severity="warning">{notice}</Alert>}
    {result && <ImportResultSummary result={result} />}
    <Button variant="contained" disabled={busy || !file || !branch?.id || !canWrite} onClick={submit} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <FiUploadCloud />} sx={{ bgcolor: color, borderRadius: 2, textTransform: "none" }}>{busy ? "Procesando… Mantén esta ventana abierta" : compatibility ? "Importar compatibilidades" : "Importar productos y vehículos"}</Button>
  </Stack>;
}
