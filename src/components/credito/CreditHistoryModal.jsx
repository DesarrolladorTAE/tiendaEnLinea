import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  useMediaQuery,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Tooltip,
  Box,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LanIcon from "@mui/icons-material/Lan";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import SettingsIcon from "@mui/icons-material/Settings";

import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";
import CreditPdfViewerModal from "./CreditPdfViewerModal";
import CreditTicketModal from "./CreditTicketModal";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const formatDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("es-MX");
};

const normalizePhone = (value = "") =>
  String(value || "").replace(/\D/g, "").slice(0, 10);

const isCancelledSale = (status = "") => {
  const value = String(status || "").toLowerCase();
  return ["cancelled", "canceled", "cancelada", "cancelado"].includes(value);
};

const getSaleStatusChip = (status = "") => {
  const value = String(status || "").toLowerCase();

  if (isCancelledSale(value)) {
    return (
      <Chip
        size="small"
        label="Venta cancelada"
        color="error"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  if (["credit", "credito"].includes(value)) {
    return (
      <Chip
        size="small"
        label="Venta a crédito"
        color="warning"
        variant="outlined"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  if (value === "paid") {
    return (
      <Chip
        size="small"
        label="Pagada"
        color="success"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  if (value === "open") {
    return (
      <Chip
        size="small"
        label="Abierta"
        color="warning"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  if (value === "pending") {
    return (
      <Chip
        size="small"
        label="Pendiente"
        color="info"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  if (value === "devuelta") {
    return (
      <Chip
        size="small"
        label="Devuelta"
        color="secondary"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  if (value === "devuelta_parcial") {
    return (
      <Chip
        size="small"
        label="Devolución parcial"
        color="secondary"
        variant="outlined"
        sx={{ fontWeight: 900 }}
      />
    );
  }

  return (
    <Chip
      size="small"
      label={status || "Sin estado"}
      variant="outlined"
      sx={{ fontWeight: 900 }}
    />
  );
};

const APP_META = {
  windows_usb: {
    label: "Enviar Historial a Windows USB",
    color: "#1565c0",
    icon: <ComputerIcon />,
  },
  windows_ip: {
    label: "Enviar Historial a Windows IP",
    color: "#1976d2",
    icon: <LanIcon />,
  },
  android_usb: {
    label: "Enviar Historial Android USB",
    color: "#2e7d32",
    icon: <AndroidIcon />,
  },
  android_ip: {
    label: "Enviar Historial Android IP",
    color: "#1b5e20",
    icon: <AndroidIcon />,
  },
  ios_ip: {
    label: "Enviar Historial iPhone IP",
    color: "#455a64",
    icon: <LanIcon />,
  },
  ios_ble: {
    label: "Enviar Historial iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon />,
  },
  whatsapp: {
    label: "Enviar por WhatsApp",
    color: "#25D366",
    icon: <WhatsAppIcon />,
  },
};

export default function CreditHistoryModal({ open, onClose, account }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [reportPhone, setReportPhone] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [printSetting, setPrintSetting] = useState(null);

  const printMeta = useMemo(() => {
    if (!printSetting?.enabled || !printSetting?.app_type) {
      return {
        label: "Configurar conexión",
        color: "#9ca3af",
        icon: <SettingsIcon />,
      };
    }

    return (
      APP_META[printSetting.app_type] || {
        label: "Enviar payload",
        color: "#2563eb",
        icon: <PrintRoundedIcon />,
      }
    );
  }, [printSetting]);

  const loadPayloadConfig = async (acc = null) => {
    const posLocationId =
      acc?.pos_location_id ||
      acc?.posLocation?.id ||
      acc?.pos_location?.id ||
      account?.pos_location_id ||
      account?.posLocation?.id ||
      account?.pos_location?.id ||
      null;

    if (!posLocationId) {
      setPrintSetting(null);
      return;
    }

    setLoadingConfig(true);

    try {
      const { data } = await axiosClient.get(
        `/pos/print-settings/${posLocationId}/payload-config`
      );

      setPrintSetting(data || null);
    } catch (error) {
      console.error("Error cargando configuración de impresión:", error);
      setPrintSetting(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadDetail = async () => {
    if (!open || !account?.id) return;

    setLoading(true);

    try {
      const { data } = await axiosClient.get(
        `/pos/credit-accounts/${account.id}`
      );

      const acc = data?.account || null;

      setDetail(acc);

      const phone = normalizePhone(
        acc?.client?.telefono || account?.client_phone || ""
      );

      setReportPhone(phone);

      await loadPayloadConfig(acc);
    } catch (error) {
      console.error(error);
      setDetail(null);
      setPrintSetting(null);
      showError("No se pudo cargar el historial de crédito.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDetail();
    } else {
      setDetail(null);
      setPdfOpen(false);
      setTicketOpen(false);
      setSelectedSale(null);
      setReportPhone("");
      setTicketPhone("");
      setPrintSetting(null);
      setLoadingConfig(false);
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account?.id]);

  const movementsRaw = Array.isArray(detail?.movements) ? detail.movements : [];

  const isReversalType = (type = "") =>
    ["cancelacion", "reversal", "devolucion"].includes(String(type).toLowerCase());

  const movementsToShow = movementsRaw.filter((m) => {
    const cancelled = isCancelledSale(m?.sale?.status);

    // Ocultamos el cargo original si ya fue cancelado,
    // porque la reversión/cancelación ya representa ese movimiento.
    if (m.type === "cargo" && cancelled) {
      return false;
    }

    return true;
  });

  const movements = [...movementsToShow]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .reduce((acc, m) => {
      const prevBalance =
        acc.length > 0
          ? Number(acc[acc.length - 1].computed_balance_after || 0)
          : 0;

      const amount = Number(m.amount || 0);
      const cancelled = isCancelledSale(m?.sale?.status);

      let nextBalance = prevBalance;

      if (m.type === "cargo" && !cancelled) {
        nextBalance = prevBalance + amount;
      }

      if (m.type === "abono") {
        nextBalance = Math.max(0, prevBalance - amount);
      }

      // // Si es cargo cancelado o reversión, visualmente no mueve el saldo
      // if ((m.type === "cargo" && cancelled) || isReversalType(m.type)) {
      //   nextBalance = prevBalance;
      // }

      acc.push({
        ...m,
        computed_balance_before: prevBalance,
        computed_balance_after: nextBalance,
      });

      return acc;
    }, [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const downloadExcel = async () => {
    if (!account?.id) return;

    try {
      setBusy(true);

      const { data } = await axiosClient.get(
        `/pos/credit-accounts/${account.id}/report/excel`,
        { responseType: "blob" }
      );

      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `estado_cuenta_fiado_${account.id}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      console.error(error);
      showError("No se pudo descargar el Excel.");
    } finally {
      setBusy(false);
    }
  };

  const sendReportWhatsapp = async (payload = {}) => {
    if (!account?.id) return;

    const phoneToSend = payload.es_cliente ? reportPhone : payload.phone;

    if (String(phoneToSend || "").length !== 10) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    try {
      setBusy(true);

      await axiosClient.post(
        `/pos/credit-accounts/${account.id}/report/whatsapp`,
        {
          phone: phoneToSend,
          es_cliente: payload.es_cliente,
        }
      );

      showSuccess("Estado de cuenta enviado por WhatsApp.");
    } catch (error) {
      console.error(error);
      showError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo enviar el estado de cuenta."
      );
    } finally {
      setBusy(false);
    }
  };

  const sendTicketWhatsapp = async (payload = {}) => {
    if (!selectedSale?.id) return;

    if (isCancelledSale(selectedSale?.status)) {
      showError("No se puede enviar el ticket de una venta cancelada.");
      return;
    }

    const phoneToSend = payload.es_cliente ? ticketPhone : payload.phone;

    if (String(phoneToSend || "").length !== 10) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    try {
      setBusy(true);

      await axiosClient.post(`/sales/${selectedSale.id}/send-whatsapp`, {
        phone: phoneToSend,
        es_cliente: payload.es_cliente,
      });

      showSuccess("Ticket enviado por WhatsApp.");
    } catch (error) {
      console.error(error);
      showError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo enviar el ticket."
      );
    } finally {
      setBusy(false);
    }
  };

  const sendToWindows = (payload) => {
    if (typeof window.sendPrintPayloadToWindows === "function") {
      window.sendPrintPayloadToWindows(payload);
      return true;
    }

    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const sendToAndroidUsb = (payload) => {
    if (window.AndroidPrintBridge?.print) {
      window.AndroidPrintBridge.print(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const sendToFlutter = async (request) => {
    if (!window.flutter_inappwebview?.callHandler) {
      throw new Error("No hay bridge Flutter disponible.");
    }

    const resp = await window.flutter_inappwebview.callHandler(
      "printTicket",
      request
    );

    if (resp && resp.ok === false) {
      throw new Error(resp?.message || "No se pudo imprimir desde la aplicación.");
    }

    return true;
  };

  const handleSendStatementPayload = async () => {
    if (!account?.id) return;

    try {
      setBusy(true);

      const posLocationId =
        detail?.pos_location_id ||
        detail?.posLocation?.id ||
        detail?.pos_location?.id ||
        account?.pos_location_id ||
        account?.posLocation?.id ||
        account?.pos_location?.id ||
        null;

      if (!posLocationId) {
        throw new Error("No se encontró el punto de venta de esta cuenta.");
      }

      let setting = printSetting;

      if (!setting?.enabled || !setting?.app_type) {
        const { data } = await axiosClient.get(
          `/pos/print-settings/${posLocationId}/payload-config`
        );

        setting = data || null;
        setPrintSetting(setting);
      }

      if (!setting?.enabled || !setting?.app_type) {
        throw new Error("No hay conectividad configurada para este punto de venta.");
      }

      const { data } = await axiosClient.get(
        `/pos/credit-accounts/${account.id}/print-payload`
      );

      if (!data?.ok || !data?.payload) {
        throw new Error(data?.message || "No se pudo obtener el payload.");
      }

      const appType = setting.app_type;

      const payload = {
        ...data.payload,
        app_type: appType,
        credit_account_id: account.id,
      };

      if (appType === "whatsapp") {
        throw new Error("El estado de cuenta por WhatsApp se envía desde el botón del PDF.");
      }

      if (appType === "windows_usb") {
        const ok = sendToWindows({
          ...payload,
          transport: "usb",
        });

        if (!ok) throw new Error("No hay bridge Windows disponible.");
      }

      if (appType === "windows_ip") {
        const printerIp = payload?.printer?.ip;
        const printerPort = payload?.printer?.port;

        if (!printerIp || !printerPort) {
          throw new Error("Configura primero la IP y puerto de la impresora.");
        }

        const ok = sendToWindows({
          ...payload,
          transport: "tcp",
          host: printerIp,
          port: printerPort,
        });

        if (!ok) throw new Error("No hay bridge Windows disponible.");
      }

      if (appType === "android_usb") {
        const ok = sendToAndroidUsb({
          ...payload,
          transport: "usb",
        });

        if (!ok) throw new Error("No hay bridge Android USB disponible.");
      }

      if (appType === "android_ip" || appType === "ios_ip") {
        const printerIp = payload?.printer?.ip;
        const printerPort = payload?.printer?.port;

        if (!printerIp || !printerPort) {
          throw new Error("Configura primero la IP y puerto de la impresora.");
        }

        await sendToFlutter({
          payload: {
            ...payload,
            transport: "tcp",
          },
          host: printerIp,
          port: printerPort,
        });
      }

      if (appType === "ios_ble") {
        await sendToFlutter({
          payload: {
            ...payload,
            transport: "ble",
          },
        });
      }

      showSuccess(`${printMeta.label} correctamente.`);
    } catch (error) {
      console.error(error);
      showError(error?.message || "No se pudo enviar el payload térmico.");
    } finally {
      setBusy(false);
    }
  };

  const openTicket = (sale) => {
    if (isCancelledSale(sale?.status)) {
      showError("Esta venta está cancelada. No se puede abrir el ticket.");
      return;
    }

    const phone = normalizePhone(
      detail?.client?.telefono || account?.client_phone || ""
    );

    setSelectedSale(sale);
    setTicketPhone(phone);
    setTicketOpen(true);
  };

  const renderMovementType = (m) => {
    const cancelled = isCancelledSale(m?.sale?.status);

    if (m.type === "cargo") {
      return (
        <Chip
          size="small"
          label={cancelled ? "Venta fiada cancelada" : "Venta fiada"}
          color={cancelled ? "error" : "warning"}
        />
      );
    }

    if (m.type === "cancelacion") {
      return <Chip size="small" label="Cancelación" color="error" />;
    }

    return <Chip size="small" label="Abono" color="success" />;
  };

  const printDisabled =
    busy ||
    loadingConfig ||
    !account?.id ||
    !printSetting?.enabled ||
    !printSetting?.app_type ||
    printSetting?.app_type === "whatsapp";

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pr: 6 }}>
          Historial de crédito
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", right: 12, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Stack alignItems="center" py={5}>
              <CircularProgress />
              <Typography mt={2}>Cargando historial...</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography sx={{ fontWeight: 900 }}>
                  {detail?.client?.nombre_alias ||
                    account?.client_name ||
                    "Cliente"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Tel:{" "}
                  {detail?.client?.telefono ||
                    account?.client_phone ||
                    "Sin teléfono"}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  <Chip
                    label={`Saldo actual: ${money(detail?.current_balance)}`}
                    color="warning"
                  />

                  <Chip
                    label={`Límite: ${Number(detail?.credit_limit || 0) <= 0
                      ? "Ilimitado"
                      : money(detail?.credit_limit)
                      }`}
                    variant="outlined"
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PictureAsPdfIcon />}
                    disabled={busy || !account?.id}
                    onClick={() => setPdfOpen(true)}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    Ver reporte PDF
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<TableChartIcon />}
                    disabled={busy || !account?.id}
                    onClick={downloadExcel}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    Descargar Excel
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={
                      busy || loadingConfig ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        printMeta.icon
                      )
                    }
                    disabled={printDisabled}
                    onClick={handleSendStatementPayload}
                    sx={{
                      textTransform: "none",
                      fontWeight: 900,
                      minHeight: 42,
                      bgcolor: printMeta.color,
                      boxShadow: `0 12px 26px ${printMeta.color}44`,
                      "&:hover": {
                        bgcolor: printMeta.color,
                        filter: "brightness(.92)",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "#d1d5db",
                        color: "#6b7280",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {busy || loadingConfig ? "Procesando..." : printMeta.label}
                  </Button>
                </Stack>

                <Stack sx={{ mt: 1.5 }}>
                  {loadingConfig ? (
                    <Chip
                      label="Cargando configuración de impresión..."
                      size="small"
                      variant="outlined"
                      sx={{ alignSelf: "flex-start", fontWeight: 800 }}
                    />
                  ) : printSetting?.enabled ? (
                    <Chip
                      label={
                        printSetting?.app_type === "whatsapp"
                          ? "Conexión WhatsApp activa: usa el PDF para enviar el estado"
                          : `Conexión activa: ${printMeta.label}`
                      }
                      size="small"
                      sx={{
                        alignSelf: "flex-start",
                        fontWeight: 900,
                        bgcolor: `${printMeta.color}18`,
                        color: printMeta.color,
                      }}
                    />
                  ) : (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      No hay conectividad configurada para este punto de venta.
                    </Alert>
                  )}
                </Stack>
              </Paper>

              <Typography sx={{ fontWeight: 900 }}>Movimientos</Typography>

              {movements.length === 0 ? (
                <Typography color="text.secondary">
                  Sin movimientos registrados.
                </Typography>
              ) : isMobile ? (
                <Stack spacing={1.2}>
                  {movements.map((m) => {
                    const sale = m.sale;
                    const items = Array.isArray(sale?.items) ? sale.items : [];
                    const cancelled = isCancelledSale(sale?.status);

                    return (
                      <Paper
                        key={m.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: cancelled ? "#fef2f2" : "background.paper",
                          borderColor: cancelled ? "#fecaca" : "divider",
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            {renderMovementType(m)}
                            <Typography sx={{ fontWeight: 900 }}>
                              {money(m.amount)}
                            </Typography>
                          </Stack>

                          <Typography variant="caption" color="text.secondary">
                            {formatDate(m.created_at)}
                          </Typography>

                          <Typography variant="body2">
                            Saldo antes: <b>{money(m.balance_before)}</b>
                          </Typography>

                          <Typography variant="body2">
                            Saldo después: <b>{money(m.computed_balance_after)}</b>
                          </Typography>

                          {m.payment_method ? (
                            <Typography variant="body2">
                              Método: <b>{m.payment_method}</b>{" "}
                              {m.reference ? `· Ref: ${m.reference}` : ""}
                            </Typography>
                          ) : null}

                          {m.notes ? (
                            <Typography variant="body2" color="text.secondary">
                              {m.notes}
                            </Typography>
                          ) : null}

                          {sale ? (
                            <>
                              <Divider />

                              <Stack spacing={0.7}>
                                <Typography sx={{ fontWeight: 900 }}>
                                  Venta #{sale.id} · Total {money(sale.total_amount)}
                                </Typography>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {getSaleStatusChip(sale.status)}

                                </Stack>

                                {sale.motivo_cancelacion ? (
                                  <Typography variant="caption" color="error">
                                    Motivo: {sale.motivo_cancelacion}
                                  </Typography>
                                ) : null}

                                {sale.fecha_cancelacion ? (
                                  <Typography variant="caption" color="error">
                                    Cancelada el: {formatDate(sale.fecha_cancelacion)}
                                  </Typography>
                                ) : null}
                              </Stack>

                              {items.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  Sin productos cargados.
                                </Typography>
                              ) : (
                                items.map((it) => (
                                  <Box key={it.id}>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 800 }}
                                    >
                                      {it.product?.name || "Producto"}
                                      {it.product_variant?.name
                                        ? ` - ${it.product_variant.name}`
                                        : ""}
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Cant: {it.quantity} · Precio:{" "}
                                      {money(it.unit_price)} · Importe:{" "}
                                      {money(it.total_price)}
                                    </Typography>
                                  </Box>
                                ))
                              )}

                              <Button
                                variant="outlined"
                                startIcon={<ReceiptLongIcon />}
                                onClick={() => openTicket(sale)}
                                disabled={cancelled}
                                sx={{ textTransform: "none", fontWeight: 800 }}
                              >
                                {cancelled ? "Ticket cancelado" : "Ver ticket"}
                              </Button>
                            </>
                          ) : null}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{ "& th": { fontWeight: 900, bgcolor: "#f8fafc" } }}
                      >
                        <TableCell>Fecha</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell>Venta / Productos</TableCell>

                        <TableCell align="right">Cargo</TableCell>

                        <TableCell align="right">Abono</TableCell>

                        <TableCell align="right">Reversión</TableCell>

                        <TableCell align="right">Saldo después</TableCell>

                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {movements.map((m) => {
                        const sale = m.sale;
                        const items = Array.isArray(sale?.items) ? sale.items : [];

                        const cancelled = isCancelledSale(sale?.status);

                        const isReversal = [
                          "cancelacion",
                          "reversal",
                          "devolucion",
                        ].includes(m.type);

                        return (
                          <TableRow
                            key={m.id}
                            hover
                            sx={{
                              bgcolor: cancelled ? "#fef2f2" : "inherit",
                              "&:hover": {
                                bgcolor: cancelled ? "#fee2e2" : undefined,
                              },
                            }}
                          >
                            <TableCell>
                              {formatDate(m.created_at)}
                            </TableCell>

                            <TableCell>
                              <Stack spacing={0.5}>
                                {renderMovementType(m)}

                                {m.payment_method ? (
                                  <Typography variant="caption">
                                    {m.payment_method}
                                    {m.reference ? ` · ${m.reference}` : ""}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </TableCell>

                            <TableCell>
                              {sale ? (
                                <Stack spacing={0.5}>
                                  <Typography sx={{ fontWeight: 900 }}>
                                    Venta #{sale.id}
                                  </Typography>

                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                  >
                                    {getSaleStatusChip(sale.status)}
                                  </Stack>

                                  {sale.motivo_cancelacion ? (
                                    <Typography
                                      variant="caption"
                                      color="error"
                                    >
                                      Motivo: {sale.motivo_cancelacion}
                                    </Typography>
                                  ) : null}

                                  {sale.fecha_cancelacion ? (
                                    <Typography
                                      variant="caption"
                                      color="error"
                                    >
                                      Cancelada el:{" "}
                                      {formatDate(
                                        sale.fecha_cancelacion
                                      )}
                                    </Typography>
                                  ) : null}

                                  {items.length ? (
                                    items.map((it) => (
                                      <Typography
                                        key={it.id}
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {it.product?.name ||
                                          "Producto"}

                                        {it.product_variant?.name
                                          ? ` - ${it.product_variant.name}`
                                          : ""}

                                        {" · Cant: "}
                                        {it.quantity}

                                        {" · "}
                                        {money(it.total_price)}
                                      </Typography>
                                    ))
                                  ) : (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Sin productos cargados
                                    </Typography>
                                  )}
                                </Stack>
                              ) : (
                                m.notes || "Movimiento registrado"
                              )}
                            </TableCell>

                            {/* CARGO */}
                            <TableCell align="right">
                              {m.type === "cargo" && !cancelled
                                ? money(m.amount)
                                : "—"}
                            </TableCell>

                            {/* ABONO */}
                            <TableCell align="right">
                              {m.type === "abono"
                                ? money(m.amount)
                                : "—"}
                            </TableCell>

                            {/* REVERSIÓN */}
                            <TableCell align="right">
                              {isReversal
                                ? money(m.amount)
                                : cancelled && m.type === "cargo"
                                  ? "Reversada"
                                  : "—"}
                            </TableCell>

                            {/* SALDO */}
                            <TableCell align="right">
                              <b>{money(m.computed_balance_after)}</b>
                            </TableCell>

                            {/* ACCIONES */}
                            <TableCell align="center">
                              {sale ? (
                                <Tooltip
                                  title={
                                    cancelled
                                      ? "Venta cancelada"
                                      : "Ver ticket"
                                  }
                                >
                                  <span>
                                    <IconButton
                                      color={
                                        cancelled
                                          ? "default"
                                          : "primary"
                                      }
                                      onClick={() =>
                                        openTicket(sale)
                                      }
                                      disabled={cancelled}
                                    >
                                      <ReceiptLongIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <CreditPdfViewerModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        title="Estado de cuenta PDF"
        pdfUrl={account?.id ? `/pos/credit-accounts/${account.id}/report/pdf` : ""}
        phone={reportPhone}
        setPhone={setReportPhone}
        onSendWhatsapp={sendReportWhatsapp}
        sending={busy}
        downloadName={`estado_cuenta_fiado_${account?.id || ""}.pdf`}
      />

      <CreditTicketModal
        open={ticketOpen}
        onClose={() => {
          setTicketOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        phone={ticketPhone}
        setPhone={setTicketPhone}
        onSendWhatsapp={sendTicketWhatsapp}
        sending={busy}
      />
    </>
  );
}