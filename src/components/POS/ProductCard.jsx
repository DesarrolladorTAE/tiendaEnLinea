// src/components/POS/ProductCard.jsx
import React, { useRef } from "react";
import { Paper, Box, Typography, TextField, MenuItem, Button } from "@mui/material";

export default function ProductCard({
  product,
  selectedVariation = {},
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
  isMdUp = false, // ✅ NUEVO: true en desktop, false en móvil
}) {
  const baseId = product?.id;
  const selectedVar = selectedVariation?.[baseId] ?? null;
  const selectedSz = selectedSize?.[baseId] ?? null;

  const compositeId =
    selectedVar && selectedSz ? `${baseId}-${selectedVar.id}-${selectedSz}` : baseId;

  const canAdd = !isVariantProduct(product) || (!!selectedVar && !!selectedSz);

  const stock = getAvailableStock({
    ...product,
    variation: selectedVar,
    size: selectedSz,
  });

  // ✅ Tap real (si se movió = scroll, NO agrega) -> SOLO desktop no lo necesita, pero lo dejamos por si tablet
  const touchStart = useRef({ x: 0, y: 0, moved: false });
  const TAP_MOVE_PX = 10;

  const addOne = () => {
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
      // ✅ Desktop: click en toda la card agrega
      onClick={() => {
        if (isMdUp) addOne();
      }}
      // ✅ Mobile: NO agregar tocando la card
      onPointerDown={(e) => {
        if (isMdUp) return;
        // móvil: ignora por completo el "tap en card"
        return;
      }}
      // (si quieres conservar lógica touch en desktop/tablet puedes dejarla activa solo cuando isMdUp)
      onPointerDownCapture={(e) => {
        if (!isMdUp) return;
        if (e.pointerType !== "touch") return;
        touchStart.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMoveCapture={(e) => {
        if (!isMdUp) return;
        if (e.pointerType !== "touch") return;
        const dx = Math.abs(e.clientX - touchStart.current.x);
        const dy = Math.abs(e.clientY - touchStart.current.y);
        if (dx > TAP_MOVE_PX || dy > TAP_MOVE_PX) touchStart.current.moved = true;
      }}
      onPointerUpCapture={(e) => {
        if (!isMdUp) return;
        if (e.pointerType !== "touch") return;
        if (touchStart.current.moved) return;
        addOne();
      }}
      sx={{
        p: { xs: 1.25, md: 2 },
        backgroundColor: stock === 0 ? "#ffebee" : "inherit",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: { xs: 280, md: 320 },
        cursor:
          isMdUp && canAdd && stock > getQuantityInCart(compositeId) ? "pointer" : "default",
        touchAction: "pan-y",
      }}
    >
      {getProductImage(product) && (
        <Box
          component="img"
          src={getProductImage(product)}
          alt={product.name}
          sx={{
            width: "100%",
            height: { xs: 84, md: 100 },
            objectFit: "contain",
            mb: 1,
            pointerEvents: "none",
          }}
        />
      )}

      <Typography variant="subtitle1" sx={{ pointerEvents: "none", fontWeight: 800 }}>
        {product.name}
      </Typography>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pointerEvents: "none" }}
      >
        <Box>
          {Number(product?.discount) > 0 ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through" }}
              >
                ${(Number(product?.price) || 0).toFixed(2)}
              </Typography>
              <Typography variant="h6" color="error" fontWeight="bold">
                $
                {(
                  (Number(product?.price) || 0) *
                  (1 - (Number(product?.discount) || 0) / 100)
                ).toFixed(2)}
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
              ${(Number(product?.price) || 0).toFixed(2)}
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
              const variation = product.variation.find((v) => v.id == e.target.value);
              setSelectedVariation((prev) => ({ ...prev, [baseId]: variation }));
              setSelectedSize((prev) => ({ ...prev, [baseId]: "" }));
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
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
            onChange={(e) => setSelectedSize((prev) => ({ ...prev, [baseId]: e.target.value }))}
            disabled={!selectedVar}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            {Array.isArray(selectedVar?.size) && selectedVar.size.length ? (
              selectedVar.size.map((s) => (
                <MenuItem key={s.name} value={s.name}>
                  {s.name} ({s.stock})
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">
                {selectedVar ? "Sin tamaños disponibles" : "Seleccione una variación"}
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
          e.stopPropagation();
          addOne();
        }}
        disabled={!canAdd || stock === 0}
        sx={{ textTransform: "none", fontWeight: 900 }}
      >
        Agregar al carrito
      </Button>
    </Paper>
  );
}
