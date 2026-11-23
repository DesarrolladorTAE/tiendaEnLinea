import React from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  Paper,
  Chip,
  Avatar,
  Button,
  Collapse,
  Divider,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import TuneIcon from "@mui/icons-material/Tune";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";

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

function getMonthLabel(monthlyIndex, month) {
  if (!month) return "Todos";
  const found = monthlyIndex.find((m) => m.month_key === month);
  return found?.month_label || month;
}

function StatCard({ icon, label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 1.15,
        border: "1px solid",
        borderColor: alpha("#0f172a", 0.08),
        bgcolor: "#fff",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
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
              fontSize: 11,
              lineHeight: 1.1,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 14,
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
          mt: 1,
          p: 1.1,
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
    <Stack spacing={0.8} sx={{ mt: 1 }}>
      {items.map((item) => (
        <Paper
          key={item.id}
          elevation={0}
          sx={{
            p: 0.95,
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha("#0ea5e9", 0.15),
            bgcolor: alpha("#0ea5e9", 0.04),
          }}
        >
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
              {item.name}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              Cantidad: {item.quantity}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              Unitario: {money.format(item.unitPrice)}
            </Typography>

            <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
              {money.format(item.total)}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function SaleCard({ sale, isExpanded, onToggle }) {
  const statusStyles = getStatusStyles(sale.status);
  const items = normalizeSaleItems(sale);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0.95,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha("#0f172a", 0.08),
        bgcolor: "#fff",
        height: "100%",
        width: "100%",
      }}
    >
      <Stack spacing={0.9}>
        <Stack spacing={0.55}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={0.75}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: 12.5,
                  lineHeight: 1.1,
                }}
              >
                Venta #{sale.id}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.35,
                  fontSize: 10.5,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {formatDate(sale.created_at)}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.15,
                  fontSize: 10.5,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {sale.payment_method || "—"}
              </Typography>
            </Box>

            <Chip
              label={getStatusLabel(sale.status)}
              size="small"
              sx={{
                height: 22,
                maxWidth: 86,
                "& .MuiChip-label": {
                  px: 0.8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
                fontWeight: 700,
                fontSize: 10,
                color: statusStyles.color,
                bgcolor: statusStyles.bg,
                border: "1px solid",
                borderColor: statusStyles.border,
                flexShrink: 0,
              }}
            />
          </Stack>

          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 15.5,
              lineHeight: 1,
              color: "#0f172a",
              wordBreak: "break-word",
            }}
          >
            {money.format(Number(sale.total_amount || 0))}
          </Typography>
        </Stack>

        <Divider />

        <Stack spacing={0.7}>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Inventory2OutlinedIcon sx={{ fontSize: 14, color: "#0284c7" }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 10.5, lineHeight: 1.2 }}
            >
              {items.length} prod.
            </Typography>
          </Stack>

          <Button
            onClick={onToggle}
            size="small"
            variant="outlined"
            fullWidth
            endIcon={
              isExpanded ? (
                <KeyboardArrowUpRoundedIcon sx={{ fontSize: 16 }} />
              ) : (
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              minHeight: 30,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 11,
              px: 0.75,
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
        </Stack>

        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <SaleProductsList sale={sale} />
        </Collapse>
      </Stack>
    </Paper>
  );
}

function FilterOptionChip({ active, label, onClick }) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      clickable
      size="small"
      sx={{
        height: 32,
        borderRadius: 999,
        fontWeight: 700,
        border: "1px solid",
        borderColor: active ? alpha("#0284c7", 0.35) : alpha("#0f172a", 0.08),
        bgcolor: active ? alpha("#0ea5e9", 0.12) : "#fff",
        color: active ? "#0369a1" : "#334155",
      }}
    />
  );
}

