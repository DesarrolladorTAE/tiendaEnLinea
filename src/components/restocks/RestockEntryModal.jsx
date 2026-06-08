import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import RemoveCircleRoundedIcon from "@mui/icons-material/RemoveCircleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";

import axiosClient from "../../config/axiosClient";
import { toast } from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  danger: "#e94e1b",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

const EMPTY_LINE = () => ({
  id: Date.now() + Math.random(),
  product: null,
  variant: null,
  product_variant_id: "",
  variation_size_id: "",
  warehouse_id: "",
  unit_price: 0,
  quantity: 1,
  notes: "",
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
  },
};

const sxBtnOutlined = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  borderColor: alpha("#000", 0.15),
  color: COLORS.black,
  bgcolor: "#fff",
  "&:hover": { bgcolor: alpha("#000", 0.03) },
};

const sxBtnBlack = {
  borderRadius: 2.5,
  textTransform: "none",
  fontWeight: 900,
  bgcolor: COLORS.black,
  color: "#fff",
  "&:hover": { bgcolor: alpha(COLORS.black, 0.86) },
};

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

function Section({ title, subtitle, icon, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: COLORS.paper,
        border: `1px solid ${alpha("#000", 0.08)}`,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={0.6} sx={{ mb: 1.4 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.18),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Typography sx={{ fontWeight: 950, fontSize: 14 }}>
            {title}
          </Typography>
        </Stack>

        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>

      <Stack spacing={1.2}>{children}</Stack>
    </Paper>
  );
}

function getVariantOptions(product) {
  if (!product?.has_variants || !Array.isArray(product?.variants)) return [];

  return product.variants.map((v) => {
    const attrs = Array.isArray(v?.variant_attributes)
      ? v.variant_attributes
          .map((a) => `${a.name}: ${a.value}`)
          .filter(Boolean)
          .join(" / ")
      : "";

    return {
      ...v,
      label: v?.name || attrs || v?.sku || `Variante #${v?.id}`,
    };
  });
}

export default function RestockEntryModal({
  open,
  onClose,
  branchId,
  suppliers = [],
  onSaved,
  readOnly = false,
  movement = null,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [movementType, setMovementType] = useState("entrada");

  const [supplier, setSupplier] = useState(null);
  const [uuidInvoice, setUuidInvoice] = useState("");
  const [folio, setFolio] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [notes, setNotes] = useState("");

  const [pdfFile, setPdfFile] = useState(null);
  const [xmlFile, setXmlFile] = useState(null);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [lines, setLines] = useState([EMPTY_LINE()]);

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 500);

  const isReadOnly = Boolean(readOnly);
  const isSalida = movementType === "salida";

  const filteredProducts = useMemo(() => {
    const term = String(debouncedProductSearch || "").toLowerCase().trim();

    if (!term) return products;

    return products.filter((p) => {
      const name = String(p?.name || "").toLowerCase();
      const sku = String(p?.sku || "").toLowerCase();

      return name.includes(term) || sku.includes(term);
    });
  }, [products, debouncedProductSearch]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (acc, line) =>
        acc + Number(line.unit_price || 0) * Number(line.quantity || 0),
      0
    );

    return {
      subtotal,
      tax: 0,
      total: subtotal,
    };
  }, [lines]);

  const resetForm = () => {
    setMovementType("entrada");
    setSupplier(null);
    setUuidInvoice("");
    setFolio("");
    setInvoiceDate("");
    setNotes("");
    setPdfFile(null);
    setXmlFile(null);
    setProductSearch("");
    setLines([EMPTY_LINE()]);
  };

  const fetchWarehouses = useCallback(async () => {
    if (!branchId) return;

    try {
      const { data } = await axiosClient.get(`/branches/${branchId}/warehouses`);

      setWarehouses(
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      );
    } catch {
      setWarehouses([]);
    }
  }, [branchId]);

  const fetchProducts = useCallback(async () => {
    if (!branchId) return;

    try {
      setLoadingProducts(true);

      const { data } = await axiosClient.get(
        `/admin/branches/${branchId}/products-with-variants`
      );

      setProducts(Array.isArray(data) ? data : data?.products || data?.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!open || !branchId) return;

    fetchWarehouses();

    if (!isReadOnly) {
      fetchProducts();
    }
  }, [open, branchId, fetchWarehouses, fetchProducts, isReadOnly]);

  useEffect(() => {
    if (!open) return;

    if (isReadOnly && movement) {
      const currentMovementType =
        movement?.movement_type ||
        movement?.restock_invoice?.movement_type ||
        movement?.invoice?.movement_type ||
        "entrada";

      setMovementType(currentMovementType);

      setSupplier(
        movement?.supplier
          ? { id: movement?.supplier_id || "", name: movement?.supplier }
          : null
      );

      setUuidInvoice(movement?.uuid_invoice || "");
      setFolio(movement?.folio || "");
      setInvoiceDate(movement?.invoice_date || "");

      setNotes(
        movement?.invoice_notes ||
          movement?.restock_invoice?.notes ||
          movement?.entry_name ||
          ""
      );

      setLines([
        {
          id: movement?.id || Date.now(),
          product: movement?.product || null,
          variant: movement?.product_variant || movement?.variant || null,
          product_variant_id:
            movement?.product_variant_id || movement?.variant?.id || "",
          variation_size_id: movement?.variation_size_id || "",
          warehouse_id:
            movement?.warehouse_id || movement?.warehouse?.id || "",
          unit_price: Number(movement?.unit_price || 0),
          quantity: Number(movement?.quantity || 0),
          notes:
            movement?.line_notes ||
            movement?.description ||
            movement?.notes ||
            "",
        },
      ]);
    }

    if (!isReadOnly && !movement) {
      resetForm();
    }
  }, [open, isReadOnly, movement]);

  const updateLine = (id, updates) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...updates } : line))
    );
  };

  const addLine = () => setLines((prev) => [...prev, EMPTY_LINE()]);

  const removeLine = (id) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const lineRequiresWarehouse = (line) => {
    const product = line.product;

    if (!product) return false;

    if (Boolean(product?.use_warehouse_inventory)) return true;

    if (
      Array.isArray(product?.warehouse_inventories) &&
      product.warehouse_inventories.length > 0
    ) {
      return true;
    }

    if (line.product_variant_id) {
      const variant = product?.variants?.find(
        (v) => Number(v.id) === Number(line.product_variant_id)
      );

      if (
        Array.isArray(variant?.warehouse_stocks) &&
        variant.warehouse_stocks.length > 0
      ) {
        return true;
      }
    }

    return false;
  };

  const getWarehouseOptions = (line) => {
    const product = line.product;

    if (!product) return warehouses;

    if (line.product_variant_id) {
      const variant = product?.variants?.find(
        (v) => Number(v.id) === Number(line.product_variant_id)
      );

      if (
        Array.isArray(variant?.warehouse_stocks) &&
        variant.warehouse_stocks.length > 0
      ) {
        return variant.warehouse_stocks.map((w) => ({
          id: w.warehouse_id,
          name: w.warehouse_name,
          stock: w.stock,
        }));
      }
    }

    if (
      Array.isArray(product?.warehouse_inventories) &&
      product.warehouse_inventories.length > 0
    ) {
      return product.warehouse_inventories.map((w) => ({
        id: w.warehouse_id,
        name: w.warehouse_name,
        stock: w.qty ?? w.stock,
      }));
    }

    return warehouses;
  };

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;

    if (!branchId) {
      toast.error("Seleccione una sucursal.");
      return;
    }

    for (const line of lines) {
      if (!line.product?.id || Number(line.quantity) <= 0) continue;

      if (lineRequiresWarehouse(line) && !line.warehouse_id) {
        toast.error(
          `El producto "${line.product?.name || "seleccionado"}" ya maneja inventario por almacén. Selecciona un almacén.`
        );
        return;
      }
    }

    const cleanItems = lines
      .filter((line) => line.product?.id && Number(line.quantity) > 0)
      .map((line) => ({
        product_id: line.product.id,
        product_variant_id: line.variant?.id || line.product_variant_id || "",
        variation_size_id: line.variation_size_id || "",
        warehouse_id: line.warehouse_id || "",
        unit_price: Number(line.unit_price || 0),
        quantity: Number(line.quantity || 0),
        notes: line.notes || "",
      }));

    if (cleanItems.length === 0) {
      toast.error("Agrega al menos un producto válido.");
      return;
    }

    const formData = new FormData();

    formData.append("branch_id", branchId);
    formData.append("movement_type", movementType);
    formData.append("supplier_id", supplier?.id || "");
    formData.append("uuid_invoice", uuidInvoice || "");
    formData.append("folio", folio || "");
    formData.append("invoice_date", invoiceDate || "");
    formData.append("subtotal", totals.subtotal);
    formData.append("tax", totals.tax);
    formData.append("total", totals.total);
    formData.append("notes", notes || "");

    if (pdfFile) formData.append("pdf", pdfFile);
    if (xmlFile) formData.append("xml", xmlFile);

    cleanItems.forEach((item, index) => {
      formData.append(`items[${index}][product_id]`, item.product_id);
      formData.append(
        `items[${index}][product_variant_id]`,
        item.product_variant_id
      );
      formData.append(
        `items[${index}][variation_size_id]`,
        item.variation_size_id
      );
      formData.append(`items[${index}][warehouse_id]`, item.warehouse_id);
      formData.append(`items[${index}][unit_price]`, item.unit_price);
      formData.append(`items[${index}][quantity]`, item.quantity);
      formData.append(`items[${index}][notes]`, item.notes);
    });

    try {
      setLoading(true);

      await toast.promise(
        axiosClient.post("/restocks", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        {
          loading: isSalida
            ? "Registrando salida..."
            : "Registrando entrada...",
          success: isSalida
            ? "Salida registrada correctamente."
            : "Entrada registrada correctamente.",
          error: (err) =>
            err?.response?.data?.message ||
            (isSalida
              ? "Error al registrar salida."
              : "Error al registrar entrada."),
        }
      );

      resetForm();
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          maxWidth: "1100px",
          width: "100%",
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          border: fullScreen ? "none" : `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: COLORS.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: COLORS.paper,
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: isSalida
                ? alpha(COLORS.danger, 0.16)
                : alpha(COLORS.accent, 0.2),
              border: `1px solid ${
                isSalida
                  ? alpha(COLORS.danger, 0.35)
                  : alpha(COLORS.accent, 0.35)
              }`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Inventory2RoundedIcon
              sx={{ color: isSalida ? COLORS.danger : COLORS.black }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1 }}>
              {isReadOnly
                ? "Detalle del movimiento"
                : isSalida
                  ? "Registrar salida de inventario"
                  : "Registrar entrada de inventario"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {isReadOnly
                ? "Consulta la información registrada en este movimiento."
                : "Registra entradas o salidas de productos, variantes, almacén y cantidades."}
            </Typography>
          </Box>

          <IconButton onClick={handleClose} disabled={loading}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={1.5}>
          <Section
            title="Tipo de movimiento"
            subtitle="Selecciona si este registro aumenta o disminuye inventario."
            icon={<Inventory2RoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              select
              label="Tipo de movimiento"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              fullWidth
              disabled={isReadOnly}
              sx={fieldSx}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
            </TextField>
          </Section>

          <Section
            title={isSalida ? "Motivo de la salida" : "Nombre de la entrada"}
            subtitle={
              isSalida
                ? "Describe el motivo general de la salida: merma, daño, ajuste, consumo interno, etc."
                : "Este nombre se guardará en las notas generales de la factura de reabastecimiento."
            }
            icon={<NotesRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <TextField
              label={isSalida ? "Motivo de la salida" : "Nombre de la entrada"}
              placeholder={
                isSalida
                  ? "Ej. Producto dañado, merma, ajuste de inventario..."
                  : "Ej. Compra de mercancía mayo 2026"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              disabled={isReadOnly}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NotesRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Section>

          <Section
            title={isSalida ? "Datos del documento" : "Datos de factura o compra"}
            subtitle={
              isSalida
                ? "Puedes registrar un folio interno o referencia de la salida."
                : "Información general del proveedor y comprobante. El proveedor es opcional."
            }
            icon={<ReceiptLongRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              {!isSalida && (
                <Autocomplete
                  value={supplier}
                  onChange={(_, value) => setSupplier(value)}
                  options={suppliers}
                  getOptionLabel={(s) => s?.name || ""}
                  fullWidth
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Proveedor opcional"
                      sx={fieldSx}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <LocalShippingRoundedIcon fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}

              <TextField
                label={isSalida ? "UUID / Referencia" : "UUID factura"}
                value={uuidInvoice}
                onChange={(e) => setUuidInvoice(e.target.value)}
                fullWidth
                disabled={isReadOnly}
                sx={fieldSx}
              />

              <TextField
                label="Folio"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                fullWidth
                disabled={isReadOnly}
                sx={fieldSx}
              />

              <TextField
                label={isSalida ? "Fecha salida" : "Fecha factura"}
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                fullWidth
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Stack>
          </Section>

          {!isReadOnly && !isSalida && (
            <Section
              title="Archivos de factura"
              subtitle="Puedes adjuntar PDF y XML de la compra si los tienes disponibles."
              icon={<AttachFileRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileRoundedIcon />}
                  sx={{
                    ...sxBtnOutlined,
                    minWidth: 170,
                    justifyContent: "flex-start",
                  }}
                  disabled={loading}
                >
                  {pdfFile ? "PDF cargado" : "Subir PDF"}
                  <input
                    hidden
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </Button>

                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileRoundedIcon />}
                  sx={{
                    ...sxBtnOutlined,
                    minWidth: 170,
                    justifyContent: "flex-start",
                  }}
                  disabled={loading}
                >
                  {xmlFile ? "XML cargado" : "Subir XML"}
                  <input
                    hidden
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                  />
                </Button>
              </Stack>

              {(pdfFile || xmlFile) && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {pdfFile && (
                    <Chip
                      label={`PDF: ${pdfFile.name}`}
                      onDelete={() => setPdfFile(null)}
                    />
                  )}

                  {xmlFile && (
                    <Chip
                      label={`XML: ${xmlFile.name}`}
                      onDelete={() => setXmlFile(null)}
                    />
                  )}
                </Stack>
              )}
            </Section>
          )}

          <Section
            title={isSalida ? "Productos a retirar" : "Productos a ingresar"}
            subtitle={
              isSalida
                ? "La cantidad registrada se descontará del stock. No se permite dejar stock negativo."
                : "Cada partida puede tener su propia descripción. El costo actualizará el historial si cambió."
            }
            icon={<WarehouseRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            {!isReadOnly && (
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                spacing={1}
              >
                <Typography variant="caption" color="text.secondary">
                  Puedes agregar varios productos en un solo movimiento.
                </Typography>

                <Button
                  onClick={addLine}
                  variant="outlined"
                  startIcon={<AddCircleRoundedIcon />}
                  sx={sxBtnOutlined}
                >
                  Agregar producto
                </Button>
              </Stack>
            )}

            <Stack spacing={1.2}>
              {lines.map((line, idx) => {
                const variantOptions = getVariantOptions(line.product);
                const warehouseOptions = getWarehouseOptions(line);
                const requiresWarehouse = lineRequiresWarehouse(line);
                const lineSubtotal =
                  Number(line.unit_price || 0) * Number(line.quantity || 0);

                return (
                  <Paper
                    key={line.id}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${alpha("#000", 0.08)}`,
                      bgcolor: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1.1,
                        bgcolor: isSalida
                          ? alpha(COLORS.danger, 0.08)
                          : alpha(COLORS.accent, 0.1),
                        borderBottom: `1px solid ${alpha("#000", 0.07)}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          size="small"
                          label={`Partida ${idx + 1}`}
                          sx={{
                            fontWeight: 900,
                            bgcolor: "#fff",
                          }}
                        />

                        <Chip
                          size="small"
                          label={isSalida ? "Salida" : "Entrada"}
                          color={isSalida ? "error" : "success"}
                        />

                        <Box sx={{ flex: 1 }} />

                        {!isReadOnly && (
                          <>
                            <Tooltip title="Agregar partida">
                              <IconButton onClick={addLine} size="small">
                                <AddCircleRoundedIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Eliminar partida">
                              <span>
                                <IconButton
                                  onClick={() => removeLine(line.id)}
                                  disabled={lines.length === 1}
                                  size="small"
                                  sx={{
                                    color: COLORS.danger,
                                    opacity: lines.length === 1 ? 0.4 : 1,
                                  }}
                                >
                                  <RemoveCircleRoundedIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </Box>

                    <Box sx={{ p: 1.5 }}>
                      <Stack spacing={1.2}>
                        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.2}>
                          <Autocomplete
                            value={line.product}
                            onChange={(_, product) => {
                              updateLine(line.id, {
                                product: product || null,
                                variant: null,
                                product_variant_id: "",
                                variation_size_id: "",
                                warehouse_id: "",
                                unit_price: Number(product?.purchase_cost || 0),
                              });
                            }}
                            onInputChange={(_, inputValue) => {
                              setProductSearch(inputValue);
                            }}
                            options={filteredProducts}
                            loading={loadingProducts}
                            disabled={isReadOnly}
                            getOptionLabel={(p) =>
                              p?.name
                                ? `${p.name}${p.sku ? ` • ${p.sku}` : ""}`
                                : ""
                            }
                            isOptionEqualToValue={(option, value) =>
                              Number(option?.id) === Number(value?.id)
                            }
                            fullWidth
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Buscar producto"
                                sx={fieldSx}
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <>
                                      <InputAdornment position="start">
                                        <SearchRoundedIcon fontSize="small" />
                                      </InputAdornment>
                                      {params.InputProps.startAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                          />

                          <Autocomplete
                            value={line.variant}
                            onChange={(_, variant) => {
                              updateLine(line.id, {
                                variant: variant || null,
                                product_variant_id: variant?.id || "",
                                warehouse_id: "",
                                unit_price: Number(
                                  variant?.purchase_cost ||
                                    variant?.price ||
                                    line.unit_price ||
                                    0
                                ),
                              });
                            }}
                            options={variantOptions}
                            disabled={isReadOnly || variantOptions.length === 0}
                            getOptionLabel={(v) =>
                              v?.label || v?.name || v?.sku || ""
                            }
                            isOptionEqualToValue={(option, value) =>
                              Number(option?.id) === Number(value?.id)
                            }
                            fullWidth
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={
                                  variantOptions.length > 0
                                    ? "Buscar variante"
                                    : "Sin variantes"
                                }
                                sx={fieldSx}
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <>
                                      <InputAdornment position="start">
                                        <SearchRoundedIcon fontSize="small" />
                                      </InputAdornment>
                                      {params.InputProps.startAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                          />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                          <TextField
                            select
                            fullWidth
                            label="Almacén"
                            value={line.warehouse_id || ""}
                            onChange={(e) =>
                              updateLine(line.id, {
                                warehouse_id: e.target.value,
                              })
                            }
                            disabled={isReadOnly}
                            required={requiresWarehouse}
                            helperText={
                              requiresWarehouse
                                ? "Este producto ya usa inventario por almacén."
                                : "Si eliges almacén, el producto quedará ligado a inventario por almacén."
                            }
                            sx={fieldSx}
                          >
                            {!requiresWarehouse && (
                              <MenuItem value="">Sin almacén</MenuItem>
                            )}

                            {warehouseOptions.map((warehouse) => (
                              <MenuItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                                {warehouse.stock !== undefined &&
                                warehouse.stock !== null
                                  ? ` — Stock: ${warehouse.stock}`
                                  : ""}
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            label={isSalida ? "Costo referencial" : "Costo de compra"}
                            type="number"
                            value={line.unit_price}
                            onChange={(e) =>
                              updateLine(line.id, {
                                unit_price: Number(e.target.value || 0),
                              })
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                            disabled={isReadOnly}
                            fullWidth
                            sx={fieldSx}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">$</InputAdornment>
                              ),
                            }}
                          />

                          <TextField
                            label="Cantidad"
                            type="number"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line.id, {
                                quantity: Number(e.target.value || 0),
                              })
                            }
                            inputProps={{ min: 0.01, step: "0.01" }}
                            disabled={isReadOnly}
                            fullWidth
                            sx={fieldSx}
                          />

                          <TextField
                            label="Subtotal"
                            value={money(lineSubtotal)}
                            disabled
                            fullWidth
                            sx={fieldSx}
                          />
                        </Stack>

                        <TextField
                          label="Descripción de la partida"
                          placeholder={
                            isSalida
                              ? "Ej. Producto dañado, merma, retiro interno..."
                              : "Ej. Caja dañada, lote especial, entrega parcial..."
                          }
                          value={line.notes || ""}
                          onChange={(e) =>
                            updateLine(line.id, { notes: e.target.value })
                          }
                          disabled={isReadOnly}
                          fullWidth
                          multiline
                          minRows={2}
                          sx={fieldSx}
                        />
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Section>

          <Section
            title="Resumen"
            subtitle={`Totales calculados antes de guardar la ${
              isSalida ? "salida" : "entrada"
            }.`}
            icon={<PaidRoundedIcon sx={{ fontSize: 17, color: COLORS.black }} />}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={`Subtotal: ${money(totals.subtotal)}`}
                sx={{ fontWeight: 900 }}
              />

              <Chip
                label={`Total: ${money(totals.total)}`}
                sx={{
                  fontWeight: 900,
                  bgcolor: isSalida
                    ? alpha(COLORS.danger, 0.14)
                    : alpha(COLORS.accent, 0.28),
                  border: `1px solid ${
                    isSalida
                      ? alpha(COLORS.danger, 0.28)
                      : alpha(COLORS.accent, 0.4)
                  }`,
                }}
              />
            </Stack>

            {!isReadOnly && (
              <Typography variant="caption" color="text.secondary">
                {isSalida
                  ? "El stock se descontará al guardar. No se permite registrar salidas mayores al stock disponible."
                  : "El stock se actualizará al guardar la entrada. Si el costo de compra cambia, se registrará en el historial."}
              </Typography>
            )}
          </Section>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: COLORS.paper,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseRoundedIcon />}
          variant="outlined"
          sx={sxBtnOutlined}
        >
          {isReadOnly ? "Cerrar" : "Cancelar"}
        </Button>

        <Box sx={{ flex: 1 }} />

        {!isReadOnly && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveRoundedIcon />
              )
            }
            sx={{
              ...sxBtnBlack,
              minWidth: 220,
            }}
          >
            {loading
              ? "Guardando..."
              : isSalida
                ? "Guardar salida"
                : "Guardar entrada"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}