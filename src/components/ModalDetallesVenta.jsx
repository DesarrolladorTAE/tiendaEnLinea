import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Box,
  Button,
  Divider,
  Chip,
  Stack,
  Paper,
  Avatar,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import axiosClient from "../config/axiosClientPOS";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const STATUS_CONFIG = {
  paid: {
    label: "Venta pagada",
    color: "success",
    icon: <ReceiptLongRoundedIcon />,
  },
  open: {
    label: "Venta pendiente",
    color: "warning",
    icon: <PendingActionsRoundedIcon />,
  },
  credit: {
    label: "Venta a crédito pendiente",
    color: "primary",
    icon: <CreditScoreRoundedIcon />,
  },
  credit_paid: {
    label: "Venta a crédito saldada",
    color: "success",
    icon: <CreditScoreRoundedIcon />,
  },
  cancelled: {
    label: "Venta cancelada",
    color: "error",
    icon: <CancelRoundedIcon />,
  },
  partially_cancelled: {
    label: "Cancelación parcial",
    color: "error",
    icon: <CancelRoundedIcon />,
  },
  devuelta: {
    label: "Venta devuelta",
    color: "info",
    icon: <AutorenewRoundedIcon />,
  },
  devuelta_parcial: {
    label: "Devolución parcial",
    color: "info",
    icon: <AutorenewRoundedIcon />,
  },
};

const PAYMENT_LABELS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "Tarjeta crédito",
  td: "Tarjeta débito",
};

const getPagoConcepto = (index, pago, pagos, totalVenta) => {
  const acumulado = pagos
    .slice(0, index + 1)
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const esPrimero = index === 0;
  const liquida = acumulado + 0.00001 >= Number(totalVenta || 0);

  if (pagos.length === 1 && liquida) return "Pago completo";
  if (esPrimero && !liquida) return "Anticipo inicial";
  if (!esPrimero && liquida) return "Liquidación pendiente";
  return "Abono pendiente";
};

