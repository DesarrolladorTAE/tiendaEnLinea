// ModalDevolucionExtendido.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Grid,
  Tabs,
  Tab,
  Alert,
  Checkbox,
  FormControlLabel,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import axiosClient from "../config/axiosClientPOS";
import { showError, showSuccess } from "../utils/alerts";

export default function ModalDevolucionExtendido({ open, onClose, ventaId, onSuccess }) {
  const [productosVenta, setProductosVenta] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sustitutos, setSustitutos] = useState({});
  const [motivo, setMotivo] = useState("");
  const [tab, setTab] = useState("parcial");
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);

  useEffect(() => {
    if (open) {
      resetCampos();
      cargarProductos();
    }
  }, [open]);

  const resetCampos = () => {
    setSelectedIds([]);
    setSustitutos({});
    setMotivo("");
    setTab("parcial");
    setBusqueda("");
    setProductoSeleccionadoId(null);
  };

  const cargarProductos = async () => {
    try {
      const venta = await axiosClient.get(`/ventas/${ventaId}/items`);
      setProductosVenta(venta.data.filter((p) => p.estado === "vendido"));

      const inventario = await axiosClient.get("/productos/buscar?tipo=venta");
      setProductosDisponibles(inventario.data);
    } catch (error) {
      showError("Error al cargar productos.");
    }
  };

  const toggleSeleccion = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (tab !== "total" && selectedIds.length === 0) {
      showError("Selecciona al menos un producto.");
      return;
    }

    if (!motivo.trim()) {
      showError("El motivo es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      let tipo = tab === "cambio" ? "cambio_producto" : "reembolso";
      const items =
        tab === "total"
          ? productosVenta.map((p) => ({
              sale_item_id: p.id,
              cantidad: p.quantity,
              accion: "reembolso",
            }))
          : selectedIds.map((id) => {
              const item = {
                sale_item_id: id,
                cantidad: productosVenta.find((p) => p.id === id).quantity,
                accion: tipo,
              };
              if (tipo === "cambio_producto") {
                const s = sustitutos[id];
                if (!s || !s.producto_nuevo_id) throw new Error("Faltan productos sustitutos");
                item.producto_nuevo_id = s.producto_nuevo_id;
                item.cantidad_nueva = 1;
              }
              return item;
            });

      await axiosClient.post(`/devoluciones/${ventaId}/registrar`, {
        tipo,
        motivo,
        items,
      });

      showSuccess("Devolución registrada correctamente.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      showError("Error al registrar la devolución.");
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productosDisponibles.filter((prod) =>
    prod.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    prod.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Alert icon={<WarningAmberIcon />} severity="warning" sx={{ mb: 1 }}>
          Cancelar / Devolver Venta
        </Alert>
        <Typography>
          Estás gestionando una operación sobre la venta <strong>#{ventaId}</strong>.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(e, val) => {
            setTab(val);
            setSelectedIds([]);
            setSustitutos({});
          }}
          centered
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab value="total" label="REEMBOLSO TOTAL" />
          <Tab value="parcial" label="DEVOLUCIÓN PARCIAL" />
          <Tab value="cambio" label="CAMBIO DE PRODUCTO" />
        </Tabs>

        {(tab === "parcial" || tab === "cambio") && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Selecciona los productos:
            </Typography>
            <Grid container spacing={2}>
              {productosVenta.map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: selectedIds.includes(p.id)
                        ? "2px solid #1976d2"
                        : "1px solid #ccc",
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                    onClick={() => toggleSeleccion(p.id)}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSeleccion(p.id)}
                          color="primary"
                        />
                      }
                      label={
                        <Box textAlign="center">
                          <Typography fontWeight="bold">{p.nombre}</Typography>
                          <Typography variant="body2">Cantidad: x{p.quantity}</Typography>
                        </Box>
                      }
                      sx={{ width: "100%", justifyContent: "center" }}
                    />

                    {tab === "cambio" && selectedIds.includes(p.id) && (
                      <>
                        <TextField
                          label="Buscar producto"
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          fullWidth
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setBusqueda("")}> 
                                  {busqueda ? <CloseIcon /> : <SearchIcon />} 
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mt: 2, mb: 1 }}
                        />

                        <Box
                          sx={{
                            maxHeight: 200,
                            overflowY: "auto",
                            border: "1px solid #ccc",
                            borderRadius: 1,
                            width: "100%",
                            mt: 1,
                          }}
                        >
                          {productosFiltrados.map((prod) => (
                            <Box
                              key={prod.id}
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: "pointer",
                                backgroundColor:
                                  sustitutos[p.id]?.producto_nuevo_id === prod.id
                                    ? "#e3f2fd"
                                    : "white",
                                borderBottom: "1px solid #eee",
                                "&:hover": { backgroundColor: "#f5f5f5" },
                              }}
                              onClick={() =>
                                setSustitutos((prev) => ({
                                  ...prev,
                                  [p.id]: {
                                    ...prev[p.id],
                                    producto_nuevo_id: prod.id,
                                  },
                                }))
                              }
                            >
                              <Typography variant="body2">
                                {prod.name} - Stock: {prod.stock} - ${prod.price}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <TextField
          label="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 3 }}
        />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Button onClick={onClose} color="primary">
          CERRAR
        </Button>
        <Button
          variant="contained"
          color={tab === "cambio" ? "info" : "error"}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Procesando..."
            : tab === "cambio"
            ? "CAMBIAR PRODUCTOS"
            : "DEVOLVER PRODUCTOS"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
