import React, { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import axiosClient from "../../config/axiosClientPOS";

/**
 * Normaliza un valor numérico para enviarlo con 6 decimales.
 *
 * Devuelve string para no eliminar los ceros finales:
 * 500 -> "500.000000"
 */
const decimal6 = (value) => {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "0.000000";
  }

  return number.toFixed(6);
};

/**
 * Convierte los valores recibidos del backend para mostrarlos.
 */
const toSafeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

export default function IsrRetentionPreview({
  clientId,
  totalAmount = 0,
  ivaTotal = null,
  onChange,
}) {
  const [loading, setLoading] = useState(false);
  const [retentionInfo, setRetentionInfo] =
    useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    /*
     * Al quitar el cliente, limpiamos toda la información.
     */
    if (!clientId) {
      setRetentionInfo(null);
      setError("");
      setLoading(false);
      onChange?.(null);

      return;
    }

    let cancelled = false;

    /*
     * Debounce para evitar peticiones repetidas cuando
     * cambia rápidamente el carrito.
     */
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Se envían los importes como strings con 6 decimales.
         *
         * Laravel los acepta con la regla "numeric".
         */
        const payload = {
          client_id: Number(clientId),
          total_amount: decimal6(totalAmount),
        };

        /*
         * Solo enviamos iva_total cuando realmente
         * esté disponible y sea numérico.
         */
        if (
          ivaTotal !== null &&
          ivaTotal !== undefined &&
          ivaTotal !== "" &&
          Number.isFinite(Number(ivaTotal))
        ) {
          payload.iva_total = decimal6(ivaTotal);
        }

        const { data } = await axiosClient.post(
          "/v2/sales/check-isr-retention",
          payload,
        );

        if (cancelled) return;

        setRetentionInfo(data);
        onChange?.(data);
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Error consultando retención ISR:",
          requestError?.response?.data ||
            requestError,
        );

        const message =
          requestError?.response?.data?.message ||
          "No se pudo verificar la retención ISR.";

        setRetentionInfo(null);
        setError(message);
        onChange?.(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    clientId,
    totalAmount,
    ivaTotal,
    onChange,
  ]);

  if (!clientId) {
    return null;
  }

  if (loading) {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          mt: 1.5,
          p: 1.25,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <CircularProgress size={18} />

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Revisando situación fiscal del cliente...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert
        severity="warning"
        variant="outlined"
        sx={{
          mt: 1.5,
          borderRadius: 2,
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!retentionInfo) {
    return null;
  }

  if (!retentionInfo.applies_retention) {
    return (
      <Alert
        severity="success"
        variant="outlined"
        sx={{
          mt: 1.5,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ fontWeight: 800 }}>
          No aplica retención ISR
        </Typography>

        <Typography variant="body2">
          {retentionInfo.message}
        </Typography>
      </Alert>
    );
  }

  const calculation =
    retentionInfo.calculation || {};

  /*
   * El backend devuelve strings con 6 decimales.
   * Aquí convertimos únicamente para presentación.
   */
  const totalBeforeRetention = toSafeNumber(
    calculation.total_before_retention,
    toSafeNumber(totalAmount),
  );

  const retentionTotal = toSafeNumber(
    calculation.isr_retention_total,
  );

  const netTotal = toSafeNumber(
    calculation.net_total_amount,
    totalBeforeRetention,
  );

  return (
    <Alert
      severity="info"
      sx={{
        mt: 1.5,
        borderRadius: 2,

        "& .MuiAlert-message": {
          width: "100%",
        },
      }}
    >
      <Typography sx={{ fontWeight: 900 }}>
        Retención ISR RESICO del 1.25%
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.4 }}
      >
        La tienda es persona física RESICO y el
        cliente seleccionado es persona moral.
      </Typography>

      <Divider sx={{ my: 1 }} />

      <Stack spacing={0.6}>
        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="body2">
            Total antes de retención:
          </Typography>

          <Typography
            variant="body2"
            sx={{ fontWeight: 800 }}
          >
            ${totalBeforeRetention.toFixed(2)}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="body2">
            Retención ISR 1.25%:
          </Typography>

          <Typography
            variant="body2"
            color="error.main"
            sx={{ fontWeight: 800 }}
          >
            -${retentionTotal.toFixed(2)}
          </Typography>
        </Stack>

        <Divider sx={{ my: 0.4 }} />

        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography sx={{ fontWeight: 900 }}>
            Total a pagar:
          </Typography>

          <Typography
            sx={{
              fontWeight: 900,
              color: "success.main",
            }}
          >
            ${netTotal.toFixed(2)}
          </Typography>
        </Stack>
      </Stack>
    </Alert>
  );
}