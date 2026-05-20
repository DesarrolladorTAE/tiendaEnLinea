import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CancelIcon from "@mui/icons-material/Cancel";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import axiosClientPOS from "../config/axiosClientPOS";

import ModalTicketVenta from "./ModalTicketVenta";
import ModalDetallesVenta from "./ModalDetallesVenta";
import ModalCancelarVenta from "./ModalCancelarVenta";
import ModalDevolverVenta from "./ModalDevolverVenta";
import ModalClienteVenta from "./ModalClienteVenta";

import HistorialPOSFilters from "./HistorialPOSFilters";
import HistorialPOSResumen from "./HistorialPOSResumen";

const hoyISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const LABELS_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "T. crédito",
  td: "T. débito",
};

const etiquetaPagoVenta = (v) => {
  if (v?.payment_label) return v.payment_label;

  const pagos = Array.isArray(v?.payment_methods) ? v.payment_methods : [];
  if (!pagos.length) return "—";

  return pagos
    .map((p) => `${LABELS_PAGO[p.method] || p.method} ${money(p.total)}`)
    .join(" + ");
};

const parseFechaLocal = (value) => {
  if (!value) return null;

  const dateOnly = String(value).slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const formatFecha = (value) => {
  try {
    const fecha = parseFechaLocal(value);
    if (!fecha) return "—";

    return format(fecha, "d 'de' MMM yyyy", {
      locale: es,
    });
  } catch {
    return "—";
  }
};

const formatFechaLarga = (value) => {
  try {
    const fecha = parseFechaLocal(value);
    if (!fecha) return "Sin fecha";

    return format(fecha, "d 'de' MMMM 'del' yyyy", {
      locale: es,
    });
  } catch {
    return "Sin fecha";
  }
};

const fechaSoloDia = (value) => {
  if (!value) return "";

  const fecha = new Date(value);

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isPendiente = (row) => {
  const status = String(
    row?.estadoRaw || row?.venta?.status || "",
  ).toLowerCase();
  return status === "open" || status === "credit";
};

const getColorByType = (type, estado) => {
  const status = String(estado || "").toLowerCase();

  if (status === "open" || status === "credit") return "warning";
  if (status === "cancelled" || status === "partially_cancelled")
    return "error";
  if (status === "devuelta" || status === "devuelta_parcial") return "info";
  if (status === "credit_paid") return "primary";

  return "success";
};

const getBgByType = (type, estado) => {
  const status = String(estado || "").toLowerCase();

  if (status === "open" || status === "credit") return "#fff3e0";
  if (status === "cancelled" || status === "partially_cancelled")
    return "#ffebee";
  if (status === "devuelta" || status === "devuelta_parcial") return "#e3f2fd";
  if (status === "credit_paid") return "#e8eaf6";

  return "#e8f5e9";
};

const getTypeLabel = (type, estado) => {
  const status = String(estado || "").toLowerCase();

  if (status === "open") return "Pendiente";
  if (status === "credit") return "Crédito";
  if (status === "credit_paid") return "Crédito pagado";
  if (status === "cancelled") return "Cancelada";
  if (status === "partially_cancelled") return "Cancelada parcial";
  if (status === "devuelta") return "Devuelta";
  if (status === "devuelta_parcial") return "Devolución parcial";

  return "Venta";
};

const getBorderColor = (color) => {
  if (color === "warning") return "warning.light";
  if (color === "success") return "success.light";
  if (color === "info") return "info.light";
  if (color === "error") return "error.light";
  return "divider";
};

const agruparPorDia = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    const key = fechaSoloDia(row.fecha);
    if (!key) return;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      date,
      label: formatFechaLarga(date),
      rows: items,
      total: items.length,
    }));
};