export default function ModalDetallesVenta({ open, onClose, ventaId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [detalles, setDetalles] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarDetalles = async () => {
      setLoading(true);

      try {
        const { data } = await axiosClient.get(`/ventas/${ventaId}`);
        setDetalles(data?.sale ? data : null);
      } catch (error) {
        console.error("Error al cargar detalles", error);
        setDetalles(null);
      } finally {
        setLoading(false);
      }
    };

    if (ventaId && open) cargarDetalles();
  }, [ventaId, open]);

  const sale = detalles?.sale;

  const statusConfig = useMemo(() => {
    return (
      STATUS_CONFIG[sale?.status] || {
        label: sale?.status_label || "Movimiento",
        color: "default",
        icon: <ReceiptLongRoundedIcon />,
      }
    );
  }, [sale]);

  const pagos = Array.isArray(detalles?.payments) ? detalles.payments : [];
  const items = Array.isArray(detalles?.items) ? detalles.items : [];
  const creditMovements = Array.isArray(detalles?.credit_movements)
    ? detalles.credit_movements
    : [];

  const totals = sale?.totals || {};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 5,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2.5,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #334155 100%)",
            color: "#fff",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,.12)",
                  color: "#fff",
                  width: 56,
                  height: 56,
                  border: "1px solid rgba(255,255,255,.22)",
                }}
              >
                {statusConfig.icon}
              </Avatar>

              <Box>
                <Typography fontWeight={950} sx={{ fontSize: { xs: 20, md: 26 } , color:"white"}}>
                  Ticket #{sale?.id || ventaId}
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.78 , color: "white" }}>
                  Detalle operativo y financiero de la venta
                </Typography>
              </Box>
            </Stack>

            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              sx={{
                fontWeight: 900,
                borderRadius: 2,
                color: "#fff",
              }}
            />
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc" }}>
        {loading ? (
          <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : detalles && sale ? (
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,.99), rgba(248,250,252,.96))",
                  }}
                >
                  <Typography fontWeight={950} sx={{ mb: 2 }}>
                    Información general
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Fecha
                      </Typography>
                      <Typography fontWeight={850}>
                        {sale.created_at
                          ? format(new Date(sale.created_at), "d MMM yyyy, HH:mm", {
                              locale: es,
                            })
                          : "—"}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Cliente
                      </Typography>
                      <Typography fontWeight={850}>
                        {sale?.client?.name || "Cliente general"}
                      </Typography>
                      {sale?.client?.phone ? (
                        <Typography variant="caption" color="text.secondary">
                          {sale.client.phone}
                        </Typography>
                      ) : null}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Punto de venta
                      </Typography>
                      <Typography fontWeight={850}>
                        {sale?.pos_location?.name || "—"}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Estado
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          size="small"
                          color={statusConfig.color}
                          label={statusConfig.label}
                          sx={{ fontWeight: 900 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(15,23,42,.04), rgba(255,255,255,.98))",
                  }}
                >
                  <Stack spacing={1.2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccountBalanceWalletRoundedIcon color="primary" />
                      <Typography fontWeight={950}>Resumen final</Typography>
                    </Stack>

                    <Divider />

                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Total venta</Typography>
                      <Typography fontWeight={950}>{money(totals.total_amount)}</Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Pagado</Typography>
                      <Typography fontWeight={950}>{money(totals.paid_amount)}</Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Restante</Typography>
                      <Typography
                        fontWeight={950}
                        color={Number(totals.remaining_amount) > 0 ? "warning.main" : "success.main"}
                      >
                        {money(totals.remaining_amount)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Cambio</Typography>
                      <Typography fontWeight={950}>{money(totals.change_amount)}</Typography>
                    </Stack>

                    <Divider />

                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        Importe principal
                      </Typography>
                      <Typography sx={{ fontSize: { xs: 30, md: 36 }, fontWeight: 950 }}>
                        {money(totals.total_amount)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <ShoppingBagRoundedIcon color="primary" />
                <Typography fontWeight={950}>Productos vendidos</Typography>
                <Chip size="small" label={`${items.length} conceptos`} sx={{ fontWeight: 800 }} />
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Cantidad</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Precio</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900 }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id || `${item.nombre}-${item.total}`}>
                        <TableCell>
                          <Typography fontWeight={850}>{item.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.variante || item.talla || item.sku || "Sin variante"}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{money(item.precio_unitario)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={950}>{money(item.total)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <PaymentsRoundedIcon color="primary" />
                    <Typography fontWeight={950}>Pagos de la venta</Typography>
                  </Stack>

                  {pagos.length > 0 ? (
                    <Stack spacing={1}>
                      {pagos.map((pago, index) => (
                        <Box
                          key={pago.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Box>
                              <Typography fontWeight={950}>
                                {getPagoConcepto(
                                  index,
                                  pago,
                                  pagos,
                                  totals.total_amount,
                                )}
                              </Typography>

                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.7 }}>
                                <Chip
                                  size="small"
                                  label={PAYMENT_LABELS[pago.method] || pago.method || "Sin método"}
                                  sx={{ fontWeight: 850 }}
                                />

                                {pago.referencia ? (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`Ref. ${pago.referencia}`}
                                    sx={{ fontWeight: 800 }}
                                  />
                                ) : null}

                                {pago.ultimos_4 ? (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`**** ${pago.ultimos_4}`}
                                    sx={{ fontWeight: 800 }}
                                  />
                                ) : null}
                              </Stack>
                            </Box>

                            <Typography fontWeight={950} sx={{ fontSize: 20 }}>
                              {money(pago.amount)}
                            </Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">Sin pagos registrados.</Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <CreditScoreRoundedIcon color="primary" />
                    <Typography fontWeight={950}>Crédito / fiado</Typography>
                  </Stack>

                  {sale?.credit?.is_credit ? (
                    <Stack spacing={1.2}>
                      <Chip
                        color={sale.credit.is_credit_paid ? "success" : "primary"}
                        label={
                          sale.credit.is_credit_paid
                            ? "Crédito saldado"
                            : "Crédito pendiente"
                        }
                        sx={{ fontWeight: 900, alignSelf: "flex-start" }}
                      />

                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Cuenta</Typography>
                        <Typography fontWeight={900}>
                          #{sale.credit.credit_account_id || "—"}
                        </Typography>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Saldo actual</Typography>
                        <Typography fontWeight={950}>
                          {money(sale.credit.account_balance)}
                        </Typography>
                      </Stack>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary">
                      Esta venta no pertenece a crédito.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {creditMovements.length > 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography fontWeight={950} sx={{ mb: 2 }}>
                  Movimientos de crédito
                </Typography>

                <Stack spacing={1}>
                  {creditMovements.map((mov) => (
                    <Box
                      key={mov.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "rgba(248,250,252,.8)",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography fontWeight={950}>
                            {mov.type_label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {mov.payment_method_label || "Sin método"}
                          </Typography>
                        </Box>

                        <Box textAlign={{ xs: "left", sm: "right" }}>
                          <Typography fontWeight={950}>
                            {money(mov.amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Saldo: {money(mov.balance_after)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        ) : (
          <Box py={8} textAlign="center">
            <Typography fontWeight={900}>No se encontraron detalles.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 3,
            fontWeight: 900,
            textTransform: "none",
            minWidth: 130,
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}