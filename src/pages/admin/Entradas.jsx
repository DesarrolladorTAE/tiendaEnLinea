import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";

import {
  AddRounded,
  ArrowBackRounded,
  HistoryRounded,
  Inventory2Rounded,
  LocalShippingRounded,
  ReceiptLongRounded,
} from "@mui/icons-material";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import axiosClient from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";

import SupplierModal from "../../components/restocks/SupplierModal";
import RestockEntryModal from "../../components/restocks/RestockEntryModal";
import ProductRestockHistory from "../../components/restocks/ProductRestockHistory";
import LowStockProductsPanel from "../../components/restocks/LowStockProductsPanel";
import RestockHistoryTable from "../../components/restocks/RestockHistoryTable";
import SupplierRestockHistory from "../../components/restocks/SupplierRestockHistory";
import InventoryDetailModal from "../../components/inventory/InventoryDetailModal";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
};

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

export default function StockEntryForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();

  const branchFromNav = location.state?.branch ?? null;
  const branchIdFromUrl = params.get("branch_id");

  const activeBranch = useMemo(() => {
    if (branchFromNav?.id) return branchFromNav;
    if (selectedBranch?.id) return selectedBranch;
    if (branchIdFromUrl) return { id: Number(branchIdFromUrl) };
    return null;
  }, [branchFromNav, selectedBranch, branchIdFromUrl]);

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [stockHistory, setStockHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [lowStock, setLowStock] = useState(null);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [minStock, setMinStock] = useState(20);

  const [productHistoryOpen, setProductHistoryOpen] = useState(false);

  const [movementDetailOpen, setMovementDetailOpen] = useState(false);
  const [movementDetail, setMovementDetail] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailScope, setDetailScope] = useState("global");
  const [detailWarehouseId, setDetailWarehouseId] = useState(null);

  const [supplierHistoryOpen, setSupplierHistoryOpen] = useState(false);

  useEffect(() => {
    setHideLayout(false);
  }, [setHideLayout]);

  useEffect(() => {
    if (branchFromNav?.id) {
      setSelectedBranch(branchFromNav);
    }
  }, [branchFromNav, setSelectedBranch]);

  useEffect(() => {
    if (!activeBranch?.id) {
      navigate("/admin/sucursales");
    }
  }, [activeBranch?.id, navigate]);

  const fetchProducts = useCallback(async () => {
    if (!activeBranch?.id) return;

    try {
      setLoadingProducts(true);

      const { data } = await axiosClient.get(
        `/admin/branches/${activeBranch.id}/products-with-variants`,
      );

      const list = Array.isArray(data)
        ? data
        : data?.products || data?.data || [];

      setProducts(list);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [activeBranch?.id]);

  const fetchSuppliers = useCallback(async () => {
    if (!activeBranch?.id) return;

    try {
      const { data } = await axiosClient.get("/restocks/suppliers", {
        params: {
          branch_id: activeBranch.id,
        },
      });

      const list = Array.isArray(data)
        ? data
        : data?.suppliers || data?.data || [];

      setSuppliers(list);
    } catch {
      setSuppliers([]);
    }
  }, [activeBranch?.id]);

  const fetchStockHistory = useCallback(async () => {
    if (!activeBranch?.id) return;

    try {
      setLoadingHistory(true);

      const { data } = await axiosClient.get("/restocks", {
        params: {
          branch_id: activeBranch.id,
          per_page: 1000,
        },
      });

      setStockHistory(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error("Error al cargar historial.");
      setStockHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeBranch?.id]);

  const fetchLowStock = useCallback(async () => {
    if (!activeBranch?.id) return;

    try {
      setLoadingLowStock(true);

      const { data } = await axiosClient.get("/restocks/low-stock", {
        params: {
          branch_id: activeBranch.id,
          min_stock: minStock || 20,
        },
      });

      setLowStock(data);
    } catch {
      setLowStock(null);
    } finally {
      setLoadingLowStock(false);
    }
  }, [activeBranch?.id, minStock]);

  useEffect(() => {
    if (!activeBranch?.id) return;

    fetchProducts();
    fetchSuppliers();
    fetchStockHistory();
    fetchLowStock();
  }, [
    activeBranch?.id,
    fetchProducts,
    fetchSuppliers,
    fetchStockHistory,
    fetchLowStock,
  ]);

  const downloadLowStockReport = (type) => {
    if (!activeBranch?.id) return;

    const url = `/restocks/low-stock/report/${type}?branch_id=${
      activeBranch.id
    }&min_stock=${minStock || 20}`;

    window.open(url, "_blank");
  };

  const openDetail = (item) => {
    setDetailItem({
      item_type: item.item_type,
      product_id: item.product_id,
      variant_id: item.variant_id,
    });

    setDetailScope(item.scope || "global");
    setDetailWarehouseId(item.warehouse_id || null);
    setDetailOpen(true);
  };

  const refreshAll = () => {
    fetchSuppliers();
    fetchStockHistory();
    fetchLowStock();
  };

  const openMovementDetail = (entry) => {
    setMovementDetail(entry);
    setMovementDetailOpen(true);
  };

  const renderHistoryCard = (entry) => (
    <Card
      key={entry.id}
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${alpha("#000", 0.08)}`,
      }}
    >
      <CardContent
        sx={{
          p: 1.5,
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            bgcolor: alpha(COLORS.accent, 0.22),
            display: "grid",
            placeItems: "center",
          }}
        >
          <ReceiptLongRounded />
        </Box>

        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Typography sx={{ fontWeight: 900 }}>
              {entry.product?.name || "Producto"}
            </Typography>

            <Chip size="small" label={entry.created_at || "-"} />

            <Chip
              size="small"
              label={entry.uuid_invoice || entry.folio || "Sin factura"}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Proveedor: {entry.supplier || "No asignado"} • Cantidad:{" "}
            <b>{entry.quantity}</b> • Costo: <b>{money(entry.unit_price)}</b>
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Stock anterior: {entry.previous_stock ?? "-"} • Stock nuevo:{" "}
            {entry.new_stock ?? "-"} • Subtotal: {money(entry.subtotal)}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={() => openMovementDetail(entry)}
          sx={{
            borderRadius: 2,
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          Detalle
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        minHeight: "100vh",
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={1.5} sx={{ mb: 2.25 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: alpha(COLORS.accent, 0.22),
                border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Inventory2Rounded sx={{ color: COLORS.black }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: COLORS.black,
                }}
              >
                Entradas de Productos
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {activeBranch?.name
                  ? `Sucursal activa: ${activeBranch.name}`
                  : activeBranch?.id
                    ? `Sucursal activa: #${activeBranch.id}`
                    : "Seleccione una sucursal"}
              </Typography>
            </Box>

            <Tooltip title="Cambiar sucursal">
              <IconButton
                onClick={() => navigate("/admin/sucursales")}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              >
                <ArrowBackRounded />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button
              onClick={() => setRestockOpen(true)}
              variant="contained"
              startIcon={<AddRounded />}
              sx={{
                bgcolor: COLORS.black,
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Registrar Entrada
            </Button>

            <Button
              onClick={() => setSupplierOpen(true)}
              variant="outlined"
              startIcon={<LocalShippingRounded />}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Nuevo Proveedor
            </Button>

            <Button
              variant="outlined"
              startIcon={<HistoryRounded />}
              onClick={() => setProductHistoryOpen(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Historial por Producto
            </Button>

            <Button
              variant="outlined"
              startIcon={<LocalShippingRounded />}
              onClick={() => setSupplierHistoryOpen(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Historial por Proveedor
            </Button>

            <Chip
              icon={<HistoryRounded />}
              label={`${stockHistory.length} movimiento(s)`}
              sx={{
                height: 40,
                fontWeight: 900,
                bgcolor: alpha(COLORS.accent, 0.22),
              }}
            />
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Stack spacing={2} sx={{ flex: 1, width: "100%" }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha("#000", 0.08)}`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
                <Stack
                  direction={{
                    xs: "column",
                    md: "row",
                  }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{
                    xs: "stretch",
                    md: "center",
                  }}
                  sx={{ mb: 1.5 }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: COLORS.black,
                      }}
                    >
                      Historial General de Movimientos
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Se muestran todos los movimientos registrados.
                    </Typography>
                  </Box>
                </Stack>

                <RestockHistoryTable
                  rows={stockHistory}
                  loading={loadingHistory}
                  onOpenDetail={openMovementDetail}
                />
              </CardContent>
            </Card>
          </Stack>

          <LowStockProductsPanel
            lowStock={lowStock}
            loadingLowStock={loadingLowStock}
            minStock={minStock}
            setMinStock={setMinStock}
            onSearch={fetchLowStock}
            onDownloadReport={downloadLowStockReport}
            onOpenDetail={openDetail}
          />
        </Stack>

        <SupplierModal
          open={supplierOpen}
          onClose={() => setSupplierOpen(false)}
          branchId={activeBranch?.id}
          onSaved={() => {
            fetchSuppliers();
          }}
        />

        <RestockEntryModal
          open={restockOpen}
          onClose={() => setRestockOpen(false)}
          branchId={activeBranch?.id}
          suppliers={suppliers}
          onSaved={() => {
            setRestockOpen(false);
            refreshAll();
          }}
        />

        <SupplierRestockHistory
          open={supplierHistoryOpen}
          onClose={() => setSupplierHistoryOpen(false)}
          branchId={activeBranch?.id}
          suppliers={suppliers}
          renderHistoryCard={renderHistoryCard}
        />

        <RestockEntryModal
          open={movementDetailOpen}
          onClose={() => {
            setMovementDetailOpen(false);
            setMovementDetail(null);
          }}
          branchId={activeBranch?.id}
          suppliers={suppliers}
          readOnly
          movement={movementDetail}
        />

        <ProductRestockHistory
          open={productHistoryOpen}
          onClose={() => setProductHistoryOpen(false)}
          branchId={activeBranch?.id}
          products={products}
          loadingProducts={loadingProducts}
          renderHistoryCard={renderHistoryCard}
        />

        <InventoryDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          item={detailItem}
          scope={detailScope}
          warehouseId={detailWarehouseId}
        />
      </Container>
    </Box>
  );
}
