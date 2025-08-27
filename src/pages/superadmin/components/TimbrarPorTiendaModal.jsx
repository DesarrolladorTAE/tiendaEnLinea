import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, Divider, Chip, Box, TextField, MenuItem, IconButton, Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import axios from "../../../config/axiosSuperadmin";
import dayjs from "dayjs";
import ModalDatosFiscales from "../../../components/superadmin/modales/ModalDatosFiscales"; // <-- tu componente existente

const usosCFDI = [
  { clave: "G01", descripcion: "Adquisición de mercancías" },
  { clave: "G03", descripcion: "Gastos en general" },
  { clave: "S01", descripcion: "Sin efectos fiscales" },
];

const CAMPOS_REQUERIDOS = ["rfc", "razon_social", "domicilio_fac", "codigo_regimen"];

export default function TimbrarPorTiendaModal({ open, onClose, seleccion, rowsAll = [], onOk, onError }) {
  const [loading, setLoading] = useState(false);
  const [usoCfdi, setUsoCfdi] = useState("G03"); // default sugerido
  const [tiendas, setTiendas] = useState([]); // [{store_id, nombre, fiscales, ok, faltantes}]
  const [editandoTienda, setEditandoTienda] = useState(null); // {id, nombre}

  // --- construir lista de tiendas a partir de la selección ---
  const tiendasSeleccion = useMemo(() => {
    const setSel = new Set(seleccion);
    const elegidas = rowsAll.filter(r => setSel.has(r.id));
    // agrupamos por store_id
    const map = new Map();
    elegidas.forEach(it => {
      const sid = it.store_id;
      const nom = it.tienda || `Tienda ${sid}`;
      if (!map.has(sid)) map.set(sid, { store_id: sid, nombre: nom, count: 0 });
      map.get(sid).count++;
    });
    return Array.from(map.values());
  }, [seleccion, rowsAll]);

  // total estimado (opcional)
  const total = useMemo(() => {
    const setSel = new Set(seleccion);
    return rowsAll.filter(r => setSel.has(r.id)).reduce((acc, it) => acc + Number(it.monto || 0), 0);
  }, [seleccion, rowsAll]);

  // cargar datos fiscales de cada tienda al abrir
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
            faltantes: CAMPOS_REQUERIDOS.slice(), // todos faltan
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

  // cuando se cierra el sub-modal de edición, refrescamos esa tienda
  const refrescarTienda = async (store_id) => {
    try {
      const { data } = await axios.get(`/admin/tiendas/${store_id}/fiscales`);
      setTiendas(prev => prev.map(t => {
        if (t.store_id !== store_id) return t;
        const faltantes = CAMPOS_REQUERIDOS.filter(c => !data?.[c] || String(data[c]).trim() === "");
        return { ...t, fiscales: data, ok: faltantes.length === 0, faltantes };
      }));
    } catch (e) {
      // si falla, mantenemos el estado anterior
    }
  };

  const enviar = async () => {
    if (!todasOK) return;
    setLoading(true);
    try {
      // el backend acepta defaults si no mandas uso_cfdi/formaPago/metodoPago,
      // pero como quieres controlar usoCfdi, lo enviamos explícitamente:
      const payload = {
        subscription_ids: seleccion,
        uso_cfdi: usoCfdi,      // <- aquí va el seleccionado
        // formaPago y metodoPago puedes no enviarlos (usa defaults) o ponerlos si quieres:
        // formaPago: "03",
        // metodoPago: "PUE",
      };
      const res = await axios.post("admin/timbrar-por-tienda", payload);
      if (res?.data?.ok) {
        onOk("Timbrado por tienda completado");
        onClose();
      } else {
        onError(res?.data?.message || "Error al timbrar por tienda");
      }
    } catch (e) {
      onError("Error al timbrar por tienda");
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

      {/* Sub-modal para editar/guardar SIN salir del flujo */}
      {editandoTienda && (
        <ModalDatosFiscales
          open={Boolean(editandoTienda)}
          onClose={async () => {
            const sid = editandoTienda.id;
            setEditandoTienda(null);
            if (sid) await refrescarTienda(sid); // <- revalida al cerrar
          }}
          tienda={{ id: editandoTienda.id, nombre: editandoTienda.nombre }}
        />
      )}
    </>
  );
}
