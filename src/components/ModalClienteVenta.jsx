import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import axiosClient from "../config/axiosClient";

export default function ModalClienteVenta({
  open,
  onClose,
  ventaId,
  clienteActualId = null,
  posLocationId = null,
  onSuccess,
}) {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");
    setClienteId(clienteActualId ? String(clienteActualId) : "");

    if (!posLocationId) {
      setClientes([]);
      setError("No se recibió el punto de venta para cargar los clientes.");
      return;
    }

    let cancelled = false;
    setLoadingClientes(true);

    axiosClient
      .get("/clientes/simple", {
        params: { pos_location_id: posLocationId },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setClientes(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error al cargar clientes:", err);
        setClientes([]);
        setError(
          err?.response?.data?.message || "No se pudieron cargar los clientes."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingClientes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, clienteActualId, posLocationId]);

  const clienteActualSeleccionado = useMemo(() => {
    return clientes.find((c) => String(c.id) === String(clienteId)) || null;
  }, [clientes, clienteId]);

  const guardarCliente = async () => {
    if (!ventaId || !clienteId || !posLocationId) return;

    setLoading(true);
    setError("");

    try {
      await axiosClient.post("/clientes/change-sale-client", {
        pos_location_id: posLocationId,
        sale_id: ventaId,
        new_client_id: Number(clienteId),
      });

      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error("Error al guardar cliente:", e);
      setError(
        e?.response?.data?.message ||
          "No se pudo actualizar el cliente de la venta."
      );
    } finally {
      setLoading(false);
    }
  };

  const quitarCliente = async () => {
    if (!ventaId || !clienteActualId || !posLocationId) return;

    setLoading(true);
    setError("");

    try {
      await axiosClient.post(`/clientes/${clienteActualId}/unassign-sale`, {
        pos_location_id: posLocationId,
        sale_id: ventaId,
      });

      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error("Error al quitar cliente:", e);
      setError(
        e?.response?.data?.message ||
          "No se pudo quitar el cliente de la venta."
      );
    } finally {
      setLoading(false);
    }
  };

  const cambioPendiente =
    String(clienteId || "") !== String(clienteActualId || "");

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Cliente de la venta</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Selecciona el cliente que deseas asignar a esta venta.
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {loadingClientes ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando clientes...</Typography>
            </Stack>
          ) : (
            <TextField
              select
              fullWidth
              size="small"
              label="Cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <MenuItem value="">Sin cliente</MenuItem>

              {clientes.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.nombre_alias}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Typography variant="caption" color="text.secondary">
            Cliente actual:{" "}
            {clienteActualId
              ? clientes.find((c) => String(c.id) === String(clienteActualId))
                  ?.nombre_alias || `#${clienteActualId}`
              : "Sin cliente"}
          </Typography>

          {clienteActualSeleccionado ? (
            <Typography variant="caption" color="text.secondary">
              Seleccionado: {clienteActualSeleccionado.nombre_alias}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <Button
          color="error"
          onClick={quitarCliente}
          disabled={loading || !clienteActualId}
        >
          Quitar cliente
        </Button>

        <Button
          variant="contained"
          onClick={guardarCliente}
          disabled={loading || !clienteId || !cambioPendiente}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}