export default function ClienteHistoryModalMobile({
  payload,
  cliente,
  month,
  tempMonth,
  setTempMonth,
  status,
  tempStatus,
  setTempStatus,
  showMobileFilters,
  toggleMobileFilters,
  applyFilters,
  clearFilters,
  monthlyIndex,
  activeStatusLabel,
  resumenVentas,
  resumenMonto,
  sales,
  expandedSales,
  toggleSale,
  loading,
  onDownloadPdf,
  onDownloadExcel,
  downloadingPdf,
  downloadingExcel,
  hasReportData,
}) {
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          p: 1.15,
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha("#0f172a", 0.08),
          bgcolor: "#fff",
        }}
      >
        <Grid container spacing={1.2} alignItems="center">
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha("#0ea5e9", 0.12),
                  color: "#0284c7",
                }}
              >
                <PersonOutlineIcon />
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 17, lineHeight: 1.1 }}>
                  {payload?.cliente?.nombre_alias ||
                    cliente?.nombre_alias ||
                    "Cliente"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  Historial de compras
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 13.5 }}>
                    Filtros
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Mes: {getMonthLabel(monthlyIndex, month)} · Estado: {activeStatusLabel}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={toggleMobileFilters}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 800,
                    minWidth: 0,
                    flexShrink: 0,
                  }}
                >
                  {showMobileFilters ? "Cerrar" : "Filtrar"}
                </Button>
              </Stack>

              <Collapse in={showMobileFilters} timeout="auto" unmountOnExit>
                <Paper
                  elevation={0}
                  sx={{
                    mt: 0.5,
                    p: 1.1,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: alpha("#0ea5e9", 0.16),
                    bgcolor: alpha("#0ea5e9", 0.03),
                  }}
                >
                  <Stack spacing={1.15}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 0.9, fontSize: 12.5 }}>
                        Mes
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.75,
                          overflowX: "auto",
                          pb: 0.4,
                          "&::-webkit-scrollbar": { display: "none" },
                        }}
                      >
                        <FilterOptionChip
                          active={tempMonth === ""}
                          label="Todos"
                          onClick={() => setTempMonth("")}
                        />

                        {monthlyIndex.map((m) => (
                          <FilterOptionChip
                            key={m.month_key}
                            active={tempMonth === m.month_key}
                            label={m.month_label}
                            onClick={() => setTempMonth(m.month_key)}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 0.9, fontSize: 12.5 }}>
                        Estado
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.75,
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <FilterOptionChip
                            key={opt.value || "all"}
                            active={tempStatus === opt.value}
                            label={opt.label}
                            onClick={() => setTempStatus(opt.value)}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CheckRoundedIcon />}
                        onClick={applyFilters}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Aplicar
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<RestartAltRoundedIcon />}
                        onClick={clearFilters}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Limpiar
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Collapse>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
        <Grid item xs={6}>
          <StatCard
            icon={<ReceiptLongIcon fontSize="small" />}
            label="Ventas"
            value={resumenVentas}
          />
        </Grid>

        <Grid item xs={6}>
          <StatCard
            icon={<PaidIcon fontSize="small" />}
            label="Total vendido"
            value={money.format(resumenMonto)}
          />
        </Grid>

        <Grid item xs={12}>
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
          <Stack spacing={1}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={0.8}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
                Ventas registradas
              </Typography>

              <Chip
                label={`${sales.length} venta${sales.length === 1 ? "" : "s"}`}
                sx={{
                  fontWeight: 700,
                  bgcolor: "#fff",
                  border: "1px solid",
                  borderColor: alpha("#0f172a", 0.08),
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfRoundedIcon />}
                onClick={onDownloadPdf}
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
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<TableViewRoundedIcon />}
                onClick={onDownloadExcel}
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
          <Grid container spacing={0.9} sx={{ p: 0.9 }}>
            {sales.map((sale) => (
              <Grid item xs={6} sm={6} key={sale.id} sx={{ display: "flex" }}>
                <SaleCard
                  sale={sale}
                  isExpanded={!!expandedSales[sale.id]}
                  onToggle={() => toggleSale(sale.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </>
  );
}