function DayPagination({ groups, page, setPage }) {
  const totalPages = groups.length;
  const current = groups[page];

  if (!totalPages) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Box>
          <Typography fontWeight={800}>
            {current?.label || "Sin fecha"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Página {page + 1} de {totalPages} · {current?.total || 0} registros
            de este día
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            disabled={page <= 0}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Anterior
          </Button>

          <Button
            size="small"
            variant="contained"
            endIcon={<ChevronRightIcon />}
            disabled={page >= totalPages - 1}
            onClick={() =>
              setPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Siguiente
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function HistorialPOSSimple({ cambiarVista, posLocationId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(true);

  const [modoConsulta, setModoConsulta] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tipoPago, setTipoPago] = useState("");

  const [puntoVenta, setPuntoVenta] = useState("");
  const [trabajadorId, setTrabajadorId] = useState("");

  const [ventas, setVentas] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [cancelaciones, setCancelaciones] = useState([]);

  const [paginaDia, setPaginaDia] = useState(0);

  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);

  const [openModalCliente, setOpenModalCliente] = useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [ventaClienteSeleccionada, setVentaClienteSeleccionada] =
    useState(null);

  const handleFiltrar = async () => {
    setLoading(true);

    const params = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    if (tipoPago) params.payment_method = tipoPago;

    try {
      const { data } = await axiosClientPOS.get("/ventas/mis-ventas", {
        params,
      });

      setVentas(
        Array.isArray(data?.ventas)
          ? data.ventas
          : Array.isArray(data)
            ? data
            : [],
      );

      setDevoluciones(
        Array.isArray(data?.devoluciones) ? data.devoluciones : [],
      );
      setCancelaciones(
        Array.isArray(data?.cancelaciones) ? data.cancelaciones : [],
      );
      setPaginaDia(0);
    } catch (error) {
      console.error("Error al consultar historial:", error);
      setVentas([]);
      setDevoluciones([]);
      setCancelaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFiltrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiarFiltros = () => {
    const h = hoyISO();
    setModoConsulta("dia");
    setFechaInicio(h);
    setFechaFin(h);
    setTipoPago("");
    setPuntoVenta("");
    setTrabajadorId("");
    setPaginaDia(0);
    setTimeout(() => handleFiltrar(), 0);
  };

  const abrirModalTicket = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalTicketOpen(true);
  };

  const abrirModalDetalles = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalDetallesOpen(true);
  };

  const abrirModalCancelar = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalCancelarOpen(true);
  };

  const abrirModalDevolver = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalDevolverOpen(true);
  };

  const abrirModalCliente = (row) => {
    const venta = row?.venta || null;
    if (!venta?.id) return;

    setVentaClienteSeleccionada(venta);
    setOpenModalCliente(true);
  };

  const cerrarModalCliente = () => {
    setOpenModalCliente(false);
    setVentaClienteSeleccionada(null);
  };

  const devolucionesRows = useMemo(() => {
    return devoluciones.map((r) => ({
      id: `dev-${r.id}`,
      rowType: "devolucion",
      fecha: r.fecha || r.created_at,
      venta_id: r.sale?.id || r.sale_id || r.id,
      venta: r.sale || null,
      total: Number(r?.importe_afectado ?? r?.sale?.total_amount ?? 0),
      pago: r.sale ? etiquetaPagoVenta(r.sale) : "—",
      motivo: r.motivo || "—",
      estado: r.tipo || "Devuelta",
      estadoRaw: r.tipo || "devolucion",
      cliente: r.sale?.client || null,
    }));
  }, [devoluciones]);

const cancelacionesRows = useMemo(() => {
  return cancelaciones.map((r) => {
    const tipoCancelacion = String(r?.tipo || "").toLowerCase();

    const statusCancelacion =
      tipoCancelacion.includes("parcial") ||
      tipoCancelacion.includes("partial")
        ? "partially_cancelled"
        : "cancelled";

    return {
      id: `cancel-${r.id}`,
      rowType: "cancelacion",
      fecha: r.fecha || r.created_at,
      venta_id: r.sale?.id || r.sale_id || r.id,
      venta: {
        ...(r.sale || {}),
        status: statusCancelacion,
      },
      total: Number(r?.importe_afectado ?? r?.sale?.total_amount ?? 0),
      pago: r.sale ? etiquetaPagoVenta(r.sale) : "—",
      motivo: r.motivo || "—",
      estado:
        statusCancelacion === "partially_cancelled"
          ? "Cancelada parcial"
          : "Cancelada",
      estadoRaw: statusCancelacion,
      tipoCancelacion: r.tipo || "total",
      cliente: r.sale?.client || null,
    };
  });
}, [cancelaciones]);

  const ventasRows = useMemo(() => {
    return ventas.map((v) => ({
      id: `venta-${v.id}`,
      rowType: "venta",
      fecha: v.created_at,
      venta_id: v.id,
      venta: v,
      total: Number(v.total_amount || 0),
      pago: etiquetaPagoVenta(v),
      motivo: "—",
      estado:
        v.status === "open"
          ? "Pendiente"
          : v.status === "cancelled"
            ? "Cancelada"
            : v.status === "partially_cancelled"
              ? "Parcial"
              : v.status === "devuelta"
                ? "Devuelta"
                : v.status === "paid"
                  ? "Pagada"
                  : v.status || "—",
      estadoRaw: v.status,
      cliente: v.client || null,
    }));
  }, [ventas]);

const historialRows = useMemo(() => {
  const idsConMovimiento = new Set([
    ...devolucionesRows.map((r) => Number(r.venta_id)),
    ...cancelacionesRows.map((r) => Number(r.venta_id)),
  ]);

  const ventasLimpias = ventasRows.filter((v) => {
    const status = String(v.estadoRaw || "").toLowerCase();

    if (status === "open" || status === "credit") {
      return true;
    }

    return !idsConMovimiento.has(Number(v.venta_id));
  });

  return [
    ...ventasLimpias,
    ...devolucionesRows,
    ...cancelacionesRows,
  ].sort((a, b) => {
    const fa = new Date(a.fecha || 0).getTime();
    const fb = new Date(b.fecha || 0).getTime();
    return fb - fa;
  });
}, [ventasRows, devolucionesRows, cancelacionesRows]);

  const historialRowsParaResumen = useMemo(() => {
    return historialRows.filter((row) => !isPendiente(row));
  }, [historialRows]);

  const historialGroups = useMemo(
    () => agruparPorDia(historialRows),
    [historialRows],
  );

  const rowsPaginaActual = historialGroups[paginaDia]?.rows || [];

  useEffect(() => {
    setPaginaDia(0);
  }, [fechaInicio, fechaFin, tipoPago, modoConsulta]);

  useEffect(() => {
    if (paginaDia > historialGroups.length - 1 && historialGroups.length > 0) {
      setPaginaDia(0);
    }
  }, [paginaDia, historialGroups.length]);

  const trabajadores = useMemo(() => [], []);

  const HeaderActions = () => (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.2}
      alignItems="center"
      justifyContent="center"
      sx={{ px: { xs: 1.2, md: 2 }, pt: 1.5, pb: 1 }}
    >
      <Button
        variant="contained"
        color="success"
        startIcon={<ShoppingCartIcon />}
        onClick={() => cambiarVista("venta")}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 700,
          width: { xs: "100%", md: "auto" },
        }}
      >
        Ventas
      </Button>

      <Button
        variant="contained"
        color="warning"
        startIcon={<ReceiptLongIcon />}
        onClick={() => cambiarVista("facturas")}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 700,
          width: { xs: "100%", md: "auto" },
        }}
      >
        Facturas
      </Button>

      <Button
        variant="outlined"
        color="success"
        startIcon={<DashboardIcon />}
        onClick={() => cambiarVista("menu")}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 700,
          width: { xs: "100%", md: "auto" },
        }}
      >
        Regresar al panel
      </Button>
    </Stack>
  );

  const renderCliente = (cliente) => {
    if (!cliente) {
      return (
        <Typography variant="body2" color="text.secondary">
          Sin cliente
        </Typography>
      );
    }

    return (
      <Stack spacing={0.2}>
        <Typography variant="body2" fontWeight={700}>
          {cliente.nombre_alias || "Cliente"}
        </Typography>
        {cliente.telefono ? (
          <Typography variant="caption" color="text.secondary">
            {cliente.telefono}
          </Typography>
        ) : null}
      </Stack>
    );
  };

  const renderActions = (row) => {
    const ventaId = row.venta_id;
    const isVenta = row.rowType === "venta";

    return (
      <Stack
        direction="row"
        spacing={0.3}
        justifyContent="center"
        flexWrap="wrap"
      >
        <Tooltip title="Ticket">
          <IconButton
            size="small"
            color="primary"
            onClick={() => abrirModalTicket(ventaId)}
          >
            <PrintIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Detalles">
          <IconButton
            size="small"
            color="secondary"
            onClick={() => abrirModalDetalles(ventaId)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Cliente">
          <IconButton
            size="small"
            color="inherit"
            onClick={() => abrirModalCliente(row)}
          >
            <PersonOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {isVenta ? (
          <>
            <Tooltip title="Cancelar">
              <IconButton
                size="small"
                color="error"
                onClick={() => abrirModalCancelar(ventaId)}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Devolver">
              <IconButton
                size="small"
                color="info"
                onClick={() => abrirModalDevolver(ventaId)}
              >
                <AutorenewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : null}
      </Stack>
    );
  };

  const DesktopTable = ({ rows }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#fafafa" }}>
              <TableCell>
                <strong>Tipo</strong>
              </TableCell>
              <TableCell>
                <strong>Venta</strong>
              </TableCell>
              <TableCell>
                <strong>Fecha</strong>
              </TableCell>
              <TableCell>
                <strong>Total</strong>
              </TableCell>
              <TableCell>
                <strong>Cliente</strong>
              </TableCell>
              <TableCell>
                <strong>Pago</strong>
              </TableCell>
              <TableCell>
                <strong>Estado / Motivo</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const status = String(
                row.estadoRaw || row.venta?.status || "",
              ).toLowerCase();
              const pendiente = isPendiente(row);
              const color = getColorByType(row.rowType, status);
              const bg = getBgByType(row.rowType, status);

              return (
                <TableRow key={row.id} hover sx={{ bgcolor: bg }}>
                  <TableCell>
                    <Chip
                      size="small"
                      color={color}
                      label={getTypeLabel(row.rowType, status)}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>

                  <TableCell>#{row.venta_id}</TableCell>
                  <TableCell>{formatFecha(row.fecha)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {money(row.total)}
                  </TableCell>
                  <TableCell>{renderCliente(row.cliente)}</TableCell>

                  <TableCell>
                    <Typography
                      variant="body2"
                      title={row.pago}
                      sx={{
                        maxWidth: 220,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.pago}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.estado || "—"}
                      </Typography>

                      {pendiente ? (
                        <Typography
                          variant="caption"
                          color="warning.dark"
                          fontWeight={800}
                        >
                          Se paga en el módulo de ventas pendientes
                        </Typography>
                      ) : null}

                      {row.motivo && row.motivo !== "—" ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          title={row.motivo}
                          sx={{
                            maxWidth: 210,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.motivo}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>

                  <TableCell align="center">{renderActions(row)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );

  const MobileCards = ({ rows }) => (
    <Stack spacing={1.2}>
      {rows.map((row) => {
        const pendiente = isPendiente(row);
        const color = pendiente
          ? "warning"
          : getColorByType(row.rowType, row.estadoRaw);
        const bg = pendiente
          ? "#fff3e0"
          : getBgByType(row.rowType, row.estadoRaw);

        return (
          <Card
            key={row.id}
            sx={{
              borderRadius: 3,
              bgcolor: bg,
              border: "1px solid",
              borderColor: getBorderColor(color),
            }}
          >
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Chip
                    size="small"
                    color={color}
                    label={
                      pendiente
                        ? "Pendiente"
                        : getTypeLabel(row.rowType, row.estadoRaw)
                    }
                    sx={{ fontWeight: 700 }}
                  />

                  <Typography variant="caption" color="text.secondary">
                    {formatFecha(row.fecha)}
                  </Typography>
                </Stack>

                <Typography variant="body2" fontWeight={800}>
                  Venta #{row.venta_id}
                </Typography>

                <Typography variant="h6" fontWeight={800}>
                  {money(row.total)}
                </Typography>

                <Box>{renderCliente(row.cliente)}</Box>

                <Typography variant="body2">{row.pago}</Typography>

                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {row.estado || "—"}
                  </Typography>

                  {pendiente ? (
                    <Typography
                      variant="caption"
                      color="warning.dark"
                      fontWeight={800}
                      display="block"
                    >
                      Se paga en el módulo de ventas pendientes
                    </Typography>
                  ) : null}

                  {row.motivo && row.motivo !== "—" ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Motivo: {row.motivo}
                    </Typography>
                  ) : null}
                </Box>

                <Stack direction="row" justifyContent="flex-end">
                  {renderActions(row)}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );

  return (
    <>
      <Box sx={{ pb: 2 }}>
        <HeaderActions />

        <HistorialPOSFilters
          sucursalLabel="Sucursal #6"
          puntoVenta={puntoVenta}
          setPuntoVenta={setPuntoVenta}
          trabajadores={trabajadores}
          trabajadorId={trabajadorId}
          setTrabajadorId={setTrabajadorId}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          modoConsulta={modoConsulta}
          setModoConsulta={setModoConsulta}
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          onApply={handleFiltrar}
          onClear={limpiarFiltros}
          loading={loading}
        />

        <Box sx={{ px: { xs: 1.2, md: 2 } }}>
          <HistorialPOSResumen rows={historialRows} />

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : historialRows.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" fontWeight={800}>
                Sin registros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No se encontraron ventas, devoluciones ni cancelaciones.
              </Typography>
            </Paper>
          ) : (
            <>
              <DayPagination
                groups={historialGroups}
                page={paginaDia}
                setPage={setPaginaDia}
              />

              {isMobile ? (
                <MobileCards rows={rowsPaginaActual} />
              ) : (
                <DesktopTable rows={rowsPaginaActual} />
              )}
            </>
          )}
        </Box>
      </Box>

      <ModalTicketVenta
        open={modalTicketOpen}
        onClose={() => setModalTicketOpen(false)}
        ventaId={ventaSeleccionada}
        posLocationId={posLocationId}
      />

      <ModalDetallesVenta
        open={modalDetallesOpen}
        onClose={() => setModalDetallesOpen(false)}
        ventaId={ventaSeleccionada}
      />

      <ModalCancelarVenta
        open={modalCancelarOpen}
        onClose={() => setModalCancelarOpen(false)}
        ventaId={ventaSeleccionada}
        onSuccess={() => {
          setModalCancelarOpen(false);
          handleFiltrar();
        }}
      />

      <ModalDevolverVenta
        open={modalDevolverOpen}
        onClose={() => setModalDevolverOpen(false)}
        ventaId={ventaSeleccionada}
        onSuccess={() => {
          setModalDevolverOpen(false);
          handleFiltrar();
        }}
      />

      <ModalClienteVenta
        open={openModalCliente}
        onClose={cerrarModalCliente}
        ventaId={ventaClienteSeleccionada?.id ?? null}
        clienteActualId={ventaClienteSeleccionada?.client_id ?? null}
        posLocationId={posLocationId}
        onSuccess={() => {
          cerrarModalCliente();
          handleFiltrar();
        }}
      />
    </>
  );
}
