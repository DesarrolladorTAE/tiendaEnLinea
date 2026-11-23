// src/components/POS/ProductCard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { productStock, hasProductVariants, usesWarehouses, variantStock, activeVariant } from "../../utils/productInventory";
import {
  Paper,
  TableCell,
  TableRow,
  ButtonBase,
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
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
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
}) {
  const theme = useTheme();

  const baseId = product?.id;
  const hasVariants = hasProductVariants(product);
  const useWh = usesWarehouses(product);

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
        qty: r.qty ?? 0,
        location_bin: r.location_bin ?? null,
      }))
      .sort((a, b) => (Number(b.qty) || 0) - (Number(a.qty) || 0));
  }, [product]);

  // ✅ Stock global (según backend; si ya filtraste por almacén, será el del POS)
  const globalStock = useMemo(() => {
    const st = getAvailableStock(product);
    return Number.isFinite(Number(st)) ? Number(st) : 0;
  }, [product, getAvailableStock]);

  const simpleCartKey = String(baseId);
  const qtyInCartSimple = getQuantityInCart(simpleCartKey);
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
    return arr.filter(activeVariant);
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
    const warehouseId = selectedWarehouseId || (variantWarehouses.length === 1 ? variantWarehouses[0].warehouse_id : null);
    return `${baseId}-v${selectedVariantId}${useWh && warehouseId ? `-w${warehouseId}` : ""}`;
  }, [baseId, selectedVariantId, selectedWarehouseId, useWh, variantWarehouses]);

  const qtyInCartVariant = variantCartKey ? getQuantityInCart(variantCartKey) : 0;

  const variantTotalStock = useMemo(() => {
    if (useWh) {
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

  const stock = productStock(product, { activeOnly: true });
  const pieces = cart.reduce(
    (sum, item) => String(item.product_id ?? item.id) === String(baseId)
      ? sum + (Number(item.quantity) || 0)
      : sum,
    0,
  );

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ overflowWrap: "anywhere", color: "text.secondary" }}>
          {product.sku || "—"}
        </TableCell>
        <TableCell sx={{ overflowWrap: "anywhere" }}>
          <ButtonBase
            disabled={!hasVariants && (stock === null || pieces >= stock)}
            onClick={hasVariants ? openDetails : addSimpleOne}
            aria-label={hasVariants ? `Ver variantes de ${product.name}` : `Agregar ${product.name}`}
            sx={{
              textAlign: "left",
              justifyContent: "flex-start",
              width: "100%",
              py: 0.5,
              color: "primary.main",
              "&:hover, &.Mui-focusVisible": { textDecoration: "underline" },
              "&.Mui-disabled": { color: "text.primary" },
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={800}>{product.name}</Typography>
              {hasVariants && <Typography variant="caption" color="text.secondary">Ver variantes</Typography>}
            </Box>
          </ButtonBase>
        </TableCell>
        <TableCell align="right">{pieces}</TableCell>
        <TableCell align="right">{stock ?? "—"}</TableCell>
      </TableRow>

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
            <Grid size={{ xs: 12, md: 4 }}>
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

                <Stack divider={<Divider />}>
                  {variants.length ? (
                    variants.map((v) => {
                      const attrs = normalizeAttrs(v.variant_attributes || v.attributes);
                      const selected = String(v.id) === String(selectedVariantId);
                      const stock = variantStock(v, useWh);

                      return (
                        <ButtonBase
                          key={v.id}
                          onClick={() => setSelectedVariantId(String(v.id))}
                          aria-pressed={selected}
                          sx={{
                            display: "flex", justifyContent: "space-between", gap: 1,
                            px: 1, py: 0.75, textAlign: "left", borderRadius: 1,
                            bgcolor: selected ? "action.selected" : "transparent",
                            "&:hover, &.Mui-focusVisible": { bgcolor: "action.hover" },
                          }}
                        >
                          <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                            <Typography variant="body2" fontWeight={800}>{pickVariantLabel(v)}</Typography>
                            {v.sku && v.sku !== pickVariantLabel(v) && (
                              <Typography display="block" variant="caption" color="text.secondary">{v.sku}</Typography>
                            )}
                            {attrs.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {attrs.map(({ name, value }) => [name, value].filter(Boolean).join(": ")).join(" · ")}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ flexShrink: 0 }}>Stock: {stock ?? "—"}</Typography>
                        </ButtonBase>
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
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{
                      height: { xs: 140, md: 320 },
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
                        sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
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

                <Grid size={{ xs: 12, md: 7 }}>
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
                          (useWh ? stockForSelectedWarehouse <= 0 : variantTotalStock <= 0)
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
