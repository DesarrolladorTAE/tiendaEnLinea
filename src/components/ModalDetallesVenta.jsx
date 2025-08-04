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
} from "@mui/material";
import axiosClient from "../config/axiosClientPOS";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ModalDetallesVenta({ open, onClose, ventaId }) {
  const [detalles, setDetalles] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalles de la Compra</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : detalles ? (
          <>
            <Typography variant="body1" fontWeight="bold">
              Folio: {detalles.id}
            </Typography>
            <Typography variant="body2">
              Fecha:{" "}
              {format(new Date(detalles.created_at), "d 'de' MMMM 'del' yyyy, HH:mm", {
                locale: es,
              })}
            </Typography>
            <Typography variant="body2">
              Tipo de Pago:{" "}
              {detalles.tipo_pago?.replace("_", " ")?.toUpperCase() || "—"}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {detalles.productos?.map((prod, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={`${prod.nombre} (x${prod.cantidad})`}
                    secondary={`$${Number(prod.precio_unitario).toFixed(2)} c/u`}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" textAlign="right">
              Total: ${Number(detalles.total_amount).toFixed(2)}
            </Typography>
          </>
        ) : (
          <Typography>No se encontraron detalles.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
