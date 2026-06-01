// src/components/restocks/ProductRestockHistory.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import {
  CloseRounded,
  PictureAsPdfRounded,
  SearchRounded,
  TableChartRounded,
  Inventory2Rounded,
  TuneRounded,
} from "@mui/icons-material";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError } from "../../utils/alerts";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
  },
};

const btnBlackSx = {
  borderRadius: 2,
  fontWeight: 900,
  textTransform: "none",
  bgcolor: COLORS.black,
  color: "#fff",
  "&:hover": { bgcolor: "#222" },
};

const btnOutlinedSx = {
  borderRadius: 2,
  fontWeight: 900,
  textTransform: "none",
  borderColor: alpha("#000", 0.15),
  color: COLORS.black,
  bgcolor: "#fff",
  "&:hover": { bgcolor: alpha("#000", 0.03) },
};

const getProductVariants = (product) => {
  if (!product) return [];

  const variants =
    product.variants ||
    product.product_variants ||
    product.productVariants ||
    product.variantes ||
    [];

  return Array.isArray(variants) ? variants : [];
};

const safeFileName = (value = "producto") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

export default function ProductRestockHistory({
  open,
  onClose,
  branchId,
  products,
  loadingProducts,
  renderHistoryCard,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const variants = useMemo(() => getProductVariants(product), [product]);

  const fetchHistory = useCallback(async () => {
    if (!branchId || !product?.id) return;

    try {
      setLoading(true);

      const params = {
        branch_id: branchId,
        product_id: product.id,
        per_page: 500,
      };

      if (variant?.id) {
        params.product_variant_id = variant.id;
      }

      if (filterType === "range") {
        if (from) params.from = from;
        if (to) params.to = to;
      }

      const { data } = await axiosClient.get("/restocks", { params });

      setHistory(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      alertFromAxiosError(err, "Error al cargar historial del producto.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, product?.id, variant?.id, filterType, from, to]);

  const buildReportParams = () => {
    const params = new URLSearchParams();

    params.append("branch_id", String(branchId));
    params.append("product_id", String(product.id));

    if (variant?.id) {
      params.append("product_variant_id", String(variant.id));
    }

    if (filterType === "range") {
      if (from) params.append("from", from);
      if (to) params.append("to", to);
    }

    return params.toString();
  };

  const downloadPdf = async () => {
    if (!branchId || !product?.id) return;

    try {
      setExportingPdf(true);

      const query = buildReportParams();

      const response = await axiosClient.get(
        `/restocks/reports/product/pdf?${query}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `historial-producto-${safeFileName(
        product?.name || "producto",
      )}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      alertFromAxiosError(error, "No se pudo descargar el PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const exportExcel = async () => {
    if (!branchId || !product?.id) return;

    try {
      setExportingExcel(true);

      const query = buildReportParams();

      const response = await axiosClient.get(
        `/restocks/reports/product/excel?${query}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `historial-producto-${safeFileName(
        product?.name || "producto",
      )}.xlsx`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      alertFromAxiosError(error, "No se pudo descargar el Excel del producto.");
    } finally {
      setExportingExcel(false);
    }
  };

  useEffect(() => {
    if (open && product?.id) fetchHistory();

    if (!open) {
      setProduct(null);
      setVariant(null);
      setHistory([]);
      setFilterType("all");
      setFrom("");
      setTo("");
      setExportingPdf(false);
      setExportingExcel(false);
    }
  }, [open, product?.id, variant?.id, fetchHistory]);

  const handleProductChange = (_, value) => {
    setProduct(value);
    setVariant(null);
    setHistory([]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          height: fullScreen ? "100dvh" : "90vh",
          maxHeight: fullScreen ? "100dvh" : "90vh",
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
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
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Inventory2Rounded sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
              Historial por producto
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Consulte movimientos por producto, variante y rango de fechas.
            </Typography>
          </Box>

          <IconButton onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Stack
          spacing={2}
          sx={{
            height: "100%",
            minHeight: 0,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: COLORS.paper,
              border: `1px solid ${alpha("#000", 0.08)}`,
              p: 2,
              flexShrink: 0,
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TuneRounded sx={{ color: COLORS.black }} />
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>
                    Filtros de consulta
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seleccione producto y, si aplica, una variante específica.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Autocomplete
                  value={product}
                  onChange={handleProductChange}
                  options={products || []}
                  loading={loadingProducts}
                  fullWidth
                  getOptionLabel={(p) =>
                    p?.name ? `${p.name}${p.sku ? ` • ${p.sku}` : ""}` : ""
                  }
                  isOptionEqualToValue={(option, value) =>
                    Number(option?.id) === Number(value?.id)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar producto"
                      size="small"
                      sx={fieldSx}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchRounded fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <Autocomplete
                  value={variant}
                  onChange={(_, value) => {
                    setVariant(value);
                    setHistory([]);
                  }}
                  options={variants}
                  disabled={!product}
                  fullWidth
                  getOptionLabel={(v) => {
                    if (!v) return "";

                    const name =
                      v.name ||
                      v.variant_name ||
                      v.label ||
                      v.color ||
                      "Variante";

                    const sku = v.sku ? ` • ${v.sku}` : "";
                    const stock =
                      v.stock !== undefined ? ` • Stock: ${v.stock}` : "";

                    return `${name}${sku}${stock}`;
                  }}
                  isOptionEqualToValue={(option, value) =>
                    Number(option?.id) === Number(value?.id)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={
                        product
                          ? variants.length > 0
                            ? "Seleccione variante"
                            : "Este producto no tiene variantes"
                          : "Primero seleccione un producto"
                      }
                      size="small"
                      sx={fieldSx}
                    />
                  )}
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  select
                  SelectProps={{ native: true }}
                  label="Filtro"
                  size="small"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  fullWidth
                  sx={fieldSx}
                >
                  <option value="all">Todos</option>
                  <option value="range">Rango de fechas</option>
                </TextField>

                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  disabled={filterType !== "range"}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={fieldSx}
                />

                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={filterType !== "range"}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={fieldSx}
                />

                <Button
                  variant="contained"
                  onClick={fetchHistory}
                  disabled={!product || loading}
                  sx={{
                    ...btnBlackSx,
                    minWidth: { xs: "100%", md: 140 },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Consultar"
                  )}
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={
                    exportingPdf ? (
                      <CircularProgress size={18} />
                    ) : (
                      <PictureAsPdfRounded />
                    )
                  }
                  onClick={downloadPdf}
                  disabled={!product || exportingPdf}
                  sx={btnOutlinedSx}
                >
                  {exportingPdf ? "Descargando..." : "Descargar PDF"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    exportingExcel ? (
                      <CircularProgress size={18} />
                    ) : (
                      <TableChartRounded />
                    )
                  }
                  onClick={exportExcel}
                  disabled={!product || exportingExcel}
                  sx={btnOutlinedSx}
                >
                  {exportingExcel ? "Descargando..." : "Descargar Excel"}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              bgcolor: COLORS.paper,
              border: `1px solid ${alpha("#000", 0.08)}`,
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 2, flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 950 }}>
                Movimientos encontrados
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {product
                  ? `${history.length} movimiento(s) encontrados`
                  : "Seleccione un producto para iniciar la consulta"}
              </Typography>
            </Box>

            <Divider />

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                p: 1.5,
                bgcolor: "#fff",
              }}
            >
              {!product ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Seleccione un producto para consultar su historial.
                </Alert>
              ) : loading ? (
                <Stack alignItems="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Cargando historial del producto...
                  </Typography>
                </Stack>
              ) : history.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Este producto no tiene movimientos registrados.
                </Alert>
              ) : (
                <Stack spacing={1.2}>
                  {history.map((entry, idx) => renderHistoryCard(entry, idx))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
