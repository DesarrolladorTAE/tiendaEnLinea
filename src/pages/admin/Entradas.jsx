import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Autocomplete,
  Paper,
  MenuItem,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";
import axiosClient from "../../config/axiosClient";
import { toast } from "react-hot-toast";

export default function StockEntryForm() {
  const [uuidInvoice, setUuidInvoice] = useState("");
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([
    { id: Date.now(), product: null, product_code: "", unit_price: 0, quantity: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const debounceRef = useRef(null);

  const fetchProducts = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return;
    setLoadingProducts(true);

    axiosClient
      .get("/admin/buscar/producto", { params: { search: searchTerm } })
      .then((res) => {
        console.log("📦 Productos recibidos:", res.data);
        setProducts(res.data);
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: Date.now(), product: null, product_code: "", unit_price: 0, quantity: 1 },
    ]);
  };

  const removeLine = (id) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id, updates) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uuidInvoice) return toast.error("Ingresa el UUID de la factura.");

    const items = lines
      .filter((l) => l.product_code && l.quantity > 0)
      .map((l) => {
        const base = {
          product_id: l.product?.id,
          variation_size_id: l.variation_size_id || null,
          unit_price: l.unit_price,
          quantity: l.quantity,
        };

        if (l.product?.has_variations) {
          const selected = l.product.variations?.find((v) => v.code === l.product_code);
          if (selected) {
            base.color = selected.color;
            base.size = selected.size;
          }
        }

        return base;
      });

    if (items.length === 0) return toast.error("Agrega al menos un producto con cantidad válida.");

    console.log("🧾 Payload a enviar:", {
      uuid_invoice: uuidInvoice,
      items,
    });

    setLoading(true);

    await toast.promise(
      axiosClient.post("restocks", {
        uuid_invoice: uuidInvoice,
        items,
      }),
      {
        loading: "Registrando entrada...",
        success: "Entrada de stock registrada correctamente.",
        error: (err) => err?.response?.data?.message || "Error al guardar.",
      }
    );

    setUuidInvoice("");
    setLines([{ id: Date.now(), product: null, product_code: "", unit_price: 0, quantity: 1 }]);
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Registrar entradas de stock
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="UUID de la Factura"
          value={uuidInvoice}
          onChange={(e) => setUuidInvoice(e.target.value)}
          fullWidth
          required
        />

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Variación</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Precio Unitario</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line, idx) => (
              <TableRow key={line.id}>
                <TableCell sx={{ minWidth: 300 }}>
                  <Autocomplete
                    value={line.product}
                    onChange={(_, p) => {
                      updateLine(line.id, {
                        product: p || null,
                        product_code: p?.code || "",
                      });
                    }}
                    onInputChange={(_, inputValue) => {
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => {
                        fetchProducts(inputValue);
                      }, 400);
                    }}
                    options={products}
                    getOptionLabel={(p) => p.name}
                    renderInput={(params) => (
                      <TextField {...params} label="Nombre del producto" size="small" />
                    )}
                    loading={loadingProducts}
                  />
                </TableCell>

                <TableCell sx={{ minWidth: 200 }}>
                  {line.product?.has_variations && Array.isArray(line.product.variations) ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Seleccionar variación"
                      value={line.variation_size_id || ""}
                      onChange={(e) => {
                        const selected = line.product.variations.find(
                          (v) => v.variation_size_id === parseInt(e.target.value)
                        );
                        if (selected) {
                          updateLine(line.id, {
                            variation_size_id: selected.variation_size_id,
                          });
                        }
                      }}
                    >
                      {line.product.variations.map((v) => (
                        <MenuItem key={v.variation_size_id} value={v.variation_size_id}>
                          {v.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Typography color="text.secondary" fontSize={14}>
                      Sin variaciones
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <TextField
                    value={line.product_code}
                    size="small"
                    slotProps={{ htmlInput: { readOnly: true } }}
                  />
                </TableCell>

                <TableCell sx={{ maxWidth: 170 }}>
                  <TextField
                    type="number"
                    value={line.unit_price}
                    onChange={(e) =>
                      updateLine(line.id, { unit_price: parseFloat(e.target.value) })
                    }
                    slotProps={{ htmlInput: { min: 0 } }}
                    size="small"
                  />
                </TableCell>

                <TableCell sx={{ maxWidth: 170 }}>
                  <TextField
                    type="number"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.id, { quantity: parseInt(e.target.value, 10) })
                    }
                    slotProps={{ htmlInput: { min: 0 } }}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <IconButton onClick={() => removeLine(line.id)} disabled={lines.length === 1}>
                    <RemoveCircle />
                  </IconButton>
                  {idx === lines.length - 1 && (
                    <IconButton onClick={addLine}>
                      <AddCircle />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Guardando..." : "Registrar entrada"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
