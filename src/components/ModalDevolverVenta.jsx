// ModalDevolucionExtendido.jsx
import React, { useEffect, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AssignmentReturnRoundedIcon from "@mui/icons-material/AssignmentReturnRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

import axiosClient from "../config/axiosClientPOS";
import { showError, showSuccess } from "../utils/alerts";

export default function ModalDevolucionExtendido({
  open,
  onClose,
  ventaId,
  onSuccess,
}) {
  const theme = useTheme();

  const [productosVenta, setProductosVenta] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);

  useEffect(() => {
    if (!open) return;

    setMotivo("");
    setProductosVenta([]);
    setLoading(false);
    cargarDatos();
  }, [open, ventaId]);

  const cargarDatos = async () => {
    if (!ventaId) return;

    setLoadingDatos(true);

    try {
      const ventaResp = await axiosClient.get(`/ventas/${ventaId}/items`);
      const items = Array.isArray(ventaResp.data) ? ventaResp.data : [];

      setProductosVenta(
        items.filter((p) => (p.estado || "vendido") === "vendido")
      );
    } catch (error) {
      showError("Error al cargar los productos de la venta.");
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      showError("Debe ingresar el motivo del reembolso.");
      return;
    }

    if (!productosVenta.length) {
      showError("No hay productos disponibles para reembolsar.");
      return;
    }

    setLoading(true);

    try {
      const items = productosVenta.map((p) => ({
        sale_item_id: p.id,
        cantidad: p.quantity,
        accion: "reembolso",
      }));

      await axiosClient.post(`/devoluciones/${ventaId}/reembolso-total`, {
        motivo: motivo.trim(),
        items,
      });

      showSuccess("Reembolso total registrado correctamente.");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      const msg =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        "Error al registrar el reembolso total.";

      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #111827 0%, #1f2937 100%)"
              : "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.warning.main, 0.14),
                color: theme.palette.warning.main,
              }}
            >
              <AssignmentReturnRoundedIcon />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={900} fontSize={20}>
                Reembolso total de venta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registre la devolución completa de la venta seleccionada.
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
          <Alert
            severity="warning"
            icon={<WarningAmberRoundedIcon />}
            sx={{
              borderRadius: 3,
              alignItems: "center",
              border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
            }}
          >
            Está a punto de registrar un <strong>reembolso total</strong> para
            la venta <strong>#{ventaId || "N/A"}</strong>.
          </Alert>

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
              <ReceiptLongRoundedIcon
                sx={{ color: "text.secondary", mt: 0.3 }}
              />

              <Box>
                <Typography fontWeight={800} mb={0.5}>
                  Detalle de la operación
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  El reembolso total aplicará sobre todos los productos vendidos
                  de esta venta. Esta acción puede afectar reportes, historial,
                  cortes e inventario relacionado.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 1, fontWeight: 800 }}
                  color="text.primary"
                >
                  Productos incluidos:{" "}
                  {loadingDatos ? "Cargando..." : productosVenta.length}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <TextField
            fullWidth
            required
            label="Motivo del reembolso"
            placeholder="Ejemplo: Solicitud del cliente, error en venta, producto no entregado..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            multiline
            minRows={4}
            disabled={loading}
            inputProps={{ maxLength: 500 }}
            helperText={`${motivo.length}/500 caracteres`}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
              },
            }}
          />
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
            py: 1.2,
            fontWeight: 800,
          }}
        >
          Cerrar
        </Button>

        <Button
          fullWidth
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={loading || loadingDatos || !ventaId}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AssignmentReturnRoundedIcon />
            )
          }
          sx={{
            borderRadius: 2.5,
            py: 1.2,
            fontWeight: 900,
            color: "#fff",
            boxShadow: `0 12px 30px ${alpha(
              theme.palette.warning.main,
              0.32
            )}`,
          }}
        >
          {loading ? "Procesando..." : "Confirmar reembolso total"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}