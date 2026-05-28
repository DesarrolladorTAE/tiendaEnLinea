import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  PictureAsPdfRounded,
  SearchRounded,
  TableChartRounded,
} from "@mui/icons-material";
import axiosClient from "../../config/axiosClient";
import { toast } from "react-hot-toast";

export default function ProductRestockHistory({
  open,
  onClose,
  branchId,
  products,
  loadingProducts,
  renderHistoryCard,
}) {
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!branchId || !product?.id) return;

    try {
      setLoading(true);

      const params = {
        branch_id: branchId,
        product_id: product.id,
        per_page: 500,
      };

      if (filterType === "range") {
        if (from) params.from = from;
        if (to) params.to = to;
      }

      const { data } = await axiosClient.get("/restocks", { params });

      setHistory(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error("Error al cargar historial del producto.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, product?.id, filterType, from, to]);

  useEffect(() => {
    if (open && product?.id) fetchHistory();
    if (!open) {
      setProduct(null);
      setHistory([]);
      setFilterType("all");
      setFrom("");
      setTo("");
    }
  }, [open, product?.id, fetchHistory]);

  const exportExcel = () => {
    toast("Pendiente conectar endpoint Excel del backend.");
  };

  const openPdf = () => {
    toast("Pendiente conectar endpoint PDF del backend.");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 900 }}>
        Historial por producto

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 10 }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Consulte todos los movimientos de un producto o filtre por rango de
            fechas.
          </Typography>

          <Autocomplete
            value={product}
            onChange={(_, value) => setProduct(value)}
            options={products}
            loading={loadingProducts}
            getOptionLabel={(p) =>
              p?.name ? `${p.name}${p.sku ? ` • ${p.sku}` : ""}` : ""
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar producto"
                size="small"
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

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              select
              SelectProps={{ native: true }}
              label="Filtro"
              size="small"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              fullWidth
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
            />

            <Button
              variant="contained"
              onClick={fetchHistory}
              disabled={!product}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                bgcolor: "#000",
                "&:hover": { bgcolor: "#222" },
              }}
            >
              Consultar
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfRounded />}
              onClick={openPdf}
              disabled={!product}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Abrir PDF
            </Button>

            <Button
              variant="outlined"
              startIcon={<TableChartRounded />}
              onClick={exportExcel}
              disabled={!product}
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Descargar Excel
            </Button>
          </Stack>

          <Divider />

          {!product ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Seleccione un producto para consultar su historial.
            </Alert>
          ) : loading ? (
            <Typography color="text.secondary">
              Cargando historial del producto...
            </Typography>
          ) : history.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Este producto no tiene movimientos registrados.
            </Alert>
          ) : (
            <Box
              sx={{
                maxHeight: 560,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              <Stack spacing={1.2}>
                {history.map((entry, idx) => renderHistoryCard(entry, idx))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}