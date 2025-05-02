import React, { useState } from "react";
import { Box, Typography, Paper, IconButton, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PaymentDialog from "./PaymentDialog";

export default function CartSidebar({ cart, onRemove, onCheckout }) {
  const [openDialog, setOpenDialog] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Box sx={{ position: "sticky", top: 20, alignSelf: "start", zIndex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Carrito
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {cart.length === 0 ? (
          <Typography color="text.secondary">Sin artículos</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0 }}>
            {cart.map((item) => (
              <Box
                key={item.id}
                component="li"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Box>
                  <Typography variant="body2">
                    {item.name} {item.variation?.color} {item.size ? `- ${item.size}` : ""} x
                    {item.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => onRemove(item.id)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Box mt={2} borderTop={1} pt={1} borderColor="divider">
              <Typography variant="subtitle1">Total: ${total.toFixed(2)}</Typography>
            </Box>
          </Box>
        )}
        <Button
          variant="contained"
          fullWidth
          color="primary"
          disabled={cart.length === 0}
          onClick={() => setOpenDialog(true)}
          sx={{ mt: 2 }}
        >
          Cobrar
        </Button>
      </Paper>

      <PaymentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        total={total}
        onConfirm={(paymentInfo) => {
          setOpenDialog(false);
          onCheckout(paymentInfo); // ahora recibe info del pago
        }}
      />
    </Box>
  );
}
