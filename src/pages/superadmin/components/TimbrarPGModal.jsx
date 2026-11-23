// src/pages/superadmin/components/TimbrarPGModal.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Divider
} from "@mui/material";
import dayjs from "dayjs";
import axios from "../../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../../utils/alerts";

export default function TimbrarPGModal({ open, onClose, seleccion, onOk, onError, rowsAll = [] }) {
  const [loading, setLoading] = useState(false);

  // ------------ Helpers de errores/success (SweetAlert HTML) ------------
  const li = (s) => `<li>${s}</li>`;
  const kv = (k, v) => `<div><b>${k}:</b> ${v}</div>`;

  const buildErroresDesdeErrors = (errors = []) => {
    if (!Array.isArray(errors) || !errors.length) return "";
    const bloques = errors.map((e) => {
      const top = `<div><b>${e.code || ""}</b> — ${e.detail || "Error"}</div>${e.where ? kv("Sección", e.where) : ""}`;
      const ctx = e.context || {};
      const extras = [];

      if (Array.isArray(ctx.pac_errors) && ctx.pac_errors.length) {
        extras.push(`<div style="margin-top:4px"><i>Detalles del PAC:</i><ul>${ctx.pac_errors.map(li).join("")}</ul></div>`);
      }
      if (Array.isArray(ctx.faltantes) && ctx.faltantes.length) {
        extras.push(`<div style="margin-top:4px"><i>Campos faltantes:</i><ul>${ctx.faltantes.map(li).join("")}</ul></div>`);
      }
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
      ["uso_cfdi", "regimen", "store_id", "mes"].forEach(k => {
        if (ctx[k]) extras.push(kv(k, ctx[k]));
      });

      return `<li style="margin-bottom:6px">${top}${extras.length ? `<div>${extras.join("")}</div>` : ""}</li>`;
    }).join("");

    return `<ul style="margin:0;padding-left:18px">${bloques}</ul>`;
  };

  const buildBackendErrorHtml = (data = {}) => {
    const parts = [];
    if (data.message) parts.push(`<div style="margin-bottom:6px">${data.message}</div>`);
    // errores estructurados
    const errs = buildErroresDesdeErrors(data.errors);
    if (errs) parts.push(errs);

    // extras típicos del endpoint PG
    if (Array.isArray(data.meses_detectados) && data.meses_detectados.length) {
      parts.push(`<div style="margin-top:6px">${kv("Meses detectados", data.meses_detectados.join(", "))}</div>`);
    }
    if (Array.isArray(data.ineligibles) && data.ineligibles.length) {
      const inel = data.ineligibles.map(it =>
        `<li>Sub ${it.id} — compra ${it.compra ?? "-"} — fin mes ${it.fin_mes ?? "-"} — habilita ${it.habilita_en ?? "-"}</li>`
      ).join("");
      parts.push(`<div style="margin-top:6px"><i>Fuera de ventana / aún no habilitadas:</i><ul>${inel}</ul></div>`);
    }

    if (data.trace_id) {
      parts.push(`<hr/><div style="font-size:12px;color:#666">Trace ID: <code>${data.trace_id}</code></div>`);
    }
    return parts.join("");
  };

  const buildSuccessHtml = (data = {}, total, count) => {
    const lines = [];
    if (data.folio) lines.push(kv("Folio", `<b>${data.folio}</b>`));
    if (typeof total === "number") lines.push(kv("Total estimado", `$${total.toFixed(2)} MXN`));
    if (typeof count === "number") lines.push(kv("Suscripciones", `${count}`));
    if (data.pdf_url) lines.push(kv("PDF", `<a href="${data.pdf_url}" target="_blank" rel="noreferrer">Abrir PDF</a>`));
    if (data.xml_url) lines.push(kv("XML", `<a href="${data.xml_url}" target="_blank" rel="noreferrer">Abrir XML</a>`));
    if (data.trace_id) {
      lines.push(`<hr/><div style="font-size:12px;color:#666">Trace ID: <code>${data.trace_id}</code></div>`);
    }
    return lines.join("");
  };

  // ------------ Resumen UI (opcional) ------------
  const { total, porTienda } = useMemo(() => {
    const setSel = new Set(seleccion);
    const elegidas = rowsAll.filter(r => setSel.has(r.id));
    const total = elegidas.reduce((acc, it) => acc + Number(it.monto || 0), 0);
    const mapa = {};
    elegidas.forEach(it => { mapa[it.tienda] = (mapa[it.tienda] || 0) + 1; });
    return { total, porTienda: mapa };
  }, [seleccion, rowsAll]);

  // ------------ Enviar ------------
  const enviar = async () => {
    setLoading(true);
    try {
      const payload = { subscription_ids: seleccion };
      const res = await axios.post("admin/timbrar-pg", payload);
      const { status, data } = res || {};

      if (status === 200 && data?.ok) {
        const html = buildSuccessHtml(data, total, seleccion.length);
        await showSuccess("Público en General timbrado correctamente", { html });
        onOk?.(`PG timbrado folio ${data.folio}`);
        onClose?.();
        return;
      }

      // 2xx inesperado: muestra detalle si lo hay
      const html = buildBackendErrorHtml(data);
      if (html) {
        await showError(data?.title || data?.message || "Error al timbrar PG", { html });
      } else {
        await showError(data?.message || "Error al timbrar PG");
      }
    } catch (e) {
      const data = e?.response?.data || {};
      const html = buildBackendErrorHtml(data);
      if (html) {
        await showError(data?.title || data?.message || "No se pudo timbrar PG", { html });
      } else {
        await showError(data?.message || e?.message || "No se pudo timbrar PG");
      }
      onError?.(data?.message || e?.message || "No se pudo timbrar PG");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar timbrado a Público en General</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Se agruparán <b>{seleccion.length}</b> suscripciones en un solo CFDI a Público en General.
          </Typography>
          <Typography variant="body2">Total estimado: <b>${total.toFixed(2)} MXN</b></Typography>

          {!!Object.keys(porTienda).length && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">Conteo por tienda:</Typography>
              {Object.entries(porTienda).map(([t, c]) => (
                <Typography key={t} variant="caption">• {t}: {c}</Typography>
              ))}
            </>
          )}

          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Sólo se timbra si cada suscripción sigue dentro de su mes de compra y, si corresponde,
            dentro de las 72 horas posteriores a que termine ese mes ({dayjs().endOf("month").format("DD MMM YYYY")}).
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={enviar} variant="contained" disabled={loading || seleccion.length === 0}>
          {loading ? "Timbrando..." : "Timbrar PG"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
