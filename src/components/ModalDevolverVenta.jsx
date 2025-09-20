// ModalDevolucionExtendido.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, TextField, Box, Grid, Tabs, Tab,
  Alert, Checkbox, FormControlLabel, Paper, InputAdornment,
  IconButton
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
  const [tab, setTab] = useState("parcial"); // "total" | "parcial" | "cambio"
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Reset al abrir
  useEffect(() => {
    if (!open) return;
    resetCampos();
    cargarDatos();
  }, [open]);

  const resetCampos = () => {
    setSelectedIds([]);
    setSustitutos({});
    setMotivo("");
    setTab("parcial");
    setBusqueda("");
  };

  const cargarDatos = async () => {
    try {
      // Ítems de la venta (solo los "vendido")
      const ventaResp = await axiosClient.get(`/ventas/${ventaId}/items`);
      const items = Array.isArray(ventaResp.data) ? ventaResp.data : [];
      setProductosVenta(items.filter((p) => (p.estado || "vendido") === "vendido"));

      // Inventario para búsqueda (tipo=venta fuerza stock>0 en el backend)
      const invResp = await axiosClient.get(`/productos/buscar`, { params: { tipo: "venta" } });
      const lista = invResp.data?.productos ?? []; // el backend responde { ok, productos }
      setProductosDisponibles(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.error(e);
      showError("Error al cargar datos de la venta o inventario.");
    }
  };

  const toggleSeleccion = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productosDisponibles.slice(0, 50);
    return productosDisponibles.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q)
    );
  }, [busqueda, productosDisponibles]);

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
      // Determinar endpoint según la operación
      const url =
        tab === "total"
          ? `/devoluciones/${ventaId}/reembolso-total`
          : tab === "cambio"
          ? `/devoluciones/${ventaId}/cambio-parcial`
          : `/devoluciones/${ventaId}/reembolso-parcial`;

      // Construir items
      let items = [];
      if (tab === "total") {
        items = productosVenta.map((p) => ({
          sale_item_id: p.id,
          cantidad: p.quantity,
          accion: "reembolso",
        }));
      } else if (tab === "parcial") {
        items = selectedIds
          .map((id) => {
            const base = productosVenta.find((p) => p.id === id);
            if (!base) return null;
            return {
              sale_item_id: id,
              cantidad: base.quantity,
              accion: "reembolso",
            };
          })
          .filter(Boolean);
      } else if (tab === "cambio") {
        items = selectedIds
          .map((id) => {
            const base = productosVenta.find((p) => p.id === id);
            if (!base) return null;
            const s = sustitutos[id];
            if (!s?.producto_nuevo_id) {
              throw new Error("Falta seleccionar el producto sustituto.");
            }
            return {
              sale_item_id: id,
              cantidad: base.quantity,
              accion: "cambio_producto",
              producto_nuevo_id: s.producto_nuevo_id,
              cantidad_nueva: 1, // ajusta si tu lógica requiere otra cantidad
            };
          })
          .filter(Boolean);
      }

      await axiosClient.post(url, { motivo, items });

      showSuccess("Operación registrada correctamente.");
      onSuccess?.(); // refresca la vista padre (re-cargar ventas)
      onClose();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.details ||
        e?.response?.data?.message ||
        "Error al registrar la operación.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          onChange={(e, val) => { setTab(val); setSelectedIds([]); setSustitutos({}); }}
          centered
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab value="total" label="REEMBOLSO TOTAL" />
          {/* <Tab value="parcial" label="DEVOLUCIÓN PARCIAL" /> */}
          {/* <Tab value="cambio" label="CAMBIO DE PRODUCTO" /> */}
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
                      border: selectedIds.includes(p.id) ? "2px solid #1976d2" : "1px solid #ccc",
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
                          <Typography fontWeight="bold">{p.nombre || p.name}</Typography>
                          <Typography variant="body2">Cantidad: x{p.quantity}</Typography>
                        </Box>
                      }
                      sx={{ width: "100%", justifyContent: "center" }}
                    />

                    {/* {tab === "cambio" && selectedIds.includes(p.id) && (
                      <>
                        <TextField
                          label="Buscar producto (nombre o SKU)"
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
                            maxHeight: 220,
                            overflowY: "auto",
                            border: "1px solid #ccc",
                            borderRadius: 1,
                            width: "100%",
                            mt: 1,
                          }}
                        >
                          {filtrados.map((prod) => {
                            const active = sustitutos[p.id]?.producto_nuevo_id === prod.id;
                            return (
                              <Box
                                key={prod.id}
                                sx={{
                                  px: 2,
                                  py: 1,
                                  cursor: "pointer",
                                  backgroundColor: active ? "#e3f2fd" : "white",
                                  borderBottom: "1px solid #eee",
                                  "&:hover": { backgroundColor: "#f5f5f5" },
                                }}
                                onClick={() =>
                                  setSustitutos((prev) => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], producto_nuevo_id: prod.id },
                                  }))
                                }
                              >
                                <Typography variant="body2">
                                  {prod.name} · SKU: {prod.sku || "—"} · Stock: {prod.stock} · ${Number(prod.price || 0).toFixed(2)}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </>
                    )} */}
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
        <Button onClick={onClose} color="primary">CERRAR</Button>
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
            : tab === "total"
            ? "REEMBOLSO TOTAL"
            : "DEVOLVER PRODUCTOS"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
