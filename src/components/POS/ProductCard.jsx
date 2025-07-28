import React from "react";
import { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";

export default function ProductCard({
  product,
  selectedVariation,
  selectedSize,
  setSelectedVariation,
  setSelectedSize,
  cart,
  onAdd,
  onRemove,
  handleDecrease,
  getQuantityInCart,
  getAvailableStock,
  getProductImage,
  isVariantProduct,
}) {
  const baseId = product.id;
  const selectedVar = selectedVariation[baseId];
  const selectedSz = selectedSize[baseId];
  const compositeId =
    selectedVar && selectedSz
      ? `${baseId}-${selectedVar.id}-${selectedSz}`
      : baseId;

  const canAdd = !isVariantProduct(product) || (selectedVar && selectedSz);
  const stock = getAvailableStock({
    ...product,
    variation: selectedVar,
    size: selectedSz,
  });

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleAddOnTouch = () => {
    if (canAdd && stock > getQuantityInCart(compositeId)) {
      onAdd({
        ...product,
        variation: selectedVar,
        size: selectedSz,
        id: compositeId,
      });
    }
  };
  // Dentro del componente ProductCard:
  const [inputQty, setInputQty] = useState("");

  // Sincronizar cuando cambia el producto o el carrito
  useEffect(() => {
    const qty = getQuantityInCart(compositeId);
    setInputQty(qty > 0 ? qty.toString() : "");
  }, [compositeId, cart]); // <- importante incluir el carrito aquí

  return (
    <Paper
      variant="outlined"
      {...(isTouchDevice && { onTouchEnd: handleAddOnTouch })}
      sx={{
        p: 2,
        backgroundColor: stock === 0 ? "#ffebee" : "inherit",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 320, // ajustable según tus necesidades
        cursor:
          isTouchDevice && canAdd && stock > getQuantityInCart(compositeId)
            ? "pointer"
            : "default",
      }}
    >
      {getProductImage(product) && (
        <Box
          component="img"
          src={getProductImage(product)}
          alt={product.name}
          sx={{
            width: "100%",
            height: 100,
            objectFit: "contain",
            mb: 1,
            pointerEvents: "none",
          }}
        />
      )}

      <Typography noWrap variant="subtitle1" sx={{ pointerEvents: "none" }}>
        {product.name}
      </Typography>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pointerEvents: "none" }}
      >
        <Box>
          {product.discount > 0 ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through" }}
              >
                ${product.price.toFixed(2)}
              </Typography>
              <Typography variant="h6" color="error" fontWeight="bold">
                ${(product.price * (1 - product.discount / 100)).toFixed(2)}
              </Typography>
              <Box
                sx={{
                  backgroundColor: "#ff5722",
                  color: "white",
                  fontSize: "11px",
                  px: 1,
                  py: 0.2,
                  borderRadius: "4px",
                  display: "inline-block",
                  mt: 0.5,
                }}
              >
                -{product.discount}% dto.
              </Box>
            </>
          ) : (
            <Typography variant="h6" color="primary">
              ${product.price.toFixed(2)}
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Stock: {stock}
        </Typography>
      </Box>

      {isVariantProduct(product) ? (
        <>
          <TextField
            id={`variation-${baseId}`}
            name={`variation-${baseId}`}
            select
            size="small"
            fullWidth
            label="Variación"
            sx={{ mt: 1 }}
            value={selectedVar?.id || ""}
            onChange={(e) => {
              const variation = product.variation.find(
                (v) => v.id == e.target.value
              );
              setSelectedVariation((prev) => ({
                ...prev,
                [baseId]: variation,
              }));
              setSelectedSize((prev) => ({ ...prev, [baseId]: "" }));
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {product.variation.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.color}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id={`size-${baseId}`}
            name={`size-${baseId}`}
            select
            size="small"
            fullWidth
            label="Tamaño"
            sx={{ mt: 1 }}
            value={selectedSz || ""}
            onChange={(e) =>
              setSelectedSize((prev) => ({ ...prev, [baseId]: e.target.value }))
            }
            disabled={!selectedVar}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedVar?.size?.length ? (
              selectedVar.size.map((s) => (
                <MenuItem key={s.name} value={s.name}>
                  {s.name} ({s.stock})
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">
                {selectedVar
                  ? "Sin tamaños disponibles"
                  : "Seleccione una variación"}
              </MenuItem>
            )}
          </TextField>
        </>
      ) : (
        <Box sx={{ height: 80, pointerEvents: "none" }} /> // espacio reservado si no tiene variaciones
      )}

      <Box sx={{ flexGrow: 1 }} />

      <Box
        mt={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          size="small"
          color="error"
          variant="contained"
          // Evitamos que el touch en “–” suba al padre
          onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleDecrease(compositeId);
          }}
          disabled={!canAdd}
        >
          –
        </Button>
        
        <TextField
          type="number"
          variant="standard"
          inputProps={{
            step: "any",
            min: 0,
            style: { textAlign: "center", width: 60 },
          }}
          value={inputQty}
          onChange={(e) => {
            const val = e.target.value;
            setInputQty(val); // dejar que el usuario escriba lo que quiera

            const value = parseFloat(val);
            if (!isNaN(value) && value >= 0 && value <= stock) {
              onAdd({
                ...product,
                variation: selectedVar,
                size: selectedSz,
                id: compositeId,
                quantity: value,
              });
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />

        <Button
          size="small"
          variant="contained"
          // Evitamos que el touch en “+” suba al padre
          onTouchEnd={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAdd({
              ...product,
              variation: selectedVar,
              size: selectedSz,
              id: compositeId,
            });
          }}
          disabled={
            !canAdd || stock === getQuantityInCart(compositeId) || stock === 0
          }
        >
          +
        </Button>
      </Box>
    </Paper>
  );
}
