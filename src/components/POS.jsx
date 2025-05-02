import React from "react";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import ProductCard from "./POS/ProductCard";
import Cart from "./POS/Cart";
import { usePOSLogic } from "../hooks/POS/usePOSLogic";

export default function POS({ posName }) {
  const {
    search,
    setSearch,
    products,
    cart,
    selectedVariation,
    selectedSize,
    setSelectedVariation,
    setSelectedSize,
    handleAdd,
    handleRemove,
    handleDecrease,
    handleCheckout,
    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
  } = usePOSLogic();

  if (!products) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box mt={3} px={5}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Punto de Venta:</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight="bold" color="secondary">
            {posName}
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              localStorage.removeItem("POS_TOKEN");
              window.location.href = "/prueba/pos";
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Box>

      <TextField
        label="Buscar producto"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Box mt={3} display="grid" gridTemplateColumns={{ xs: "1fr", md: "3fr 1fr" }} gap={2}>
        {/* Productos */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Productos
          </Typography>
          <Box display="grid" gap={2} gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selectedVariation={selectedVariation}
                selectedSize={selectedSize}
                setSelectedVariation={setSelectedVariation}
                setSelectedSize={setSelectedSize}
                cart={cart}
                onAdd={handleAdd}
                onRemove={handleRemove}
                handleDecrease={handleDecrease}
                getQuantityInCart={getQuantityInCart}
                getAvailableStock={getAvailableStock}
                getProductImage={getProductImage}
                isVariantProduct={isVariantProduct}
              />
            ))}
          </Box>
        </Box>

        {/* Carrito */}
        <Cart
          cart={cart}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
        />
      </Box>
    </Box>
  );
}
