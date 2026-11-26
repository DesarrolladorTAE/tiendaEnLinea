import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, LinearProgress, Step, StepLabel, Stepper, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import useServiceBranch from "../../hooks/useServiceBranch";
import useServiceSetupModules from "../../hooks/useServiceSetupModules";
import { serviceService } from "../../services/admin/serviceService";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";
import { ServiceBookingStep, ServiceFinalStep, ServiceGeneralStep, ServiceOperationStep, ServicePriceStep, ServiceResourcesStep } from "../../components/services/ServiceFormFields";

import ServiceTourSection from "../../components/tours/ServiceTourSection";
import ServiceBookingConfig from "../../components/services/ServiceBookingConfig";
import ServiceResourceAssociations from "../../components/services/ServiceResourceAssociations";
import ServiceFormAssociations from "../../components/services/ServiceFormAssociations";

const INITIAL = {
  name: "", code: "", short_description: "", description: "", service_type: "general", base_price: "",
  duration_minutes: "", requires_booking: false, requires_resource: false, requires_address: false,
  is_home_service: false, requires_confirmation: false, requires_deposit: false, deposit_type: "fixed",
  deposit_value: "", billing_mode: "fixed", default_capacity: "", sat_product_code: "", sat_unit_code: "",
  tax_object: "02", iva_percentage: "16", price_override: "", capacity_override: "", is_active: true,
};
const numericOrEmpty = (value) => value == null ? "" : value;

export default function ServiceFormPage() {
  const branch = useServiceBranch();
  const { id } = useParams();
  return <ServiceForm key={`${branch?.id}-${id ?? "new"}`} branch={branch} id={id} />;
}

