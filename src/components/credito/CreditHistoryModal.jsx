import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import ComputerIcon from "@mui/icons-material/Computer";
import LanIcon from "@mui/icons-material/Lan";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import BluetoothIcon from "@mui/icons-material/Bluetooth";

import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";

import CreditHistoryHeader from "./CreditHistoryHeader";
import CreditHistoryTable from "./CreditHistoryTable";
import CreditHistoryMobileCards from "./CreditHistoryMobileCards";

import CreditTicketModal from "./CreditTicketModal";
import CreditTicketPaymentModal from "./CreditTicketPaymentModal";
import CreditPdfViewerModal from "./CreditPdfViewerModal";

import { normalizePhone, getVisibleMovements } from "./creditHistoryUtils";

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
    label: "Enviar Historial a Android USB",
    color: "#2e7d32",
    icon: <AndroidIcon />,
  },

  android_ip: {
    label: "Enviar Historial a Android IP",
    color: "#1b5e20",
    icon: <AndroidIcon />,
  },

  ios_ip: {
    label: "Enviar Historial a iPhone IP",
    color: "#455a64",
    icon: <AppleIcon />,
  },

  ios_ble: {
    label: "Enviar Historial a iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon />,
  },
};

export default function CreditHistoryModal({ open, account, onClose }) {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [ticketOpen, setTicketOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [ticketPaymentOpen, setTicketPaymentOpen] = useState(false);
  const [selectedPaymentSale, setSelectedPaymentSale] = useState(null);

  const [phone, setPhone] = useState("");

  const [pdfOpen, setPdfOpen] = useState(false);

  const [busy, setBusy] = useState(false);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sendingPayload, setSendingPayload] = useState(false);

  const [printSetting, setPrintSetting] = useState(null);

  const [sendingStatementWhatsapp, setSendingStatementWhatsapp] =
    useState(false);

  const posLocationId =
    detail?.pos_location_id ||
    account?.pos_location_id ||
    account?.posLocation?.id;

  useEffect(() => {
    if (!open || !account?.id) return;

    loadDetail();

    // eslint-disable-next-line
  }, [open, account?.id]);

  const loadDetail = async () => {
    try {
      setLoading(true);

      const { data } = await axiosClient.get(
        `/pos/credit-accounts/${account.id}`,
      );

      const acc = data?.account || null;

      setDetail(acc);

      const clientPhone =
        acc?.client?.telefono ||
        acc?.client_phone ||
        account?.client_phone ||
        "";

      setPhone(normalizePhone(clientPhone));

      if (acc) {
        await loadPrintConfig(acc);
      }
    } catch (e) {
      console.error(e);

      showError(
        e?.response?.data?.message || "No se pudo cargar el historial.",
      );
    } finally {
      setLoading(false);
    }
  };
  const loadPrintConfig = async (acc = null) => {
    try {
      const currentPosLocationId =
        acc?.pos_location_id ||
        acc?.posLocation?.id ||
        acc?.pos_location?.id ||
        account?.pos_location_id ||
        account?.posLocation?.id ||
        account?.pos_location?.id ||
        null;

      if (!currentPosLocationId) {
        setPrintSetting(null);
        return;
      }

      setLoadingConfig(true);

      const { data } = await axiosClient.get(
        `/pos/print-settings/${currentPosLocationId}/payload-config`,
      );

      setPrintSetting(data || null);
    } catch (e) {
      console.error(e);
      setPrintSetting(null);
    } finally {
      setLoadingConfig(false);
    }
  };

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
        label: "Enviar historial",
        color: "#2563eb",
        icon: <PrintRoundedIcon />,
      }
    );
  }, [printSetting]);

  const movementsRaw = Array.isArray(detail?.movements) ? detail.movements : [];

  const visibleMovements = getVisibleMovements(movementsRaw);

  const openTicket = (sale) => {
    setSelectedSale(sale);
    setTicketOpen(true);
  };

  const openTicketPayment = (sale) => {
    setSelectedPaymentSale(sale);
    setTicketPaymentOpen(true);
  };

  const downloadExcel = async () => {
    try {
      setBusy(true);

      const response = await axiosClient.get(
        `/pos/credit-accounts/${account.id}/report/excel`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute("download", `estado_cuenta_fiado_${account.id}.xlsx`);

      document.body.appendChild(link);

      link.click();

      link.remove();
    } catch (e) {
      console.error(e);

      showError(e?.response?.data?.message || "No se pudo descargar el Excel.");
    } finally {
      setBusy(false);
    }
  };

  const handleSendStatementPayload = async () => {
    try {
      showError("Implementa aquí tu payload ESC/POS.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendStatementWhatsapp = async ({ phone: targetPhone } = {}) => {
    const cleanPhone = normalizePhone(targetPhone || phone);

    if (!account?.id) {
      showError("No se encontró la cuenta de crédito.");
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    try {
      setSendingStatementWhatsapp(true);

      const { data } = await axiosClient.post(
        `/pos/credit-accounts/${account.id}/report/whatsapp`,
        {
          phone: cleanPhone,
        },
      );

      showSuccess(data?.message || "Estado de cuenta enviado por WhatsApp.");
    } catch (e) {
      console.error(e);

      showError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.response?.data?.details ||
          "No se pudo enviar el estado de cuenta por WhatsApp.",
      );
    } finally {
      setSendingStatementWhatsapp(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxWidth: isMobile ? "100%" : 1100,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 950, pr: 6 }}>
          Historial de crédito
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 12,
              top: 10,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              py={8}
              spacing={2}
            >
              <CircularProgress />

              <Typography color="text.secondary">
                Cargando historial...
              </Typography>
            </Stack>
          ) : !detail ? (
            <Alert severity="warning">
              No se encontró información de la cuenta.
            </Alert>
          ) : (
            <Stack spacing={2}>
              <CreditHistoryHeader
                detail={detail}
                account={account}
                busy={busy}
                loadingConfig={loadingConfig}
                printSetting={printSetting}
                printMeta={printMeta}
                printDisabled={
                  busy ||
                  loadingConfig ||
                  sendingPayload ||
                  !printSetting?.enabled
                }
                onOpenPdf={() => setPdfOpen(true)}
                onDownloadExcel={downloadExcel}
                onSendPayload={handleSendStatementPayload}
              />

              <Typography sx={{ fontWeight: 900 }}>Movimientos</Typography>

              {isMobile ? (
                <CreditHistoryMobileCards
                  movements={visibleMovements}
                  onOpenTicket={openTicket}
                  onOpenTicketPayment={openTicketPayment}
                />
              ) : (
                <CreditHistoryTable
                  movements={visibleMovements}
                  onOpenTicket={openTicket}
                  onOpenTicketPayment={openTicketPayment}
                />
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <CreditTicketModal
        open={ticketOpen}
        onClose={() => {
          setTicketOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        phone={phone}
        setPhone={setPhone}
      />

      <CreditTicketPaymentModal
        open={ticketPaymentOpen}
        onClose={() => {
          setTicketPaymentOpen(false);
          setSelectedPaymentSale(null);
        }}
        account={account}
        sale={selectedPaymentSale}
        onSaved={() => {
          loadDetail();
        }}
      />

      <CreditPdfViewerModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        title="Estado de cuenta PDF"
        pdfUrl={`/pos/credit-accounts/${account?.id}/report/pdf`}
        phone={phone}
        setPhone={setPhone}
        onSendWhatsapp={handleSendStatementWhatsapp}
        sending={sendingStatementWhatsapp}
        downloadName={`estado_cuenta_fiado_${account?.id}.pdf`}
      />
    </>
  );
}
