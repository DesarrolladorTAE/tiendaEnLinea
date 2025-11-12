// ModalAgregarSuscripcion.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
  Typography,
  Divider,
  Box,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../utils/alerts";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";
import dayjs from "dayjs";

const ModalAgregarSuscripcion = ({ open, onClose, tienda, onSaved }) => {
  const [tipo, setTipo] = useState("plan");
  const [mesesPagados, setMesesPagados] = useState(1);
  const [form, setForm] = useState({
    plan_id: "",
    complemento_id: "",
    cantidad: 1,
    notas: "",
    monto: "",
    starts_at: "",
    ends_at: "",
  });

  useEffect(() => {
    if (!open) return;
    // reset visual al abrir
    setTipo("plan");
    setMesesPagados(1);
    setForm({
      plan_id: "",
      complemento_id: "",
      cantidad: 1,
      notas: "",
      monto: "",
      starts_at: "",
      ends_at: "",
    });
    setEvalResult(null);
  }, [open]);

  const mesesObtenidos = useMemo(() => {
    if (mesesPagados === 1) return 1;
    if (mesesPagados === 5) return 6;
    return 12; // 10->12
  }, [mesesPagados]);

  const selPlanId = form.plan_id;
  const planSeleccionado = useMemo(
    () => planes.find((p) => p.plan_id === parseInt(selPlanId)),
    [selPlanId]
  );

  const ahora = dayjs();
  const fechaInicio = useMemo(() => {
    if (tienda?.plan_expiration && dayjs(tienda.plan_expiration).isAfter(ahora)) {
      return dayjs(tienda.plan_expiration);
    }
    return ahora;
  }, [tienda?.plan_expiration, ahora]);

  const fechaFin = useMemo(
    () => fechaInicio.add(mesesObtenidos, "month"),
    [fechaInicio, mesesObtenidos]
  );

  const fechaInicioFormateada = fechaInicio.format("YYYY-MM-DD HH:mm:ss");
  const fechaFinFormateada = fechaFin.format("YYYY-MM-DD HH:mm:ss");

  const montoBase =
    tipo === "plan" && planSeleccionado
      ? Number(planSeleccionado.precio_mensual || 0) * Number(mesesPagados || 1)
      : null;

  // ====== Preview de descuento por referidos (opcional) ======
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const concepto =
    tipo === "plan" && selPlanId
      ? `PLAN:${selPlanId}:${Number(mesesPagados || 1)}`
      : null;

  useEffect(() => {
    const doPreview = async () => {
      if (tipo !== "plan" || !tienda?.id || !concepto || !montoBase) {
        setEvalResult(null);
        return;
      }
      setEvalLoading(true);
      try {
        const { data } = await axiosSuperadmin.post("/referidos/descuento", {
          store_id: tienda.id,
          concepto,
          monto: Number(montoBase),
        });
        setEvalResult(data || null);
      } catch {
        setEvalResult(null);
      } finally {
        setEvalLoading(false);
      }
    };
    doPreview();
  }, [tipo, tienda?.id, concepto, montoBase]);

  const handleChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        store_id: tienda.id,
        status: "active",
      };

      if (tipo === "plan") {
        if (!form.plan_id) {
          showError("Selecciona un plan.");
          return;
        }
        payload.plan_id = form.plan_id;
        payload.monto = Number(
          evalResult?.eligible ? evalResult?.monto_final ?? montoBase : montoBase
        );
        payload.starts_at = fechaInicioFormateada;
        payload.ends_at = fechaFinFormateada;
        payload.meses_pagados = mesesPagados;
        payload.meses_obtenidos = mesesObtenidos;
        payload.concepto = concepto;
      } else {
        if (!form.complemento_id) {
          showError("Selecciona un complemento.");
          return;
        }
        payload.complemento_id = form.complemento_id;
        payload.cantidad = Number(form.cantidad || 1);
        payload.notas = form.notas || null;
        payload.starts_at = form.starts_at;
        payload.ends_at = form.ends_at || null;
        payload.monto = Number(form.monto);
      }

      await axiosSuperadmin.post("/admin/tiendas/suscripcion", payload);

      // ===== Intento fetch tienda actualizada (si existe tu endpoint) =====
      let tiendaActualizada = null;
      try {
        const { data } = await axiosSuperadmin.get(`/admin/tiendas/${tienda.id}`);
        tiendaActualizada = data || null;
      } catch {
        // ===== Fallback optimista =====
        const optimistic = { ...tienda };
        if (tipo === "plan") {
          optimistic.plan_id = Number(payload.plan_id);
          optimistic.plan_expiration = payload.ends_at; // asumimos que ends_at es nueva expiración
          optimistic.is_active = 1; // usualmente al renovar se mantiene activa
        }
        // si es complemento, no cambia plan/expiración; puedes ajustar si aplica
        tiendaActualizada = optimistic;
      }

      showSuccess("Suscripción agregada correctamente.");
      onSaved && onSaved(tiendaActualizada); // <<=== avisa al padre
    } catch (error) {
      console.error("Error al agregar suscripción:", error);
      showError("No se pudo agregar la suscripción.");
    }
  };

  const Resumen = () => (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Resumen
      </Typography>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Tienda:
          </Typography>
          <Typography variant="body2">{tienda?.name}</Typography>
        </Stack>

        {tipo === "plan" ? (
          <>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Plan:
              </Typography>
              <Typography variant="body2">
                {planSeleccionado ? planSeleccionado.nombre : "-"}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Meses:
              </Typography>
              <Typography variant="body2">
                {mesesPagados} → obtienes {mesesObtenidos}
              </Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip label={`Inicio: ${fechaInicio.format("YYYY-MM-DD")}`} size="small" />
              <Chip label={`Fin: ${fechaFin.format("YYYY-MM-DD")}`} size="small" color="primary" />
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Monto base:
              </Typography>
              <Typography variant="body2">
                {montoBase != null ? `$${Number(montoBase).toFixed(2)}` : "-"}
              </Typography>
            </Stack>
            {evalLoading ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={18} />
                <Typography variant="caption">Calculando descuento…</Typography>
              </Stack>
            ) : evalResult ? (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Descuento:
                  </Typography>
                  <Typography variant="body2">
                    {evalResult?.eligible ? `-${evalResult?.percent || 5}%` : "N/A"}
                  </Typography>
                </Stack>
                {evalResult?.eligible && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Monto final:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      ${Number(evalResult?.monto_final || montoBase).toFixed(2)}
                    </Typography>
                  </Stack>
                )}
              </>
            ) : null}
          </>
        ) : (
          <>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Complemento:
              </Typography>
              <Typography variant="body2">
                {(() => {
                  const c = complementos.find(
                    (x) => String(x.complemento_id) === String(form.complemento_id)
                  );
                  return c ? c.nombre : "-";
                })()}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Cantidad:
              </Typography>
              <Typography variant="body2">{form.cantidad || 1}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Monto:
              </Typography>
              <Typography variant="body2">
                {form.monto ? `$${Number(form.monto).toFixed(2)}` : "-"}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              {form.starts_at && <Chip label={`Inicio: ${form.starts_at}`} size="small" />}
              {form.ends_at && (
                <Chip label={`Fin: ${form.ends_at}`} size="small" color="primary" />
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Agregar Suscripción
        <Typography variant="body2" color="text.secondary">
          {tienda?.name}
        </Typography>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pb: 0 }}>
        <ToggleButtonGroup
          value={tipo}
          exclusive
          onChange={(e, newTipo) => {
            if (!newTipo) return;
            setTipo(newTipo);
            setMesesPagados(1);
            setForm({
              plan_id: "",
              complemento_id: "",
              cantidad: 1,
              notas: "",
              monto: "",
              starts_at: "",
              ends_at: "",
            });
            setEvalResult(null);
          }}
          sx={{ mb: 2, width: "100%" }}
        >
          <ToggleButton value="plan" sx={{ flex: 1 }}>
            Plan
          </ToggleButton>
          <ToggleButton value="complemento" sx={{ flex: 1 }}>
            Complemento
          </ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={3}>
          {/* Columna izquierda: formulario */}
          <Grid item xs={12} md={7}>
            <Box component="form" onSubmit={onSubmit} id="form-suscripcion">
              {tipo === "plan" ? (
                <>
                  <TextField
                    label="Selecciona un plan"
                    select
                    fullWidth
                    margin="normal"
                    value={form.plan_id}
                    onChange={handleChange("plan_id")}
                  >
                    {planes
                      .filter((p) => p.plan_id !== 0) // omitir DEMO
                      .map((p, i) => (
                        <MenuItem key={p.plan_id} value={p.plan_id}>
                          {`${i + 1}. ${p.nombre}`}
                        </MenuItem>
                      ))}
                  </TextField>

                  <TextField
                    label="Meses"
                    select
                    fullWidth
                    margin="normal"
                    value={mesesPagados}
                    onChange={(e) => setMesesPagados(parseInt(e.target.value))}
                  >
                    <MenuItem value={1}>1 mes</MenuItem>
                    <MenuItem value={5}>5 meses</MenuItem>
                    <MenuItem value={10}>10 meses</MenuItem>
                  </TextField>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <TextField
                      label="Monto base"
                      fullWidth
                      margin="normal"
                      value={montoBase ?? ""}
                      disabled
                    />
                    {evalLoading ? (
                      <Stack alignItems="center" justifyContent="center" sx={{ px: 2 }}>
                        <CircularProgress size={24} />
                      </Stack>
                    ) : evalResult ? (
                      <Tooltip
                        title={
                          evalResult?.eligible
                            ? "Descuento por referido (preview). El monto final se confirma al guardar."
                            : "Sin descuento por referido."
                        }
                      >
                        <Chip
                          color={evalResult?.eligible ? "success" : "default"}
                          label={
                            evalResult?.eligible
                              ? `- ${evalResult?.percent || 5}%`
                              : "Sin descuento"
                          }
                          sx={{ height: 40, fontWeight: 700 }}
                        />
                      </Tooltip>
                    ) : null}
                  </Stack>

                  {evalResult?.eligible && (
                    <TextField
                      label="Monto final (preview)"
                      fullWidth
                      margin="normal"
                      value={evalResult?.monto_final ?? montoBase ?? ""}
                      disabled
                      helperText="* El backend confirmará este monto al guardar"
                    />
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Fecha de inicio"
                        fullWidth
                        margin="normal"
                        value={fechaInicio.format("YYYY-MM-DD")}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Fecha de fin"
                        fullWidth
                        margin="normal"
                        value={fechaFin.format("YYYY-MM-DD")}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </>
              ) : (
                <>
                  <TextField
                    label="Complemento"
                    select
                    fullWidth
                    margin="normal"
                    value={form.complemento_id}
                    onChange={handleChange("complemento_id")}
                  >
                    {complementos.map((c) => (
                      <MenuItem key={c.complemento_id} value={c.complemento_id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Cantidad"
                    fullWidth
                    type="number"
                    margin="normal"
                    value={form.cantidad}
                    onChange={handleChange("cantidad")}
                  />

                  <TextField
                    label="Notas"
                    fullWidth
                    margin="normal"
                    value={form.notas}
                    onChange={handleChange("notas")}
                  />

                  <TextField
                    label="Monto"
                    fullWidth
                    type="number"
                    margin="normal"
                    value={form.monto}
                    onChange={handleChange("monto")}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Fecha de inicio"
                        fullWidth
                        type="date"
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={form.starts_at}
                        onChange={handleChange("starts_at")}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Fecha de fin"
                        fullWidth
                        type="date"
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={form.ends_at}
                        onChange={handleChange("ends_at")}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          </Grid>

          {/* Columna derecha: resumen */}
          <Grid item xs={12} md={5}>
            <Resumen />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer fijo del diálogo */}
      <DialogActions
        sx={{
          position: "sticky",
          bottom: 0,
          bgcolor: "background.paper",
          borderTop: (t) => `1px solid ${t.palette.divider}`,
          p: 2,
        }}
      >
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="primary" form="form-suscripcion" type="submit">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalAgregarSuscripcion;
