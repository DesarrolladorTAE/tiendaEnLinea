// src/components/POS.jsx
import React, { useState, useEffect } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
// import productsData from "../data/products.json";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  MenuItem,
} from "@mui/material";
import axiosClient from "../config/axiosClientPOS";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import Tooltip from "@mui/material/Tooltip";

export default function POS({ posName }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  useEffect(() => {
    axiosClient
      .get("my-products")
      .then(({ data }) => {
        console.log("📦 Productos recibidos:", data);
        setProducts(data);
      })
      .catch((error) => {
        console.error("Error cargando productos:", error);
        setProducts([]); // para evitar que quede null
      });
  }, []);

  const getAvailableStock = (product) => {
    if (typeof product.stock === "number") return product.stock;

    // Para productos con variaciones
    if (product.variation && product.size) {
      const variation = product.variation;
      const size = product.size;
      const matchSize = variation.size.find((s) => s.name === size);
      return matchSize?.stock || 0;
    }

    return 0;
  };

  const handleAdd = (product) => {
    const availableStock = getAvailableStock(product);

    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === product.id);

      if (index !== -1) {
        const currentQty = prevCart[index].quantity;

        if (currentQty >= availableStock) {
          alert("⚠️ No hay más stock disponible para este producto.");
          return prevCart;
        }

        const updated = [...prevCart];
        updated[index] = {
          ...updated[index],
          quantity: currentQty + 1,
        };
        return updated;
      } else {
        if (availableStock < 1) {
          alert("❌ No hay stock disponible.");
          return prevCart;
        }

        return [...prevCart, { ...product, quantity: 1, originalId: product.id }];
      }
    });
  };

  const handleRemove = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  if (!products) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const payload = {
      items: cart.map((item) => {
        const [productId] = item.id.split("-");

        let variationSizeId = null;

        if (item.variation?.size && item.size) {
          const match = item.variation.size.find((s) => s.name === item.size);
          variationSizeId = match?.id ?? null;
        }

        return {
          product_id: parseInt(productId),
          variation_size_id: variationSizeId,
          quantity: item.quantity,
        };
      }),
    };

    try {
      console.log("📦 Payload enviado:", payload);
      const { data } = await axiosClient.post("/sales", payload);
      console.log("✅ Venta registrada:", data);
      setCart([]);
      alert("Venta registrada correctamente.");
    } catch (error) {
      const response = error.response?.data;
      console.error("❌ Error al registrar venta:", response);
      if (response?.errors?.stock) {
        alert("⚠️ Error de stock:\n" + response.errors.stock.join("\n"));
      } else {
        alert("Error al cobrar. Revisa productos o stock.");
      }
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Box mt={3} px={5}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" >Punto de Venta:</Typography>
        <Typography variant="h4" fontWeight="bold" color="secondary">
          {posName}
        </Typography>
      </Box>

      <TextField
        label="Buscar producto"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Box
        mt={3}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "3fr 1fr",
          },
          gap: 2,
        }}
      >
        {/* Zona de productos */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Productos
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {filtered.map((product) => (
              <Paper
                key={product.id}
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 150,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography noWrap variant="subtitle1">
                    {product.name}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {product.price_formatted || `$${product.price}`}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                      {typeof product.stock === "number" ? (
                        <Typography variant="body2" color="text.secondary">
                          Stock: {product.stock}
                        </Typography>
                      ) : product.variation?.length ? (
                        <Tooltip title="Producto con variaciones">
                          <Inventory2Icon fontSize="small" color="action" />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="error">
                          Sin stock
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
                {product.variation?.length ? (
                  <>
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Variacion"
                        value={selectedVariation[product.id]?.id || ""}
                        onChange={(e) => {
                          const variation = product.variation.find((v) => v.id == e.target.value);
                          setSelectedVariation((prev) => ({ ...prev, [product.id]: variation }));
                          setSelectedSize((prev) => ({ ...prev, [product.id]: "" }));
                        }}
                      >
                        {product.variation.map((v) => (
                          <MenuItem key={v.id} value={v.id}>
                            {v.color}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    {selectedVariation[product.id]?.size && (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          label="Tamaño"
                          value={selectedSize[product.id] || ""}
                          onChange={(e) =>
                            setSelectedSize((prev) => ({ ...prev, [product.id]: e.target.value }))
                          }
                        >
                          {selectedVariation[product.id].size.map((s, i) => (
                            <MenuItem key={i} value={s.name}>
                              {s.name} ({s.stock})
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      disabled={!selectedVariation[product.id] || !selectedSize[product.id]}
                      onClick={() =>
                        handleAdd({
                          ...product,
                          variation: selectedVariation[product.id],
                          size: selectedSize[product.id],
                          id: `${product.id}-${selectedVariation[product.id].id}-${
                            selectedSize[product.id]
                          }`,
                        })
                      }
                      sx={{ mt: 1 }}
                    >
                      Agregar
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" size="small" onClick={() => handleAdd(product)}>
                    Agregar
                  </Button>
                )}
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Zona de carrito */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Carrito
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {cart.length === 0 ? (
              <Typography color="text.secondary">Sin artículos</Typography>
            ) : (
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
                {cart.map((item, i) => (
                  <Box
                    key={i}
                    component="li"
                    mb={1}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
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

                    <IconButton size="small" color="error" onClick={() => handleRemove(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Box mt={2} sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}>
                  <Typography variant="subtitle1">
                    Total: $
                    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Cobrar
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
