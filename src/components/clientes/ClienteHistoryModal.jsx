import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  IconButton,
  Alert,
  Grid,
  Paper,
  Chip,
  TextField,
  MenuItem,
  useMediaQuery,
  Divider,
  Avatar,
  Button,
  Collapse,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import axiosClient from "../../config/axiosClientPOS";
import ClienteHistoryModalMobile from "./ClienteHistoryModalMobile";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const STATUS_OPTIONS = [
  { value: "", label: "Selecciona un estado" },
  { value: "paid", label: "Pagada" },
  { value: "open", label: "Abierta" },
  { value: "cancelled", label: "Cancelada" },
  { value: "partially_cancelled", label: "Parcialmente cancelada" },
  { value: "devuelta", label: "Devuelta" },
];

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDate(date) {
  if (!date) return "Sin fecha";
  try {
    return new Date(date).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Sin fecha";
  }
}

function getDayKey(date) {
  if (!date) return "sin-fecha";
  try {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "sin-fecha";
  }
}

function formatDayLabel(dayKey) {
  if (!dayKey || dayKey === "sin-fecha") return "Sin fecha";
  try {
    const [year, month, day] = dayKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dayKey;
  }
}

function getStatusLabel(status) {
  const map = {
    paid: "Pagada",
    open: "Abierta",
    cancelled: "Cancelada",
    partially_cancelled: "Parcialmente cancelada",
    devuelta: "Devuelta",
  };
  return map[status] || status || "—";
}

function getStatusStyles(status) {
  const map = {
    paid: {
      color: "#166534",
      border: alpha("#16a34a", 0.35),
      bg: alpha("#16a34a", 0.08),
    },
    open: {
      color: "#92400e",
      border: alpha("#f59e0b", 0.35),
      bg: alpha("#f59e0b", 0.08),
    },
    cancelled: {
      color: "#991b1b",
      border: alpha("#ef4444", 0.35),
      bg: alpha("#ef4444", 0.08),
    },
    partially_cancelled: {
      color: "#92400e",
      border: alpha("#f59e0b", 0.35),
      bg: alpha("#f59e0b", 0.08),
    },
    devuelta: {
      color: "#1d4ed8",
      border: alpha("#3b82f6", 0.35),
      bg: alpha("#3b82f6", 0.08),
    },
  };

  return (
    map[status] || {
      color: "#334155",
      border: alpha("#64748b", 0.25),
      bg: alpha("#64748b", 0.06),
    }
  );
}

function getProductName(item) {
  return (
    item?.name ||
    item?.product_name ||
    item?.variant_name ||
    item?.product?.name ||
    "Producto"
  );
}

function getItemQty(item) {
  return Number(item?.quantity ?? item?.qty ?? item?.cantidad ?? 0);
}

function getItemUnitPrice(item) {
  return Number(item?.unit_price ?? item?.price ?? item?.precio ?? 0);
}

function normalizeSaleItems(sale) {
  const source = sale?.items || sale?.sale_items || sale?.details || [];
  if (!Array.isArray(source)) return [];

  return source.map((item, index) => {
    const quantity = getItemQty(item);
    const unitPrice = getItemUnitPrice(item);
    const total =
      Number(item?.total ?? item?.subtotal ?? item?.importe ?? 0) ||
      quantity * unitPrice;

    return {
      id: item?.id ?? `${sale?.id || "sale"}-item-${index}`,
      name: getProductName(item),
      quantity,
      unitPrice,
      total,
    };
  });
}

