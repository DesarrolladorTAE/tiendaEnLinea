import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  PictureAsPdfRounded,
  TableChartRounded,
  VisibilityRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import axiosClient from "../../config/axiosClient";
import { alertFromAxiosError } from "../../utils/alerts";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

export default function LowStockProductsPanel({
  lowStock,
  loadingLowStock,
  minStock,
  setMinStock,
  onSearch,
  onOpenDetail,
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const lowStockItems = useMemo(() => {
    const productsRows = lowStock?.products || [];
    const variants = lowStock?.variants || [];
    const warehouseProducts = lowStock?.warehouse_products || [];
    const warehouseVariants = lowStock?.warehouse_variants || [];

    return [
      ...productsRows.map((p) => ({
        type: "Producto",
        item_type: "product",
        product_id: p.id,
        variant_id: null,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        warehouse: null,
        warehouse_id: null,
        scope: "global",
      })),
      ...variants.map((v) => ({
        type: "Variante",
        item_type: "variant",
        product_id: v.product_id,
        variant_id: v.id,
        name: `${v.product_name} / ${v.name || "Variante"}`,
        sku: v.sku,
        stock: v.stock,
        warehouse: null,
        warehouse_id: null,
        scope: "global",
      })),
      ...warehouseProducts.map((p) => ({
        type: "Producto en almacén",
        item_type: "product",
        product_id: p.product_id,
        variant_id: null,
        name: p.product_name,
        sku: p.sku,
        stock: p.qty,
        warehouse: p.warehouse_name,
        warehouse_id: p.warehouse_id,
        scope: "warehouse",
      })),
      ...warehouseVariants.map((v) => ({
        type: "Variante en almacén",
        item_type: "variant",
        product_id: null,
        variant_id: v.variant_id,
        name: `${v.product_name} / ${v.variant_name || "Variante"}`,
        sku: v.variant_sku,
        stock: v.stock,
        warehouse: v.warehouse_name,
        warehouse_id: v.warehouse_id,
        scope: "warehouse",
      })),
    ];
  }, [lowStock]);

  const buildReportParams = () => {
    const params = new URLSearchParams();

    if (minStock !== "" && minStock !== null && minStock !== undefined) {
      params.append("min_stock", String(minStock));
    }

    return params.toString();
  };

  const downloadPdf = async () => {
    try {
      setDownloadingPdf(true);

      const query = buildReportParams();

      const response = await axiosClient.get(
        `/restocks/reports/low-stock/pdf?${query}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `productos-por-restablecer-min-${minStock || 20}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      alertFromAxiosError(error, "No se pudo descargar el PDF de productos por restablecer.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setDownloadingExcel(true);

      const query = buildReportParams();

      const response = await axiosClient.get(
        `/restocks/reports/low-stock/excel?${query}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileURL = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `productos-por-restablecer-min-${minStock || 20}.xlsx`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      alertFromAxiosError(error, "No se pudo descargar el Excel de productos por restablecer.");
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        width: { xs: "100%", lg: 430 },
        borderRadius: 4,
        border: `1px solid ${alpha("#000", 0.08)}`,
        bgcolor: "#fff",
        overflow: "hidden",
        position: { lg: "sticky" },
        top: { lg: 16 },
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(COLORS.danger, 0.055),
          borderBottom: `1px solid ${alpha(COLORS.danger, 0.12)}`,
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <WarningAmberRounded sx={{ color: COLORS.danger }} />

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 950 }}>
              Productos por Reabastecer
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lista completa con scroll y detalle.
            </Typography>
          </Box>

          <Chip label={lowStockItems.length} sx={{ fontWeight: 950 }} />
        </Stack>
      </Box>

      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.4}>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Mínimo"
              type="number"
              size="small"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              fullWidth
            />

            <Button
              variant="contained"
              onClick={onSearch}
              disabled={loadingLowStock}
              sx={{
                bgcolor: COLORS.black,
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              {loadingLowStock ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                "Buscar"
              )}
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={
                downloadingExcel ? (
                  <CircularProgress size={18} />
                ) : (
                  <TableChartRounded />
                )
              }
              onClick={downloadExcel}
              disabled={downloadingExcel || loadingLowStock}
              sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
            >
              {downloadingExcel ? "Descargando..." : "Excel"}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={
                downloadingPdf ? (
                  <CircularProgress size={18} />
                ) : (
                  <PictureAsPdfRounded />
                )
              }
              onClick={downloadPdf}
              disabled={downloadingPdf || loadingLowStock}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                color: COLORS.danger,
                borderColor: alpha(COLORS.danger, 0.4),
              }}
            >
              {downloadingPdf ? "Descargando..." : "PDF"}
            </Button>
          </Stack>

          <Divider />

          {loadingLowStock ? (
            <Typography color="text.secondary">
              Cargando bajo stock...
            </Typography>
          ) : lowStockItems.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              No hay productos por debajo del mínimo.
            </Alert>
          ) : (
            <Box
              sx={{
                maxHeight: 620,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              <Stack spacing={1}>
                {lowStockItems.map((item, idx) => (
                  <Box
                    key={`${item.type}-${item.product_id || item.variant_id}-${
                      item.warehouse_id || "global"
                    }-${idx}`}
                    sx={{
                      p: 1.2,
                      borderRadius: 2.5,
                      border: `1px solid ${alpha("#000", 0.08)}`,
                      bgcolor:
                        idx < 3
                          ? alpha(COLORS.danger, 0.045)
                          : alpha("#000", 0.018),
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          {item.name}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {item.type}
                          {item.sku ? ` • SKU: ${item.sku}` : ""}
                          {item.warehouse ? ` • ${item.warehouse}` : ""}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={item.stock ?? 0}
                        sx={{
                          fontWeight: 950,
                          color: COLORS.danger,
                          bgcolor: "#fff",
                        }}
                      />

                      <Tooltip title="Ver información completa">
                        <IconButton
                          onClick={() => onOpenDetail(item)}
                          sx={{
                            borderRadius: 2,
                            border: `1px solid ${alpha("#000", 0.08)}`,
                          }}
                        >
                          <VisibilityRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}