function ServiceForm({ branch, id }) {
  const theme = useTheme(); const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = !!id; const navigate = useNavigate(); const location = useLocation(); const [params, setParams] = useSearchParams();
  const { setSelectedBranch, setHideLayout } = useAdminUi();
  const branchId = branch?.id;
  const modules = useServiceSetupModules(branchId);
  const saveLock = useRef(false);
  const alive = useRef(false);
  const [visited, setVisited] = useState({});
  const [storedType, setStoredType] = useState(null);
  const [storedDuration, setStoredDuration] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [storedVehicleRequirement, setStoredVehicleRequirement] = useState("none");
  const [form, setForm] = useState(() => ({ ...INITIAL, vehicle_requirement: "none", service_type: !isEdit && params.get("service_type") === "tour" ? "tour" : INITIAL.service_type })); const [existingImages, setExistingImages] = useState([]); const [files, setFiles] = useState([]); const [deletedIds, setDeletedIds] = useState([]); const [primaryImageId, setPrimaryImageId] = useState(null); const [primaryNewIndex, setPrimaryNewIndex] = useState(null); const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(isEdit); const [saving, setSaving] = useState(false); const [errors, setErrors] = useState({}); const [loadError, setLoadError] = useState("");
  const listUrl = `/admin/services?branch_id=${branchId}`;

  const canConfigure = isEdit && storedType && storedType !== "tour" && !loadError;
  const showVehicleRequirement = modules.vehicleRecords && form.service_type !== "tour";
  const requestedSection = params.get("section");
  const section = canConfigure && (
    requestedSection === "agenda" || requestedSection === "recursos" ||
    (requestedSection === "formularios" && modules.serviceForms)
  ) ? requestedSection : "general";
  const changeSection = (_, value) => {
    const next = new URLSearchParams(params);
    if (value === "general") next.delete("section");
    else next.set("section", value);
    next.set("branch_id", String(branchId));
    setParams(next);
  };
  useEffect(() => { setVisited((previous) => previous[section] ? previous : { ...previous, [section]: true }); }, [section]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { setHideLayout(false); if (branchId) setSelectedBranch(branch); }, [branchId, setHideLayout, setSelectedBranch]);
  useEffect(() => { if (!branchId) navigate("/admin/sucursales", { replace: true }); }, [branchId, navigate]);
  useEffect(() => {
    if (!isEdit || !branchId) return;
    const controller = new AbortController();
    setLoading(true);
    serviceService.get(branchId, id, controller.signal).then(({ data }) => {
      if (controller.signal.aborted) return;
      const service = data.service;
      const config = data.branch_config || {};
      const requirement = service.config?.vehicle_requirement ?? "none";
      const values = Object.fromEntries(Object.keys(INITIAL).map((key) => [key, service[key] ?? INITIAL[key]]));
      setForm({ ...values, vehicle_requirement: requirement, duration_minutes: numericOrEmpty(service.duration_minutes),
        deposit_value: numericOrEmpty(service.deposit_value), default_capacity: numericOrEmpty(service.default_capacity),
        iva_percentage: numericOrEmpty(service.iva_percentage), price_override: numericOrEmpty(config.price_override),
        capacity_override: numericOrEmpty(config.capacity_override) });
      setStoredType(service.service_type);
      setStoredDuration(service.duration_minutes);
      setStoredVehicleRequirement(requirement);
      if (Number(data.branch?.id) === Number(branchId)) setBranchName(data.branch.name);
      setExistingImages(service.images || []);
      setPrimaryImageId((service.images || []).find((image) => image.is_primary)?.id ?? null);
    }).catch((err) => {
      if (!controller.signal.aborted) setLoadError(err?.response?.data?.message || "No se pudo cargar el servicio.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [branchId, id, isEdit]);

  useEffect(() => { if (id && location.state?.configureTour) setActiveStep(5); }, [id, location.state?.configureTour]);

  const setField = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => {
      if (key === "service_type" && value === "onsite") return { ...prev, service_type: value, requires_address: true, is_home_service: true };
      return { ...prev, [key]: value };
    });
  };
  const setChecked = (key) => (event) => {
    const { checked } = event.target;
    setForm((prev) => ({ ...prev, [key]: checked }));
  };
  const toggleDelete = (imageId) => setDeletedIds((prev) => prev.includes(imageId) ? prev.filter((value) => value !== imageId) : [...prev, imageId]);
  const validationForStep = (step) => {
    const next = {};
    if (step === 0) {
      if (!form.name.trim()) next.name = "El nombre es obligatorio.";
      else if (form.name.length > 191) next.name = "El nombre admite hasta 191 caracteres.";
      if (form.code.length > 191) next.code = "El código admite hasta 191 caracteres.";
      if (!form.service_type || form.service_type.length > 40) next.service_type = "Selecciona un tipo de servicio válido.";
    }
    if (step === 1) { if (form.base_price === "" || Number(form.base_price) < 0) next.base_price = "Ingresa un precio igual o mayor a cero."; if (form.requires_deposit && !form.deposit_type) next.deposit_type = "Selecciona el tipo de anticipo."; if (form.requires_deposit && (form.deposit_value === "" || Number(form.deposit_value) < 0)) next.deposit_value = "Captura el valor del anticipo."; if (form.requires_deposit && form.deposit_type === "percentage" && Number(form.deposit_value) > 100) next.deposit_value = "El porcentaje debe estar entre 0 y 100."; }
    if (step === 2) { [["duration_minutes", "La duración debe ser un entero mayor a cero."], ["default_capacity", "La capacidad debe ser un entero mayor a cero."], ["capacity_override", "La capacidad debe ser un entero mayor a cero."]].forEach(([key, message]) => { if (form[key] !== "" && (!Number.isSafeInteger(Number(form[key])) || Number(form[key]) < 1)) next[key] = message; }); }
    if (step === (form.service_type === "tour" ? 6 : 5) && (Number(form.iva_percentage) < 0 || Number(form.iva_percentage) > 100)) next.iva_percentage = "El IVA debe estar entre 0 y 100.";
    return next;
  };
  const validateStep = (step) => { const next = validationForStep(step); setErrors(next); return Object.keys(next).length === 0; };
  const goNext = () => { if (validateStep(activeStep)) setActiveStep((value) => Math.min(value + 1, steps.length - 1)); };
  const submit = async (event) => {
    event.preventDefault();
    if (saveLock.current || loadError || !branchId) return;
    const tour = form.service_type === "tour";
    const validatedSteps = [0, 1, 2, tour ? 6 : 5];
    const allErrors = Object.assign({}, ...validatedSteps.map(validationForStep));
    setErrors(allErrors);
    if (Object.keys(allErrors).length) {
      setActiveStep(validatedSteps.find((step) => Object.keys(validationForStep(step)).length) ?? 0);
      return;
    }
    const openAgenda = !tour && event.nativeEvent.submitter?.value === "agenda";
    saveLock.current = true;
    setSaving(true);
    try {
      const { vehicle_requirement, ...general } = form;
      const requirement = tour && storedVehicleRequirement !== "none" ? "none" :
        showVehicleRequirement && vehicle_requirement !== storedVehicleRequirement ? vehicle_requirement : undefined;
      const payload = { ...general, vehicle_requirement: requirement, images: files, delete_image_ids: deletedIds,
        ...(!primaryNewIndex && primaryNewIndex !== 0 && primaryImageId && !deletedIds.includes(primaryImageId) ? { primary_image_id: primaryImageId } : {}),
        ...(!isEdit && files.length ? { primary_image_index: primaryNewIndex ?? 0 } : {}) };
      const { data } = isEdit ? await serviceService.update(branchId, id, payload) : await serviceService.create(branchId, payload);
      if (!alive.current) return;
      const savedId = data?.service?.id;
      if (!savedId && !isEdit) {
        navigate(listUrl, { replace: true, state: { branch } });
        void showSuccess("El servicio se guardó. Ábrelo desde el listado para continuar la configuración.");
        return;
      }
      if (openAgenda || !isEdit) {
        navigate(`/admin/services/edit/${savedId ?? id}?branch_id=${branchId}${openAgenda ? "&section=agenda" : ""}`,
          { replace: true, state: { branch, configureTour: tour } });
      } else if (tour) {
        navigate(listUrl, { state: { branch } });
      }
      if (isEdit && !tour) {
        const updated = data?.service;
        setStoredType(updated?.service_type ?? form.service_type);
        setStoredDuration(updated?.duration_minutes ?? numericOrEmpty(form.duration_minutes));
        setStoredVehicleRequirement(updated?.config?.vehicle_requirement ?? requirement ?? storedVehicleRequirement);
        if (Array.isArray(updated?.images)) {
          setExistingImages(updated.images);
          setPrimaryImageId(updated.images.find((image) => image.is_primary)?.id ?? null);
        }
        setFiles([]);
        setDeletedIds([]);
        setPrimaryNewIndex(null);
      }
      void showSuccess(data?.message || (isEdit ? "Servicio actualizado correctamente." : "Servicio creado correctamente."));
    } catch (err) {
      if (!alive.current) return;
      const apiErrors = err?.response?.data?.errors || {};
      setErrors(Object.fromEntries(Object.entries(apiErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
      if (apiErrors.vehicle_requirement) setActiveStep(2);
      void alertFromAxiosError(err, "No se pudo guardar el servicio");
    } finally {
      saveLock.current = false;
      if (alive.current) setSaving(false);
    }
  };

  if (loading) return <Stack alignItems="center" py={10}><CircularProgress /></Stack>;
  const steps = ["Información general", "Precio y cobro", "Operación", "Reservaciones", "Recursos", "Fiscal y publicación"];
  if (form.service_type === "tour") steps.splice(5, 0, "Rutas, salidas y paradas");
  const removeNewImage = (index) => { setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); setPrimaryNewIndex((current) => current === index ? null : current > index ? current - 1 : current); };
  const imageProps = { existingImages, deletedIds, files, primaryImageId, primaryNewIndex, onFiles: (next) => { setFiles(next); if (next.length && primaryNewIndex == null && !primaryImageId) setPrimaryNewIndex(0); }, onToggleDelete: toggleDelete, onPrimaryExisting: (imageId) => { setPrimaryImageId(imageId); setPrimaryNewIndex(null); }, onPrimaryNew: (index) => { setPrimaryNewIndex(index); setPrimaryImageId(null); }, onRemoveNew: removeNewImage };
  const stepContent = [<ServiceGeneralStep form={form} setField={setField} errors={errors} imageProps={imageProps} />, <ServicePriceStep form={form} setField={setField} setChecked={setChecked} errors={errors} />, <ServiceOperationStep form={form} setField={setField} setChecked={setChecked} errors={errors} showVehicleRequirement={showVehicleRequirement} />, <ServiceBookingStep form={form} setChecked={setChecked} />, <ServiceResourcesStep form={form} />, <ServiceFinalStep form={form} setField={setField} setChecked={setChecked} errors={errors} branch={branch} imageCount={existingImages.filter((image) => !deletedIds.includes(image.id)).length + files.length} />];

  if (form.service_type === "tour") stepContent.splice(5, 0, <Box><ServiceTourSection embedded key={`${branchId}-${id || "new"}`} branchId={branchId} serviceId={id} disabled={saving || !!loadError} />{!isEdit && <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={saving || !!loadError}>Guardar servicio y configurar tour</Button>}</Box>);

  return <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 1, sm: 2 }, borderRadius: 4, bgcolor: "#f7f7f5" }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5} mb={2} sx={{ bgcolor: "#fff", border: "1px solid rgba(0,0,0,.08)", borderLeft: "6px solid #f9b233", borderRadius: 3, p: { xs: 2, sm: 2.5 } }}>
      <Box><Typography variant="h4" fontWeight={900}>{isEdit ? "✏️ Editar Servicio" : "📝 Crear Servicio"}</Typography><Typography color="text.secondary">Sucursal: {branchName || branch?.name || `#${branchId}`}</Typography></Box>
      <Button className="service-back-button" variant="contained" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(listUrl, { state: { branch } })} sx={{ alignSelf: { xs: "stretch", sm: "center" }, bgcolor: "#1976d2", color: "#fff", fontWeight: 900, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#1565c0" } }}>Volver a servicios</Button>
    </Stack>
    {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
    {modules.error && <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={modules.retry}>Reintentar</Button>}>{modules.error}</Alert>}
    {canConfigure && <Tabs value={section} onChange={changeSection} variant="scrollable" scrollButtons="auto" aria-label="Configuración del servicio" sx={{ mb: 2 }}>
      <Tab label="General" value="general" disabled={saving} />
      <Tab label="Agenda" value="agenda" disabled={saving} />
      <Tab label="Recursos" value="recursos" disabled={saving} />
      {modules.serviceForms && <Tab label="Formularios" value="formularios" disabled={saving} />}
    </Tabs>}
    {canConfigure && <Card sx={{ p: { xs: 2, md: 3 } }} hidden={section === "general"}>
      {(section === "agenda" || visited.agenda) && <Box hidden={section !== "agenda"}><ServiceBookingConfig branchId={branchId} serviceId={id} duration={storedDuration} active={section === "agenda"} /></Box>}
      {(section === "recursos" || visited.recursos) && <Box hidden={section !== "recursos"}><ServiceResourceAssociations branchId={branchId} serviceId={id} /></Box>}
      {modules.serviceForms && (section === "formularios" || visited.formularios) && <Box hidden={section !== "formularios"}>
        <Button onClick={() => navigate(`/admin/services/forms?branch_id=${branchId}`)} sx={{ mb: 2 }}>Administrar plantillas</Button>
        <ServiceFormAssociations branchId={branchId} serviceId={id} />
      </Box>}
    </Card>}
    <Card
      component="form"
      onSubmit={submit}
      hidden={section !== "general"}
      sx={{
        borderRadius: { xs: 2, md: 4 },
        p: { xs: 2, sm: 3, md: 4 },
        background: "#fff",
        color: "#000",
        boxShadow: "0 12px 32px rgba(0,0,0,.10)",
        border: "1px solid rgba(0,0,0,.08)",
        "& .MuiButton-root": { minHeight: 42, borderRadius: 2, textTransform: "none", fontWeight: 800 },
        "& .MuiButton-outlined": { color: "#171b20", borderColor: "rgba(0,0,0,.18)", "&:hover": { bgcolor: "#fff9eb", borderColor: "#b97400" } },
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
          color: "#b91c1c",
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
        "& .MuiCard-root:not(.service-type-card), & .MuiPaper-root:not(.service-type-card)": { backgroundColor: "#fff", color: "#000", borderColor: "rgba(0,0,0,.10)" },
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
          {activeStep < steps.length - 1 ? <Button variant="contained" onClick={goNext}>Siguiente</Button> : <><Button type="submit" variant="contained" color="success" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />} disabled={saving || !!loadError}>{saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear servicio"}</Button>{form.requires_booking && form.service_type !== "tour" && <Button type="submit" value="agenda" variant="outlined" color="warning" disabled={saving || !!loadError}>Guardar y configurar agenda</Button>}</>}
        </Stack>
      </Stack>
    </Card>
  </Box>;
}
