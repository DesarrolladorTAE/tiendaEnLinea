import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress, MenuItem, Stack, Step, StepLabel, Stepper, TextField, Typography } from "@mui/material";
import { FiUploadCloud, FiTrash2 } from "react-icons/fi";
import axiosClient from "../../config/axiosClient";
import { useTienda } from "../../context/TiendaContext";
import ImportFileDropZone from "../common/ImportFileDropZone";

const COLUMNS = ["Proveedor", "Clave proveedor / SKU", "Número OE", "Nombre del producto", "Costo de compra con IVA incluido", "IVA (16, 16% o 0.16)", "Factor de utilidad (45 o 45%)", "Existencias Guerrero", "Existencias Yucatán", "Existencias Quintana Roo", "Visible (si/no)", "Descripción completa", "Clave producto SAT", "Clave unidad SAT", "Categoría", "Subcategoría"];
const RULES = [
  "Proveedores, categorías, subcategorías y los tres almacenes se crean si no existen.",
  "La columna B se guarda como SKU y clave del proveedor; C se conserva como número OE.",
  "Costo 100 con utilidad 45 genera precio final 145; el IVA no se agrega nuevamente.",
  "Un SKU existente en la sucursal se actualiza.",
  "Las existencias se reemplazan, no se suman.",
  "Las categorías se reemplazan por las indicadas en O/P.",
  "No se admiten productos con variantes.",
  "Un error cancela toda la importación.",
  "Las claves con ceros iniciales deben guardarse como texto en Excel.",
];

