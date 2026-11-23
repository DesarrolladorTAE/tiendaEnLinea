import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { QRCodeCanvas } from "qrcode.react";
import axiosClient from "../../config/axiosClient";

import { showConfirm, showSuccess, showError } from "../../utils/alerts";

const isConnectedStatus = (status) =>
  ["CONNECTED", "open", "connected", "OPEN"].includes(String(status || ""));

const formatDate = (value) => {
  if (!value) return "Sin fecha";

  return new Date(String(value).replace(" ", "T")).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getRemainingText = (fechaFin) => {
  if (!fechaFin) return "Sin vencimiento";

  const end = new Date(String(fechaFin).replace(" ", "T"));
  const now = new Date();
  const diffMs = end - now;

  if (diffMs <= 0) return "Vencido";

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days >= 365) {
    const years = Math.floor(days / 365);
    const restDays = days % 365;

    return `${years} año${years > 1 ? "s" : ""}${
      restDays ? ` y ${restDays} días` : ""
    }`;
  }

  if (days >= 30) {
    const months = Math.floor(days / 30);
    const restDays = days % 30;

    return `${months} mes${months > 1 ? "es" : ""}${
      restDays ? ` y ${restDays} días` : ""
    }`;
  }

  return `${days} día${days > 1 ? "s" : ""}`;
};

