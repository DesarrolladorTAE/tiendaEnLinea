// src/components/POS/ProductCard.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Grid,
  TextField,
  MenuItem,
  alpha,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";

function money(n) {
  const x = Number(n) || 0;
  return x.toFixed(2);
}

function discountedPrice(price, discount) {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  return (p * (1 - d / 100)).toFixed(2);
}

function normalizeAttrs(attrs) {
  const arr = Array.isArray(attrs) ? attrs : [];
  return arr
    .map((a) => ({
      name: String(a?.name ?? "").trim(),
      value: String(a?.value ?? "").trim(),
    }))
    .filter((x) => x.name || x.value);
}

function pickVariantLabel(v) {
  const name = (v?.name ?? "").trim();
  if (name) return name;
  const sku = (v?.sku ?? "").trim();
  if (sku) return sku;
  return `Variante #${v?.id}`;
}

export default function ProductCard({
  product,
  cart,
  onAdd,
  getQuantityInCart,
  getAvailableStock,
  getProductImage,
  isVariantProduct,
  isMdUp = false,
}) {
  const theme = useTheme();

  const baseId = product?.id;
  const hasVariants = Boolean(product?.has_variants) || isVariantProduct(product);
  const useWh = Boolean(product?.use_warehouse_inventory);

  const [openVariants, setOpenVariants] = useState(false);

  // ✅ imagen del producto
  const productImg = getProductImage(product);

  const hasDiscount = Number(product?.discount) > 0;
  const priceFinalProduct = hasDiscount
    ? discountedPrice(product?.price, product?.discount)
    : money(product?.price);

  // ✅ Warehouses (producto simple multi-almacén)
  // IMPORTANTE: con tu backend nuevo, aquí ya debe venir SOLO 1 almacén (el del POS)
  const productWarehouseRows = useMemo(() => {
    const rows = Array.isArray(product?.warehouse_inventories)
      ? product.warehouse_inventories
      : [];
    return rows
      .map((r) => ({
        warehouse_id: r.warehouse_id,
        warehouse_name: r.warehouse_name || `Almacén ${r.warehouse_id}`,
        qty: r.qty ?? r.stock ?? 0,
        location_bin: r.location_bin ?? null,
      }))
      .sort((a, b) => (Number(b.qty) || 0) - (Number(a.qty) || 0));
  }, [product]);

  // ✅ Stock global (según backend; si ya filtraste por almacén, será el del POS)
  const globalStock = useMemo(() => {
    const st = getAvailableStock(product);
    return Number.isFinite(Number(st)) ? Number(st) : 0;
  }, [product, getAvailableStock]);

  // ✅ Hint almacén
  const stockHint = useMemo(() => {
    if (!useWh) return null;
    const withStock = productWarehouseRows.filter((r) => (Number(r.qty) || 0) > 0);
    if (!withStock.length) return "Sin stock";
    const top = withStock.slice(0, 1).map((r) => `${r.warehouse_name}: ${Number(r.qty) || 0}`);
    return top.join(" • ");
  }, [useWh, productWarehouseRows]);

  // ====== producto simple ======
  const simpleCartKey = String(baseId);
  const qtyInCartSimple = getQuantityInCart(simpleCartKey);
  const canAddSimple = !hasVariants;

  // ✅ si es multi-almacén, NO click directo (solo botón)
  const canClickCardToAdd = isMdUp && canAddSimple && !useWh;

  // ---- Modal selección almacén (solo si realmente hay 2+ almacenes en data) ----
  const [openSimpleWh, setOpenSimpleWh] = useState(false);
  const [selectedSimpleWarehouseId, setSelectedSimpleWarehouseId] = useState("");

  const simpleWarehouseRow = useMemo(() => {
    if (!selectedSimpleWarehouseId) return null;
    return (
      productWarehouseRows.find(
        (r) => String(r.warehouse_id) === String(selectedSimpleWarehouseId)
      ) || null
    );
  }, [productWarehouseRows, selectedSimpleWarehouseId]);

  const stockForSimpleWarehouse = useMemo(() => {
    if (!useWh) return globalStock;
    if (!simpleWarehouseRow) return 0;
    return Number(simpleWarehouseRow.qty) || 0;
  }, [useWh, globalStock, simpleWarehouseRow]);

  const simpleWhCartKey = useMemo(() => {
    if (!selectedSimpleWarehouseId) return null;
    return `${baseId}-w${selectedSimpleWarehouseId}`;
  }, [baseId, selectedSimpleWarehouseId]);

  const addSimpleDirectWarehouse = (row) => {
    if (!row) return;
    const cartKey = `${baseId}-w${row.warehouse_id}`;
    const stock = Number(row.qty) || 0;
    const qtyLine = getQuantityInCart(cartKey);
    if (qtyLine >= stock) return;

    onAdd({
      cart_key: cartKey,
      id: cartKey,
      product_id: Number(baseId),
      variant_id: null,
      warehouse_id: Number(row.warehouse_id),
      warehouse_name: row.warehouse_name,
      display_name: `${product?.name} — ${row.warehouse_name}`,
      name: product?.name,
      original_price: Number(product?.price ?? 0),
      price_original: Number(product?.price ?? 0),
      price: Number(priceFinalProduct),
      quantity: 1,
      has_variants: false,
      stock_available: stock,
    });
  };

  const addSimpleOne = () => {
    // ✅ si es multi-almacén:
    if (useWh) {
      const withStock = productWarehouseRows.filter((r) => (Number(r.qty) || 0) > 0);

      // ✅ si SOLO hay 1 almacén (lo normal con backend filtrado por POS) => NO modal
      if (withStock.length === 1) {
        addSimpleDirectWarehouse(withStock[0]);
        return;
      }

      // ✅ si hay 2+ (caso raro / data vieja) => modal
      setOpenSimpleWh(true);
      const first = withStock[0] || null;
      setSelectedSimpleWarehouseId(first ? String(first.warehouse_id) : "");
      return;
    }

    // ✅ no almacenes: agrega normal
    if (qtyInCartSimple >= globalStock) return;

    onAdd({
      ...product,
      cart_key: String(baseId),
      id: String(baseId),
      product_id: Number(baseId),
      variant_id: null,
      warehouse_id: null,
      warehouse_name: null,
      display_name: product?.name,
      name: product?.name,
      original_price: Number(product?.price ?? 0),
      price_original: Number(product?.price ?? 0),
      price: Number(priceFinalProduct),
      quantity: 1,
      has_variants: false,
      stock_available: Number(globalStock) || 0,
    });
  };

  const confirmAddSimpleWithWarehouse = () => {
    if (!simpleWarehouseRow || !simpleWhCartKey) return;

    const stock = stockForSimpleWarehouse;
    const qtyInThatLine = getQuantityInCart(simpleWhCartKey);
    if (qtyInThatLine >= stock) return;

    onAdd({
      cart_key: simpleWhCartKey,
      id: simpleWhCartKey,
      product_id: Number(baseId),
      variant_id: null,
      warehouse_id: Number(simpleWarehouseRow.warehouse_id),
      warehouse_name: simpleWarehouseRow.warehouse_name,
      display_name: `${product?.name} — ${simpleWarehouseRow.warehouse_name}`,
      name: product?.name,
      original_price: Number(product?.price ?? 0),
      price_original: Number(product?.price ?? 0),
      price: Number(priceFinalProduct),
      quantity: 1,
      has_variants: false,
      stock_available: Number(stock) || 0,
    });

    setOpenSimpleWh(false);
  };

  // ====== variantes ======
  const variants = useMemo(() => {
    const arr = Array.isArray(product?.variants) ? product.variants : [];
    return arr.filter((v) => v?.is_active !== false);
  }, [product]);

  const [selectedVariantId, setSelectedVariantId] = useState("");
  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return variants.find((v) => String(v.id) === String(selectedVariantId)) || null;
  }, [variants, selectedVariantId]);

  const variantLabel = useMemo(() => {
    return selectedVariant ? pickVariantLabel(selectedVariant) : "";
  }, [selectedVariant]);

  const selectedVariantAttrs = useMemo(() => {
    return normalizeAttrs(selectedVariant?.variant_attributes || selectedVariant?.attributes);
  }, [selectedVariant]);

  const variantImage = useMemo(() => {
    const vimg = selectedVariant?.image_url || selectedVariant?.image || null;
    if (vimg && typeof vimg === "string") return vimg;
    return productImg;
  }, [selectedVariant, productImg]);

  // ✅ con backend filtrado por POS, aquí debería venir SOLO 1 warehouse (el del POS)
  const variantWarehouses = useMemo(() => {
    const rows = Array.isArray(selectedVariant?.warehouse_stocks)
      ? selectedVariant.warehouse_stocks
      : [];
    return rows
      .map((r) => ({
        warehouse_id: r.warehouse_id,
        warehouse_name: r.warehouse_name || `Almacén ${r.warehouse_id}`,
        stock: Number(r.stock) || 0,
        location_bin: r.location_bin ?? null,
      }))
      .sort((a, b) => (b.stock || 0) - (a.stock || 0));
  }, [selectedVariant]);

  // ✅ auto-seleccionar almacén si solo hay 1 (para que NO salga el modal de selección)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  useEffect(() => {
    if (!useWh) return;
    if (!openVariants) return;

    const withStock = variantWarehouses.filter((r) => (Number(r.stock) || 0) > 0);

    if (withStock.length === 1) {
      setSelectedWarehouseId(String(withStock[0].warehouse_id));
      return;
    }

    // si hay 0 o 2+, dejamos que el usuario elija (o quedará vacío)
    setSelectedWarehouseId("");
  }, [useWh, openVariants, selectedVariantId, variantWarehouses]);

  const selectedWarehouseRow = useMemo(() => {
    if (!selectedWarehouseId) return null;
    return (
      variantWarehouses.find((r) => String(r.warehouse_id) === String(selectedWarehouseId)) ||
      null
    );
  }, [variantWarehouses, selectedWarehouseId]);

  const effectiveUnitPrice = useMemo(() => {
    const p = selectedVariant?.price ?? product?.price ?? 0;
    const d = Number(product?.discount) || 0;
    return d > 0 ? Number(discountedPrice(p, d)) : Number(p);
  }, [selectedVariant, product]);

  const variantCartKey = useMemo(() => {
    if (!selectedVariantId) return null;
    return `${baseId}-v${selectedVariantId}`;
  }, [baseId, selectedVariantId]);

  const qtyInCartVariant = variantCartKey ? getQuantityInCart(variantCartKey) : 0;

  const variantTotalStock = useMemo(() => {
    if (useWh && variantWarehouses.length) {
      return variantWarehouses.reduce((a, r) => a + (Number(r.stock) || 0), 0);
    }
    return Number(selectedVariant?.stock) || 0;
  }, [useWh, variantWarehouses, selectedVariant]);

  const stockForSelectedWarehouse = useMemo(() => {
    if (!useWh) return variantTotalStock;
    if (!selectedWarehouseRow) return 0;
    return Number(selectedWarehouseRow.stock) || 0;
  }, [useWh, selectedWarehouseRow, variantTotalStock]);

  const canAddVariant =
    Boolean(selectedVariantId) && (!useWh || Boolean(selectedWarehouseId) || variantWarehouses.length === 1);

  const addVariantOne = () => {
    if (!selectedVariant || !variantCartKey) return;

    const whId =
      !useWh
        ? null
        : selectedWarehouseId
        ? Number(selectedWarehouseId)
        : variantWarehouses.length === 1
        ? Number(variantWarehouses[0].warehouse_id)
        : null;

    const whRow =
      !useWh
        ? null
        : selectedWarehouseRow ||
          (variantWarehouses.length === 1 ? variantWarehouses[0] : null);

    if (useWh && !whId) return;

    const stock = useWh ? (Number(whRow?.stock) || 0) : variantTotalStock;
    if (qtyInCartVariant >= stock) return;

    onAdd({
      cart_key: variantCartKey,
      id: variantCartKey,

      product_id: Number(baseId),
      variant: selectedVariant,
      variant_id: Number(selectedVariantId),

      warehouse_id: useWh ? whId : null,
      warehouse_name: useWh ? whRow?.warehouse_name : null,

      original_price: Number(selectedVariant?.price ?? product?.price ?? 0),
      price_original: Number(selectedVariant?.price ?? product?.price ?? 0),
      price: Number(effectiveUnitPrice),

      display_name: `${product?.name} — ${variantLabel}`,
      name: product?.name,
      variant_attributes: selectedVariantAttrs,

      quantity: 1,
      has_variants: true,
      stock_available: Number(stock) || 0,
    });
  };

  const openDetails = () => {
    if (!hasVariants) return;
    setOpenVariants(true);

    const first = variants[0] || null;
    setSelectedVariantId(first ? String(first.id) : "");
  };

  const closeDetails = () => {
    setOpenVariants(false);
    setSelectedWarehouseId("");
  };

  return (
    <>
      {/* CARD */}
      <Paper
        variant="outlined"
        onClick={() => {
          if (hasVariants) openDetails();
          else if (canClickCardToAdd) addSimpleOne();
        }}
        sx={{
          width: "100%",
          alignSelf: "stretch",
          p: 1.5,
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          cursor: hasVariants || canClickCardToAdd ? "pointer" : "default",
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)}, #fff)`,
          borderColor: alpha(theme.palette.primary.main, 0.18),
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          transition: "transform .15s ease, box-shadow .15s ease",
          "&:hover": {
            transform: hasVariants || canClickCardToAdd ? "translateY(-2px)" : "none",
            boxShadow:
              hasVariants || canClickCardToAdd
                ? "0 14px 38px rgba(0,0,0,0.10)"
                : "0 10px 30px rgba(0,0,0,0.06)",
          },
          height: "100%",
          minHeight: { xs: 278, md: 305 },
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Badge */}
        <Box sx={{ position: "absolute", top: 12, right: 12 }}>
          {hasDiscount ? (
            <Chip
              icon={<LocalOfferRoundedIcon />}
              label={`-${Number(product?.discount) || 0}%`}
              size="small"
              sx={{
                fontWeight: 900,
                bgcolor: alpha("#ef4444", 0.14),
                border: `1px solid ${alpha("#ef4444", 0.22)}`,
              }}
            />
          ) : hasVariants ? (
            <Chip
              icon={<TuneRoundedIcon />}
              label="Variantes"
              size="small"
              sx={{
                fontWeight: 900,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              }}
            />
          ) : null}
        </Box>

        {/* Imagen */}
        <Box
          sx={{
            height: { xs: 104, md: 120 },
            borderRadius: 3,
            bgcolor: alpha("#111827", 0.03),
            border: `1px solid ${alpha("#111827", 0.08)}`,
            overflow: "hidden",
            mb: 1.25,
            position: "relative",
            minWidth: 0,
          }}
        >
          {productImg ? (
            <Box
              component="img"
              src={productImg}
              alt={product?.name}
              sx={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          ) : (
            <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
              <Inventory2RoundedIcon sx={{ fontSize: 34, opacity: 0.5 }} />
            </Box>
          )}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.00) 40%, rgba(0,0,0,0.18) 100%)",
              pointerEvents: "none",
            }}
          />
        </Box>

        {/* Nombre */}
        <Typography
          sx={{
            fontWeight: 950,
            lineHeight: 1.15,
            mb: 0.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            minHeight: "2.3em",
          }}
        >
          {product?.name}
        </Typography>

        {product?.sku ? (
          <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.8 }} noWrap>
            SKU: {product.sku}
          </Typography>
        ) : (
          <Box sx={{ height: 18 }} />
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          justifyContent="space-between"
          spacing={{ xs: 0.75, sm: 1 }}
          sx={{ minWidth: 0 }}
        >
          <Box sx={{ minWidth: 0, width: "100%" }}>
            {hasVariants ? (
              <>
                <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>
                  Precio
                </Typography>
                <Typography sx={{ fontSize: { xs: 14, sm: 16 }, fontWeight: 950, lineHeight: 1.05 }}>
                  Según variante
                </Typography>
              </>
            ) : hasDiscount ? (
              <>
                <Typography
                  sx={{ fontSize: 12, color: "text.secondary", textDecoration: "line-through" }}
                  noWrap
                >
                  ${money(product?.price)}
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 950 }} noWrap>
                  ${priceFinalProduct}
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: 18, fontWeight: 950 }} noWrap>
                ${priceFinalProduct}
              </Typography>
            )}
          </Box>

          <Chip
            size="small"
            icon={<Inventory2RoundedIcon />}
            label={`Stock: ${hasVariants ? "ver" : globalStock}`}
            sx={{
              fontWeight: 900,
              bgcolor: alpha("#10b981", 0.1),
              border: `1px solid ${alpha("#10b981", 0.18)}`,
              flex: "0 0 auto",
              alignSelf: { xs: "flex-start", sm: "flex-end" },
              maxWidth: "100%",
            }}
          />
        </Stack>

        {useWh && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, minWidth: 0 }}>
            <WarehouseRoundedIcon sx={{ fontSize: 16, opacity: 0.7, flex: "0 0 auto" }} />
            <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>
              {stockHint || "Almacén"}
            </Typography>
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {hasVariants ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={<TuneRoundedIcon />}
            onClick={(e) => {
              e.stopPropagation();
              openDetails();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 950,
              borderRadius: 3,
              py: 1.05,
              whiteSpace: "nowrap",
              fontSize: { xs: 13, sm: 14 },
            }}
          >
            Ver catálogo
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCartRoundedIcon />}
            disabled={globalStock <= 0}
            onClick={(e) => {
              e.stopPropagation();
              addSimpleOne();
            }}
            sx={{ textTransform: "none", fontWeight: 950, borderRadius: 3 }}
          >
            Agregar
          </Button>
        )}
      </Paper>

      {/* MODAL ALMACÉN (producto simple multi) — solo aparece si hay 2+ almacenes */}
      <Dialog
        open={openSimpleWh}
        onClose={() => setOpenSimpleWh(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 16, lineHeight: 1.2 }} noWrap>
                {product?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>
                Selecciona el almacén para vender
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenSimpleWh(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 2 }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
            <Typography sx={{ fontWeight: 950, mb: 1 }}>
              ¿De qué almacén se venderá?
            </Typography>

            <TextField
              select
              fullWidth
              size="small"
              label="Almacén"
              value={selectedSimpleWarehouseId}
              onChange={(e) => setSelectedSimpleWarehouseId(e.target.value)}
            >
              {productWarehouseRows.length ? (
                productWarehouseRows.map((w) => (
                  <MenuItem
                    key={w.warehouse_id}
                    value={String(w.warehouse_id)}
                    disabled={(Number(w.qty) || 0) <= 0}
                  >
                    {w.warehouse_name} — Stock: {Number(w.qty) || 0}
                    {w.location_bin ? ` — Bin: ${w.location_bin}` : ""}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  Sin almacenes configurados
                </MenuItem>
              )}
            </TextField>

            <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
              Stock disponible en almacén seleccionado:{" "}
              <b>{selectedSimpleWarehouseId ? stockForSimpleWarehouse : "-"}</b>
            </Typography>
          </Paper>

          <Paper
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 4,
              bgcolor: alpha("#111827", 0.02),
              border: `1px solid ${alpha("#111827", 0.08)}`,
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShoppingCartRoundedIcon />}
                disabled={!selectedSimpleWarehouseId || stockForSimpleWarehouse <= 0}
                onClick={confirmAddSimpleWithWarehouse}
                sx={{ textTransform: "none", fontWeight: 950, borderRadius: 3 }}
              >
                Agregar al carrito
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpenSimpleWh(false)}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 3 }}
              >
                Cancelar
              </Button>
            </Stack>

            {!selectedSimpleWarehouseId && (
              <Typography sx={{ mt: 1, fontSize: 12, color: "error.main" }}>
                Selecciona un almacén para poder agregar.
              </Typography>
            )}
          </Paper>
        </DialogContent>
      </Dialog>

      {/* MODAL VARIANTES */}
      <Dialog
        open={openVariants}
        onClose={closeDetails}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 16, lineHeight: 1.2 }} noWrap>
                {product?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>
                {product?.sku ? `SKU: ${product.sku}` : "Producto con variantes"}
              </Typography>
            </Box>
            <IconButton onClick={closeDetails}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* LISTA VARIANTES */}
            <Grid item xs={12} md={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 4,
                  height: { xs: "auto", md: "70vh" },
                  overflow: "auto",
                }}
              >
                <Typography sx={{ fontWeight: 950, mb: 1 }}>
                  Variantes disponibles
                </Typography>

                <Stack spacing={1}>
                  {variants.length ? (
                    variants.map((v) => {
                      const vImg = v?.image_url || v?.image || productImg || null;
                      const attrs = normalizeAttrs(v?.variant_attributes || v?.attributes);
                      const selected = String(v.id) === String(selectedVariantId);

                      const stockTotal =
                        useWh && Array.isArray(v?.warehouse_stocks) && v.warehouse_stocks.length
                          ? v.warehouse_stocks.reduce((a, r) => a + (Number(r.stock) || 0), 0)
                          : Number(v?.stock) || 0;

                      return (
                        <Paper
                          key={v.id}
                          variant="outlined"
                          onClick={() => {
                            setSelectedVariantId(String(v.id));
                          }}
                          sx={{
                            p: 1,
                            borderRadius: 3,
                            cursor: "pointer",
                            borderColor: selected
                              ? alpha(theme.palette.primary.main, 0.55)
                              : alpha("#111827", 0.1),
                            bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : "#fff",
                            transition: "transform .12s ease",
                            "&:hover": { transform: "translateY(-1px)" },
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 58,
                                height: 58,
                                borderRadius: 2.5,
                                overflow: "hidden",
                                border: `1px solid ${alpha("#111827", 0.1)}`,
                                bgcolor: alpha("#111827", 0.03),
                                flex: "0 0 auto",
                              }}
                            >
                              {vImg ? (
                                <Box
                                  component="img"
                                  src={vImg}
                                  alt={pickVariantLabel(v)}
                                  sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                                  <StyleRoundedIcon sx={{ opacity: 0.55 }} />
                                </Box>
                              )}
                            </Box>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography sx={{ fontWeight: 950, fontSize: 13 }} noWrap>
                                {pickVariantLabel(v)}
                              </Typography>

                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25, flexWrap: "wrap" }}>
                                <Chip
                                  size="small"
                                  label={`Stock: ${stockTotal}`}
                                  sx={{
                                    height: 22,
                                    fontWeight: 900,
                                    bgcolor: alpha("#10b981", 0.1),
                                    border: `1px solid ${alpha("#10b981", 0.18)}`,
                                  }}
                                />
                                {useWh && (
                                  <Chip
                                    size="small"
                                    icon={<WarehouseRoundedIcon />}
                                    label={variantWarehouses.length === 1 ? "Almacén" : "Multi"}
                                    sx={{
                                      height: 22,
                                      fontWeight: 900,
                                      bgcolor: alpha("#6366f1", 0.1),
                                      border: `1px solid ${alpha("#6366f1", 0.18)}`,
                                    }}
                                  />
                                )}
                              </Stack>

                              {!!attrs.length && (
                                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                                  {attrs.slice(0, 3).map((a, idx) => (
                                    <Chip
                                      key={`${v.id}-${idx}`}
                                      size="small"
                                      variant="outlined"
                                      label={`${a.name}${a.value ? `: ${a.value}` : ""}`}
                                      sx={{ height: 22, fontWeight: 800, bgcolor: alpha("#111827", 0.02) }}
                                    />
                                  ))}
                                  {attrs.length > 3 && (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={`+${attrs.length - 3}`}
                                      sx={{ height: 22, fontWeight: 900, bgcolor: alpha("#111827", 0.02) }}
                                    />
                                  )}
                                </Stack>
                              )}
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })
                  ) : (
                    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                      No hay variantes activas para este producto.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* DETALLE */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      height: 320,
                      borderRadius: 4,
                      overflow: "hidden",
                      border: `1px solid ${alpha("#111827", 0.1)}`,
                      bgcolor: alpha("#111827", 0.03),
                      position: "relative",
                    }}
                  >
                    {variantImage ? (
                      <Box
                        component="img"
                        src={variantImage}
                        alt={variantLabel || product?.name}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                        <Inventory2RoundedIcon sx={{ fontSize: 52, opacity: 0.5 }} />
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.00) 45%, rgba(0,0,0,0.25) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>

                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.18),
                    }}
                  >
                    <Typography sx={{ fontWeight: 950, fontSize: 14 }}>
                      Precio unitario (variante)
                    </Typography>
                    <Typography sx={{ fontSize: 26, fontWeight: 950, lineHeight: 1 }}>
                      ${money(effectiveUnitPrice)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4, mb: 2 }}>
                    <Typography sx={{ fontWeight: 950, mb: 0.5 }}>
                      Variante seleccionada
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 900 }}>
                      {selectedVariant ? pickVariantLabel(selectedVariant) : "Seleccione una variante"}
                    </Typography>

                    {!!selectedVariantAttrs.length && (
                      <>
                        <Typography sx={{ mt: 1.25, fontSize: 12, color: "text.secondary", fontWeight: 900 }}>
                          Atributos
                        </Typography>
                        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                          {selectedVariantAttrs.map((a, idx) => (
                            <Chip
                              key={`attr-${idx}`}
                              icon={<StyleRoundedIcon sx={{ fontSize: 16 }} />}
                              label={`${a.name}${a.value ? `: ${a.value}` : ""}`}
                              variant="outlined"
                              sx={{ fontWeight: 900, bgcolor: alpha("#111827", 0.02) }}
                            />
                          ))}
                        </Stack>
                      </>
                    )}
                  </Paper>

                  {/* ✅ Selector de almacén SOLO si realmente hay 2+ */}
                  {useWh && variantWarehouses.filter((w) => (Number(w.stock) || 0) > 0).length > 1 && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 4, mb: 2 }}>
                      <Typography sx={{ fontWeight: 950, mb: 1 }}>
                        ¿De qué almacén se venderá?
                      </Typography>

                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Almacén"
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        disabled={!selectedVariantId}
                      >
                        {variantWarehouses.length ? (
                          variantWarehouses.map((w) => (
                            <MenuItem
                              key={w.warehouse_id}
                              value={String(w.warehouse_id)}
                              disabled={(Number(w.stock) || 0) <= 0}
                            >
                              {w.warehouse_name} — Stock: {Number(w.stock) || 0}
                              {w.location_bin ? ` — Bin: ${w.location_bin}` : ""}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled value="">
                            Sin almacenes para esta variante
                          </MenuItem>
                        )}
                      </TextField>

                      <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                        Stock disponible: <b>{selectedWarehouseId ? stockForSelectedWarehouse : "-"}</b>
                      </Typography>
                    </Paper>
                  )}

                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 4,
                      bgcolor: alpha("#111827", 0.02),
                      border: `1px solid ${alpha("#111827", 0.08)}`,
                    }}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCartRoundedIcon />}
                        disabled={
                          !canAddVariant ||
                          (useWh ? stockForSelectedWarehouse <= 0 && variantWarehouses.length !== 1 : variantTotalStock <= 0)
                        }
                        onClick={addVariantOne}
                        sx={{ textTransform: "none", fontWeight: 950, borderRadius: 3 }}
                      >
                        Agregar al carrito
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={closeDetails}
                        sx={{ textTransform: "none", fontWeight: 900, borderRadius: 3 }}
                      >
                        Cerrar
                      </Button>
                    </Stack>

                    {!canAddVariant && (
                      <Typography sx={{ mt: 1, fontSize: 12, color: "error.main" }}>
                        {useWh
                          ? "Selecciona una variante (el almacén se elige solo si aplica)."
                          : "Selecciona una variante para poder agregar."}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}