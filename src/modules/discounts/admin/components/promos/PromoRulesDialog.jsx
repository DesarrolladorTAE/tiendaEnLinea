import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  forwardRef,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Divider,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  useMediaQuery,
  Autocomplete,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Popper,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import axiosClient from "../../../../../config/axiosClient";

/* =========================
   helpers
========================= */
function normalizeListResponse(res) {
  const d = res?.data;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  if (Array.isArray(d)) return d;
  return [];
}

function useDebouncedValue(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function prettyMode(mode) {
  return mode === "exclude" ? "Excepto" : "Aplica a";
}

function prettyScopeType(scopeType) {
  if (scopeType === "product") return "Producto";
  if (scopeType === "category") return "Categoría";
  if (scopeType === "variant") return "Variante";
  if (scopeType === "variant_attribute") return "Atributo";
  return scopeType;
}

function getImageUrl(item) {
  return item?.image || item?.product_image || null;
}

/* =========================
   Popper seguro
========================= */
const SafePopper = (props) => {
  const { anchorEl, style } = props;

  return (
    <Popper
      {...props}
      placement="bottom-start"
      style={{
        ...style,
        width: anchorEl ? anchorEl.clientWidth : undefined,
      }}
      modifiers={[
        { name: "offset", options: { offset: [0, 8] } },
        {
          name: "preventOverflow",
          options: {
            boundary: "viewport",
            padding: 8,
          },
        },
        {
          name: "flip",
          options: {
            fallbackPlacements: ["top-start", "bottom-start"],
          },
        },
      ]}
      sx={(theme) => ({
        zIndex: theme.zIndex.modal + 20,
      })}
    />
  );
};

/* =========================
   Listbox con footer "Cargar más"
========================= */
function makeLoadMoreListbox({ loading, hasMore, onLoadMore }) {
  return forwardRef(function LoadMoreListbox(props, ref) {
    const { children, ...other } = props;

    return (
      <Box
        ref={ref}
        component="ul"
        {...other}
        sx={{
          m: 0,
          p: 0,
          listStyle: "none",
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {children}

        <Box component="li" sx={{ p: 1.25, bgcolor: "background.paper" }}>
          {hasMore ? (
            <Button
              fullWidth
              variant="outlined"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onLoadMore}
              disabled={loading}
              sx={{ borderRadius: 3, fontWeight: 900 }}
            >
              {loading ? "Cargando…" : "Cargar más"}
            </Button>
          ) : (
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              No hay más resultados.
            </Typography>
          )}
        </Box>
      </Box>
    );
  });
}

/* =========================
   OptionPicker genérico
========================= */
function PromotionOptionPicker({
  apiBase,
  endpoint,
  label,
  placeholder,
  helperText,
  value,
  onChange,
  disabled,
  icon,
  getOptionLabelText,
}) {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const q = useDebouncedValue(input.trim(), 350);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const lastKeyRef = useRef("");
  const perPage = 20;
  const minChars = 2;

  const fetchOptions = useCallback(
    async ({ nextPage = 1, mode = "replace" } = {}) => {
      if (!apiBase || !endpoint || disabled) return;

      if (!q || q.length < minChars) {
        setItems([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      const key = `${apiBase}${endpoint}|${q}|${nextPage}|${perPage}`;
      lastKeyRef.current = key;

      setLoading(true);
      try {
        const res = await axiosClient.get(`${apiBase}${endpoint}`, {
          params: { q, per_page: perPage, page: nextPage },
        });

        const list = normalizeListResponse(res);
        if (lastKeyRef.current !== key) return;

        setItems((prev) => {
          if (mode !== "append") return list;

          const merged = [...prev, ...list];
          const map = new Map();
          merged.forEach((item) => map.set(String(item.id), item));
          return Array.from(map.values());
        });

        const d = res?.data;
        if (d?.current_page && d?.last_page) {
          setHasMore(Number(d.current_page) < Number(d.last_page));
        } else {
          setHasMore(list.length === perPage);
        }

        setPage(nextPage);
      } catch (e) {
        console.error(e);
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [apiBase, endpoint, disabled, q]
  );

  useEffect(() => {
    if (!open || disabled || !apiBase || !endpoint) return;
    fetchOptions({ nextPage: 1, mode: "replace" });
  }, [open, apiBase, endpoint, disabled, q, fetchOptions]);

  const ListboxComponent = useMemo(
    () =>
      makeLoadMoreListbox({
        loading,
        hasMore,
        onLoadMore: () => fetchOptions({ nextPage: page + 1, mode: "append" }),
      }),
    [loading, hasMore, page, fetchOptions]
  );

  const noOptionsText = !apiBase
    ? "Falta apiBase."
    : !q
      ? `Escribe para buscar (${minChars}+ letras)…`
      : q.length < minChars
        ? `Escribe al menos ${minChars} letras…`
        : loading
          ? "Buscando…"
          : "Sin resultados.";

  return (
    <Autocomplete
      disabled={disabled || !apiBase}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disablePortal={false}
      PopperComponent={SafePopper}
      ListboxComponent={ListboxComponent}
      options={items}
      value={value}
      loading={loading}
      filterOptions={(x) => x}
      onChange={(_, v) => onChange(v)}
      inputValue={input}
      onInputChange={(_, v, reason) => {
        if (reason === "input") setInput(v);
        if (reason === "clear") setInput("");
      }}
      isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
      getOptionLabel={(opt) =>
        getOptionLabelText
          ? getOptionLabelText(opt)
          : String(opt?.name || `#${opt?.id || ""}`)
      }
      noOptionsText={noOptionsText}
      sx={{
        "& .MuiOutlinedInput-root": { borderRadius: 3 },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, opt) => {
        const image = getImageUrl(opt);

        return (
          <Box
            component="li"
            {...props}
            key={opt.id}
            sx={{
              py: 1,
              px: 1.25,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ width: "100%" }}>
              <Avatar
                variant="rounded"
                src={image || undefined}
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  flexShrink: 0,
                }}
              >
                {!image ? icon : null}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={950} noWrap>
                  {getOptionLabelText ? getOptionLabelText(opt) : opt.name || `#${opt.id}`}
                </Typography>

                <Typography variant="caption" sx={{ opacity: 0.78 }} noWrap>
                  {opt.meta || `ID: ${opt.id}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      }}
    />
  );
}

function ProductPicker(props) {
  return (
    <PromotionOptionPicker
      {...props}
      endpoint="/promotion-options/products"
      label="Producto"
      placeholder="Ej: coca, sabritas, leche…"
      helperText="Busca productos de esta sucursal."
      icon={<ImageRoundedIcon fontSize="small" />}
      getOptionLabelText={(opt) => String(opt?.name || `#${opt?.id || ""}`)}
    />
  );
}

function CategoryPicker(props) {
  return (
    <PromotionOptionPicker
      {...props}
      endpoint="/promotion-options/categories"
      label="Categoría"
      placeholder="Ej: bebidas, botanas, limpieza…"
      helperText="Busca categorías de esta sucursal."
      icon={<CategoryRoundedIcon fontSize="small" />}
      getOptionLabelText={(opt) => String(opt?.name || `#${opt?.id || ""}`)}
    />
  );
}

function VariantPicker(props) {
  return (
    <PromotionOptionPicker
      {...props}
      endpoint="/promotion-options/variants"
      label="Variante"
      placeholder="Ej: Coca 600 ml, Roja XL…"
      helperText="Busca variantes registradas en esta sucursal."
      icon={<Inventory2RoundedIcon fontSize="small" />}
      getOptionLabelText={(opt) => String(opt?.name || `#${opt?.id || ""}`)}
    />
  );
}

function VariantAttributePicker(props) {
  return (
    <PromotionOptionPicker
      {...props}
      endpoint="/promotion-options/variant-attributes"
      label="Atributo"
      placeholder="Ej: color rojo, talla mediana…"
      helperText="Busca atributos ya existentes en variantes."
      icon={<TuneRoundedIcon fontSize="small" />}
      getOptionLabelText={(opt) =>
        opt?.name && opt?.value
          ? `${opt.name}: ${opt.value}`
          : String(opt?.label || `#${opt?.id || ""}`)
      }
    />
  );
}

/* =========================
   Help dialog
========================= */
function PromoRulesHelpDialog({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 1 }}>
        Guía rápida de reglas
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)}, transparent)`,
            }}
          >
            <Typography fontWeight={950}>¿Qué significa “Aplica a”?</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Es donde <b>sí</b> entra la promoción.
              <br />
              Ejemplo: “Aplica a la <b>categoría Bebidas</b>”.
            </Typography>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(180deg, ${alpha(theme.palette.warning.main, 0.08)}, transparent)`,
            }}
          >
            <Typography fontWeight={950}>¿Qué significa “Excepto”?</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Son excepciones que <b>bloquean</b> la promoción.
              <br />
              Ejemplo: “Aplica a Bebidas, <b>excepto Coca 600 ml</b>”.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={950}>Tipos de regla</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="body2">
                • <b>Producto</b>: elige un producto puntual.
              </Typography>
              <Typography variant="body2">
                • <b>Categoría</b>: la promoción afecta una categoría.
              </Typography>
              <Typography variant="body2">
                • <b>Variante</b>: aplica a una variante específica.
              </Typography>
              <Typography variant="body2">
                • <b>Atributo</b>: por ejemplo <b>color = rojo</b>.
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 3, fontWeight: 900 }}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================
   MAIN
========================= */
export function PromoRulesDialog({
  open,
  onClose,
  promo,
  rules = [],
  loading = false,
  onAdd,
  onDelete,
  apiBase,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [helpOpen, setHelpOpen] = useState(false);

  const [mode, setMode] = useState("include");
  const [scopeType, setScopeType] = useState("product");

  const [scopeId, setScopeId] = useState("");
  const [attrName, setAttrName] = useState("");
  const [attrValue, setAttrValue] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMode("include");
    setScopeType("product");
    setScopeId("");
    setAttrName("");
    setAttrValue("");
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedVariant(null);
    setSelectedAttribute(null);
  }, [open]);

  const canSubmit =
    scopeType === "variant_attribute"
      ? attrName.trim() && attrValue.trim()
      : scopeType === "product"
        ? !!selectedProduct?.id
        : scopeType === "category"
          ? !!selectedCategory?.id
          : scopeType === "variant"
            ? !!selectedVariant?.id
            : String(scopeId).trim() !== "";

  const resetInputs = () => {
    setScopeId("");
    setAttrName("");
    setAttrValue("");
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedVariant(null);
    setSelectedAttribute(null);
  };

  const scopeLabel = (r) => {
    if (r?.scope_label) return r.scope_label;
    if (r.scope_type === "variant_attribute") return `${r.attr_name} = ${r.attr_value}`;
    return `${prettyScopeType(r.scope_type)} • ID: ${r.scope_id}`;
  };

  const handleAdd = () => {
    if (!canSubmit) return;

    const payload =
      scopeType === "variant_attribute"
        ? {
            mode,
            scope_type: scopeType,
            attr_name: attrName.trim(),
            attr_value: attrValue.trim(),
          }
        : {
            mode,
            scope_type: scopeType,
            scope_id: Number(scopeId),
          };

    onAdd?.(payload);
    resetInputs();
  };

  const previewData = useMemo(() => {
    if (scopeType === "product" && selectedProduct) {
      return {
        title: selectedProduct.name || `Producto #${selectedProduct.id}`,
        subtitle: selectedProduct.meta || `ID: ${selectedProduct.id}`,
        image: selectedProduct.image || null,
      };
    }

    if (scopeType === "category" && selectedCategory) {
      return {
        title: selectedCategory.name || `Categoría #${selectedCategory.id}`,
        subtitle: selectedCategory.meta || `ID: ${selectedCategory.id}`,
        image: null,
      };
    }

    if (scopeType === "variant" && selectedVariant) {
      return {
        title: selectedVariant.name || `Variante #${selectedVariant.id}`,
        subtitle: selectedVariant.meta || `ID: ${selectedVariant.id}`,
        image: selectedVariant.image || selectedVariant.product_image || null,
      };
    }

    if (scopeType === "variant_attribute" && (attrName.trim() || attrValue.trim())) {
      return {
        title:
          attrName.trim() && attrValue.trim()
            ? `${attrName.trim()}: ${attrValue.trim()}`
            : "Atributo incompleto",
        subtitle: "Se guardará como regla por atributo",
        image: null,
      };
    }

    return null;
  }, [
    scopeType,
    selectedProduct,
    selectedCategory,
    selectedVariant,
    attrName,
    attrValue,
  ]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            overflow: "hidden",
            minHeight: { xs: "100%", md: 620 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            px: { xs: 2, md: 3 },
            py: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
          }}
        >
          Reglas de la promoción
          {promo?.name ? (
            <Typography component="span" sx={{ opacity: 0.75, fontWeight: 800 }}>
              {" "}
              • {promo.name}
            </Typography>
          ) : null}

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Ver guía">
            <IconButton onClick={() => setHelpOpen(true)}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
          }}
        >
          <Stack spacing={2.2}>
            {/* 1) Comportamiento */}
            <Box>
              <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                1) Comportamiento de la regla
              </Typography>

              <ToggleButtonGroup
                fullWidth
                exclusive
                value={mode}
                onChange={(_, v) => v && setMode(v)}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  borderRadius: 3,
                  overflow: "hidden",
                  "& .MuiToggleButton-root": {
                    py: 1.15,
                    fontWeight: 950,
                    borderColor: alpha(theme.palette.divider, 0.7),
                  },
                }}
              >
                <ToggleButton value="include">Aplica a</ToggleButton>
                <ToggleButton value="exclude">Excepto</ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="caption" sx={{ display: "block", mt: 0.75, opacity: 0.8 }}>
                Tip: “Excepto” sirve para bloquear productos, categorías o variantes específicas.
              </Typography>
            </Box>

            {/* 2) Tipo */}
            <Box>
              <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                2) Tipo de regla
              </Typography>

              <TextField
                select
                fullWidth
                value={scopeType}
                onChange={(e) => {
                  setScopeType(e.target.value);
                  resetInputs();
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
              >
                <MenuItem value="product">Producto</MenuItem>
                <MenuItem value="category">Categoría</MenuItem>
                <MenuItem value="variant">Variante</MenuItem>
                <MenuItem value="variant_attribute">Atributo (color, talla, etc.)</MenuItem>
              </TextField>
            </Box>

            {/* 3) Selección */}
            <Box>
              <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                3) Selección
              </Typography>

              {scopeType === "product" ? (
                <ProductPicker
                  apiBase={apiBase}
                  value={selectedProduct}
                  onChange={(p) => {
                    setSelectedProduct(p);
                    setScopeId(p?.id ? String(p.id) : "");
                  }}
                  disabled={!apiBase}
                />
              ) : scopeType === "category" ? (
                <CategoryPicker
                  apiBase={apiBase}
                  value={selectedCategory}
                  onChange={(c) => {
                    setSelectedCategory(c);
                    setScopeId(c?.id ? String(c.id) : "");
                  }}
                  disabled={!apiBase}
                />
              ) : scopeType === "variant" ? (
                <VariantPicker
                  apiBase={apiBase}
                  value={selectedVariant}
                  onChange={(v) => {
                    setSelectedVariant(v);
                    setScopeId(v?.id ? String(v.id) : "");
                  }}
                  disabled={!apiBase}
                />
              ) : (
                <Stack spacing={2}>
                  <VariantAttributePicker
                    apiBase={apiBase}
                    value={selectedAttribute}
                    onChange={(a) => {
                      setSelectedAttribute(a);
                      setAttrName(a?.name || "");
                      setAttrValue(a?.value || "");
                    }}
                    disabled={!apiBase}
                  />

                  <TextField
                    fullWidth
                    label="Nombre del atributo"
                    placeholder="Ej: color"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />

                  <TextField
                    fullWidth
                    label="Valor del atributo"
                    placeholder="Ej: rojo"
                    value={attrValue}
                    onChange={(e) => setAttrValue(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                </Stack>
              )}

              {previewData ? (
                <Chip
                  sx={{ mt: 1.25, fontWeight: 900 }}
                  color="primary"
                  variant="outlined"
                  label={`Seleccionado: ${previewData.title}`}
                />
              ) : null}
            </Box>

            {/* 4) Vista previa */}
            <Box>
              <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                4) Vista previa de la regla
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 4,
                  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
                  borderColor: alpha(theme.palette.divider, 0.9),
                }}
              >
                {!previewData ? (
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    Aún no has seleccionado un elemento. Elige un producto, categoría, variante o
                    atributo para ver la vista previa.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={prettyMode(mode)}
                        sx={{
                          fontWeight: 950,
                          bgcolor:
                            mode === "exclude"
                              ? alpha(theme.palette.warning.main, 0.18)
                              : alpha(theme.palette.success.main, 0.18),
                        }}
                      />
                      <Chip
                        label={prettyScopeType(scopeType)}
                        variant="outlined"
                        sx={{ fontWeight: 900 }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        variant="rounded"
                        src={previewData.image || undefined}
                        sx={{
                          width: 58,
                          height: 58,
                          borderRadius: 3,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        }}
                      >
                        {!previewData.image
                          ? scopeType === "product"
                            ? <ImageRoundedIcon />
                            : scopeType === "category"
                              ? <CategoryRoundedIcon />
                              : scopeType === "variant"
                                ? <Inventory2RoundedIcon />
                                : <TuneRoundedIcon />
                          : null}
                      </Avatar>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={950} noWrap>
                          {previewData.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.78 }}>
                          {previewData.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                )}
              </Paper>
            </Box>

            {/* 5) Acciones */}
            <Box>
              <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                5) Acciones
              </Typography>

              <Stack spacing={1.2}>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  disabled={!canSubmit}
                  onClick={handleAdd}
                  sx={{ borderRadius: 3, py: 1.15, fontWeight: 950 }}
                  fullWidth
                >
                  Agregar regla
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={resetInputs}
                  sx={{ borderRadius: 3, py: 1.15, fontWeight: 950 }}
                  fullWidth
                >
                  Limpiar
                </Button>
              </Stack>
            </Box>

            {/* 6) Reglas actuales */}
            <Box>
              <Divider sx={{ mb: 1.5 }} />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}
              >
                <Typography fontWeight={950}>6) Reglas actuales</Typography>
                <Chip
                  size="small"
                  label={`${rules.length} regla${rules.length === 1 ? "" : "s"}`}
                  sx={{ fontWeight: 900 }}
                />
              </Stack>

              {loading ? (
                <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : rules.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    borderStyle: "dashed",
                    borderColor: alpha(theme.palette.divider, 0.9),
                    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)}, transparent)`,
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <LocalOfferRoundedIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={950}>Aún no hay reglas</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Agrega al menos una regla para controlar dónde aplica la promoción.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ) : isMobile ? (
                <Stack spacing={1.25}>
                  {rules.map((r) => (
                    <Paper
                      key={r.id}
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 4,
                        borderColor: alpha(theme.palette.divider, 0.9),
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={prettyMode(r.mode)}
                          sx={{
                            fontWeight: 950,
                            bgcolor:
                              r.mode === "exclude"
                                ? alpha(theme.palette.warning.main, 0.18)
                                : alpha(theme.palette.success.main, 0.18),
                          }}
                        />
                        <Typography fontWeight={950} sx={{ flex: 1 }} noWrap>
                          {prettyScopeType(r.scope_type)}
                        </Typography>

                        <Tooltip title="Eliminar regla">
                          <IconButton color="error" onClick={() => onDelete?.(r.id)} size="small">
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      <Typography variant="body2" sx={{ mt: 1, opacity: 0.88 }}>
                        {scopeLabel(r)}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 4, maxHeight: "42vh" }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 950 }}>Regla</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Detalle</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 950 }}>
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rules.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>
                            <Chip
                              size="small"
                              label={prettyMode(r.mode)}
                              sx={{
                                fontWeight: 950,
                                bgcolor:
                                  r.mode === "exclude"
                                    ? alpha(theme.palette.warning.main, 0.18)
                                    : alpha(theme.palette.success.main, 0.18),
                              }}
                            />
                          </TableCell>
                          <TableCell>{prettyScopeType(r.scope_type)}</TableCell>
                          <TableCell>{scopeLabel(r)}</TableCell>
                          <TableCell align="right">
                            <Button
                              color="error"
                              variant="text"
                              startIcon={<DeleteRoundedIcon />}
                              onClick={() => onDelete?.(r.id)}
                              sx={{ fontWeight: 900 }}
                            >
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 3, fontWeight: 900 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <PromoRulesHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}