import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";

import axiosClient from "../config/axiosClient";

export default function ModalClienteVenta({
  open,
  onClose,
  ventaId,
  clienteActualId = null,
  posLocationId = null,
  onSuccess,
}) {
  const theme = useTheme();

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

  const clienteActual = useMemo(() => {
    return (
      clientes.find((c) => String(c.id) === String(clienteActualId)) || null
    );
  }, [clientes, clienteActualId]);

  const clienteActualSeleccionado = useMemo(() => {
    return clientes.find((c) => String(c.id) === String(clienteId)) || null;
  }, [clientes, clienteId]);

  const cambioPendiente =
    String(clienteId || "") !== String(clienteActualId || "");

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.24)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #111827 0%, #1f2937 100%)"
              : "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }}
            >
              <PersonAddAlt1RoundedIcon />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={900} fontSize={20}>
                Cliente de la venta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asigne, cambie o quite el cliente relacionado a la venta.
              </Typography>
            </Box>

            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: 2,
                color: "text.secondary",
              }}
            >
              <CloseRoundedIcon />
            </Button>
          </Stack>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {error ? (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          ) : null}

          <Box
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              borderRadius: 3,
              p: 2,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.03)
                  : alpha(theme.palette.grey[100], 0.8),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <StorefrontRoundedIcon
                sx={{ color: "text.secondary", mt: 0.3 }}
              />

              <Box>
                <Typography fontWeight={800} mb={0.5}>
                  Venta #{ventaId || "N/A"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Seleccione el cliente que desea relacionar con esta venta. Si
                  la venta no debe tener cliente, puede utilizar la opción de
                  quitar cliente.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {loadingClientes ? (
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
                borderRadius: 3,
                p: 2,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Cargando clientes disponibles...
              </Typography>
            </Stack>
          ) : (
            <TextField
              select
              fullWidth
              label="Cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={loading || !posLocationId}
              helperText={
                clienteActualSeleccionado
                  ? `Seleccionado: ${clienteActualSeleccionado.nombre_alias}`
                  : "Seleccione un cliente para asignarlo a la venta."
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                },
              }}
            >
              <MenuItem value="">Sin cliente</MenuItem>

              {clientes.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.nombre_alias}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Box
            sx={{
              borderRadius: 3,
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Cliente actual
            </Typography>

            <Typography fontWeight={900}>
              {clienteActualId
                ? clienteActual?.nombre_alias || `#${clienteActualId}`
                : "Sin cliente"}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 0,
          gap: 1,
          flexDirection: { xs: "column-reverse", sm: "row" },
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          sx={{
            borderRadius: 2.5,
            py: 1.15,
            fontWeight: 800,
          }}
        >
          Cancelar
        </Button>

        <Button
          fullWidth
          color="error"
          variant="outlined"
          onClick={quitarCliente}
          disabled={loading || !clienteActualId}
          startIcon={<PersonRemoveRoundedIcon />}
          sx={{
            borderRadius: 2.5,
            py: 1.15,
            fontWeight: 800,
          }}
        >
          Quitar
        </Button>

        <Button
          fullWidth
          variant="contained"
          onClick={guardarCliente}
          disabled={loading || !clienteId || !cambioPendiente}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />
          }
          sx={{
            borderRadius: 2.5,
            py: 1.15,
            fontWeight: 900,
            boxShadow: `0 12px 30px ${alpha(
              theme.palette.primary.main,
              0.28
            )}`,
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}