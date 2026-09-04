import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, LinearProgress, Step, StepLabel, Stepper, Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { serviceService } from "../../services/admin/serviceService";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";
import { ServiceBookingStep, ServiceFinalStep, ServiceGeneralStep, ServiceOperationStep, ServicePriceStep, ServiceResourcesStep } from "../../components/services/ServiceFormFields";

const INITIAL = {
  name: "", code: "", short_description: "", description: "", service_type: "general", base_price: "",
  duration_minutes: "", requires_booking: false, requires_resource: false, requires_address: false,
  is_home_service: false, requires_confirmation: false, requires_deposit: false, deposit_type: "fixed",
  deposit_value: "", billing_mode: "fixed", default_capacity: "", sat_product_code: "", sat_unit_code: "",
  tax_object: "02", iva_percentage: "16", price_override: "", capacity_override: "", is_active: true,
};
const numericOrEmpty = (value) => value == null ? "" : value;

export default function ServiceFormPage() {
  const theme = useTheme(); const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = useParams(); const isEdit = !!id; const navigate = useNavigate(); const location = useLocation(); const [params] = useSearchParams();
  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();
  const branchFromNav = location.state?.branch; const branchId = Number(branchFromNav?.id || selectedBranch?.id || params.get("branch_id") || 0); const branch = branchFromNav || selectedBranch || (branchId ? { id: branchId } : null);
  const [form, setForm] = useState(INITIAL); const [existingImages, setExistingImages] = useState([]); const [files, setFiles] = useState([]); const [deletedIds, setDeletedIds] = useState([]); const [primaryImageId, setPrimaryImageId] = useState(null); const [primaryNewIndex, setPrimaryNewIndex] = useState(null); const [activeStep, setActiveStep] = useState(0); const [saveAndSchedule, setSaveAndSchedule] = useState(false);
  const [loading, setLoading] = useState(isEdit); const [saving, setSaving] = useState(false); const [errors, setErrors] = useState({}); const [loadError, setLoadError] = useState("");
  const listUrl = `/admin/services?branch_id=${branchId}`;

  useEffect(() => { setHideLayout(false); if (branchFromNav?.id) setSelectedBranch(branchFromNav); }, [branchFromNav, setHideLayout, setSelectedBranch]);
  useEffect(() => { if (!branchId) navigate("/admin/sucursales", { replace: true }); }, [branchId, navigate]);
  useEffect(() => {
    if (!isEdit || !branchId) return;
    let active = true; setLoading(true);
    serviceService.get(branchId, id).then(({ data }) => { if (!active) return; const s = data.service || {}; const config = data.branch_config || {}; setForm({ ...INITIAL, ...s, duration_minutes: numericOrEmpty(s.duration_minutes), deposit_value: numericOrEmpty(s.deposit_value), default_capacity: numericOrEmpty(s.default_capacity), iva_percentage: numericOrEmpty(s.iva_percentage), price_override: numericOrEmpty(config.price_override), capacity_override: numericOrEmpty(config.capacity_override) }); setExistingImages(s.images || []); setPrimaryImageId((s.images || []).find((img) => img.is_primary)?.id || null); }).catch((err) => { if (active) setLoadError(err?.response?.data?.message || "No se pudo cargar el servicio."); }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [branchId, id, isEdit]);

  const setField = (key) => (event) => setForm((prev) => {
    const value = event.target.value;
    if (key === "service_type" && value === "onsite") return { ...prev, service_type: value, requires_address: true, is_home_service: true };
    return { ...prev, [key]: value };
  });
  const setChecked = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.checked }));
  const toggleDelete = (imageId) => setDeletedIds((prev) => prev.includes(imageId) ? prev.filter((value) => value !== imageId) : [...prev, imageId]);
  const validationForStep = (step) => {
    const next = {};
    if (step === 0) { if (!form.name.trim()) next.name = "El nombre es obligatorio."; if (!form.service_type) next.service_type = "Selecciona un tipo de servicio."; }
    if (step === 1) { if (form.base_price === "" || Number(form.base_price) < 0) next.base_price = "Ingresa un precio igual o mayor a cero."; if (form.requires_deposit && !form.deposit_type) next.deposit_type = "Selecciona el tipo de anticipo."; if (form.requires_deposit && (form.deposit_value === "" || Number(form.deposit_value) < 0)) next.deposit_value = "Captura el valor del anticipo."; if (form.requires_deposit && form.deposit_type === "percentage" && Number(form.deposit_value) > 100) next.deposit_value = "El porcentaje debe estar entre 0 y 100."; }
    if (step === 2) { [["duration_minutes", "La duración debe ser mayor a cero."], ["default_capacity", "La capacidad debe ser mayor a cero."], ["capacity_override", "La capacidad debe ser mayor a cero."]].forEach(([key, message]) => { if (form[key] !== "" && Number(form[key]) <= 0) next[key] = message; }); }
    if (step === 5 && (Number(form.iva_percentage) < 0 || Number(form.iva_percentage) > 100)) next.iva_percentage = "El IVA debe estar entre 0 y 100.";
    return next;
  };
  const validateStep = (step) => { const next = validationForStep(step); setErrors(next); return Object.keys(next).length === 0; };
  const goNext = () => { if (validateStep(activeStep)) setActiveStep((value) => Math.min(value + 1, 5)); };
  const submit = async (event) => {
    event.preventDefault(); const allErrors = [0, 1, 2, 5].reduce((result, step) => ({ ...result, ...validationForStep(step) }), {}); setErrors(allErrors); if (Object.keys(allErrors).length) { const first = [0, 1, 2, 5].find((step) => Object.keys(validationForStep(step)).length); setActiveStep(first ?? 0); return; } setSaving(true);
    try { const payload = { ...form, images: files, delete_image_ids: deletedIds, ...(primaryImageId && !deletedIds.includes(primaryImageId) ? { primary_image_id: primaryImageId } : {}), ...(!isEdit && files.length ? { primary_image_index: primaryNewIndex ?? 0 } : {}) }; const { data } = isEdit ? await serviceService.update(branchId, id, payload) : await serviceService.create(branchId, payload); await showSuccess(data?.message || (isEdit ? "Servicio actualizado correctamente." : "Servicio creado correctamente.")); navigate(listUrl, { state: { branch, configureSchedule: saveAndSchedule && form.requires_booking } }); }
    catch (err) { const apiErrors = err?.response?.data?.errors || {}; setErrors(Object.fromEntries(Object.entries(apiErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))); alertFromAxiosError(err, "No se pudo guardar el servicio"); }
    finally { setSaving(false); }
  };

  if (loading) return <Stack alignItems="center" py={10}><CircularProgress /></Stack>;
  const steps = ["Información general", "Precio y cobro", "Operación", "Reservaciones", "Recursos", "Fiscal y publicación"];
  const removeNewImage = (index) => { setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); setPrimaryNewIndex((current) => current === index ? null : current > index ? current - 1 : current); };
  const imageProps = { existingImages, deletedIds, files, primaryImageId, primaryNewIndex, onFiles: (next) => { setFiles(next); if (next.length && primaryNewIndex == null && !primaryImageId) setPrimaryNewIndex(0); }, onToggleDelete: toggleDelete, onPrimaryExisting: (imageId) => { setPrimaryImageId(imageId); setPrimaryNewIndex(null); }, onPrimaryNew: (index) => { setPrimaryNewIndex(index); setPrimaryImageId(null); }, onRemoveNew: removeNewImage };
  const stepContent = [<ServiceGeneralStep form={form} setField={setField} errors={errors} imageProps={imageProps} />, <ServicePriceStep form={form} setField={setField} setChecked={setChecked} errors={errors} />, <ServiceOperationStep form={form} setField={setField} setChecked={setChecked} errors={errors} />, <ServiceBookingStep form={form} setChecked={setChecked} />, <ServiceResourcesStep form={form} />, <ServiceFinalStep form={form} setField={setField} setChecked={setChecked} errors={errors} branch={branch} imageCount={existingImages.filter((image) => !deletedIds.includes(image.id)).length + files.length} />];

  return <Box component="form" onSubmit={submit} sx={{ maxWidth: 1100, mx: "auto", p: { xs: 1, sm: 2 }, borderRadius: 4, bgcolor: "#f7f7f5" }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5} mb={2} sx={{ bgcolor: "#fff", border: "1px solid rgba(0,0,0,.08)", borderLeft: "6px solid #f9b233", borderRadius: 3, p: { xs: 2, sm: 2.5 } }}>
      <Box><Typography variant="h4" fontWeight={900}>{isEdit ? "✏️ Editar Servicio" : "📝 Crear Servicio"}</Typography><Typography color="text.secondary">Sucursal: {branch?.name || `#${branchId}`}</Typography></Box>
      <Button className="service-back-button" variant="contained" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(listUrl, { state: { branch } })} sx={{ alignSelf: { xs: "stretch", sm: "center" }, bgcolor: "#1976d2", color: "#fff", fontWeight: 900, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#1565c0" } }}>Volver a servicios</Button>
    </Stack>
    {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
    <Card
      sx={{
        borderRadius: { xs: 2, md: 4 },
        p: { xs: 2, sm: 3, md: 4 },
        background: "#fff",
        color: "#000",
        boxShadow: "0 12px 32px rgba(0,0,0,.10)",
        border: "1px solid rgba(0,0,0,.08)",
        "& .MuiInputLabel-root, & .MuiFormLabel-root": {
          color: "#000",
        },
        "& .MuiInputLabel-root.Mui-focused, & .MuiFormLabel-root.Mui-focused": {
          color: "#000",
        },
        "& .MuiInputBase-root": {
          backgroundColor: "#fff",
          borderRadius: 2,
        },
        "& .MuiInputBase-input, & .MuiSelect-select": {
          color: "#000",
        },
        "& .MuiInputBase-input::placeholder": {
          color: "rgba(0,0,0,.55)",
          opacity: 1,
        },
        "& .MuiFormHelperText-root": {
          color: "rgba(0,0,0,.65)",
        },
        "& .MuiFormHelperText-root.Mui-error": {
          color: "#ff8a80",
        },
        "& .MuiFormControlLabel-label": {
          color: "#000",
        },
        "& .MuiAlert-root": {
          color: "#000",
          bgcolor: "rgba(249,178,51,.10)",
          border: "1px solid rgba(249,178,51,.25)",
        },
        "& .MuiAlert-message, & .MuiAlert-icon": {
          color: "#000",
        },
        "& .MuiChip-label": {
          color: "#000",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(0,0,0,.18)",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#000",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#f9b233",
        },
        "& .MuiSvgIcon-root": {
          color: "#000",
        },
        "& .MuiTypography-root": { color: "#000" },
        "& .MuiCard-root, & .MuiPaper-root": { backgroundColor: "#fff", color: "#000", borderColor: "rgba(0,0,0,.10)" },
        "& .MuiButton-contained:not(.service-back-button)": { backgroundColor: "#000", color: "#fff", fontWeight: 900, "&:hover": { backgroundColor: "rgba(0,0,0,.85)" } },
      }}
    >
      {mobile ? <Box mb={3}><Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}><Typography variant="overline" sx={{ color: "#b97400", fontWeight: 900 }}>Paso {activeStep + 1} de {steps.length}</Typography><Typography variant="body2" sx={{ color: "#52525b" }}>{steps[activeStep]}</Typography></Stack><LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ height: 7, borderRadius: 10, bgcolor: "rgba(249,178,51,.18)", "& .MuiLinearProgress-bar": { bgcolor: "#f9b233", borderRadius: 10 } }} /></Box> : <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5, p: 2, borderRadius: 3, bgcolor: "rgba(249,178,51,.06)", "& .MuiStepConnector-line": { borderColor: "rgba(0,0,0,.18)" }, "& .MuiStepLabel-label": { color: "#71717a !important", mt: 1, fontWeight: 700 }, "& .Mui-active .MuiStepLabel-label, & .Mui-completed .MuiStepLabel-label": { color: "#000 !important", fontWeight: "900 !important" }, "& .MuiStepIcon-root": { color: "#d4d4d8" }, "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: "#f9b233" }, "& .MuiStepIcon-text": { fill: "#000", fontWeight: 900 } }}>{steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>}
      <Typography variant={mobile ? "h5" : "h4"} sx={{ color: "#000", borderBottom: "3px solid #f9b233", pb: 1, display: "inline-block" }} fontWeight={900} mb={3}>{steps[activeStep]}</Typography>
      {stepContent[activeStep]}
      <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="space-between" spacing={1.5} mt={4} p={2} sx={{ border: "1px solid rgba(0,0,0,.08)", position: "sticky", bottom: 8, bgcolor: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", zIndex: 5, borderRadius: 3, boxShadow: "0 8px 30px rgba(0,0,0,.10)" }}>
        <Button variant="outlined" color="inherit" onClick={() => navigate(listUrl, { state: { branch } })} disabled={saving}>Cancelar</Button>
        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1}>
          {activeStep > 0 && <Button variant="outlined" color="inherit" onClick={() => { setErrors({}); setActiveStep((value) => value - 1); }} disabled={saving}>Atrás</Button>}
          {activeStep < steps.length - 1 ? <Button variant="contained" onClick={goNext}>Siguiente</Button> : <><Button type="submit" variant="contained" color="success" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />} disabled={saving || !!loadError}>{saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear servicio"}</Button>{form.requires_booking && <Button type="submit" variant="outlined" color="warning" onClick={() => setSaveAndSchedule(true)} disabled={saving}>Guardar y configurar agenda</Button>}</>}
        </Stack>
      </Stack>
    </Card>
  </Box>;
}
