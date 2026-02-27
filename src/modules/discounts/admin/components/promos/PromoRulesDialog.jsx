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
  Grid,
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

import axiosClient from "../../../../../config/axiosClient";

/* =========================
   helpers
========================= */
const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

function imageUrlMaybe(path) {
  if (!path) return "";
  return String(path).startsWith("http") ? path : `/storage/${path}`;
}

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

/* =========================
   Popper seguro (GLOBAL)
   - NO se sale del modal
   - MISMO ancho que el input
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
        { name: "preventOverflow", options: { boundary: "clippingParents", padding: 8 } },
        { name: "flip", options: { fallbackPlacements: ["bottom-start", "top-start"] } },
      ]}
      sx={(theme) => ({ zIndex: theme.zIndex.modal + 2 })}
    />
  );
};

/* =========================
   Listbox con footer "Cargar más"
========================= */
function makeLoadMoreListbox({ loading, hasMore, onLoadMore }) {
  // eslint-disable-next-line react/display-name
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
          maxHeight: 360,
          overflow: "auto",
        }}
      >
        {children}
        <Box component="li" sx={{ p: 1.25 }}>
          {hasMore ? (
            <Button
              fullWidth
              variant="outlined"
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
   ProductPicker PRO
========================= */
function ProductPicker({ apiBase, value, onChange, disabled }) {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const q = useDebouncedValue(input.trim(), 350);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const lastKeyRef = useRef("");

  const perPage = 18;
  const minChars = 2;

  const fetchProducts = useCallback(
    async ({ nextPage = 1, mode = "replace" } = {}) => {
      if (!apiBase || disabled) return;

      if (!q || q.length < minChars) {
        setItems([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      const key = `${apiBase}/products|${q}|${nextPage}|${perPage}`;
      lastKeyRef.current = key;

      setLoading(true);
      try {
        const res = await axiosClient.get(`${apiBase}/products`, {
          params: { q, per_page: perPage, page: nextPage },
        });

        const list = normalizeListResponse(res);
        if (lastKeyRef.current !== key) return;

        setItems((prev) => (mode === "append" ? [...prev, ...list] : list));

        const d = res?.data?.data;
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
    [apiBase, disabled, q]
  );

  useEffect(() => {
    if (!open || disabled || !apiBase) return;
    fetchProducts({ nextPage: 1, mode: "replace" });
  }, [open, apiBase, disabled, q, fetchProducts]);

  const ListboxComponent = useMemo(
    () =>
      makeLoadMoreListbox({
        loading,
        hasMore,
        onLoadMore: () => fetchProducts({ nextPage: page + 1, mode: "append" }),
      }),
    [loading, hasMore, page, fetchProducts]
  );

  const noOptionsText = !apiBase
    ? "Selecciona una sucursal para cargar productos."
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
      disablePortal
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
      isOptionEqualToValue={(a, b) => Number(a?.id) === Number(b?.id)}
      getOptionLabel={(opt) =>
        opt?.name ? String(opt.name) : opt?.title ? String(opt.title) : `#${opt?.id || ""}`
      }
      noOptionsText={noOptionsText}
      sx={{
        "& .MuiOutlinedInput-root": { borderRadius: 3 },
        "& .MuiAutocomplete-paper": {
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Producto"
          placeholder="Ej: coca, 750ml, SKU…"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          helperText="Busca por nombre/SKU/código. No cargamos todo para que vaya rápido."
        />
      )}
      renderOption={(props, opt) => {
        const img = imageUrlMaybe(opt?.image || opt?.main_image || opt?.cover);
        const sku = opt?.sku || opt?.code || opt?.barcode || "";
        const price = opt?.price ?? opt?.sale_price ?? null;

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
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%" }}>
              <Avatar
                variant="rounded"
                src={img || undefined}
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  flexShrink: 0,
                }}
              >
                <ImageRoundedIcon fontSize="small" />
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={950} noWrap>
                  {opt.name || opt.title || `Producto #${opt.id}`}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.78 }} noWrap>
                  {sku ? `SKU: ${sku} • ` : ""}ID: {opt.id}
                  {price != null ? ` • ${fmtMoney(price)}` : ""}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      }}
    />
  );
}

/* =========================
   CategoryPicker (MISMO FLOW que Producto)
   - carga flat una vez (por branch)
   - búsqueda con mínimo 2 letras
   - paginación LOCAL con "Cargar más"
========================= */
function CategoryPicker({ branchId, value, onChange, disabled }) {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const q = useDebouncedValue(input.trim(), 250);

  const [loading, setLoading] = useState(false);
  const [flat, setFlat] = useState([]);

  // paginación local
  const perPage = 22;
  const minChars = 2;
  const [limit, setLimit] = useState(perPage);

  const catMap = useMemo(() => {
    const m = new Map();
    (flat || []).forEach((c) => m.set(Number(c.id), c));
    return m;
  }, [flat]);

  const breadcrumb = useCallback(
    (cat) => {
      if (!cat) return "";
      const names = [];
      let cur = cat;
      let guard = 0;
      while (cur && guard < 12) {
        names.unshift(cur.name || `#${cur.id}`);
        const pid = cur.parent_id != null ? Number(cur.parent_id) : null;
        cur = pid ? catMap.get(pid) : null;
        guard++;
      }
      return names.join(" / ");
    },
    [catMap]
  );

  const fetchAllCats = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await axiosClient.get("admin/categories", {
        params: { branch_id: branchId },
      });
      const list = res?.data?.categories ?? res?.data ?? [];
      setFlat(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setFlat([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!branchId || disabled) return;
    fetchAllCats();
  }, [branchId, disabled, fetchAllCats]);

  // reset paginación cuando cambias búsqueda o abres
  useEffect(() => {
    setLimit(perPage);
  }, [q, branchId, perPage]);

  const filtered = useMemo(() => {
    if (!q || q.length < minChars) return [];
    const qq = q.toLowerCase();
    // filtro rápido por nombre y breadcrumb (si quieres más agresivo)
    const base = (flat || []).filter((c) => {
      const n = String(c?.name || "").toLowerCase();
      return n.includes(qq);
    });
    return base;
  }, [flat, q]);

  const sliced = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
  const hasMore = filtered.length > limit;

  const ListboxComponent = useMemo(
    () =>
      makeLoadMoreListbox({
        loading: false,
        hasMore,
        onLoadMore: () => setLimit((x) => x + perPage),
      }),
    [hasMore, perPage]
  );

  const noOptionsText = !branchId
    ? "Selecciona una sucursal primero…"
    : !q
    ? `Escribe para buscar (${minChars}+ letras)…`
    : q.length < minChars
    ? `Escribe al menos ${minChars} letras…`
    : loading
    ? "Cargando categorías…"
    : "Sin resultados.";

  return (
    <Autocomplete
      disabled={disabled || !branchId}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disablePortal
      PopperComponent={SafePopper}
      ListboxComponent={ListboxComponent}
      options={sliced}
      value={value}
      loading={loading}
      filterOptions={(x) => x}
      onChange={(_, v) => onChange(v)}
      inputValue={input}
      onInputChange={(_, v, reason) => {
        if (reason === "input") setInput(v);
        if (reason === "clear") setInput("");
      }}
      isOptionEqualToValue={(a, b) => Number(a?.id) === Number(b?.id)}
      getOptionLabel={(opt) => breadcrumb(opt) || String(opt?.name || `#${opt?.id || ""}`)}
      noOptionsText={noOptionsText}
      sx={{
        "& .MuiOutlinedInput-root": { borderRadius: 3 },
        "& .MuiAutocomplete-paper": {
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Categoría"
          placeholder="Ej: bebidas, botanas, limpieza…"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          helperText="Escribe para buscar. Si hay muchas categorías, usa “Cargar más”."
        />
      )}
      renderOption={(props, opt) => (
        <Box component="li" {...props} key={opt.id} sx={{ py: 1, px: 1.25 }}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ width: "100%" }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                flexShrink: 0,
              }}
            >
              <CategoryRoundedIcon fontSize="small" />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={950} noWrap>
                {opt.name || `Categoría #${opt.id}`}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.78 }} noWrap>
                {breadcrumb(opt)} • ID: {opt.id}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    />
  );
}

/* =========================
   Help dialog (guía)
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
              Es donde <b>SÍ</b> entra la promoción.
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
              Son excepciones que <b>bloquean</b> la promo aunque cumpla.
              <br />
              Ejemplo: “Aplica a Bebidas, <b>excepto Coca 600ml</b>”.
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={950}>Tipos de regla</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="body2">
                • <b>Producto</b>: busca por nombre/SKU y elige uno.
              </Typography>
              <Typography variant="body2">
                • <b>Categoría</b>: busca una categoría por nombre.
              </Typography>
              <Typography variant="body2">
                • <b>Variante</b>: por ID (temporal).
              </Typography>
              <Typography variant="body2">
                • <b>Atributo</b>: por ejemplo “color = rojo” (si tu backend lo soporta).
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={950}>Consejos</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              • Para tiendas grandes, escribe al menos <b>2 letras</b> y usa <b>Cargar más</b>.
              <br />
              • Si no agregas reglas “Aplica a”, la promo puede quedar como <b>general</b> (según tu lógica).
            </Typography>
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
   MAIN (FORMULARIO: 1 campo por fila)
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
  activeBranchId,
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

  useEffect(() => {
    if (!open) return;
    setMode("include");
    setScopeType("product");
    setScopeId("");
    setAttrName("");
    setAttrValue("");
    setSelectedProduct(null);
    setSelectedCategory(null);
  }, [open]);

  const canSubmit =
    scopeType === "variant_attribute"
      ? attrName.trim() && attrValue.trim()
      : scopeType === "product"
      ? !!selectedProduct?.id
      : scopeType === "category"
      ? !!selectedCategory?.id
      : String(scopeId).trim() !== "";

  const resetInputs = () => {
    setScopeId("");
    setAttrName("");
    setAttrValue("");
    setSelectedProduct(null);
    setSelectedCategory(null);
  };

  const scopeLabel = (r) => {
    if (r.scope_type === "variant_attribute") return `${r.attr_name} = ${r.attr_value}`;
    return `${prettyScopeType(r.scope_type)} • ID: ${r.scope_id}`;
  };

  const handleAdd = () => {
    if (!canSubmit) return;

    const payload =
      scopeType === "variant_attribute"
        ? { mode, scope_type: scopeType, attr_name: attrName.trim(), attr_value: attrValue.trim() }
        : { mode, scope_type: scopeType, scope_id: Number(scopeId) };

    onAdd?.(payload);
    resetInputs();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: { xs: 0, sm: 4 }, overflow: "hidden" },
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

        <DialogContent dividers sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
          <Grid container spacing={2}>
            {/* FORM: 1 campo por fila */}
            <Grid item xs={12}>
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
                Tip: “Excepto” se usa para <b>bloquear</b> casos específicos.
              </Typography>
            </Grid>

            <Grid item xs={12}>
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
                <MenuItem value="variant">Variante (por ID)</MenuItem>
                <MenuItem value="variant_attribute">Atributo (color, talla, etc.)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
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
                <>
                  <CategoryPicker
                    branchId={activeBranchId}
                    value={selectedCategory}
                    onChange={(c) => {
                      setSelectedCategory(c);
                      setScopeId(c?.id ? String(c.id) : "");
                    }}
                    disabled={!activeBranchId}
                  />
                  {!activeBranchId ? (
                    <Typography variant="caption" sx={{ color: "warning.main", mt: 0.6, display: "block" }}>
                      Te falta pasar <b>activeBranchId</b> desde el padre.
                    </Typography>
                  ) : null}
                </>
              ) : scopeType !== "variant_attribute" ? (
                <>
                  <TextField
                    fullWidth
                    label="ID (variante)"
                    placeholder="Ej: 123"
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    Por ahora <b>Variante</b> es por ID.
                  </Typography>
                </>
              ) : (
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Atributo"
                    placeholder="Ej: color"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                  <TextField
                    fullWidth
                    label="Valor"
                    placeholder="Ej: rojo"
                    value={attrValue}
                    onChange={(e) => setAttrValue(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                </Stack>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                4) Acciones
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
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
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography fontWeight={950}>Reglas actuales</Typography>
                <Chip size="small" label={`${rules.length} regla${rules.length === 1 ? "" : "s"}`} sx={{ fontWeight: 900 }} />
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
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
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
                      sx={{ p: 1.25, borderRadius: 4, borderColor: alpha(theme.palette.divider, 0.9) }}
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
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 4, maxHeight: "45vh" }}>
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
            </Grid>
          </Grid>
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