function StatCard({ icon, label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 2,
        border: "1px solid",
        borderColor: alpha("#0f172a", 0.08),
        bgcolor: "#fff",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha("#0ea5e9", 0.1),
            color: "#0284c7",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1.1,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 18,
              lineHeight: 1.15,
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function SaleProductsList({ sale }) {
  const items = normalizeSaleItems(sale);

  if (!items.length) {
    return (
      <Box
        sx={{
          p: 1.25,
          borderRadius: 2,
          bgcolor: alpha("#0ea5e9", 0.04),
          border: "1px dashed",
          borderColor: alpha("#0ea5e9", 0.25),
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          Esta venta no trae productos en la respuesta del endpoint.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha("#0ea5e9", 0.12),
        overflow: "hidden",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              bgcolor: alpha("#0ea5e9", 0.06),
            }}
          >
            <TableCell sx={{ fontWeight: 900 }}>Producto</TableCell>
            <TableCell sx={{ fontWeight: 900, width: 100 }}>Cantidad</TableCell>
            <TableCell sx={{ fontWeight: 900, width: 140 }}>Unitario</TableCell>
            <TableCell sx={{ fontWeight: 900, width: 140 }}>Total</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                  {item.name}
                </Typography>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{money.format(item.unitPrice)}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>
                {money.format(item.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SalesTableDesktop({ sales, expandedSales, toggleSale, currentDayLabel }) {
  return (
    <TableContainer sx={{ maxHeight: "calc(100dvh - 390px)" }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 900, minWidth: 120 }}>Venta</TableCell>
            <TableCell sx={{ fontWeight: 900, minWidth: 170 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 900, minWidth: 130 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 900, minWidth: 130 }}>Pago</TableCell>
            <TableCell sx={{ fontWeight: 900, minWidth: 120 }}>Productos</TableCell>
            <TableCell sx={{ fontWeight: 900, minWidth: 150 }}>Total</TableCell>
            <TableCell sx={{ fontWeight: 900, minWidth: 120 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sales.map((sale) => {
            const items = normalizeSaleItems(sale);
            const statusStyles = getStatusStyles(sale.status);
            const isExpanded = !!expandedSales[sale.id];

            return (
              <React.Fragment key={sale.id}>
                <TableRow hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      Venta #{sale.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentDayLabel}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>
                      {formatDate(sale.created_at)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={getStatusLabel(sale.status)}
                      size="small"
                      sx={{
                        height: 24,
                        fontWeight: 700,
                        fontSize: 11,
                        color: statusStyles.color,
                        bgcolor: statusStyles.bg,
                        border: "1px solid",
                        borderColor: statusStyles.border,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>
                      {sale.payment_method || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "#0284c7" }} />
                      <Typography sx={{ fontSize: 13 }}>
                        {items.length} producto{items.length === 1 ? "" : "s"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>
                      {money.format(Number(sale.total_amount || 0))}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Button
                      onClick={() => toggleSale(sale.id)}
                      size="small"
                      variant="outlined"
                      endIcon={
                        isExpanded ? (
                          <KeyboardArrowUpRoundedIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
                        )
                      }
                      sx={{
                        minHeight: 32,
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: 12,
                        px: 1.25,
                        borderColor: alpha("#0284c7", 0.25),
                        color: "#0369a1",
                        "&:hover": {
                          borderColor: alpha("#0284c7", 0.4),
                          bgcolor: alpha("#0ea5e9", 0.05),
                        },
                      }}
                    >
                      {isExpanded ? "Ocultar" : "Detalles"}
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{
                      py: isExpanded ? 1.2 : 0,
                      px: 1.5,
                      borderBottom: isExpanded ? undefined : 0,
                    }}
                  >
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <SaleProductsList sale={sale} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ClienteHistoryModal({ open, onClose, cliente }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");

  const [tempMonth, setTempMonth] = useState("");
  const [tempStatus, setTempStatus] = useState("");

  const [expandedSales, setExpandedSales] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dayPage, setDayPage] = useState(1);

  const load = async (selectedMonth = month, selectedStatus = status) => {
    if (!cliente?.id || !open) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await axiosClient.get(`/clientes/${cliente.id}/ventas`, {
        params: {
          ...(selectedMonth ? { month: selectedMonth } : {}),
          ...(selectedStatus ? { status: selectedStatus } : {}),
        },
      });

      setPayload(data);
    } catch (e) {
      setPayload(null);
      setError("No se pudo cargar el historial del cliente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && cliente?.id) {
      const currentMonth = getCurrentMonthKey();

      if (isMobile) {
        setMonth("");
        setStatus("");
        setTempMonth("");
        setTempStatus("");
        setPayload(null);
        setError("");
        setExpandedSales({});
        setShowMobileFilters(false);
        setDayPage(1);
        load("", "");
      } else {
        setMonth(currentMonth);
        setStatus("");
        setTempMonth(currentMonth);
        setTempStatus("");
        setPayload(null);
        setError("");
        setExpandedSales({});
        setShowMobileFilters(false);
        setDayPage(1);
        load(currentMonth, "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente?.id, isMobile]);

  const sales = useMemo(() => payload?.sales?.data || [], [payload]);
  const monthlyIndex = useMemo(() => payload?.monthly_index || [], [payload]);

  const groupedSalesByDay = useMemo(() => {
    const groups = new Map();

    sales.forEach((sale) => {
      const dayKey = getDayKey(sale.created_at);

      if (!groups.has(dayKey)) {
        groups.set(dayKey, []);
      }

      groups.get(dayKey).push(sale);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dayKey, daySales]) => ({
        dayKey,
        dayLabel: formatDayLabel(dayKey),
        sales: daySales.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        totalVentas: daySales.length,
        totalMonto: daySales.reduce(
          (acc, sale) => acc + Number(sale?.total_amount || 0),
          0
        ),
      }));
  }, [sales]);

  const totalDayPages = groupedSalesByDay.length;
  const currentDayGroup = groupedSalesByDay[dayPage - 1] || null;
  const currentDaySales = currentDayGroup?.sales || [];

  useEffect(() => {
    setDayPage(1);
  }, [sales, month, status]);

  useEffect(() => {
    if (dayPage > totalDayPages && totalDayPages > 0) {
      setDayPage(totalDayPages);
    }
    if (totalDayPages === 0 && dayPage !== 1) {
      setDayPage(1);
    }
  }, [dayPage, totalDayPages]);

  const resumenVentas = payload?.summary?.ventas_total ?? sales.length ?? 0;
  const resumenMonto =
    payload?.summary?.monto_total ?? payload?.summary?.monto_neto ?? 0;

  const activeStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === status)?.label ||
    "Selecciona un estado";

  const hasReportData = sales.length > 0 && !!cliente?.id;

  const downloadBlobFile = (blob, fileName) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const buildReportFileName = (type) => {
    const safeName = String(
      payload?.cliente?.nombre_alias || cliente?.nombre_alias || `cliente_${cliente?.id || "0"}`
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w-]/g, "");

    const monthPart = month || "todos";
    const statusPart = status || "todos";

    return `historial_${safeName}_${monthPart}_${statusPart}.${type}`;
  };

  const handleDownloadReport = async (reportType) => {
    if (!cliente?.id) return;

    const isPdf = reportType === "pdf";
    const setLoadingState = isPdf ? setDownloadingPdf : setDownloadingExcel;
    const endpoint = isPdf
      ? `/clientes/${cliente.id}/historial/pdf`
      : `/clientes/${cliente.id}/historial/excel`;

    setLoadingState(true);
    setError("");

    try {
      const response = await axiosClient.get(endpoint, {
        params: {
          ...(month ? { month } : {}),
          ...(status ? { status } : {}),
        },
        responseType: "blob",
      });

      const contentType = response.headers?.["content-type"] || "";

      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        let message = "No se pudo generar el reporte.";
        try {
          const json = JSON.parse(text);
          message = json?.message || message;
        } catch {
          //
        }
        throw new Error(message);
      }

      downloadBlobFile(
        response.data,
        buildReportFileName(isPdf ? "pdf" : "xlsx")
      );
    } catch (e) {
      setError(
        e?.message ||
          `No se pudo descargar el reporte en ${isPdf ? "PDF" : "Excel"}.`
      );
    } finally {
      setLoadingState(false);
    }
  };

  const handleDownloadPdf = () => handleDownloadReport("pdf");
  const handleDownloadExcel = () => handleDownloadReport("excel");

  const toggleSale = (saleId) => {
    setExpandedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  };

  const toggleMobileFilters = () => {
    const next = !showMobileFilters;
    if (next) {
      setTempMonth(month);
      setTempStatus(status);
    }
    setShowMobileFilters(next);
  };

  const applyFilters = () => {
    setMonth(tempMonth);
    setStatus(tempStatus);
    setShowMobileFilters(false);
    setDayPage(1);
    load(tempMonth, tempStatus);
  };

  const clearFilters = () => {
    if (isMobile) {
      setTempMonth("");
      setTempStatus("");
      setMonth("");
      setStatus("");
      setShowMobileFilters(false);
      setDayPage(1);
      load("", "");
      return;
    }

    const currentMonth = getCurrentMonthKey();
    setMonth(currentMonth);
    setStatus("");
    setDayPage(1);
    load(currentMonth, "");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: 0, sm: 4 },
          height: { xs: "100dvh", sm: "calc(100dvh - 40px)" },
          maxHeight: { xs: "100dvh", sm: "calc(100dvh - 40px)" },
          overflow: "hidden",
          bgcolor: "#f8fafc",
          position: "relative",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.15, sm: 2 },
          background:
            "linear-gradient(90deg, #0f172a 0%, #0369a1 45%, #0ea5e9 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 1.2,
        }}
      >
        <HistoryIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: { xs: 18, sm: 22 },
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            Historial del cliente
          </Typography>
          <Typography
            variant="body2"
            sx={{
              opacity: 0.95,
              color: "#fff",
              fontSize: { xs: 12, sm: 14 },
            }}
          >
            Consulta de ventas y productos vendidos
          </Typography>
        </Box>

        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        dividers
        sx={{
          p: { xs: 1, sm: 2.5 },
          bgcolor: "#f8fafc",
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {isMobile ? (
          <ClienteHistoryModalMobile
            payload={payload}
            cliente={cliente}
            month={month}
            tempMonth={tempMonth}
            setTempMonth={setTempMonth}
            status={status}
            tempStatus={tempStatus}
            setTempStatus={setTempStatus}
            showMobileFilters={showMobileFilters}
            toggleMobileFilters={toggleMobileFilters}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            monthlyIndex={monthlyIndex}
            activeStatusLabel={activeStatusLabel}
            resumenVentas={resumenVentas}
            resumenMonto={resumenMonto}
            sales={sales}
            expandedSales={expandedSales}
            toggleSale={toggleSale}
            loading={loading}
            onDownloadPdf={handleDownloadPdf}
            onDownloadExcel={handleDownloadExcel}
            downloadingPdf={downloadingPdf}
            downloadingExcel={downloadingExcel}
            hasReportData={hasReportData}
          />
        ) : (
          <>
            <Paper
              elevation={0}
              sx={{
                mb: 1.5,
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha("#0f172a", 0.08),
                bgcolor: "#fff",
              }}
            >
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} xl={4}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 46,
                        height: 46,
                        bgcolor: alpha("#0ea5e9", 0.12),
                        color: "#0284c7",
                      }}
                    >
                      <PersonOutlineIcon />
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: 18,
                          lineHeight: 1.1,
                          color: "#1f2937",
                        }}
                      >
                        {payload?.cliente?.nombre_alias ||
                          cliente?.nombre_alias ||
                          "Cliente"}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: 13,
                        }}
                      >
                        Historial de compras
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} xl={8}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      justifyContent: { lg: "flex-end", xs: "flex-start" },
                    }}
                  >
                    <TextField
                      select
                      label="Mes"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      size="small"
                      sx={{
                        minWidth: 220,
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          height: 60,
                          borderRadius: 1.5,
                          fontSize: 16,
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: 16,
                        },
                      }}
                    >
                      <MenuItem value="">Selecciona un mes</MenuItem>
                      {monthlyIndex.map((m) => (
                        <MenuItem key={m.month_key} value={m.month_key}>
                          {m.month_label} ({m.ventas_count})
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      label="Estado"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      size="small"
                      sx={{
                        minWidth: 220,
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          height: 60,
                          borderRadius: 1.5,
                          fontSize: 16,
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: 16,
                        },
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value || "all"} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Box
                      sx={{
                        minWidth: 220,
                        height: 60,
                        px: 2,
                        border: "1px solid",
                        borderColor: alpha("#0f172a", 0.18),
                        borderRadius: 1.5,
                        bgcolor: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "text.secondary",
                          lineHeight: 1,
                          mb: 0.5,
                        }}
                      >
                        Índice por mes
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#374151",
                          lineHeight: 1.15,
                        }}
                      >
                        {monthlyIndex.length
                          ? `${monthlyIndex.length} mes(es) con actividad`
                          : "Sin movimientos"}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => {
                        setDayPage(1);
                        load(month, status);
                      }}
                      sx={{
                        minWidth: 150,
                        height: 50,
                        borderRadius: 1.5,
                        textTransform: "uppercase",
                        fontWeight: 900,
                        fontSize: 16,
                        boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
                      }}
                    >
                      Aplicar
                    </Button>

                    <Button
                      variant="text"
                      onClick={clearFilters}
                      startIcon={<RestartAltRoundedIcon />}
                      sx={{
                        minWidth: 120,
                        height: 50,
                        borderRadius: 1.5,
                        textTransform: "uppercase",
                        fontWeight: 900,
                        fontSize: 15,
                        color: "#a21caf",
                      }}
                    >
                      Limpiar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
              <Grid item xs={6} md={4}>
                <StatCard
                  icon={<ReceiptLongIcon fontSize="small" />}
                  label="Ventas"
                  value={resumenVentas}
                />
              </Grid>

              <Grid item xs={6} md={4}>
                <StatCard
                  icon={<PaidIcon fontSize="small" />}
                  label="Total vendido"
                  value={money.format(resumenMonto)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <StatCard
                  icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                  label="Meses con actividad"
                  value={monthlyIndex.length}
                />
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha("#0f172a", 0.08),
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1.2,
                  borderBottom: "1px solid",
                  borderColor: alpha("#0f172a", 0.08),
                  bgcolor: alpha("#0ea5e9", 0.05),
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                >
                  <Stack spacing={0.4}>
                    <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
                      Ventas registradas
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {currentDayGroup
                        ? `${currentDayGroup.dayLabel} · ${currentDayGroup.totalVentas} venta${
                            currentDayGroup.totalVentas === 1 ? "" : "s"
                          } · ${money.format(currentDayGroup.totalMonto)}`
                        : "Sin ventas para mostrar"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PictureAsPdfRoundedIcon />}
                      onClick={handleDownloadPdf}
                      disabled={!hasReportData || downloadingPdf || downloadingExcel}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                        bgcolor: "#fff",
                      }}
                    >
                      {downloadingPdf ? "Descargando..." : "PDF"}
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<TableViewRoundedIcon />}
                      onClick={handleDownloadExcel}
                      disabled={!hasReportData || downloadingPdf || downloadingExcel}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                        bgcolor: "#fff",
                      }}
                    >
                      {downloadingExcel ? "Descargando..." : "Excel"}
                    </Button>

                    <Chip
                      label={`${sales.length} venta${sales.length === 1 ? "" : "s"} en total`}
                      sx={{
                        fontWeight: 700,
                        bgcolor: "#fff",
                        border: "1px solid",
                        borderColor: alpha("#0f172a", 0.08),
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : sales.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography color="text.secondary">
                    Sin ventas para mostrar.
                  </Typography>
                </Box>
              ) : (
                <>
                  <SalesTableDesktop
                    sales={currentDaySales}
                    expandedSales={expandedSales}
                    toggleSale={toggleSale}
                    currentDayLabel={currentDayGroup?.dayLabel || ""}
                  />

                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderTop: "1px solid",
                      borderColor: alpha("#0f172a", 0.08),
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Página por día: {totalDayPages === 0 ? 0 : dayPage} de {totalDayPages}
                    </Typography>

                    <Pagination
                      page={dayPage}
                      count={Math.max(totalDayPages, 1)}
                      onChange={(_, page) => setDayPage(page)}
                      color="primary"
                      shape="rounded"
                      disabled={totalDayPages <= 1}
                    />
                  </Box>
                </>
              )}
            </Paper>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}