export default function AdvancedProductsModal({ mode, branch, onClose, onChanged, onBack }) {
  const importing = mode === "excel";
  const { tienda } = useTienda();
  const [branches, setBranches] = useState(branch?.id ? [branch] : []);
  const [branchId, setBranchId] = useState(branch?.id ? String(branch.id) : "");
  const [branchError, setBranchError] = useState("");
  const [file, setFile] = useState(null);
  const [scope, setScope] = useState("branch");
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [refreshWarning, setRefreshWarning] = useState("");
  const submitting = useRef(false);
  const input = useRef(null);
  const color = importing ? "#6d28d9" : "#b91c1c";
  const target = scope === "store" ? "toda la tienda (todas las sucursales)" : `la sucursal ${branch?.name || `#${branch?.id}`}`;

  useEffect(() => {
    if (!importing || !tienda?.id) return;
    let current = true;
    axiosClient.get("/branches", { params: { store_id: tienda.id } }).then(({ data }) => {
      if (!current) return;
      const rows = Array.isArray(data?.data) ? data.data : [];
      setBranches(branch?.id && !rows.some(b => String(b.id) === String(branch.id)) ? [branch, ...rows] : rows);
    }).catch(() => { if (current) setBranchError("No se pudieron cargar las sucursales. Puedes usar la sucursal activa o cerrar y reintentar."); });
    return () => { current = false; };
  }, [importing, tienda?.id, branch]);

  const selectFile = (files) => {
    setError(null);
    setFile(null);
    if (files.length !== 1) { setError({ message: "Selecciona un solo archivo Excel." }); return; }
    const next = files[0];
    if (!/\.(xlsx|xls)$/i.test(next.name) || !next.size || next.size > 20 * 1024 * 1024) {
      setError({ message: "Selecciona un archivo .xlsx o .xls no vacío de máximo 20 MB." });
      return;
    }
    setFile(next);
  };

  const submit = async () => {
    if (submitting.current || result) return;
    if (importing ? !file || !branchId : step !== 2 || !accepted || confirmation !== "ELIMINAR" || (scope === "branch" && !branch?.id)) return;
    submitting.current = true;
    setBusy(true); setError(null); setProgress(null); setPhase(importing ? "Subiendo archivo..." : "Eliminando productos...");
    try {
      let response;
      if (importing) {
        const data = new FormData();
        data.append("archivo", file);
        data.append("branch_id", branchId);
        response = await axiosClient.post("/productos/importar-excel", data, {
          onUploadProgress: ({ loaded, total }) => {
            if (total > 0) {
              setProgress(Math.min(100, Math.round(loaded / total * 100)));
              if (loaded >= total) setPhase("Procesando productos...");
            }
          },
        });
      } else {
        response = await axiosClient.delete("/productos/eliminar-todos", scope === "branch" ? { params: { branch_id: branch.id } } : {});
      }
      setResult(response.data);
      setPhase("Actualizando catálogo e inventarios...");
      try { await onChanged(); } catch { setRefreshWarning("La operación terminó, pero no se pudo actualizar el listado. Recarga la página para consultar los datos actuales."); }
    } catch (err) {
      setError(err.response?.data || { message: "No se pudo confirmar el resultado. Revisa la conexión y el catálogo antes de reintentar." });
    } finally { submitting.current = false; setBusy(false); }
  };

  return (
    <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="sm" aria-labelledby="advanced-products-title" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#fff", color: "#172033" } }}>
      <DialogTitle id="advanced-products-title" sx={{ p: 3, background: "linear-gradient(120deg, #ede9fe, #ccfbf1)" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: "flex", p: 1.5, borderRadius: 3, bgcolor: "white", color }}>{importing ? <FiUploadCloud size={28} /> : <FiTrash2 size={28} />}</Box>
          <Box><Typography component="span" sx={{ display: "block", fontSize: 23, fontWeight: 800 }}>{importing ? "Importar Excel" : "Eliminar todos los productos"}</Typography><Typography variant="body2">{importing ? "Carga tu catálogo desde Excel." : "Revisa y confirma cada paso antes de eliminar."}</Typography></Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {busy ? <Box sx={{ py: 3, textAlign: "center" }} aria-busy="true">
          <Box sx={{ position: "relative", width: 152, height: 152, mx: "auto", my: 3 }}>
            <CircularProgress size={152} thickness={2.5} sx={{ color, position: "absolute", inset: 0 }} aria-label="Operación en proceso" />
            <Box component="img" src="/assets/logo1.png" alt="Mi Tienda en Línea MX" sx={{ position: "absolute", inset: "20%", width: "60%", height: "60%", objectFit: "contain" }} />
          </Box>
          <Typography role="status" aria-live="polite" sx={{ fontWeight: 750, color }}>{phase}{importing && phase.startsWith("Subiendo") && progress !== null ? ` ${progress}%` : ""}</Typography>
          <Typography variant="body2" sx={{ my: 2 }}>Mantén esta ventana abierta hasta que termine.</Typography>
          <LinearProgress sx={{ borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: color } }} />
        </Box> : result ? <Alert severity="success" sx={{ mt: 2 }}>
          <Typography>{result.message || (importing ? "Importación completada." : "Productos eliminados.")}</Typography>
          <Typography>{importing ? `Creados: ${result.result?.created ?? 0} · Actualizados: ${result.result?.updated ?? 0} · Total: ${result.result?.total ?? 0}` : `Cantidad eliminada: ${result.deleted ?? 0}`}</Typography>
        </Alert> : importing ? <>
          <TextField select required fullWidth label="Sucursal" value={branchId} onChange={e => setBranchId(e.target.value)} sx={{ mt: 2, mb: 2 }}>{branches.map(b => <MenuItem key={b.id} value={String(b.id)}>{b.name || `#${b.id}`}</MenuItem>)}</TextField>
          {branchError && <Alert severity="warning">{branchError}</Alert>}
          <Alert severity="info">Se importa la primera hoja: fila 1 con encabezados y productos desde la fila 2. Máximo 10,000 productos y 20 MB.</Alert>
          <Box component="details" sx={{ my: 2, p: 2, bgcolor: "#f5f3ff", borderRadius: 3 }}>
            <Typography component="summary" sx={{ cursor: "pointer", fontWeight: 750 }}>Guía de columnas y reglas de importación</Typography>
            <Box component="ol" sx={{ pl: 3, mt: 2, listStyleType: "upper-alpha" }}>{COLUMNS.map(c => <Typography component="li" variant="body2" key={c} sx={{ mb: 0.5 }}>{c}</Typography>)}</Box>
            <Box component="ul" sx={{ pl: 2 }}>{RULES.map(r => <Typography component="li" variant="body2" key={r} sx={{ mb: 1 }}>{r}</Typography>)}</Box>
          </Box>
          <ImportFileDropZone onFiles={selectFile} disabled={busy} color={color}>
            <Box sx={{ p: 3, border: "2px dashed #cbd5e1", borderRadius: 3, textAlign: "center" }}>
              <FiUploadCloud size={32} color={color} />
              <Typography sx={{ my: 1.5, overflowWrap: "anywhere" }}>{file?.name || "Selecciona o arrastra tu archivo Excel"}</Typography>
              <input ref={input} type="file" accept=".xlsx,.xls" hidden onChange={e => { selectFile(Array.from(e.target.files || [])); e.target.value = ""; }} />
              <Button onClick={() => input.current?.click()} variant="outlined" sx={{ color, borderColor: color, textTransform: "none" }}>Seleccionar archivo</Button>
            </Box>
          </ImportFileDropZone>
        </> : <>
          <Stepper activeStep={step} alternativeLabel sx={{ mt: 2, mb: 3 }}>{["Alcance", "Consecuencias", "Confirmación"].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
          {step === 0 && <TextField select fullWidth label="Alcance del borrado" value={scope} onChange={e => { setScope(e.target.value); setAccepted(false); setConfirmation(""); }}>
            <MenuItem value="branch" disabled={!branch?.id}>Sucursal activa: {branch?.name || `#${branch?.id}`}</MenuItem><MenuItem value="store">Toda la tienda</MenuItem>
          </TextField>}
          <Alert severity="error" sx={{ my: 2 }}>Se borrarán definitivamente todos los productos de {target}. Esta acción no se puede deshacer.</Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>Los proveedores, categorías y almacenes permanecen. Los reabastecimientos asociados se eliminan por las reglas existentes.</Typography>
          {step === 1 && <FormControlLabel control={<Checkbox checked={accepted} onChange={e => setAccepted(e.target.checked)} />} label={`Entiendo y acepto el borrado definitivo de los productos de ${target} y sus reabastecimientos asociados.`} />}
          {step === 2 && <TextField fullWidth autoFocus label="Escribe ELIMINAR para confirmar" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" helperText={`Confirmación final: ${target}`} />}
        </>}
        {!busy && error && <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error.message || "No se pudo completar la operación."}
          {Object.entries(error.errors || {}).map(([key, messages]) => <Typography key={key} variant="body2" sx={{ overflowWrap: "anywhere" }}><strong>{key}:</strong> {(Array.isArray(messages) ? messages : [messages]).join(" · ")}</Typography>)}
        </Alert>}
        {!busy && refreshWarning && <Alert severity="warning" sx={{ mt: 2 }}>{refreshWarning}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button disabled={busy} onClick={onClose} sx={{ color: "#526077", textTransform: "none" }}>{result ? "Cerrar" : "Cancelar"}</Button>
        {importing && onBack && <Button disabled={busy} onClick={onBack} sx={{ color: "#526077", textTransform: "none" }}>Tipos de importación</Button>}
        {!importing && !result && step > 0 && <Button disabled={busy} onClick={() => { setStep(step - 1); setConfirmation(""); }}>Atrás</Button>}
        {!result && <Button variant="contained" disabled={busy || (importing ? !file || !branchId : step === 0 ? scope === "branch" && !branch?.id : step === 1 ? !accepted : confirmation !== "ELIMINAR")}
          onClick={() => !importing && step < 2 ? setStep(step + 1) : submit()} sx={{ bgcolor: color, "&:hover": { bgcolor: color }, borderRadius: 2, textTransform: "none", px: 3 }}>
          {busy ? "Procesando..." : importing ? "Importar" : step < 2 ? `Aceptar y continuar (${step + 1}/3)` : "Eliminar definitivamente (3/3)"}
        </Button>}
      </DialogActions>
    </Dialog>
  );
}
