import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Divider, Chip, Box, TextField, MenuItem, IconButton, Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import axios from "../../../config/axiosSuperadmin";
import ModalDatosFiscales from "../../../components/superadmin/modales/ModalDatosFiscales";
import { showSuccess, showError } from "../../../utils/alerts";

const usosCFDI = [
  { clave: "G01", descripcion: "Adquisición de mercancías" },
  { clave: "G03", descripcion: "Gastos en general" },
  { clave: "S01", descripcion: "Sin efectos fiscales" },
];

const CAMPOS_REQUERIDOS = ["rfc", "razon_social", "domicilio_fac", "codigo_regimen"];

export default function TimbrarPorTiendaModal({ open, onClose, seleccion, rowsAll = [], onOk, onError }) {
  const [loading, setLoading] = useState(false);
  const [usoCfdi, setUsoCfdi] = useState("G03");
  const [tiendas, setTiendas] = useState([]); // [{store_id, nombre, fiscales, ok, faltantes, count}]
  const [editandoTienda, setEditandoTienda] = useState(null);

  // ------------ Helpers de errores (SweetAlert HTML) ------------
  const li = (s) => `<li>${s}</li>`;
  const kv = (k, v) => `<div><b>${k}:</b> ${v}</div>`;

  const buildErroresDesdeErrors = (errors = []) => {
    if (!Array.isArray(errors) || !errors.length) return "";
    const bloques = errors.map((e) => {
      const top = `<div><b>${e.code || ""}</b> — ${e.detail || "Error"}</div>${e.where ? kv("Sección", e.where) : ""}`;
      const ctx = e.context || {};
      const extras = [];

      // PAC errors
      if (Array.isArray(ctx.pac_errors) && ctx.pac_errors.length) {
        extras.push(`<div style="margin-top:4px"><i>Detalles del PAC:</i><ul>${ctx.pac_errors.map(li).join("")}</ul></div>`);
      }
      // Faltantes
      if (Array.isArray(ctx.faltantes) && ctx.faltantes.length) {
        extras.push(`<div style="margin-top:4px"><i>Campos faltantes:</i><ul>${ctx.faltantes.map(li).join("")}</ul></div>`);
      }
      // Ineligibles (fecha/ventana)
      if (Array.isArray(ctx.ineligibles) && ctx.ineligibles.length) {
        const inel = ctx.ineligibles.map(it => {
          const rows = [
            it.id != null ? kv("Sub", it.id) : "",
            it.fin_mes ? kv("Fin de mes", it.fin_mes) : "",
            it.limite ? kv("Límite 72h", it.limite) : "",
          ].join("");
          return `<li>${rows}</li>`;
        }).join("");
        extras.push(`<div style="margin-top:4px"><i>Fuera de ventana:</i><ul>${inel}</ul></div>`);
      }
      // Otros contextos simples útiles
      ["uso_cfdi","regimen","store_id"].forEach(k => {
        if (ctx[k]) extras.push(kv(k, ctx[k]));
      });

      return `<li style="margin-bottom:6px">${top}${extras.length ? `<div>${extras.join("")}</div>` : ""}</li>`;
    }).join("");

    return `<ul style="margin:0;padding-left:18px">${bloques}</ul>`;
  };

  const buildErroresDesdeResultados = (resultados = []) => {
    if (!Array.isArray(resultados) || !resultados.length) return "";
    const fallas = resultados.filter(r => r && r.ok === false);
    if (!fallas.length) return "";
    const liItems = fallas.map(f => {
      const header = `<div><b>Tienda ${f.store_id ?? "-"}</b> — ${f.message || "Error al timbrar"}</div>`;
      const errores = Array.isArray(f.errores) ? f.errores : (f.errores ? [String(f.errores)] : []);
      const body = errores.length ? `<ul style="margin-top:4px">${errores.map(li).join("")}</ul>` : "";
      return `<li style="margin-bottom:6px">${header}${body}</li>`;
    }).join("");
    return `<div style="margin-top:4px"><ul style="margin:0;padding-left:18px">${liItems}</ul></div>`;
  };

  const buildBackendErrorHtml = (data = {}) => {
    const parts = [];
    // message global
    if (data.message) parts.push(`<div style="margin-bottom:6px">${data.message}</div>`);
    // errors[]
    const errs = buildErroresDesdeErrors(data.errors);
    if (errs) parts.push(errs);
    // resultados (por tienda)
    const res = buildErroresDesdeResultados(data.resultados);
    if (res) parts.push(res);
    // trace
    if (data.trace_id) {
      parts.push(`<hr/><div style="font-size:12px;color:#666">Trace ID: <code>${data.trace_id}</code></div>`);
    }
    return parts.join("");
  };

  const buildParcialHtml = (data = {}) => {
    const resultados = Array.isArray(data?.resultados) ? data.resultados : [];
    const ok = resultados.filter(r => r.ok === true);
    const ko = resultados.filter(r => r.ok === false);

    const okLi = ok.map(r => `<li>Tienda ${r.store_id ?? "-"} — Folio <b>${r.folio ?? "-"}</b></li>`).join("");
    const koHtml = buildErroresDesdeResultados(resultados);

    const parts = [
      `<div><b>Se timbraron:</b> ${ok.length}</div>`,
      ok.length ? `<ul style="margin-top:4px">${okLi}</ul>` : "",
      `<hr/>`,
      `<div><b>Fallaron:</b> ${ko.length}</div>`,
      koHtml || ""
    ];

    if (data.trace_id) {
      parts.push(`<hr/><div style="font-size:12px;color:#666">Trace ID: <code>${data.trace_id}</code></div>`);
    }
    return parts.join("");
  };

  // --- construir lista de tiendas a partir de la selección ---
  const tiendasSeleccion = useMemo(() => {
    const setSel = new Set(seleccion);
    const elegidas = rowsAll.filter(r => setSel.has(r.id));
    const map = new Map();
    elegidas.forEach(it => {
      const sid = it.store_id;
      const nom = it.tienda || `Tienda ${sid}`;
      if (!map.has(sid)) map.set(sid, { store_id: sid, nombre: nom, count: 0 });
      map.get(sid).count++;
    });
    return Array.from(map.values());
  }, [seleccion, rowsAll]);

  // total estimado
  const total = useMemo(() => {
    const setSel = new Set(seleccion);
    return rowsAll
      .filter(r => setSel.has(r.id))
      .reduce((acc, it) => acc + Number(it.monto || 0), 0);
  }, [seleccion, rowsAll]);

  // cargar datos fiscales
  useEffect(() => {
    const cargar = async () => {
      if (!open) return;
      const base = [];
      for (const t of tiendasSeleccion) {
        try {
          const { data } = await axios.get(`/admin/tiendas/${t.store_id}/fiscales`);
          const faltantes = CAMPOS_REQUERIDOS.filter(c => !data?.[c] || String(data[c]).trim() === "");
          base.push({
            store_id: t.store_id,
            nombre: t.nombre,
            fiscales: data || {},
            ok: faltantes.length === 0,
            faltantes,
            count: t.count,
          });
        } catch {
          base.push({
            store_id: t.store_id,
            nombre: t.nombre,
            fiscales: {},
            ok: false,
            faltantes: CAMPOS_REQUERIDOS.slice(),
            count: t.count,
          });
        }
      }
      setTiendas(base);
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tiendasSeleccion.length]);

  const todasOK = useMemo(() => tiendas.length > 0 && tiendas.every(t => t.ok), [tiendas]);

  // refrescar tienda al cerrar modal de edición
  const refrescarTienda = async (store_id) => {
    try {
      const { data } = await axios.get(`/admin/tiendas/${store_id}/fiscales`);
      setTiendas(prev => prev.map(t => {
        if (t.store_id !== store_id) return t;
        const faltantes = CAMPOS_REQUERIDOS.filter(c => !data?.[c] || String(data[c]).trim() === "");
        return { ...t, fiscales: data, ok: faltantes.length === 0, faltantes };
      }));
    } catch {
      /* noop */
    }
  };

  // Enviar
  const enviar = async () => {
    if (!todasOK) {
      await showError("Completa los datos fiscales faltantes para habilitar el timbrado.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        subscription_ids: seleccion,
        uso_cfdi: usoCfdi,
        // formaPago: "03",
        // metodoPago: "PUE",
      };

      const res = await axios.post("/admin/timbrar-por-tienda", payload);
      const { status, data } = res || {};

      // Éxito total
      if (status === 200 && data?.ok && !data?.partial) {
        await showSuccess("Timbrado por tienda completado");
        onOk?.("Timbrado por tienda completado");
        onClose?.();
        return;
      }

      // Éxito parcial (mostrar detalle en error modal)
      if ((status === 207 || data?.partial === true) && data?.ok) {
        const html = buildParcialHtml(data);
        await showError("Timbrado parcial", { html });
        return;
      }

      // 2xx no esperado -> muestra detalle si viene
      const html = buildBackendErrorHtml(data);
      if (html) {
        await showError(data?.title || data?.message || "Error al timbrar por tienda", { html });
      } else {
        await showError(data?.message || "Error al timbrar por tienda");
      }
    } catch (e) {
      const data = e?.response?.data || {};
      const html = buildBackendErrorHtml(data);
      if (html) {
        await showError(data?.title || data?.message || "No se pudo timbrar por tienda", { html });
      } else {
        await showError(data?.message || e?.message || "No se pudo timbrar por tienda");
      }
      onError?.(data?.message || e?.message || "No se pudo timbrar por tienda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Timbrar por Tienda</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Se emitirá <b>un CFDI por cada tienda</b> involucrada en la selección.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <TextField
                select
                label="Uso CFDI"
                value={usoCfdi}
                onChange={(e) => setUsoCfdi(e.target.value)}
                sx={{ minWidth: 300 }}
              >
                {usosCFDI.map(u => (
                  <MenuItem key={u.clave} value={u.clave}>
                    {u.clave} — {u.descripcion}
                  </MenuItem>
                ))}
              </TextField>
              <Chip label={`Suscripciones seleccionadas: ${seleccion.length}`} />
              <Chip label={`Total estimado: $${total.toFixed(2)} MXN`} color="success" />
            </Stack>

            <Divider />

            <Typography variant="subtitle2">Revisión de datos fiscales por tienda</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
              {tiendas.map(t => (
                <Box
                  key={t.store_id}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, borderRadius: 1, bgcolor: "#f9f9f9" }}
                >
                  <Box>
                    <Typography variant="body2"><b>{t.nombre}</b> (ID: {t.store_id}) — {t.count} suscr.</Typography>
                    {t.ok ? (
                      <Typography variant="caption" color="success.main">
                        <CheckCircleIcon fontSize="small" /> Datos fiscales completos
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="error.main">
                        <CancelIcon fontSize="small" /> Faltan: {t.faltantes.join(", ")}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title="Editar datos fiscales">
                    <IconButton onClick={() => setEditandoTienda({ id: t.store_id, nombre: t.nombre })} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>

            {!todasOK && (
              <Typography variant="caption" color="warning.main">
                Completa los datos fiscales faltantes para habilitar el timbrado.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={enviar} variant="contained" disabled={loading || !todasOK || seleccion.length === 0}>
            {loading ? "Timbrando..." : "Timbrar por tienda"}
          </Button>
        </DialogActions>
      </Dialog>

      {editandoTienda && (
        <ModalDatosFiscales
          open={Boolean(editandoTienda)}
          onClose={async () => {
            const sid = editandoTienda.id;
            setEditandoTienda(null);
            if (sid) await refrescarTienda(sid);
          }}
          tienda={{ id: editandoTienda.id, nombre: editandoTienda.nombre }}
        />
      )}
    </>
  );
}
