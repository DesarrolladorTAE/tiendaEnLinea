// src/components/admin/NotificacionesHistorial.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Avatar,
  Stack,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";

import axios from "../../axiosConfig";
import ModalRecargaPendiente from "./ModalRecargaPendiente";

import Swal from "sweetalert2";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const NotificacionesHistorial = ({ soloSolicitudes = false }) => {
  const [mensajes, setMensajes] = useState([]);
  const [recargaSeleccionada, setRecargaSeleccionada] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const errMsg = (err) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Ocurrió un error inesperado";

  const cargarMensajes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/notificaciones");
      let data = res.data || [];

      if (soloSolicitudes) {
        const pendientesRes = await axios.get("/admin/recargas-pendientes");
        const idsPendientes = (pendientesRes.data || []).map((r) => r.id);

        data = data.filter(
          (m) =>
            m.mensaje?.toLowerCase().includes("nueva solicitud") &&
            idsPendientes.includes(m.transaccion_id)
        );
      }

      setMensajes(data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al cargar notificaciones",
        text: errMsg(err),
        confirmButtonText: "Ok",
      });
    } finally {
      setLoading(false);
    }
  };

  const verTransaccion = async (transaccion_id) => {
    if (!transaccion_id) return;
    if (loadingTx) return;

    setLoadingTx(true);
    try {
      const res = await axios.get("/admin/recargas-pendientes");
      const encontrada = (res.data || []).find((r) => r.id === transaccion_id);

      if (!encontrada) {
        return Swal.fire({
          icon: "warning",
          title: "No encontrada",
          text: "No se encontró la transacción en recargas pendientes.",
          confirmButtonText: "Ok",
        });
      }

      setRecargaSeleccionada({
        ...encontrada,
        user: encontrada.user || {},
        status: encontrada.status || "pendiente",
      });
      setDialogOpen(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo abrir la solicitud",
        text: errMsg(err),
        confirmButtonText: "Ok",
      });
    } finally {
      setLoadingTx(false);
    }
  };

  const confirmarRecarga = async (id) => {
    const c = await Swal.fire({
      icon: "question",
      title: "Confirmar recarga",
      text: "Se aplicará el saldo al usuario. ¿Deseas continuar?",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!c.isConfirmed) return;

    try {
      await axios.post(`/admin/recargas/${id}/confirmar`);
      await Swal.fire({
        icon: "success",
        title: "Confirmada ✅",
        text: "Recarga confirmada y saldo aplicado.",
        confirmButtonText: "Listo",
      });
      setDialogOpen(false);
      cargarMensajes();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al confirmar",
        text: errMsg(err),
        confirmButtonText: "Ok",
      });
    }
  };

  const rechazarRecarga = async (id) => {
    const c = await Swal.fire({
      icon: "warning",
      title: "Rechazar recarga",
      text: "La recarga quedará rechazada. ¿Deseas continuar?",
      showCancelButton: true,
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!c.isConfirmed) return;

    try {
      await axios.post(`/admin/recargas/${id}/rechazar`);
      await Swal.fire({
        icon: "success",
        title: "Rechazada",
        text: "La recarga fue rechazada.",
        confirmButtonText: "Ok",
      });
      setDialogOpen(false);
      cargarMensajes();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al rechazar",
        text: errMsg(err),
        confirmButtonText: "Ok",
      });
    }
  };

  useEffect(() => {
    cargarMensajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloSolicitudes]);

  const titulo = soloSolicitudes
    ? "📝 Solicitudes de Recarga"
    : "🔔 Historial de Notificaciones";

  const rows = useMemo(() => mensajes, [mensajes]);

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <NotificationsActiveRoundedIcon />
            {titulo}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            {soloSolicitudes
              ? "Solo solicitudes aún pendientes."
              : "Registro de eventos y mensajes del sistema."}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`${rows.length} registro(s)`}
            sx={{
              fontWeight: 800,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
            }}
          />
          <Tooltip title="Actualizar">
            <span>
              <IconButton
                onClick={cargarMensajes}
                disabled={loading}
                sx={{
                  borderRadius: 999,
                  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                }}
              >
                {loading ? (
                  <CircularProgress size={18} />
                ) : (
                  <RefreshRoundedIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2, opacity: 0.7 }} />

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderColor: alpha(theme.palette.divider, 0.8),
          }}
        >
          <CircularProgress size={18} />
          <Typography sx={{ fontWeight: 800 }}>Cargando…</Typography>
          <Typography sx={{ color: "text.secondary" }}>
            obteniendo notificaciones
          </Typography>
        </Paper>
      ) : rows.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" py={6}>
          🚫 Aún no hay registros para mostrar
        </Typography>
      ) : isMobile ? (
        /* ✅ MOBILE: Cards */
        <Stack spacing={1.6} sx={{ pb: 1 }}>
          {rows.map((m, idx) => (
            <MotionBox
              key={m.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: idx * 0.02 }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  p: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.background.paper,
                    0.92
                  )} 0%, ${alpha(theme.palette.background.paper, 0.72)} 100%)`,
                  backdropFilter: "blur(10px)",
                  boxShadow: `0 16px 50px ${alpha("#000", 0.08)}`,
                }}
              >
                <Stack direction="row" spacing={1.4} alignItems="center" mb={1}>
                  <Avatar sx={{ bgcolor: "primary.main", fontWeight: 900 }}>
                    {m.user?.name?.[0] || "U"}
                  </Avatar>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 900 }}>
                      {m.user?.name} {m.user?.apellidos}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(m.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={m.transaccion_id ? "Solicitud" : "Info"}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 999,
                      bgcolor: alpha(
                        m.transaccion_id
                          ? theme.palette.warning.main
                          : theme.palette.info.main,
                        0.14
                      ),
                      color: m.transaccion_id
                        ? theme.palette.warning.main
                        : theme.palette.info.main,
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 1.2, opacity: 0.7 }} />

                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {m.mensaje}
                </Typography>

                <Stack direction="row" spacing={1} mt={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={
                      loadingTx ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <VisibilityRoundedIcon />
                      )
                    }
                    disabled={!m.transaccion_id || loadingTx}
                    onClick={() => verTransaccion(m.transaccion_id)}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 900,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: `0 14px 36px ${alpha(
                        theme.palette.primary.main,
                        0.22
                      )}`,
                    }}
                  >
                    Ver solicitud
                  </Button>
                </Stack>
              </Paper>
            </MotionBox>
          ))}
        </Stack>
      ) : (
        /* ✅ DESKTOP: Tabla */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.78)} 100%)`,
            backdropFilter: "blur(10px)",
            boxShadow: `0 16px 50px ${alpha("#000", 0.08)}`,
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 900,
                    color: theme.palette.text.primary,
                    background: alpha(theme.palette.primary.main, 0.06),
                  },
                }}
              >
                <TableCell>Usuario</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Mensaje</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((m, idx) => (
                <TableRow
                  key={m.id || idx}
                  hover
                  sx={{
                    "& td": { borderColor: alpha(theme.palette.divider, 0.6) },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar sx={{ bgcolor: "primary.main", fontWeight: 900 }}>
                        {m.user?.name?.[0] || "U"}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>
                          {m.user?.name} {m.user?.apellidos}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {m.user?.id ?? "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(m.created_at).toLocaleString()}
                  </TableCell>

                  <TableCell sx={{ maxWidth: 760 }}>
                    <Typography
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.mensaje}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        loadingTx ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <VisibilityRoundedIcon />
                        )
                      }
                      disabled={!m.transaccion_id || loadingTx}
                      onClick={() => verTransaccion(m.transaccion_id)}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 900,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      }}
                    >
                      Ver solicitud
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ModalRecargaPendiente
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        recarga={recargaSeleccionada}
        onConfirmar={confirmarRecarga}
        onRechazar={rechazarRecarga}
      />
    </>
  );
};

export default NotificacionesHistorial;