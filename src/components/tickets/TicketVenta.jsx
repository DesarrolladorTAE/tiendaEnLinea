import React, { forwardRef } from "react";
import { Box, Typography, Divider } from "@mui/material";

// ForwardRef para permitir impresión directa
const TicketVenta = forwardRef(({ venta, tienda }, ref) => {
  if (!venta) return null;

  return (
    <Box ref={ref} sx={{ width: 280, padding: 2, fontSize: 12, fontFamily: 'monospace' }}>
      {/* Encabezado del ticket */}
      <Typography variant="h6" align="center" fontWeight="bold">
        {tienda?.nombre || "Nombre del Negocio"}
      </Typography>
      {tienda?.direccion && (
        <Typography variant="body2" align="center">
          {tienda.direccion}
        </Typography>
      )}
      {tienda?.telefono && (
        <Typography variant="body2" align="center">
          Tel: {tienda.telefono}
        </Typography>
      )}
      <Divider sx={{ my: 1 }} />

      {/* Datos de venta */}
      <Typography variant="body2">
        Fecha: {new Date(venta.created_at).toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Caja: {venta.pos_location?.name || "-"}
      </Typography>

      <Divider sx={{ my: 1 }} />

      {/* Productos (placeholder porque aún no tienes detalle de productos) */}
      <Box sx={{ my: 1 }}>
        <Typography variant="body2">Artículos vendidos: {venta.items_count}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Totales */}
      <Box display="flex" justifyContent="space-between">
        <Typography variant="body2">Total:</Typography>
        <Typography variant="body2" fontWeight="bold">
          ${venta.total_amount.toFixed(2)}
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Mensaje final */}
      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Gracias por su compra
      </Typography>
    </Box>
  );
});

export default TicketVenta;