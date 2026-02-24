// src/components/admin/ModalRecargaPendiente.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ZoomOutMapRoundedIcon from "@mui/icons-material/ZoomOutMapRounded";

import Swal from "sweetalert2";
import { motion } from "framer-motion";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MotionPaper = motion(Paper);

const blurActive = () => {
  try {
    const el = document?.activeElement;
    if (el && typeof el.blur === "function") el.blur();
  } catch {}
};

const moneyMX = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "$0.00";
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

const fullName = (u) => {
  const last =
    u?.apellidos ||
    u?.last_name ||
    u?.lastname ||
    u?.surname ||
    [u?.paternal_last_name, u?.maternal_last_name].filter(Boolean).join(" ");
  return [u?.name, last].filter(Boolean).join(" ").trim() || "Sin nombre";
};

const getStatusMeta = (status) => {
  const normalized = String(status || "").trim().toLowerCase();

  if (["exitosa", "confirmado", "confirmada"].includes(normalized)) {
    return { label: "Confirmado", color: "success", icon: <CheckCircleIcon /> };
  }
  if (["rechazado", "rechazada"].includes(normalized)) {
    return { label: "Rechazado", color: "error", icon: <CancelIcon /> };
  }
  if (["pendiente"].includes(normalized)) {
    return { label: "Pendiente", color: "warning", icon: <HourglassEmptyIcon /> };
  }
  return {
    label: `Estado: ${normalized || "No disponible"}`,
    color: "default",
    icon: <InsertDriveFileIcon />,
  };
};

