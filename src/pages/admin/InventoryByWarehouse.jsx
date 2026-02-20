// src/pages/admin/InventoryByWarehouse.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
  Card,
  CardContent,
  Divider,
  TextField,
  InputAdornment,
  Skeleton,
  Chip,
  Tooltip,
  Alert,
  useMediaQuery,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useTheme, alpha, keyframes } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError } from "../../utils/alerts";
import { useAdminUi } from "../../context/AdminUiContext";

import InventoryDetailModal from "../../components/inventory/InventoryDetailModal";
import InventoryReportsModal from "../../components/inventory/InventoryReportsModal";

import placeholderImg from "/assets/img/defaultproduct.png";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const floatIn = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0px); opacity: 1; }
`;

function moneyMXN(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(n));
}

/**
 * Recibe categories = [{id,name,parent_id}]
 * Devuelve flat ordenado con depth para mostrar árbol en select.
 */
function buildCategoryTreeFlat(categories = []) {
  const map = new Map();
  const roots = [];

  categories.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
  });

  categories.forEach((c) => {
    const node = map.get(c.id);
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByName = (a, b) => (a.name || "").localeCompare(b.name || "", "es");
  const flat = [];

  const dfs = (node, depth = 0) => {
    flat.push({ ...node, depth });
    node.children.sort(sortByName).forEach((ch) => dfs(ch, depth + 1));
  };

  roots.sort(sortByName).forEach((r) => dfs(r, 0));
  return flat;
}

export default function InventoryByWarehouse() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { setHideLayout, selectedBranch, setSelectedBranch } = useAdminUi();

  useEffect(() => {
    setHideLayout(false);
  }, [setHideLayout]);

  // =========================
  // Contexto desde navegación
  // =========================
  const branchFromNav = location.state?.branch ?? null;
  const warehouseFromNav = location.state?.warehouse ?? null;
  const scopeFromNav = location.state?.scope ?? null;

  const branchIdFromUrl = params.get("branch_id");
  const warehouseIdFromUrl = params.get("warehouse_id");
  const scopeFromUrl = params.get("scope"); // global|warehouse

  const scope = useMemo(() => {
    const s =
      (scopeFromNav ||
        scopeFromUrl ||
        (warehouseFromNav?.id || warehouseIdFromUrl ? "warehouse" : "global")) + "";
    return s === "global" ? "global" : "warehouse";
  }, [scopeFromNav, scopeFromUrl, warehouseFromNav?.id, warehouseIdFromUrl]);

  const activeBranch = useMemo(() => {
    if (branchFromNav?.id) return branchFromNav;
    if (selectedBranch?.id) return selectedBranch;
    if (branchIdFromUrl) return { id: Number(branchIdFromUrl) };
    return null;
  }, [branchFromNav, selectedBranch, branchIdFromUrl]);

  const activeWarehouse = useMemo(() => {
    if (scope === "global") return null;
    if (warehouseFromNav?.id) return warehouseFromNav;
    if (warehouseIdFromUrl) return { id: Number(warehouseIdFromUrl) };
    return null;
  }, [scope, warehouseFromNav, warehouseIdFromUrl]);

  useEffect(() => {
    if (branchFromNav?.id) setSelectedBranch(branchFromNav);
  }, [branchFromNav, setSelectedBranch]);

  useEffect(() => {
    if (!activeBranch?.id) navigate("/admin/sucursales");
  }, [activeBranch?.id, navigate]);

  // =========================
  // Categorías por sucursal
  // =========================
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const categoriesFlat = useMemo(() => buildCategoryTreeFlat(categories), [categories]);

  const [categoryId, setCategoryId] = useState(""); // "" -> todas
  const [includeChildren, setIncludeChildren] = useState(true); // ✅ padre incluye subcategorías

  const fetchCategories = useCallback(async () => {
    if (!activeBranch?.id) return;

    setCategoriesLoading(true);
    try {
      const { data } = await axiosClient.get(`admin/categories`, {
        params: { branch_id: activeBranch.id },
      });

      const raw = Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      const normalized = raw
        .map((c) => ({
          id: c?.id ?? c?.category_id ?? null,
          name: c?.name ?? c?.nombre ?? c?.title ?? c?.label ?? `Categoría ${c?.id ?? ""}`,
          parent_id: c?.parent_id ?? null,
        }))
        .filter((c) => c.id);

      // Aquí NO ordenamos porque el árbol lo ordena por DFS
      setCategories(normalized);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar las categorías");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // =========================
  // Estado tabla + filtros
  // =========================
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [q, setQ] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [type, setType] = useState("all"); // all|product|variant

  const [createdFrom, setCreatedFrom] = useState(""); // YYYY-MM-DD
  const [createdTo, setCreatedTo] = useState(""); // YYYY-MM-DD

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(16);
  const [total, setTotal] = useState(0);

  // modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // modal reportes
  const [reportsOpen, setReportsOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const paramsReq = {
        page,
        per_page: perPage,
        q: q || undefined,
        only_in_stock: onlyInStock ? 1 : 0,
        type,
        sort: "name",
        dir: "asc",

        created_from: createdFrom || undefined,
        created_to: createdTo || undefined,

        // categoría
        category_id: categoryId || undefined,
        include_children: categoryId ? (includeChildren ? 1 : 0) : undefined,

        // (opcional pero recomendado)
        branch_id: activeBranch?.id || undefined,
      };

      let url = "/inventory/global";
      if (scope === "warehouse") {
        if (!activeWarehouse?.id) {
          setRows([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        url = `/warehouses/${activeWarehouse.id}/inventory`;
      }

      const { data } = await axiosClient.get(url, { params: paramsReq });

      const list = Array.isArray(data?.data) ? data.data : [];
      setRows(list);
      setTotal(Number(data?.meta?.total || 0));
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar el inventario");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    scope,
    activeWarehouse?.id,
    activeBranch?.id,
    page,
    perPage,
    q,
    onlyInStock,
    type,
    createdFrom,
    createdTo,
    categoryId,
    includeChildren,
  ]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setPage(1);
  }, [
    q,
    onlyInStock,
    type,
    perPage,
    scope,
    activeWarehouse?.id,
    createdFrom,
    createdTo,
    categoryId,
    includeChildren,
  ]);

  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);

  // =========================
  // Report filters (para modal PDF/Excel)
  // =========================
  const reportFilters = useMemo(() => {
    return {
      scope,
      warehouse_id: scope === "warehouse" ? activeWarehouse?.id : null,

      // ✅ importante
      branch_id: activeBranch?.id || null,

      q: q || "",
      type,
      only_in_stock: !!onlyInStock,
      created_from: createdFrom || "",
      created_to: createdTo || "",
      category_id: categoryId || "",

      // ✅ padre incluye hijos
      include_children: !!includeChildren,

      sort: "name",
      dir: "asc",
    };
  }, [
    scope,
    activeWarehouse?.id,
    activeBranch?.id,
    q,
    type,
    onlyInStock,
    createdFrom,
    createdTo,
    categoryId,
    includeChildren,
  ]);

  const clearFilters = () => {
    setQ("");
    setType("all");
    setCategoryId("");
    setIncludeChildren(true);
    setCreatedFrom("");
    setCreatedTo("");
    setOnlyInStock(false);
    setPerPage(16);
    setPage(1);
  };

  // label categoría actual (usa árbol, porque categories normal puede no estar ordenado)
  const selectedCategoryName = useMemo(() => {
    if (!categoryId) return "";
    const found = categoriesFlat.find((c) => String(c.id) === String(categoryId));
    return found?.name || "";
  }, [categoryId, categoriesFlat]);

  // =========================
  // UI Header
  // =========================
  const header = (
    <Stack spacing={1.2} sx={{ mb: 2 }}>
      {/* Top title row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ width: "100%" }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.22),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {scope === "warehouse" ? (
              <WarehouseRoundedIcon sx={{ color: COLORS.black }} />
            ) : (
              <Inventory2RoundedIcon sx={{ color: COLORS.black }} />
            )}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 950, color: COLORS.black }} noWrap>
              {scope === "warehouse" ? "Inventario por almacén" : "Inventario Sin Almacen"}
            </Typography>

            <Typography variant="body2" color="text.secondary" noWrap>
              {scope === "warehouse"
                ? activeWarehouse?.name
                  ? `Almacén: ${activeWarehouse.name}`
                  : activeWarehouse?.id
                  ? `Almacén #${activeWarehouse.id}`
                  : "Selecciona un almacén"
                : "Productos y variantes sin inventario por almacén"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Reportes (PDF/Excel)">
            <Button
              onClick={() => setReportsOpen(true)}
              startIcon={<DescriptionRoundedIcon />}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 950,
                bgcolor: COLORS.black,
                "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
              }}
            >
              Reportes
            </Button>
          </Tooltip>

          <Tooltip title="Volver">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ borderRadius: 2, border: `1px solid ${alpha("#000", 0.08)}` }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: alpha(COLORS.accent, 0.08),
          overflow: "visible", // ✅ evita recorte de labels
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Grid container spacing={1.5}>
            {/* BLOQUE 1: Búsqueda */}
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: 950, mb: 0.8, color: alpha("#000", 0.7) }}>
                Búsqueda
              </Typography>

              <TextField
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar (SKU o nombre)…"
                size="small"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: 2.4,
                    height: 44,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5, opacity: 0.6 }} />
            </Grid>

            {/* BLOQUE 2: Filtros */}
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
                <Typography sx={{ fontWeight: 950, color: alpha("#000", 0.7) }}>
                  Filtros
                </Typography>

                {/* ✅ solo aparece si hay categoría seleccionada */}
                {categoryId ? (
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                      <Switch
                        size="small"
                        checked={includeChildren}
                        onChange={(e) => setIncludeChildren(e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        Incluir subcategorías
                      </Typography>
                    }
                  />
                ) : null}
              </Stack>

              <Grid container spacing={1.2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    label="Tipo"
                    size="small"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2.4,
                        height: 44,
                      },
                      "& .MuiInputLabel-root": { whiteSpace: "nowrap" },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TuneRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="all">Todo</MenuItem>
                    <MenuItem value="product">Productos</MenuItem>
                    <MenuItem value="variant">Variantes</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 240 }}>
                  <TextField
                    select
                    label="Categoría"
                    size="small"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      minWidth: 240,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2.4,
                        height: 44,
                      },
                      "& .MuiInputLabel-root": { whiteSpace: "nowrap" },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="">
                      {categoriesLoading ? "Cargando categorías…" : "Todas las categorías"}
                    </MenuItem>

                    {categoriesFlat.length === 0 && !categoriesLoading ? (
                      <MenuItem disabled value="__empty">
                        No hay categorías para esta sucursal
                      </MenuItem>
                    ) : null}

                    {categoriesFlat.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        <Box sx={{ pl: c.depth * 2, display: "flex", gap: 0.8, alignItems: "center" }}>
                          <span>{c.depth === 0 ? "📁" : "↳"}</span>
                          <span>{c.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    label="Creado desde"
                    size="small"
                    type="date"
                    value={createdFrom}
                    onChange={(e) => setCreatedFrom(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2.4,
                        height: 44,
                      },
                      "& .MuiInputLabel-root": { whiteSpace: "nowrap" },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    label="Creado hasta"
                    size="small"
                    type="date"
                    value={createdTo}
                    onChange={(e) => setCreatedTo(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2.4,
                        height: 44,
                      },
                      "& .MuiInputLabel-root": { whiteSpace: "nowrap" },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2} sx={{ minWidth: 170 }}>
                  <TextField
                    select
                    label="Por página"
                    size="small"
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      minWidth: 170,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: 2.4,
                        height: 44,
                      },
                      "& .MuiInputLabel-root": { whiteSpace: "nowrap" },
                    }}
                  >
                    <MenuItem value={16}>16</MenuItem>
                    <MenuItem value={24}>24</MenuItem>
                    <MenuItem value={32}>32</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    fullWidth
                    onClick={() => setOnlyInStock((v) => !v)}
                    variant={onlyInStock ? "contained" : "outlined"}
                    sx={{
                      height: 44,
                      borderRadius: 2.4,
                      textTransform: "none",
                      fontWeight: 950,
                      bgcolor: onlyInStock ? COLORS.black : "transparent",
                      color: onlyInStock ? "#fff" : "inherit",
                      "&:hover": onlyInStock ? { bgcolor: alpha(COLORS.black, 0.85) } : undefined,
                    }}
                  >
                    {onlyInStock ? "Solo con stock" : "Todos"}
                  </Button>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    onClick={clearFilters}
                    variant="contained"
                    sx={{
                      height: 44,
                      borderRadius: 2.4,
                      textTransform: "none",
                      fontWeight: 950,
                      bgcolor: alpha("#000", 0.8),
                      "&:hover": { bgcolor: alpha("#000", 0.92) },
                    }}
                  >
                    Limpiar
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );

  const metaChips = (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
      <Chip
        icon={<Inventory2RoundedIcon />}
        label={loading ? "Cargando…" : `${total} item(s)`}
        sx={{
          fontWeight: 950,
          bgcolor: alpha(COLORS.accent, 0.22),
          border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
        }}
      />

      {activeBranch?.id ? (
        <Chip
          label={activeBranch?.name ? `Sucursal: ${activeBranch.name}` : `Sucursal #${activeBranch.id}`}
          variant="outlined"
          sx={{ fontWeight: 800 }}
        />
      ) : null}

      {scope === "warehouse" && activeWarehouse?.id ? (
        <Chip
          icon={<WarehouseRoundedIcon />}
          label={activeWarehouse?.name ? activeWarehouse.name : `Almacén #${activeWarehouse.id}`}
          variant="outlined"
          sx={{ fontWeight: 800 }}
        />
      ) : (
        <Chip label="Inventario Sin Almacen" variant="outlined" sx={{ fontWeight: 800 }} />
      )}

      {categoryId ? (
        <Chip
          label={selectedCategoryName ? `Categoría: ${selectedCategoryName}` : `Categoría #${categoryId}`}
          variant="outlined"
          sx={{ fontWeight: 800 }}
        />
      ) : null}

      {categoryId ? (
        <Chip
          label={includeChildren ? "Incluye subcategorías" : "Solo categoría exacta"}
          variant="outlined"
          sx={{ fontWeight: 800 }}
        />
      ) : null}

      {createdFrom || createdTo ? (
        <Chip
          label={`Creación: ${createdFrom || "…"} → ${createdTo || "…"}`}
          variant="outlined"
          sx={{ fontWeight: 800 }}
        />
      ) : null}
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">
        {header}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha("#000", 0.08)}`,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
            {metaChips}
            <Divider sx={{ my: 1.5 }} />

            {loading ? (
              <Stack spacing={1.2}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Skeleton variant="rounded" width={44} height={44} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="50%" />
                      <Skeleton width="75%" />
                    </Box>
                    <Skeleton variant="rounded" width={120} height={36} />
                  </Box>
                ))}
              </Stack>
            ) : rows.length === 0 ? (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha("#000", 0.03),
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              >
                No hay resultados con esos filtros.
              </Alert>
            ) : (
              <Box sx={{ animation: `${floatIn} 220ms ease` }}>
                <TableContainer
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha("#000", 0.08)}`,
                    overflow: "hidden",
                    bgcolor: "#fff",
                  }}
                >
                  <Table
                    size="small"
                    sx={{
                      "& td, & th": { borderBottom: `1px solid ${alpha("#000", 0.06)}` },
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha("#000", 0.02) }}>
                        <TableCell sx={{ fontWeight: 950 }}>Producto</TableCell>
                        <TableCell sx={{ fontWeight: 950 }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 950 }} align="right">
                          Precio
                        </TableCell>
                        <TableCell sx={{ fontWeight: 950 }} align="right">
                          Costo
                        </TableCell>
                        <TableCell sx={{ fontWeight: 950 }} align="right">
                          Stock
                        </TableCell>
                        <TableCell sx={{ fontWeight: 950 }} align="right">
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {rows.map((r, idx) => {
                        const img = r?.image_url || null;
                        const isVariant = r?.item_type === "variant";

                        return (
                          <TableRow
                            key={`${r.item_type}-${r.product_id}-${r.variant_id || "0"}`}
                            hover
                            sx={{
                              bgcolor: idx % 2 === 0 ? alpha("#000", 0.008) : "#fff",
                              "&:hover": { bgcolor: alpha(COLORS.accent, 0.1) },
                              transition: "background-color 140ms ease",
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1.2} alignItems="center">
                                <Box
                                  component="img"
                                  src={img || placeholderImg}
                                  alt={r?.name || "Producto"}
                                  onError={(e) => (e.currentTarget.src = placeholderImg)}
                                  sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 2.2,
                                    objectFit: "cover",
                                    border: `1px solid ${alpha("#000", 0.1)}`,
                                    bgcolor: alpha("#000", 0.02),
                                    flexShrink: 0,
                                  }}
                                />

                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 950, color: COLORS.black }} noWrap>
                                    {r?.name || "—"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    SKU: <b>{r?.sku || "—"}</b>
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                label={isVariant ? "Variante" : "Producto"}
                                sx={{
                                  fontWeight: 950,
                                  bgcolor: alpha(COLORS.accent, isVariant ? 0.24 : 0.16),
                                  border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 950 }}>
                              {moneyMXN(r?.price)}
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 950 }}>
                              {moneyMXN(r?.purchase_cost)}
                            </TableCell>

                            <TableCell align="right" sx={{ fontWeight: 950 }}>
                              {r?.stock ?? 0}
                            </TableCell>

                            <TableCell align="right">
                              <Tooltip title="Ver detalles">
                                <IconButton
                                  onClick={() => {
                                    setSelectedItem(r);
                                    setDetailOpen(true);
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    border: `1px solid ${alpha("#000", 0.1)}`,
                                    bgcolor: "#fff",
                                    "&:hover": { bgcolor: alpha("#000", 0.03) },
                                  }}
                                >
                                  <VisibilityRoundedIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack
                  direction={isMobile ? "column" : "row"}
                  spacing={1}
                  alignItems={isMobile ? "stretch" : "center"}
                  justifyContent="space-between"
                  sx={{ mt: 1.5 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Página <b>{page}</b> de <b>{totalPages}</b>
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                    <Button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      variant="outlined"
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 950 }}
                    >
                      Anterior
                    </Button>
                    <Button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 950,
                        bgcolor: COLORS.black,
                        "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
                      }}
                    >
                      Siguiente
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ✅ Modal detalle producto */}
        <InventoryDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={selectedItem}
          scope={scope}
          warehouseId={activeWarehouse?.id}
        />

        {/* ✅ Modal reportes: PDF visor + Excel */}
        <InventoryReportsModal
          open={reportsOpen}
          onClose={() => setReportsOpen(false)}
          title={scope === "warehouse" ? "Reporte: Inventario por almacén" : "Reporte: Inventario Sin Almacen"}
          filters={reportFilters}
        />
      </Container>
    </Box>
  );
}