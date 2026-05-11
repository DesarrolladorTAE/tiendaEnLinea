import React from "react";
import {
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";

import { money } from "./creditHistoryUtils";

export default function CreditHistoryHeader({
  detail,
  account,
  busy,
  loadingConfig,
  printSetting,
  printMeta,
  printDisabled,
  onOpenPdf,
  onDownloadExcel,
  onSendPayload,
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 900 }}>
        {detail?.client?.nombre_alias || account?.client_name || "Cliente"}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Tel: {detail?.client?.telefono || account?.client_phone || "Sin teléfono"}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
        <Chip
          label={`Saldo actual: ${money(detail?.current_balance)}`}
          color="warning"
        />

        <Chip
          label={`Límite: ${
            Number(detail?.credit_limit || 0) <= 0
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
          onClick={onOpenPdf}
          sx={{ textTransform: "none", fontWeight: 800 }}
        >
          Ver reporte PDF
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<TableChartIcon />}
          disabled={busy || !account?.id}
          onClick={onDownloadExcel}
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
          onClick={onSendPayload}
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
  );
}