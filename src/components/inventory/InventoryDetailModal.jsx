// src/components/inventory/InventoryDetailModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError } from "../../utils/alerts";

import placeholderImg from "/assets/img/defaultproduct.png";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

function moneyMXN(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n));
}

/**
 * Modal de detalle:
 * - Si abre desde fila variant, backend añade selected_variant_id
 * - Aquí, si hay selected_variant_id, mostramos datos “display” de la variante (imagen/sku/precio/costo)
 */
export default function InventoryDetailModal({ open, onClose, item, scope, warehouseId }) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!open || !item?.item_type) return;

    setLoading(true);
    setDetail(null);

    try {
      const type = item.item_type; // "product" | "variant"
      const id = type === "product" ? item.product_id : item.variant_id;

      const params = { type, id };
      if (scope === "warehouse" && warehouseId) params.warehouse_id = warehouseId;

      const { data } = await axiosClient.get(`/inventory/item`, { params });
      setDetail(data?.data || null);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar los detalles");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [open, item?.item_type, item?.product_id, item?.variant_id, scope, warehouseId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const selectedWarehouseId =
    detail?.selected_warehouse_id || (scope === "warehouse" ? warehouseId : null);

  const selectedVariantId = detail?.selected_variant_id || null;

  const hasVariants = !!detail?.has_variants;
  const isMultiWarehouse = !!detail?.use_warehouse_inventory;

  const visibleLabel = detail?.visible ? "Visible" : "Oculto";
  const inventoryLabel = isMultiWarehouse ? "Por almacén" : "General";
  const typeLabel = hasVariants ? "Con variantes" : "Producto simple";

  // Producto images (si tu backend retorna array en detail.image)
  const productImages = useMemo(
    () => (Array.isArray(detail?.image) ? detail.image.filter(Boolean) : []),
    [detail?.image]
  );

  // Variante seleccionada (si aplica)
  const selectedVariant = useMemo(() => {
    if (!selectedVariantId || !Array.isArray(detail?.variants)) return null;
    return detail.variants.find((v) => Number(v?.id) === Number(selectedVariantId)) || null;
  }, [detail?.variants, selectedVariantId]);

  // ✅ imagen de variante (prioridad)
  const variantImg = useMemo(() => {
    if (!selectedVariant) return null;
    // soporte: image_url o image
    return selectedVariant?.image_url || selectedVariant?.image || null;
  }, [selectedVariant]);

  // ✅ “display” fields: si es variante, usar variante, si no, usar producto
  const displayName = selectedVariant
    ? `${detail?.name || "—"}${selectedVariant?.name ? ` / ${selectedVariant.name}` : ""}`
    : detail?.name || "—";

  const displaySku = selectedVariant?.sku || detail?.sku || "—";
  const displayPrice = selectedVariant?.price ?? detail?.price;
  const displayPurchaseCost = selectedVariant?.purchase_cost ?? detail?.purchase_cost;

  // ✅ imágenes que se muestran: primero la variante (si existe), luego las del producto
  const images = useMemo(() => {
    const out = [];
    if (variantImg) out.push(variantImg);
    productImages.forEach((x) => {
      if (x && x !== variantImg) out.push(x);
    });
    return out;
  }, [variantImg, productImages]);

  const coverImg = images?.[0] || item?.image_url || null;

  // Stock contextual (si hay almacén seleccionado)
  const contextualStock = useMemo(() => {
    if (!detail) return 0;

    // inventario general
    if (!isMultiWarehouse) {
      if (selectedVariant) return Number(selectedVariant?.stock ?? 0);
      return Number(detail?.stock ?? 0);
    }

    // inventario por almacén, pero sin warehouse seleccionado
    if (!selectedWarehouseId) {
      if (selectedVariant) return Number(selectedVariant?.stock ?? 0);
      return Number(detail?.stock ?? 0);
    }

    // inventario por almacén + con variantes
    if (hasVariants) {
      if (!selectedVariant) return 0;
      const ws = Array.isArray(selectedVariant?.warehouse_stocks) ? selectedVariant.warehouse_stocks : [];
      const row = ws.find((x) => Number(x?.warehouse_id) === Number(selectedWarehouseId));
      return row ? Number(row.stock ?? 0) : 0;
    }

    // inventario por almacén + producto simple
    const wi = Array.isArray(detail?.warehouse_inventories) ? detail.warehouse_inventories : [];
    const row = wi.find((x) => Number(x?.warehouse_id) === Number(selectedWarehouseId));
    return row ? Number(row.qty ?? 0) : 0;
  }, [detail, isMultiWarehouse, hasVariants, selectedWarehouseId, selectedVariant]);

  const Section = ({ icon, title, children }) => (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(COLORS.accent, 0.18),
            border: `1px solid ${alpha(COLORS.accent, 0.28)}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontWeight: 950, color: COLORS.black }}>{title}</Typography>
      </Stack>

      <Box
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: "#fff",
          p: { xs: 1.2, sm: 1.6 },
          boxShadow: `0 10px 30px ${alpha("#000", 0.06)}`,
        }}
      >
        {children}
      </Box>
    </Box>
  );

  const InfoGrid = ({ items }) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 1,
      }}
    >
      {items.map((it, idx) => (
        <Box
          key={idx}
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${alpha("#000", 0.08)}`,
            p: 1.2,
            bgcolor: alpha("#000", 0.015),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {it.label}
          </Typography>
          <Typography sx={{ fontWeight: 900, color: COLORS.black, mt: 0.2, wordBreak: "break-word" }}>
            {it.value ?? "—"}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  // ✅ Info: si hay variante seleccionada, SKU/Precio/Costo deben reflejar variante
  const productInfoItems = useMemo(() => {
    if (!detail) return [];
    const ivaText =
      detail?.iva !== null && detail?.iva !== undefined ? `${Number(detail.iva) * 100}%` : "—";

    return [
      { label: "SKU", value: displaySku },
      { label: "Precio", value: moneyMXN(displayPrice) },
      { label: "Precio base", value: moneyMXN(detail?.base_price) }, // base suele ser del producto
      { label: "IVA", value: ivaText },
      { label: "Costo de compra", value: moneyMXN(displayPurchaseCost) },
      { label: "Unidad de medida", value: detail?.unidad_medida_texto || "—" },

      { label: "Descuento", value: detail?.discount !== null && detail?.discount !== undefined ? `${detail.discount}` : "—" },
      { label: "Fin de oferta", value: detail?.offerEnd || "—" },
      { label: "Nuevo", value: detail?.new ? "Sí" : "No" },
      { label: "Rating", value: detail?.rating ?? "—" },
    ];
  }, [detail, displaySku, displayPrice, displayPurchaseCost]);

  const satItems = useMemo(() => {
    if (!detail) return [];
    return [
      { label: "Clave producto", value: detail?.clave_producto_sat || "—" },
      { label: "Clave unidad", value: detail?.clave_unidad_sat || "—" },
    ];
  }, [detail]);

  const categoryList = useMemo(
    () => (Array.isArray(detail?.category) ? detail.category : []),
    [detail?.category]
  );

  const tagList = useMemo(
    () => (Array.isArray(detail?.tag) ? detail.tag : []),
    [detail?.tag]
  );

  const dialogPaperSx = {
    borderRadius: 4,
    overflow: "hidden",
    border: `1px solid ${alpha("#000", 0.08)}`,
    boxShadow: `0 18px 60px ${alpha("#000", 0.24)}`,
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: dialogPaperSx }}>
      <DialogTitle
        sx={{
          p: 0,
          bgcolor: "#fff",
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Box
          sx={{
            p: { xs: 1.6, sm: 2 },
            background: `linear-gradient(180deg, ${alpha(COLORS.accent, 0.18)} 0%, #fff 55%)`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 950, color: COLORS.black, fontSize: 20 }}>
                Detalles del producto
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                Vista completa del producto (sin nombres técnicos)
              </Typography>
            </Box>

            <Tooltip title="Cerrar">
              <IconButton
                onClick={onClose}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha("#000", 0.10)}`,
                  bgcolor: "#fff",
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Divider sx={{ mt: 1.4 }} />

          {/* Hero */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ mt: 1.6 }}
          >
            <Box
              component="img"
              src={coverImg || placeholderImg}
              alt={displayName || "Producto"}
              onError={(e) => (e.currentTarget.src = placeholderImg)}
              sx={{
                width: 104,
                height: 104,
                borderRadius: 3,
                objectFit: "cover",
                border: `1px solid ${alpha("#000", 0.10)}`,
                bgcolor: alpha("#000", 0.02),
                flexShrink: 0,
              }}
            />

            <Box sx={{ flex: 1, minWidth: 260 }}>
              <Typography sx={{ fontWeight: 950, color: COLORS.black, fontSize: 22, lineHeight: 1.15 }}>
                {displayName}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                SKU: <b>{displaySku}</b>
              </Typography>

              {/* Chips amigables */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.1 }} flexWrap="wrap">
                <Chip
                  size="small"
                  label={`Stock: ${contextualStock}`}
                  sx={{
                    fontWeight: 950,
                    bgcolor: alpha(COLORS.accent, 0.22),
                    border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                  }}
                />
                <Chip size="small" label={`Precio: ${moneyMXN(displayPrice)}`} variant="outlined" />
                <Chip size="small" label={`Costo: ${moneyMXN(displayPurchaseCost)}`} variant="outlined" />
                <Chip size="small" label={`Inventario: ${inventoryLabel}`} variant="outlined" />
                <Chip size="small" label={`Tipo: ${typeLabel}`} variant="outlined" />
                <Chip size="small" label={`Estado: ${visibleLabel}`} variant="outlined" />
              </Stack>

              {/* Contexto suave */}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                {scope === "warehouse" && selectedWarehouseId ? (
                  <Chip
                    size="small"
                    icon={<WarehouseRoundedIcon />}
                    label={`Almacén #${selectedWarehouseId}`}
                    sx={{ fontWeight: 900 }}
                  />
                ) : null}
                {selectedVariantId ? (
                  <Chip
                    size="small"
                    icon={<StyleRoundedIcon />}
                    label={`Variante #${selectedVariantId}`}
                    sx={{ fontWeight: 900 }}
                  />
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: alpha("#000", 0.02) }}>
        {loading ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
            <Typography color="text.secondary">Cargando…</Typography>
          </Stack>
        ) : !detail ? (
          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              bgcolor: alpha("#000", 0.03),
              border: `1px solid ${alpha("#000", 0.08)}`,
            }}
          >
            No hay detalles disponibles.
          </Alert>
        ) : (
          <Stack spacing={2.2}>
            {/* Imágenes */}
            <Section icon={<CollectionsRoundedIcon fontSize="small" />} title="Imágenes">
              {images.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Este producto no tiene imágenes.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                  {images.map((src, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={src}
                      alt={`img-${idx}`}
                      onError={(e) => (e.currentTarget.src = placeholderImg)}
                      sx={{
                        width: 92,
                        height: 92,
                        borderRadius: 3,
                        objectFit: "cover",
                        border: `1px solid ${alpha("#000", 0.10)}`,
                        bgcolor: alpha("#000", 0.02),
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Section>

            {/* Información del producto */}
            <Section icon={<StoreRoundedIcon fontSize="small" />} title="Información del producto">
              <InfoGrid items={productInfoItems} />
            </Section>

            {/* Categorías y etiquetas */}
            <Section icon={<LocalOfferRoundedIcon fontSize="small" />} title="Categorías y etiquetas">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
                Categorías
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.4 }}>
                {categoryList.length ? (
                  categoryList.map((c, i) => (
                    <Chip key={i} size="small" label={c} variant="outlined" sx={{ fontWeight: 900 }} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin categorías.
                  </Typography>
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
                Etiquetas
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tagList.length ? (
                  tagList.map((t, i) => (
                    <Chip key={i} size="small" label={t} variant="outlined" sx={{ fontWeight: 900 }} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin etiquetas.
                  </Typography>
                )}
              </Stack>
            </Section>

            {/* SAT */}
            <Section icon={<ReceiptLongRoundedIcon fontSize="small" />} title="SAT">
              <InfoGrid items={satItems} />
            </Section>

            {/* Descripciones */}
            <Section icon={<StyleRoundedIcon fontSize="small" />} title="Descripciones">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                Corta
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {detail?.shortDescription || "—"}
              </Typography>

              <Divider sx={{ my: 1.3 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                Completa
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {detail?.fullDescription || "—"}
              </Typography>
            </Section>

            {/* Inventario por almacén */}
            {isMultiWarehouse ? (
              <Section icon={<WarehouseRoundedIcon fontSize="small" />} title="Inventario por almacén">
                {!hasVariants ? (
                  Array.isArray(detail?.warehouse_inventories) && detail.warehouse_inventories.length ? (
                    <TableContainer
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${alpha("#000", 0.08)}`,
                        overflow: "hidden",
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha("#000", 0.02) }}>
                            <TableCell sx={{ fontWeight: 950 }}>Almacén</TableCell>
                            <TableCell sx={{ fontWeight: 950 }} align="right">
                              Stock
                            </TableCell>
                            <TableCell sx={{ fontWeight: 950 }} align="right">
                              Precio
                            </TableCell>
                            <TableCell sx={{ fontWeight: 950 }} align="right">
                              Costo
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detail.warehouse_inventories.map((w) => (
                            <TableRow
                              key={w.warehouse_id}
                              hover
                              sx={
                                selectedWarehouseId && Number(w.warehouse_id) === Number(selectedWarehouseId)
                                  ? { bgcolor: alpha(COLORS.accent, 0.10) }
                                  : undefined
                              }
                            >
                              <TableCell sx={{ fontWeight: 900 }}>
                                {w?.warehouse_name || `Almacén #${w?.warehouse_id}`}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 900 }}>
                                {Number(w?.qty ?? 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 900 }}>
                                {moneyMXN(w?.price ?? detail?.price)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 900 }}>
                                {moneyMXN(w?.purchase_cost ?? detail?.purchase_cost)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay registros por almacén para este producto.
                    </Typography>
                  )
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Variantes ({Array.isArray(detail?.variants) ? detail.variants.length : 0})
                    </Typography>

                    {Array.isArray(detail?.variants) && detail.variants.length ? (
                      <TableContainer
                        sx={{
                          borderRadius: 2.5,
                          border: `1px solid ${alpha("#000", 0.08)}`,
                          overflow: "hidden",
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha("#000", 0.02) }}>
                              <TableCell sx={{ fontWeight: 950 }}>Imagen</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>SKU</TableCell>
                              <TableCell sx={{ fontWeight: 950 }}>Nombre</TableCell>
                              <TableCell sx={{ fontWeight: 950 }} align="right">
                                Precio
                              </TableCell>
                              <TableCell sx={{ fontWeight: 950 }} align="right">
                                Costo
                              </TableCell>
                              <TableCell sx={{ fontWeight: 950 }} align="right">
                                Stock
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detail.variants.map((v) => {
                              const isSelected = selectedVariantId && Number(v?.id) === Number(selectedVariantId);

                              let vStock = Number(v?.stock ?? 0);
                              if (selectedWarehouseId) {
                                const ws = Array.isArray(v?.warehouse_stocks) ? v.warehouse_stocks : [];
                                const row = ws.find((x) => Number(x?.warehouse_id) === Number(selectedWarehouseId));
                                vStock = row ? Number(row.stock ?? 0) : 0;
                              }

                              const vImg = v?.image_url || v?.image || null;

                              const attrs =
                                Array.isArray(v?.variant_attributes) && v.variant_attributes.length
                                  ? v.variant_attributes
                                      .map((a) => `${a?.name ?? ""}: ${a?.value ?? ""}`.trim())
                                      .filter(Boolean)
                                      .join(" • ")
                                  : "";

                              return (
                                <TableRow
                                  key={v.id}
                                  hover
                                  sx={isSelected ? { bgcolor: alpha(COLORS.accent, 0.12) } : undefined}
                                >
                                  <TableCell sx={{ width: 70 }}>
                                    <Box
                                      component="img"
                                      src={vImg || placeholderImg}
                                      alt={v?.name || "Variante"}
                                      onError={(e) => (e.currentTarget.src = placeholderImg)}
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2.5,
                                        objectFit: "cover",
                                        border: `1px solid ${alpha("#000", 0.10)}`,
                                        bgcolor: alpha("#000", 0.02),
                                      }}
                                    />
                                  </TableCell>

                                  <TableCell sx={{ fontWeight: 950 }}>{v?.sku || detail?.sku || "—"}</TableCell>

                                  <TableCell>
                                    <Typography sx={{ fontWeight: 900, color: COLORS.black }} noWrap>
                                      {v?.name || "—"}
                                    </Typography>
                                    {attrs ? (
                                      <Typography variant="caption" color="text.secondary">
                                        {attrs}
                                      </Typography>
                                    ) : null}
                                  </TableCell>

                                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                                    {moneyMXN(v?.price ?? detail?.price)}
                                  </TableCell>

                                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                                    {moneyMXN(v?.purchase_cost ?? detail?.purchase_cost)}
                                  </TableCell>

                                  <TableCell align="right" sx={{ fontWeight: 950 }}>
                                    {vStock}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Este producto marca variantes pero no se encontraron.
                      </Typography>
                    )}
                  </Stack>
                )}
              </Section>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: "#fff",
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<CloseRoundedIcon />}
          sx={{
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 950,
            bgcolor: COLORS.black,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}