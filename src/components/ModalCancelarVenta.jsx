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
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

import axiosClient from "../config/axiosClientPOS";
import { showError, showSuccess } from "../utils/alerts";

export default function ModalCancelarVenta({
  open,
  onClose,
  ventaId,
  onSuccess,
}) {
  const theme = useTheme();

  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo("");
      setLoading(false);
    }
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  const handleCancelar = async () => {
    if (!motivo.trim()) {
      showError("Debe ingresar el motivo de la cancelación.");
      return;
    }

    setLoading(true);

    try {
      await axiosClient.post(`/cancelacion/venta/${ventaId}`, {
        motivo: motivo.trim(),
      });

      showSuccess("Venta cancelada correctamente.");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      showError(
        error?.response?.data?.message ||
          "Ocurrió un error al procesar la cancelación."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
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
                bgcolor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.main,
              }}
            >
              <WarningAmberRoundedIcon />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={900} fontSize={20}>
                Cancelación total de venta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Esta acción cancelará completamente la venta seleccionada.
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
            Está a punto de cancelar la venta{" "}
            <strong>#{ventaId || "N/A"}</strong>. Verifique la información antes
            de continuar.
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
            <Typography fontWeight={800} mb={0.5}>
              Detalle de la acción
            </Typography>

            <Typography variant="body2" color="text.secondary">
              La cancelación total marcará la venta como cancelada y podrá
              afectar reportes, historial y cortes relacionados con esta
              operación.
            </Typography>
          </Box>

          <TextField
            fullWidth
            required
            label="Motivo de cancelación"
            placeholder="Ejemplo: Error en el cobro, venta duplicada, solicitud del cliente..."
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
          color="error"
          onClick={handleCancelar}
          disabled={loading || !ventaId}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DeleteForeverRoundedIcon />
            )
          }
          sx={{
            borderRadius: 2.5,
            py: 1.2,
            fontWeight: 900,
            boxShadow: `0 12px 30px ${alpha(theme.palette.error.main, 0.32)}`,
          }}
        >
          {loading ? "Cancelando..." : "Confirmar cancelación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}