const PremiumField = ({ icon, label, value }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.1,
        alignItems: "flex-start",
        p: 1.3,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.92
        )} 0%, ${alpha(theme.palette.background.paper, 0.72)} 100%)`,
        backdropFilter: "blur(10px)",
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.2,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.primary.main,
          flex: "0 0 auto",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 900, mt: 0.2, wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

const ModalRecargaPendiente = ({ open, onClose, recarga, onConfirmar, onRechazar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loadingAction, setLoadingAction] = useState(false);
  const [scalePct, setScalePct] = useState(100); // ✅ aquí guardamos el zoom

  const safeRecarga = recarga ?? {};
  const safeUser = safeRecarga.user ?? {};

  const statusMeta = useMemo(
    () => getStatusMeta(safeRecarga?.status),
    [safeRecarga?.status]
  );

  const comprobanteURL = String(safeRecarga.comprobante || "");
  const comprobanteLower = comprobanteURL.toLowerCase();
  const esImagen = /\.(png|jpe?g|gif|webp)$/i.test(comprobanteLower);
  const esPDF = comprobanteLower.endsWith(".pdf");

  const fechaValida =
    safeRecarga?.fecha_envio && !isNaN(Date.parse(safeRecarga.fecha_envio))
      ? new Date(safeRecarga.fecha_envio).toLocaleString()
      : "Fecha no disponible";

  const cerrar = () => {
    blurActive();
    onClose?.();
  };

  const handleConfirmar = async () => {
    if (loadingAction || !safeRecarga?.id) return;
    blurActive();

    const res = await Swal.fire({
      icon: "question",
      title: "Confirmar recarga",
      text: "Se aplicará el saldo al usuario. ¿Deseas continuar?",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    setLoadingAction(true);
    try {
      await onConfirmar?.(safeRecarga.id);
      blurActive();
      await Swal.fire({
        icon: "success",
        title: "Confirmada ✅",
        text: "Recarga confirmada.",
        timer: 1100,
        showConfirmButton: false,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRechazar = async () => {
    if (loadingAction || !safeRecarga?.id) return;
    blurActive();

    const res = await Swal.fire({
      icon: "warning",
      title: "Rechazar recarga",
      text: "La recarga quedará rechazada. ¿Deseas continuar?",
      showCancelButton: true,
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    setLoadingAction(true);
    try {
      await onRechazar?.(safeRecarga.id);
      blurActive();
      await Swal.fire({
        icon: "success",
        title: "Rechazada",
        text: "La recarga fue rechazada.",
        timer: 1100,
        showConfirmButton: false,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      keepMounted
      disableRestoreFocus
      disableEnforceFocus
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          overflow: "hidden",
          border: isMobile ? "none" : `1px solid ${alpha(theme.palette.divider, 0.65)}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.92
          )} 0%, ${alpha(theme.palette.background.paper, 0.72)} 100%)`,
          backdropFilter: "blur(12px)",
          boxShadow: isMobile ? "none" : `0 22px 80px ${alpha("#000", 0.22)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          p: { xs: 1.6, md: 2.2 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          background: `radial-gradient(900px 240px at 20% 0%, ${alpha(
            theme.palette.primary.main,
            0.16
          )} 0%, transparent 60%)`,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 950, letterSpacing: -0.3, fontSize: 18 }}>
            📄 Revisión de Recarga Manual
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8, flexWrap: "wrap" }}>
            <Chip
              icon={statusMeta.icon}
              label={statusMeta.label}
              variant="outlined"
              color={statusMeta.color}
              sx={{ fontWeight: 900, borderRadius: 999 }}
            />
            <Chip
              label={moneyMX(safeRecarga?.monto)}
              icon={<PaidRoundedIcon />}
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                color: theme.palette.secondary.main,
              }}
            />
            {safeRecarga?.referencia ? (
              <Chip
                label={`Ref: ${safeRecarga.referencia}`}
                icon={<FingerprintRoundedIcon />}
                sx={{
                  fontWeight: 900,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  color: theme.palette.info.main,
                  maxWidth: "100%",
                }}
              />
            ) : null}
          </Stack>
        </Box>

        <Tooltip title="Cerrar">
          <IconButton
            onClick={cerrar}
            sx={{
              borderRadius: 999,
              border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.55),
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.6, md: 2.4 }, pb: isMobile ? 10 : 2.4 }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          divider={
            <Divider
              orientation={isMobile ? "horizontal" : "vertical"}
              flexItem
              sx={{ opacity: 0.7 }}
            />
          }
        >
          <Box flex={1}>
            <MotionPaper
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
                background: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography sx={{ fontWeight: 950, mb: 1.5 }}>👤 Información</Typography>
              <Stack spacing={1.3}>
                <PremiumField
                  icon={<PersonRoundedIcon fontSize="small" />}
                  label="Usuario"
                  value={fullName(safeUser)}
                />
                <PremiumField
                  icon={<PaidRoundedIcon fontSize="small" />}
                  label="Monto"
                  value={moneyMX(safeRecarga?.monto)}
                />
                <PremiumField
                  icon={<FingerprintRoundedIcon fontSize="small" />}
                  label="Referencia"
                  value={safeRecarga?.referencia || "—"}
                />
                <PremiumField
                  icon={<CalendarMonthRoundedIcon fontSize="small" />}
                  label="Fecha"
                  value={fechaValida}
                />
              </Stack>
            </MotionPaper>
          </Box>

          <Box flex={1} minWidth={isMobile ? "100%" : 340}>
            <MotionPaper
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut", delay: 0.02 }}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
                background: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: "blur(10px)",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.2}>
                <Typography sx={{ fontWeight: 950 }}>🧾 Comprobante</Typography>

                {safeRecarga?.comprobante ? (
                  <Tooltip title="Abrir en nueva pestaña">
                    <IconButton
                      component="a"
                      href={safeRecarga.comprobante}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderRadius: 999,
                        border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                      }}
                    >
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>

              {esImagen && (
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    background: `linear-gradient(180deg, ${alpha(
                      theme.palette.background.paper,
                      0.6
                    )} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                  }}
                >
                  <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={6}
                    centerOnInit
                    limitToBounds
                    wheel={{ step: 0.18 }}
                    pinch={{ step: 5 }}
                    doubleClick={{ mode: "zoomIn", step: 0.8 }}
                    onTransformed={({ state }) => {
                      // ✅ aquí SI existe `state`
                      const s = state?.scale ?? 1;
                      setScalePct(Math.round(s * 100));
                    }}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <Box sx={{ height: isMobile ? "58vh" : 440, width: "100%" }}>
                          <TransformComponent
                            wrapperStyle={{
                              width: "100%",
                              height: "100%",
                              touchAction: "none",
                            }}
                            contentStyle={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={safeRecarga.comprobante}
                              alt="Comprobante"
                              draggable={false}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                userSelect: "none",
                                pointerEvents: "none",
                              }}
                            />
                          </TransformComponent>
                        </Box>

                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{
                            p: 1,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            background: alpha(theme.palette.background.paper, 0.55),
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ZoomOutMapRoundedIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 900 }}>
                              {scalePct}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              (arrastra para moverte)
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Tooltip title="Alejar">
                              <IconButton size="small" onClick={zoomOut}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Reset">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  resetTransform();
                                  setScalePct(100);
                                }}
                              >
                                <RestartAltRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Acercar">
                              <IconButton size="small" onClick={zoomIn}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </>
                    )}
                  </TransformWrapper>
                </Box>
              )}

              {esPDF && (
                <Box
                  component="iframe"
                  src={safeRecarga.comprobante}
                  title="Comprobante PDF"
                  sx={{
                    width: "100%",
                    height: isMobile ? "62vh" : 440,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    overflow: "hidden",
                  }}
                />
              )}

              {!esImagen && !esPDF && safeRecarga?.comprobante && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 3,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
                    background: alpha(theme.palette.background.paper, 0.55),
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <InsertDriveFileIcon color="disabled" />
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>Archivo no visualizable</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ábrelo en una pestaña nueva para descargarlo.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {!safeRecarga?.comprobante && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  No hay comprobante adjunto.
                </Typography>
              )}
            </MotionPaper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 1.6, md: 2.4 },
          py: 1.6,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          background: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: "blur(12px)",
          position: isMobile ? "fixed" : "static",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
        }}
      >
        <Stack direction={isMobile ? "column" : "row"} spacing={1.2} sx={{ width: "100%" }}>
          <Button
            variant="outlined"
            color="error"
            disabled={loadingAction || !safeRecarga?.id}
            onClick={handleRechazar}
            fullWidth={isMobile}
            sx={{ borderRadius: 3, fontWeight: 950, py: 1.1 }}
            startIcon={
              loadingAction ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />
            }
          >
            Rechazar
          </Button>

          <Button
            variant="contained"
            color="success"
            disabled={loadingAction || !safeRecarga?.id}
            onClick={handleConfirmar}
            fullWidth={isMobile}
            sx={{
              borderRadius: 3,
              fontWeight: 950,
              py: 1.1,
              boxShadow: `0 14px 40px ${alpha(theme.palette.success.main, 0.22)}`,
            }}
            startIcon={
              loadingAction ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />
            }
          >
            Confirmar y aplicar saldo
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ModalRecargaPendiente;