export default function WhatsAppConnectionModal({ open, onClose, addon }) {
  const [connection, setConnection] = useState(null);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const connected = useMemo(
    () => isConnectedStatus(connection?.status),
    [connection?.status],
  );

  const remainingText = useMemo(
    () => getRemainingText(addon?.fecha_fin),
    [addon?.fecha_fin],
  );

  const isExpired = remainingText === "Vencido";

  const loadConnection = useCallback(async () => {
    setError("");
    setLoadingConnection(true);

    try {
      const { data } = await axiosClient.get("/whatsapp-connections");
      const list = Array.isArray(data?.data) ? data.data : [];

      const active =
        list.find((item) => isConnectedStatus(item.status)) ||
        list.find((item) => item.qrcode) ||
        list[0] ||
        null;

      setConnection(active);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "No se pudo cargar la conexión actual de WhatsApp.",
      );
    } finally {
      setLoadingConnection(false);
    }
  }, []);

  const createConnection = async () => {
    setError("");
    setCreating(true);

    try {
      const { data } = await axiosClient.post("/whatsapp-connections", {
        complemento_id: addon?.id,
      });

      setConnection(data.connection);

      showSuccess(data?.message || "Conexión creada correctamente.");
    } catch (e) {
      showError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "No se pudo crear la conexión de WhatsApp.",
      );
    } finally {
      setCreating(false);
    }
  };

  const checkStatus = useCallback(async () => {
    if (!connection?.id || connected) return;

    setChecking(true);

    try {
      const { data } = await axiosClient.get(
        `/whatsapp-connections/${connection.id}/status`,
      );

      setConnection(data.connection);
    } catch (e) {
      showError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "No se pudo consultar el estado de WhatsApp.",
      );
    } finally {
      setChecking(false);
    }
  }, [connection?.id, connected]);

  const deleteConnection = async () => {
    if (!connection?.id) return;

    const confirmed = await showConfirm(
      "Esta acción eliminará la sesión de WhatsApp actual tanto del sistema como de ChatingBoot.",
      "Sí, eliminar",
    );

    if (!confirmed) return;

    setError("");
    setDeleting(true);

    try {
      await axiosClient.delete(`/whatsapp-connections/${connection.id}`);

      await showSuccess("La conexión de WhatsApp fue eliminada correctamente.");

      setConnection(null);
      await loadConnection();
    } catch (e) {
      if (e?.response?.status === 404) {
        setConnection(null);
        await loadConnection();

        await showSuccess(
          "La conexión ya no existía en el sistema. Se actualizó la información.",
        );

        return;
      }

      showError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "No se pudo eliminar la conexión de WhatsApp.",
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setConnection(null);
    setError("");
    loadConnection();
  }, [open, loadConnection]);

  useEffect(() => {
    if (!open || !connection?.id || connected) return;

    const timer = setInterval(() => {
      checkStatus();
    }, 4000);

    return () => clearInterval(timer);
  }, [open, connection?.id, connected, checkStatus]);

  const handleClose = () => {
    setError("");
    setCreating(false);
    setChecking(false);
    setDeleting(false);
    setLoadingConnection(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background:
            "linear-gradient(135deg, rgba(10,18,36,1) 0%, rgba(26,33,54,1) 100%)",
          color: "#fff",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WhatsAppIcon />

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: "white" }}>
              Conexión WhatsApp
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.85, color: "white" }}>
              Vincula WhatsApp con tu tienda mediante ChatingBoot CRM.
            </Typography>
          </Box>

          <Box flex={1} />

          {connected && (
            <Chip
              color="success"
              label="Conectado"
              icon={<CheckCircleRoundedIcon />}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {connected && (
            <Alert severity="success">WhatsApp conectado correctamente.</Alert>
          )}

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Vigencia del complemento
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Chip
                  icon={<AccessTimeRoundedIcon />}
                  label={`Tiempo restante: ${remainingText}`}
                  color={isExpired ? "error" : "primary"}
                  variant="outlined"
                />

                <Chip
                  label={`Inicio: ${formatDate(addon?.fecha_inicio)}`}
                  variant="outlined"
                />

                <Chip
                  label={`Fin: ${formatDate(addon?.fecha_fin)}`}
                  variant="outlined"
                />

                {addon?.cantidad && (
                  <Chip
                    label={`Cantidad: ${addon.cantidad}`}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Registro de conexión
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                La conexión se genera automáticamente con el nombre de tu
                tienda.
              </Typography>

              <Divider flexItem />

              {loadingConnection ? (
                <Stack alignItems="center" spacing={1}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" color="text.secondary">
                    Cargando conexión actual...
                  </Typography>
                </Stack>
              ) : !connection ? (
                <>
                  <Alert
                    severity={isExpired ? "warning" : "info"}
                    sx={{ width: "100%" }}
                  >
                    {isExpired
                      ? "El complemento está vencido. No se puede generar una nueva conexión."
                      : "No hay una conexión registrada. Puedes generar una nueva conexión QR."}
                  </Alert>

                  <Button
                    variant="contained"
                    color="success"
                    startIcon={
                      creating ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <QrCode2RoundedIcon />
                      )
                    }
                    onClick={createConnection}
                    disabled={creating || isExpired}
                    sx={{ fontWeight: 800 }}
                  >
                    {creating ? "Generando..." : "Generar conexión QR"}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {connection.name}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    justifyContent="center"
                    useFlexGap
                  >
                    <Chip
                      color={connected ? "success" : "warning"}
                      label={
                        connected
                          ? "CONNECTED"
                          : connection.status || "Esperando QR"
                      }
                    />

                    {connection.number && (
                      <Chip
                        label={`Número: ${connection.number}`}
                        variant="outlined"
                      />
                    )}

                    {connection.external_id && (
                      <Chip
                        label={`Sesión: ${connection.external_id}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  {connected ? (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                      <CheckCircleRoundedIcon
                        color="success"
                        sx={{ fontSize: 80, mb: 1 }}
                      />

                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        WhatsApp conectado
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        La sesión quedó vinculada correctamente.
                      </Typography>
                    </Box>
                  ) : connection.qrcode ? (
                    <>
                      <QRCodeCanvas value={connection.qrcode} size={260} />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Escanea este código desde WhatsApp &gt; Dispositivos
                        vinculados.
                      </Typography>
                    </>
                  ) : (
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={30} />
                      <Typography variant="body2" color="text.secondary">
                        Preparando código QR...
                      </Typography>
                    </Stack>
                  )}

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    flexWrap="wrap"
                    justifyContent="center"
                  >
                    {!connected && (
                      <Button
                        variant="outlined"
                        startIcon={<RefreshRoundedIcon />}
                        onClick={checkStatus}
                        disabled={checking}
                      >
                        {checking ? "Consultando..." : "Actualizar estado"}
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={
                        deleting ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <DeleteOutlineRoundedIcon />
                        )
                      }
                      onClick={deleteConnection}
                      disabled={deleting}
                    >
                      {deleting ? "Eliminando..." : "Eliminar conexión"}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={loadConnection} disabled={loadingConnection}>
          Recargar
        </Button>

        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
