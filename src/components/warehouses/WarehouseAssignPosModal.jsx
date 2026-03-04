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

  const warehouseId = warehouse?.id;

  useEffect(() => {
    if (!open || !branchId) return;
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get(
          `/branches/${branchId}/pos-locations-lite`,
          { params: storeId ? { store_id: storeId } : {} }
        );

        const list = Array.isArray(data?.data) ? data.data : [];
        setRows(list);

        // ✅ preseleccionar los POS que ya están asignados a este almacén
        const pre = new Set(
          list
            .filter((p) => Number(p.default_warehouse_id) === Number(warehouseId))
            .map((p) => p.id)
        );
        setSelectedIds(pre);
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

  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((p) => (p?.name || "").toLowerCase().includes(s));
  }, [rows, q]);

  const assignedCount = useMemo(() => {
    return rows.filter((p) => Number(p.default_warehouse_id) === Number(warehouseId)).length;
  }, [rows, warehouseId]);

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

  const save = async () => {
    if (!warehouseId) return;

    // Queremos que: los seleccionados queden con warehouseId
    // y los que estaban asignados a este warehouse pero ya NO están seleccionados -> null
    const selected = Array.from(selectedIds);

    const toAssign = rows
      .filter((p) => selectedIds.has(p.id))
      .map((p) => p.id);

    const toUnassign = rows
      .filter((p) => Number(p.default_warehouse_id) === Number(warehouseId) && !selectedIds.has(p.id))
      .map((p) => p.id);

    setSaving(true);
    try {
      // ✅ asignar
      for (const id of toAssign) {
        await axiosClient.put(`/pos-locations/${id}/assign-warehouse`, {
          default_warehouse_id: warehouseId,
        });
      }

      // ✅ desasignar
      for (const id of toUnassign) {
        await axiosClient.put(`/pos-locations/${id}/assign-warehouse`, {
          default_warehouse_id: null,
        });
      }

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
                <Chip size="small" label={`Seleccionados: ${selectedIds.size}`} variant="outlined" />
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
                {filtered.map((p) => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggle(p.id)}
                        disabled={saving}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography>{p.name}</Typography>
                        {Number(p.default_warehouse_id) === Number(warehouseId) ? (
                          <Chip size="small" label="Ya asignado" />
                        ) : p.default_warehouse_id ? (
                          <Chip size="small" label="Asignado a otro" variant="outlined" />
                        ) : (
                          <Chip size="small" label="Sin almacén" variant="outlined" />
                        )}
                      </Stack>
                    }
                  />
                ))}
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