import React, { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import { showError, showSuccess } from "../../utils/alerts";

export default function ProductCard({
  product,
  selectedVariation = {},  // 👈 default seguro
  selectedSize = {},
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
  const baseId = product?.id;
  const selectedVar = selectedVariation?.[baseId] ?? null;
  const selectedSz  = selectedSize?.[baseId] ?? null;
  const compositeId =
    selectedVar && selectedSz
      ? `${baseId}-${selectedVar.id}-${selectedSz}`
      : baseId;

const canAdd = !isVariantProduct(product) || (!!selectedVar && !!selectedSz);
  const stock = getAvailableStock({
    ...product,
    variation: selectedVar,
    size: selectedSz,
  });

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleAddOnTouch = () => {
    const qtyInCart = getQuantityInCart(compositeId);
    if (canAdd && qtyInCart < stock) {
      onAdd({
        ...product,
        variation: selectedVar,
        size: selectedSz,
        id: compositeId,
        quantity: qtyInCart + 1,
      });
    }
  };

  return (
    <Paper
      variant="outlined"
      onClick={handleAddOnTouch}
      {...(isTouchDevice && { onTouchEnd: handleAddOnTouch })}
      sx={{
        p: 2,
        backgroundColor: stock === 0 ? "#ffebee" : "inherit",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 320,
        cursor:
          canAdd && stock > getQuantityInCart(compositeId)
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

      <Typography  variant="subtitle1" sx={{ pointerEvents: "none" }}>
        {product.name}
      </Typography>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pointerEvents: "none" }}
      >
        <Box>
          {(Number(product?.discount) > 0) ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through" }}
              >
                ${(Number(product?.price) || 0).toFixed(2)}
              </Typography>
              <Typography variant="h6" color="error" fontWeight="bold">
                ${((Number(product?.price)||0) * (1 - (Number(product?.discount)||0) / 100)).toFixed(2)}
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
              ${(Number(product?.price)||0).toFixed(2)}
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
            {(Array.isArray(product?.variation) ? product.variation : []).map((v) => (
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
              setSelectedSize((prev) => ({
                ...prev,
                [baseId]: e.target.value,
              }))
            }
            disabled={!selectedVar}
            onClick={(e) => e.stopPropagation()}
          >
            {Array.isArray(selectedVar?.size) && selectedVar.size.length ? (
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
        <Box sx={{ height: 80, pointerEvents: "none" }} />
      )}

      <Box sx={{ flexGrow: 1 }} />

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={(e) => {
          e.stopPropagation(); // evita doble trigger en móvil
          handleAddOnTouch();
        }}
        disabled={!canAdd || stock === 0}
      >
        Agregar al carrito
      </Button>
    </Paper>
  );
}
