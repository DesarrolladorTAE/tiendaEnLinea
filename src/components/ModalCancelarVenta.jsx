import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Stack,
  Grid,
  Checkbox,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import axiosClient from "../config/axiosClientPOS";
import { showError, showSuccess } from "../utils/alerts";

export default function ModalCancelarVenta({
  open,
  onClose,
  ventaId,
  onSuccess,
}) {
  const [tipo, setTipo] = useState("total"); // "total" o "parcial"
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo("");
      setTipo("total");
      setProductos([]);
      setProductosSeleccionados([]);
    }
  }, [open]);

  useEffect(() => {
    if (open && tipo === "parcial" && ventaId) {
      cargarProductos();
    }
  }, [open, tipo, ventaId]);

  const cargarProductos = async () => {
    setLoadingProductos(true);
    try {
      const { data } = await axiosClient.get(`/ventas/${ventaId}/items`);
      setProductos(data.filter((p) => p.estado === "vendido")); // solo los vendidos
    } catch (error) {
      showError("Error al cargar los productos de la venta.");
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleProductoToggle = (id) => {
    setProductosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleCancelar = async () => {
    if (!motivo.trim()) {
      showError("Debes ingresar un motivo.");
      return;
    }

    if (tipo === "parcial" && productosSeleccionados.length === 0) {
      showError("Selecciona al menos un producto para devolver.");
      return;
    }

    setLoading(true);

    try {
      if (tipo === "total") {
        await axiosClient.post(`/cancelacion/venta/${ventaId}`, { motivo });
        showSuccess("Venta cancelada correctamente.");
      } else {
        await axiosClient.post(`/cancelacion/productos/${ventaId}`, {
          motivo,
          sale_item_ids: productosSeleccionados,
        });
        showSuccess("Productos devueltos correctamente.");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      showError("Ocurrió un error al procesar la cancelación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <WarningAmberIcon color="error" />
          <Typography variant="h6">Cancelar / Devolver Venta</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Typography mb={2}>
          Estás a punto de realizar una{" "}
          <strong>
            {tipo === "total" ? "cancelación total" : "devolución parcial"}
          </strong>{" "}
          de la venta <strong>#{ventaId}</strong>.
        </Typography>

        <Box mb={2}>
          <ToggleButtonGroup
            value={tipo}
            exclusive
            onChange={(e, val) => val && setTipo(val)}
            size="small"
            fullWidth
          >
            <ToggleButton value="total">Cancelación Total</ToggleButton>
            <ToggleButton value="parcial">Devolución Parcial</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {tipo === "parcial" && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Selecciona los productos a cancelar:
            </Typography>
            {loadingProductos ? (
              <Box display="flex" justifyContent="center" mt={1}>
                <CircularProgress size={24} />
              </Box>
            ) : productos.length === 0 ? (
              <Typography color="text.secondary" fontSize={14}>
                No hay productos disponibles para devolver.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {productos.map((p) => (
                  <Grid item xs={12} sm={6} md={6} key={p.id}>
                    <Box
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: 2,
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        backgroundColor: productosSeleccionados.includes(p.id)
                          ? "rgba(255, 193, 7, 0.15)"
                          : "#fafafa",
                        transition: "background-color 0.2s",
                      }}
                    >
                      <Checkbox
                        checked={productosSeleccionados.includes(p.id)}
                        onChange={() => handleProductoToggle(p.id)}
                      />
                      <Box>
                        <Typography fontWeight="bold" fontSize={14}>
                          {p.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cantidad: x{parseFloat(p.quantity).toString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        <TextField
          fullWidth
          label="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          multiline
          rows={3}
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleCancelar}
          disabled={loading}
        >
          {tipo === "total" ? "Cancelar Venta" : "Devolver Productos"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
