import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  CircularProgress,
  Box,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from "@mui/material";
import axiosClient from "../config/axiosClientPOS";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PaymentIcon from "@mui/icons-material/Payment";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";

export default function ModalDetallesVenta({ open, onClose, ventaId }) {
  const [detalles, setDetalles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const cargarDetalles = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get(`/ventas/${ventaId}`);
        console.log("📦 Detalles recibidos:", data);
        setDetalles(data);
      } catch (error) {
        console.error("Error al cargar detalles", error);
      } finally {
        setLoading(false);
      }
    };

    if (ventaId && open) {
      cargarDetalles();
    }
  }, [ventaId, open]);

  const renderChip = (tipo) => {
    switch (tipo) {
      case "efectivo":
        return <Chip label="Efectivo" color="success" size="small" />;
      case "tc":
        return <Chip label="Tarjeta de crédito" color="error" size="small" />;
      case "td":
        return <Chip label="Tarjeta de débito" color="info" size="small" />;
      default:
        return <Chip label="—" variant="outlined" size="small" />;
    }
  };

  const enviarPorWhatsapp = async () => {
    setSending(true);
    try {
      const { data } = await axiosClient.post(
        `/sales/${ventaId}/send-whatsapp`
      );
      console.log("✅ Ticket enviado:", data);
      showSuccess("Ticket enviado por WhatsApp correctamente.");
    } catch (error) {
      console.error("❌ Error al enviar ticket:", error);
      showError("No se pudo enviar el ticket por WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>🧾 Detalles de la Compra</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : detalles ? (
          <>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body1" fontWeight="bold">
                Folio: #{detalles.id}
              </Typography>
              <Typography variant="body1" fontWeight={"bold"}>
                Fecha:{" "}
                {format(
                  new Date(detalles.created_at),
                  "d 'de' MMMM 'del' yyyy, HH:mm",
                  { locale: es }
                )}
              </Typography>
            </Stack>

            <Box mb={2}>
              <Typography variant="body2" fontWeight="bold">
                Tipo de Pago: {renderChip(detalles.tipo_pago)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense>
              {detalles.productos?.map((prod, idx) => (
                <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                  <ListItemText
                    primary={`${prod.nombre} (x${prod.cantidad})`}
                    secondary={`$${Number(prod.precio_unitario).toFixed(
                      2
                    )} c/u`}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="body2">
                <PaymentIcon
                  sx={{ fontSize: 16, verticalAlign: "middle", mr: 1 }}
                />
                Con cuánto pagó:{" "}
                <strong>${Number(detalles.paid_amount).toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2">
                <ChangeCircleIcon
                  sx={{ fontSize: 16, verticalAlign: "middle", mr: 1 }}
                />
                Cambio entregado:{" "}
                <strong>${Number(detalles.cambio).toFixed(2)}</strong>
              </Typography>
              <Typography variant="h6" align="right" sx={{ mt: 2 }}>
                <MonetizationOnIcon
                  sx={{ fontSize: 22, verticalAlign: "middle", mr: 1 }}
                />
                Total:{" "}
                <strong>${Number(detalles.total_amount).toFixed(2)}</strong>
              </Typography>
            </Stack>
          </>
        ) : (
          <Typography>No se encontraron detalles.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
