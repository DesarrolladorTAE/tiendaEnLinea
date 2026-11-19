import React from "react";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { saleInfo } from "../../utils/posSaleInfo";

const statusConfig = {
  paid: { label: "Venta pagada", color: "success", icon: <ReceiptLongRoundedIcon /> },
  open: { label: "Venta pendiente", color: "warning", icon: <PendingActionsRoundedIcon /> },
  credit: { label: "Venta a crédito pendiente", color: "primary", icon: <CreditScoreRoundedIcon /> },
  credit_paid: { label: "Venta a crédito saldada", color: "success", icon: <CreditScoreRoundedIcon /> },
  cancelled: { label: "Venta cancelada", color: "error", icon: <CancelRoundedIcon /> },
  partially_cancelled: { label: "Cancelación parcial", color: "error", icon: <CancelRoundedIcon /> },
  devuelta: { label: "Venta devuelta", color: "info", icon: <AutorenewRoundedIcon /> },
  devuelta_parcial: { label: "Devolución parcial", color: "info", icon: <AutorenewRoundedIcon /> },
};

const aliases = {
  pending: "open",
  canceled: "cancelled",
  partially_canceled: "partially_cancelled",
  refunded: "devuelta",
  partially_refunded: "devuelta_parcial",
};

export function getPOSSaleStatus(sale) {
  const status = String(sale?.status ?? "").trim().toLowerCase();
  const type = saleInfo(sale ?? {}).type;
  const key = status === "paid" && type === "credit_paid" ? type : aliases[status] ?? status;
  return Object.hasOwn(statusConfig, key) ? statusConfig[key] : {
    label: sale?.status_label || sale?.status || "Estado no disponible",
    color: "default",
    icon: <ReceiptLongRoundedIcon />,
  };
}
