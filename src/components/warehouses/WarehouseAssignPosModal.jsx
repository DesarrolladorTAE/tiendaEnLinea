import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";

const safeArr = (v) => (Array.isArray(v) ? v : []);

export default function WarehouseAssignPosModal({
  open,
  onClose,
  branchId,
  storeId,
  warehouse, // {id, name}
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const warehouseId = warehouse?.id ? Number(warehouse.id) : null;

  // ==========
  // LOAD POS LITE
  // ==========
  useEffect(() => {
    if (!open || !branchId) return;

    const run = async () => {
      setLoading(true);
      try {
        // ✅ ahora el lite trae: id, name, warehouse_ids[], show_unassigned_products
        const { data } = await axiosClient.get(
          `/branches/${branchId}/pos-locations-lite`,
          { params: storeId ? { store_id: storeId } : {} }
        );

        const list = safeArr(data?.data);
        setRows(list);

        // ✅ preselecciona POS que YA incluyen este warehouseId en warehouse_ids
        if (warehouseId) {
          const pre = new Set(
            list
              .filter((p) => safeArr(p?.warehouse_ids).map(Number).includes(warehouseId))
              .map((p) => p.id)
          );
          setSelectedIds(pre);
        } else {
          setSelectedIds(new Set());
        }
      } catch (err) {
        alertFromAxiosError(err, "No se pudieron cargar los puntos de venta");
        setRows([]);
        setSelectedIds(new Set());
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [open, branchId, storeId, warehouseId]);

  // ==========
  // FILTER
  // ==========
  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((p) => (p?.name || "").toLowerCase().includes(s));
  }, [rows, q]);

  // ==========
  // COUNTS
  // ==========
  const assignedCount = useMemo(() => {
    if (!warehouseId) return 0;
    return rows.filter((p) => safeArr(p?.warehouse_ids).map(Number).includes(warehouseId)).length;
  }, [rows, warehouseId]);

  // ==========
  // UI ACTIONS
  // ==========
  const toggle = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      filtered.forEach((p) => n.add(p.id));
      return n;
    });
  };

  const clearAll = () => setSelectedIds(new Set());

  // ==========
  // SAVE (batch por POS)
  // ==========
  const save = async () => {
    if (!warehouseId) return;

    setSaving(true);
    try {
      // Para cada POS:
      // - si está seleccionado => asegurar que warehouseId esté dentro de warehouse_ids
      // - si NO está seleccionado => asegurar que warehouseId NO esté dentro de warehouse_ids
      const requests = rows.map((p) => {
        const posId = Number(p.id);
        const current = safeArr(p?.warehouse_ids).map(Number);

        const isSelected = selectedIds.has(posId);

        let next = current.slice();

        if (isSelected) {
          if (!next.includes(warehouseId)) next.push(warehouseId);
        } else {
          next = next.filter((wid) => wid !== warehouseId);
        }

        // ✅ evitar request si no cambia nada
        const same =
          next.length === current.length &&
          next.every((wid) => current.includes(wid));

        if (same) return null;

        return axiosClient.put(`/pos-locations/${posId}/assign-warehouses`, {
          warehouse_ids: next,
          // show_unassigned_products: p?.show_unassigned_products ?? undefined, // (opcional)
        });
      });

      const toRun = requests.filter(Boolean);

      // ✅ ejecutar en paralelo (si hay muchos POS, puedes limitar concurrencia)
      await Promise.all(toRun);

      await showSuccess("Asignación actualizada");
      onSaved?.();
    } catch (err) {
      alertFromAxiosError(err, "No se pudo actualizar la asignación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        Asignar punto(s) de venta
      </DialogTitle>

      <DialogContent dividers>
        {!warehouse ? (
          <Alert severity="info">Seleccione un almacén.</Alert>
        ) : (
          <Stack spacing={1.5}>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>
                Almacén: {warehouse?.name || `#${warehouseId}`}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
                <Chip size="small" label={`Asignados actualmente: ${assignedCount}`} />
                <Chip
                  size="small"
                  label={`Seleccionados: ${selectedIds.size}`}
                  variant="outlined"
                />
              </Stack>
            </Box>

            <TextField
              size="small"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar punto de venta…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button onClick={selectAllFiltered} disabled={loading || saving}>
                Seleccionar filtrados
              </Button>
              <Button onClick={clearAll} disabled={loading || saving}>
                Limpiar
              </Button>
            </Stack>

            <Divider />

            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Cargando puntos de venta…
                </Typography>
              </Stack>
            ) : filtered.length === 0 ? (
              <Alert severity="info">No hay puntos de venta en esta sucursal.</Alert>
            ) : (
              <Stack spacing={0.5}>
                {filtered.map((p) => {
                  const posId = Number(p.id);
                  const whIds = safeArr(p?.warehouse_ids).map(Number);

                  const hasThis = warehouseId ? whIds.includes(warehouseId) : false;
                  const hasOther = whIds.length > 0 && !hasThis;

                  return (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={selectedIds.has(posId)}
                          onChange={() => toggle(posId)}
                          disabled={saving}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography>{p.name}</Typography>

                          {hasThis ? (
                            <Chip size="small" label="Ya asignado" />
                          ) : hasOther ? (
                            <Chip
                              size="small"
                              label={`Asignado a ${whIds.length} almacén(es)`}
                              variant="outlined"
                            />
                          ) : (
                            <Chip size="small" label="Sin almacén" variant="outlined" />
                          )}
                        </Stack>
                      }
                    />
                  );
                })}
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button variant="contained" onClick={save} disabled={!warehouseId || saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}