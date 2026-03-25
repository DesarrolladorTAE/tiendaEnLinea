import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Stack,
  Button,
  Divider,
  TextField,
  IconButton,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Avatar,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon2 from "@mui/icons-material/Replay";
import HistoryIcon from "@mui/icons-material/History";

import axiosClientPOS from "../config/axiosClientPOS";
import axiosClient from "../config/axiosClient";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import ModalTicketVenta from "./ModalTicketVenta";
import ModalDetallesVenta from "./ModalDetallesVenta";
import ModalCancelarVenta from "./ModalCancelarVenta";
import ModalDevolverVenta from "./ModalDevolverVenta";
import HistorialPOSMobile from "./HistorialPOSMobile";

// -------------------- Helpers --------------------
const LABELS_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "Tarjeta de crédito",
  td: "Tarjeta de débito",
};

const ICONS_PAGO = {
  efectivo: <LocalAtmIcon />,
  transferencia: <AccountBalanceIcon />,
  tc: <CreditCardIcon />,
  td: <CreditScoreIcon />,
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const ES_ANULADA_TOTAL = (s) =>
  ["cancelled", "devuelta"].includes(String(s || "").toLowerCase());

const ES_CANCELADA = (s) =>
  ["cancelled", "devuelta", "partially_cancelled"].includes(
    String(s || "").toLowerCase()
  );

const pagosDeVenta = (v) => {
  if (Array.isArray(v?.payment_methods) && v.payment_methods.length) {
    return v.payment_methods;
  }
  if (v?.payment_method) {
    return [{ method: v.payment_method, total: Number(v.total_amount || 0) }];
  }
  return [];
};

const etiquetaPagoVenta = (v) => {
  if (v?.payment_label) return v.payment_label;
  const parts = pagosDeVenta(v).map(
    (p) => `${LABELS_PAGO[p.method] || p.method} ${money(p.total)}`
  );
  return parts.length ? parts.join(" + ") : "—";
};

const fechaSoloDia = (value) => String(value || "").slice(0, 10);

const textoDia = (value) => {
  if (!value) return "Sin fecha";
  return format(parseISO(fechaSoloDia(value)), "d 'de' MMMM 'del' yyyy", {
    locale: es,
  });
};

const agruparPorDia = (rows, getFecha) => {
  const map = new Map();

  rows.forEach((row) => {
    const raw = getFecha(row);
    const key = fechaSoloDia(raw);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(row);
  });

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      date,
      label: textoDia(date),
      rows: items,
      total: items.length,
    }));
};

// -------------------- Desktop UI --------------------
function DayPagination({ groups, page, setPage, label = "día" }) {
  const totalPages = groups.length;
  const current = groups[page];

  if (!totalPages) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 1.5,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          <Typography fontWeight={800}>
            {current?.label || "Sin fecha"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Página {page + 1} de {totalPages} · {current?.total || 0} registros de este {label}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Anterior
          </Button>

          <Button
            size="small"
            variant="contained"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Siguiente
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

const SummaryCard = ({ title, amount, count, avg, color = "default", hint }) => (
  <Card
    sx={{
      borderRadius: 3,
      height: "100%",
      border: "1px solid",
      borderColor:
        color === "success"
          ? "success.light"
          : color === "error"
            ? "error.light"
            : color === "info"
              ? "info.light"
              : "divider",
      background:
        color === "success"
          ? "rgba(46, 125, 50, .04)"
          : color === "error"
            ? "rgba(211, 47, 47, .04)"
            : color === "info"
              ? "rgba(25, 118, 210, .04)"
              : "inherit",
    }}
  >
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
        {money(amount)}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip size="small" color={color} variant="outlined" label={`# ${count}`} />
        <Chip size="small" color={color} variant="outlined" label={`Prom: ${money(avg)}`} />
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {hint}
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const BarRow = ({ label, right, percent }) => (
  <Stack spacing={0.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" noWrap title={label}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="bold">
        {right}
      </Typography>
    </Stack>
    <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, percent))} />
  </Stack>
);

const StatsList = ({ title, rows, total, limit = 6 }) => {
  const slice = rows.slice(0, limit);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {money(total)}
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        {slice.map((r) => (
          <BarRow
            key={r.key}
            label={`${r.label} · ${r.ventas} ventas`}
            right={money(r.total)}
            percent={(r.total / (total || 1)) * 100}
          />
        ))}
      </Stack>

      {rows.length > limit && (
        <Typography sx={{ mt: 1 }} variant="caption" color="text.secondary">
          Mostrando {limit} de {rows.length}
        </Typography>
      )}
    </Paper>
  );
};

const SalesTable = ({
  rows,
  fechaFallback,
  abrirTicket,
  abrirDetalles,
  cancelarVenta,
  devolverVenta,
}) => (
  <Box sx={{ maxHeight: 440, overflowY: "auto" }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
          <TableCell align="center"><strong>Folio</strong></TableCell>
          <TableCell align="center"><strong>Fecha</strong></TableCell>
          <TableCell align="center"><strong>Total</strong></TableCell>
          <TableCell align="center"><strong>Pago</strong></TableCell>
          <TableCell align="center"><strong>Categorías</strong></TableCell>
          <TableCell align="center"><strong>Estado</strong></TableCell>
          <TableCell align="center"><strong>Acciones</strong></TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((venta) => {
          const bg =
            venta.status === "cancelled"
              ? "#ffebee"
              : venta.status === "partially_cancelled"
                ? "#fff8e1"
                : venta.status === "devuelta"
                  ? "#e3f2fd"
                  : "inherit";

          return (
            <TableRow key={venta.id} hover sx={{ backgroundColor: bg }}>
              <TableCell align="center">#{venta.id}</TableCell>

              <TableCell align="center">
                {venta.created_at
                  ? format(
                    parseISO(venta.created_at.slice(0, 10)),
                    "d 'de' MMMM 'del' yyyy",
                    { locale: es }
                  )
                  : format(
                    parseISO(fechaFallback),
                    "d 'de' MMMM 'del' yyyy",
                    { locale: es }
                  )}
              </TableCell>

              <TableCell align="center">{money(venta.total_amount)}</TableCell>

              <TableCell align="center">
                {pagosDeVenta(venta).length ? (
                  <Tooltip
                    arrow
                    title={
                      <Box sx={{ p: 0.5 }}>
                        {pagosDeVenta(venta).map((p) => (
                          <Stack
                            key={`${venta.id}-${p.method}-${p.total}`}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {ICONS_PAGO[p.method] || null}
                            <Typography variant="caption">
                              {LABELS_PAGO[p.method] || p.method}: {money(p.total)}
                            </Typography>
                          </Stack>
                        ))}
                      </Box>
                    }
                  >
                    <Chip
                      size="small"
                      label={etiquetaPagoVenta(venta)}
                      variant="outlined"
                      sx={{ maxWidth: 240 }}
                    />
                  </Tooltip>
                ) : (
                  <Chip label="—" variant="outlined" size="small" />
                )}
              </TableCell>

              <TableCell align="center">
                <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                  {venta.categories?.length ? (
                    <>
                      {venta.categories.slice(0, 3).map((c) => (
                        <Chip key={c.id} size="small" variant="outlined" label={c.name} />
                      ))}
                      {venta.categories.length > 3 && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`+${venta.categories.length - 3}`}
                        />
                      )}
                    </>
                  ) : (
                    <Chip size="small" variant="outlined" label="Sin categoría" />
                  )}
                </Stack>
              </TableCell>

              <TableCell align="center">
                <Chip
                  size="small"
                  label={
                    venta.status === "cancelled"
                      ? "Cancelada"
                      : venta.status === "partially_cancelled"
                        ? "Parcial"
                        : venta.status === "devuelta"
                          ? "Devuelta"
                          : venta.status === "paid"
                            ? "Pagada"
                            : "—"
                  }
                  color={
                    venta.status === "cancelled"
                      ? "error"
                      : venta.status === "partially_cancelled"
                        ? "warning"
                        : venta.status === "devuelta"
                          ? "info"
                          : venta.status === "paid"
                            ? "success"
                            : "default"
                  }
                  variant={venta.status === "paid" ? "outlined" : "filled"}
                />
              </TableCell>

              <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Tooltip title="Imprimir / Ticket">
                    <IconButton color="primary" onClick={() => abrirTicket(venta.id)}>
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Detalles">
                    <IconButton color="secondary" onClick={() => abrirDetalles(venta.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>

                  {!ES_CANCELADA(venta.status) && (
                    <>
                      <Tooltip title="Cancelar venta">
                        <IconButton color="error" onClick={() => cancelarVenta(venta.id)}>
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Devolver venta">
                        <IconButton color="info" onClick={() => devolverVenta(venta.id)}>
                          <ReplayIcon2 />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Box>
);

const PaymentPicker = ({ stats, selected, onSelect }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
    {stats.rows.map((r) => {
      const value = r.key;
      const active = selected === value;

      return (
        <Chip
          key={value}
          clickable
          onClick={() => onSelect(value)}
          label={`${LABELS_PAGO[value] || value} · ${money(r.total)}`}
          icon={
            ICONS_PAGO[value] || (
              <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>
                {(LABELS_PAGO[value] || "?")[0]}
              </Avatar>
            )
          }
          color={active ? "primary" : "default"}
          variant={active ? "filled" : "outlined"}
          sx={{ borderRadius: 2 }}
        />
      );
    })}
  </Stack>
);

const SalesCardsGrid = ({ rows, abrirTicket, abrirDetalles }) => (
  <Grid container spacing={2}>
    {rows.map((v) => (
      <Grid item xs={12} md={6} lg={4} key={v.id}>
        <Card sx={{ borderRadius: 3, height: "100%" }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 1 }}
              gap={1}
            >
              <Stack spacing={0}>
                <Typography variant="subtitle2" color="text.secondary">
                  Folio
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  #{v.id}
                </Typography>
              </Stack>
              <Chip size="small" label={etiquetaPagoVenta(v)} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {v.created_at
                ? format(parseISO(v.created_at.slice(0, 10)), "d 'de' MMMM 'del' yyyy", {
                  locale: es,
                })
                : "Fecha no disponible"}
            </Typography>

            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              {money(v.total_amount)}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {v.categories?.length ? (
                <>
                  {v.categories.slice(0, 6).map((c) => (
                    <Chip key={c.id} size="small" variant="outlined" label={c.name} />
                  ))}
                  {v.categories.length > 6 && (
                    <Chip size="small" variant="outlined" label={`+${v.categories.length - 6}`} />
                  )}
                </>
              ) : (
                <Chip size="small" variant="outlined" label="Sin categoría" />
              )}
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="contained"
                onClick={() => abrirTicket(v.id)}
                startIcon={<PrintIcon />}
              >
                Ticket
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => abrirDetalles(v.id)}
                startIcon={<VisibilityIcon />}
              >
                Detalles
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

const SimpleList = ({
  rows,
  loading,
  color = "default",
  onTicket,
  onDetails,
  paymentFromSale = true,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin registros en el rango seleccionado.
      </Typography>
    );
  }

  const rowBg =
    color === "error" ? "#ffebee" : color === "info" ? "#e3f2fd" : "inherit";

  return (
    <Box sx={{ maxHeight: 440, overflowY: "auto" }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell align="center"><strong>#</strong></TableCell>
            <TableCell align="center"><strong>Venta</strong></TableCell>
            <TableCell align="center"><strong>Fecha</strong></TableCell>
            <TableCell align="center"><strong>Tipo</strong></TableCell>
            <TableCell align="center"><strong>Motivo</strong></TableCell>
            <TableCell align="center"><strong>Total afectado</strong></TableCell>
            <TableCell align="center"><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r) => {
            const fecha = r.fecha || r.created_at;
            const venta = r.sale || {};
            const totalAfectado = Number(
              r?.importe_afectado ?? venta?.total_amount ?? 0
            );
            const pagoLabel = paymentFromSale ? etiquetaPagoVenta(venta) : "—";

            return (
              <TableRow key={`row-${r.id}`} sx={{ backgroundColor: rowBg }}>
                <TableCell align="center">#{r.id}</TableCell>
                <TableCell align="center">{venta?.id ? `#${venta.id}` : "—"}</TableCell>
                <TableCell align="center">
                  {fecha
                    ? format(
                      parseISO(String(fecha).slice(0, 10)),
                      "d 'de' MMMM 'del' yyyy",
                      { locale: es }
                    )
                    : "—"}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={color}
                    variant="outlined"
                    label={
                      (r.tipo || "").toUpperCase() ||
                      (color === "error" ? "CANCELADA" : "DEVUELTA")
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" noWrap title={r.motivo || ""}>
                    {r.motivo || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip
                    title={`Total del ticket: ${venta?.total_amount != null ? money(venta.total_amount) : "—"
                      } · Pago: ${pagoLabel}`}
                  >
                    <span>{money(totalAfectado)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  {venta?.id ? (
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Imprimir / Ticket">
                        <IconButton color="primary" onClick={() => onTicket?.(venta.id)}>
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Detalles">
                        <IconButton color="secondary" onClick={() => onDetails?.(venta.id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

// -------------------- Principal --------------------
export default function HistorialPOS({ cambiarVista, posLocationId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [modoConsulta, setModoConsulta] = useState("dia");
  const [ventas, setVentas] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [cancelaciones, setCancelaciones] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tipoPago, setTipoPago] = useState("");
  const [catList, setCatList] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [pagina, setPagina] = useState(0);
  const [tab, setTab] = useState(0);

  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);

  const [pagoSeleccionado, setPagoSeleccionado] = useState("");
  const [categoriaTabSel, setCategoriaTabSel] = useState("");

  const handleFiltrar = async () => {
    setLoading(true);
    const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    if (tipoPago) params.payment_method = tipoPago;

    try {
      const { data } = await axiosClientPOS.get("/ventas/mis-ventas", { params });
      setVentas(
        Array.isArray(data?.ventas)
          ? data.ventas
          : Array.isArray(data)
            ? data
            : []
      );
      setDevoluciones(Array.isArray(data?.devoluciones) ? data.devoluciones : []);
      setCancelaciones(Array.isArray(data?.cancelaciones) ? data.cancelaciones : []);
      setPagina(0);
    } catch (error) {
      console.error("Error al filtrar ventas", error);
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

  useEffect(() => {
    axiosClient
      .get("/admin/categories")
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : data?.data || [];
        setCatList(
          arr.map((c) => ({
            id: c.id,
            name: c.name ?? c.nombre ?? String(c.id),
          }))
        );
      })
      .catch(() => setCatList([]));
  }, []);

  const limpiarFiltros = () => {
    const h = hoyISO();
    setModoConsulta("dia");
    setFechaInicio(h);
    setFechaFin(h);
    setTipoPago("");
    setCategoriaId("");
    setPagoSeleccionado("");
    setCategoriaTabSel("");
    setTab(isMobile ? 1 : 0);
    setPagina(0);

    setTimeout(() => {
      handleFiltrar();
    }, 0);
  };

  const categoriaSeleccionadaNombre = useMemo(() => {
    if (!categoriaId) return "";
    const found = catList.find((c) => String(c.id) === String(categoriaId));
    return (found?.name || "").trim();
  }, [categoriaId, catList]);

  const ventasFiltradas = useMemo(() => {
    if (!categoriaId) return ventas;

    return ventas.filter(
      (v) =>
        (v.categories || []).some((c) => String(c.id) === String(categoriaId)) ||
        (v.items || []).some((it) => {
          const ids = (it?.category_ids || []).map(String);
          const names = (it?.category_names || []).map((n) => (n || "").trim());

          return (
            ids.includes(String(categoriaId)) ||
            (!!categoriaSeleccionadaNombre &&
              names.includes(categoriaSeleccionadaNombre))
          );
        })
    );

    console.log(
      ventasFiltradas.slice(0, 10).map((v) => ({
        id: v.id,
        total_amount: v.total_amount,
        payment_method: v.payment_method,
        payment_methods: v.payment_methods,
        total_neto: v.total_neto,
      }))
    );
  }, [ventas, categoriaId, categoriaSeleccionadaNombre]);

  const ventasVigentesBase = useMemo(
    () => ventasFiltradas.filter((v) => !ES_ANULADA_TOTAL(v.status)),
    [ventasFiltradas]
  );

  const cancelacionesDerivadas = useMemo(
    () =>
      ventas
        .filter(
          (v) => v.status === "cancelled" || v.status === "partially_cancelled"
        )
        .map((v) => ({
          id: v.id,
          sale_id: v.id,
          store_id: v.store_id,
          tipo: v.status === "partially_cancelled" ? "parcial" : "total",
          motivo: v.cancel_reason || v.motivo || "",
          fecha: v.updated_at || v.created_at,
          created_at: v.updated_at || v.created_at,
          sale: v,
          importe_afectado:
            v.status === "partially_cancelled"
              ? Number(
                v.items
                  ?.filter((it) => it.estado === "cancelado")
                  .reduce((a, b) => a + Number(b.total_price || 0), 0) || 0
              )
              : Number(v.total_amount || 0),
        })),
    [ventas]
  );

  const cancelacionesRows = useMemo(
    () => (cancelaciones?.length ? cancelaciones : cancelacionesDerivadas),
    [cancelaciones, cancelacionesDerivadas]
  );

  const getImporteAfectado = (r) =>
    Number(r?.importe_afectado ?? r?.sale?.total_amount ?? 0);

  const esParcial = (r) =>
    String(r?.tipo || "").toLowerCase().includes("parc");

  const totalVentasBrutas = useMemo(
    () =>
      ventasVigentesBase.reduce((ac, v) => ac + Number(v.total_amount || 0), 0),
    [ventasVigentesBase]
  );

  const totalParcCancel = useMemo(
    () =>
      cancelacionesRows
        .filter(esParcial)
        .reduce((ac, r) => ac + getImporteAfectado(r), 0),
    [cancelacionesRows]
  );

  const totalParcDev = useMemo(
    () =>
      devoluciones
        .filter(esParcial)
        .reduce((ac, r) => ac + getImporteAfectado(r), 0),
    [devoluciones]
  );

  const totalVigentes = Math.max(
    0,
    totalVentasBrutas - totalParcCancel - totalParcDev
  );
  const ticketsVigentes = ventasVigentesBase.length;
  const ticketPromVigente = ticketsVigentes ? totalVigentes / ticketsVigentes : 0;

  const totalCancelaciones = useMemo(
    () => cancelacionesRows.reduce((ac, r) => ac + getImporteAfectado(r), 0),
    [cancelacionesRows]
  );
  const ticketsCanceladas = cancelacionesRows.length;
  const ticketPromCancelada = ticketsCanceladas
    ? totalCancelaciones / ticketsCanceladas
    : 0;

  const totalDevoluciones = useMemo(
    () => devoluciones.reduce((ac, r) => ac + getImporteAfectado(r), 0),
    [devoluciones]
  );
  const ticketsDevoluciones = devoluciones.length;
  const ticketPromDevolucion = ticketsDevoluciones
    ? totalDevoluciones / ticketsDevoluciones
    : 0;

  const textoRango =
    modoConsulta === "dia"
      ? format(parseISO(fechaInicio), "d 'de' MMMM 'del' yyyy", { locale: es })
      : `${format(parseISO(fechaInicio), "d 'de' MMMM 'del' yyyy", {
        locale: es,
      })} – ${format(parseISO(fechaFin), "d 'de' MMMM 'del' yyyy", {
        locale: es,
      })}`;

  const statsPago = useMemo(() => {
    const map = new Map();

    ventasVigentesBase.forEach((v) => {
      pagosDeVenta(v).forEach((p) => {
        const cur = map.get(p.method) || { ventas: 0, total: 0 };
        cur.ventas += 1;
        cur.total += Number(p.total);
        map.set(p.method, cur);
      });
    });

    const rows = Array.from(map.entries())
      .map(([key, val]) => ({
        key,
        label: LABELS_PAGO[key] || key,
        ventas: val.ventas,
        total: val.total,
      }))
      .sort((a, b) => b.total - a.total);

    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);

    return { rows, totales: { ventas: totVentas, total: totImporte } };
  }, [ventasVigentesBase]);

  const statsCategoria = useMemo(() => {
    const map = new Map();

    ventasVigentesBase.forEach((v) => {
      const names = (v.categories || [])
        .map((c) => (c?.name || "").trim())
        .filter(Boolean);

      const set = new Set(names);
      if (set.size === 0) set.add("Sin categoría");

      const prorrata = Number(v.total_amount || 0) / set.size;

      set.forEach((name) => {
        const cur = map.get(name) || { ventas: 0, total: 0 };
        cur.ventas += 1;
        cur.total += prorrata;
        map.set(name, cur);
      });
    });

    const rows = Array.from(map.entries())
      .map(([label, val]) => ({
        key: label,
        label,
        ventas: val.ventas,
        total: val.total,
      }))
      .sort((a, b) => b.total - a.total);

    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);

    return { rows, totales: { ventas: totVentas, total: totImporte } };
  }, [ventasVigentesBase]);

  const ventasPorPago = useMemo(() => {
    if (!pagoSeleccionado) return [];
    return ventasVigentesBase.filter((v) =>
      pagosDeVenta(v).some((p) => p.method === pagoSeleccionado)
    );
  }, [ventasVigentesBase, pagoSeleccionado]);

  const ventasPorCategoria = useMemo(() => {
    if (!categoriaTabSel) return [];
    return ventasVigentesBase.filter((v) => {
      const names = (v.categories || []).map((c) => (c?.name || "").trim());
      if (categoriaTabSel === "Sin categoría") return names.length === 0;
      return names.includes(categoriaTabSel);
    });
  }, [ventasVigentesBase, categoriaTabSel]);

  // -------- Paginación por día --------
  const ventasGroups = useMemo(
    () =>
      agruparPorDia(
        ventasFiltradas,
        (v) => v.created_at || fechaInicio
      ),
    [ventasFiltradas, fechaInicio]
  );

  const devolucionesGroups = useMemo(
    () =>
      agruparPorDia(
        devoluciones,
        (r) => r.fecha || r.created_at
      ),
    [devoluciones]
  );

  const cancelacionesGroups = useMemo(
    () =>
      agruparPorDia(
        cancelacionesRows,
        (r) => r.fecha || r.created_at
      ),
    [cancelacionesRows]
  );

  const ventasRowsPagina = ventasGroups[pagina]?.rows || [];
  const devolucionesRowsPagina = devolucionesGroups[pagina]?.rows || [];
  const cancelacionesRowsPagina = cancelacionesGroups[pagina]?.rows || [];

  useEffect(() => {
    setPagina(0);
  }, [tab, fechaInicio, fechaFin, tipoPago, categoriaId, modoConsulta]);

  useEffect(() => {
    const totalGroups =
      tab === 1
        ? ventasGroups.length
        : tab === 4
          ? devolucionesGroups.length
          : tab === 5
            ? cancelacionesGroups.length
            : 0;

    if (totalGroups > 0 && pagina > totalGroups - 1) {
      setPagina(0);
    }
  }, [tab, pagina, ventasGroups.length, devolucionesGroups.length, cancelacionesGroups.length]);

  const abrirModalTicket = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalTicketOpen(true);
  };

  const abrirModalDetalles = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalDetallesOpen(true);
  };

  const cancelarVenta = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalCancelarOpen(true);
  };

  const devolverVenta = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalDevolverOpen(true);
  };

  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            width: "100%",
            maxWidth: "none",
            ml: "calc(50% - 50vw)",
            mr: "calc(50% - 50vw)",
            width: "100vw",
            px: 1.25,
            py: 1,
          }}
        >
          <HistorialPOSMobile
            tab={tab}
            setTab={setTab}
            pagina={pagina}
            setPagina={setPagina}
            loading={loading}
            textoRango={textoRango}
            ventasFiltradas={ventasFiltradas}
            devoluciones={devoluciones}
            cancelacionesRows={cancelacionesRows}
            ventasGroups={ventasGroups}
            devolucionesGroups={devolucionesGroups}
            cancelacionesGroups={cancelacionesGroups}
            totalVigentes={totalVigentes}
            totalDevoluciones={totalDevoluciones}
            totalCancelaciones={totalCancelaciones}
            ticketsVigentes={ticketsVigentes}
            ticketsDevoluciones={ticketsDevoluciones}
            ticketsCanceladas={ticketsCanceladas}
            ticketPromVigente={ticketPromVigente}
            ticketPromDevolucion={ticketPromDevolucion}
            ticketPromCancelada={ticketPromCancelada}
            tipoPago={tipoPago}
            modoConsulta={modoConsulta}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            setModoConsulta={setModoConsulta}
            setFechaInicio={setFechaInicio}
            setFechaFin={setFechaFin}
            setTipoPago={setTipoPago}
            handleFiltrar={handleFiltrar}
            limpiarFiltros={limpiarFiltros}
            hoyISO={hoyISO}
            cambiarVista={cambiarVista}
            abrirTicket={abrirModalTicket}
            abrirDetalles={abrirModalDetalles}
            cancelarVenta={cancelarVenta}
            devolverVenta={devolverVenta}
          />
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
      </>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box display="flex" justifyContent="center" mb={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="center"
          width={{ xs: "100%", md: "auto" }}
        >
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<ShoppingCartIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              boxShadow: 3,
              width: { xs: "100%", md: "auto" },
            }}
            onClick={() => cambiarVista("venta")}
          >
            Ventas
          </Button>

          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<ReceiptLongIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              boxShadow: 3,
              width: { xs: "100%", md: "auto" },
            }}
            onClick={() => cambiarVista("facturas")}
          >
            Facturas
          </Button>

          <Button
            variant="outlined"
            color="success"
            size="large"
            startIcon={<DashboardIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              borderWidth: 2,
              boxShadow: 2,
              "&:hover": { borderWidth: 2 },
              width: { xs: "100%", md: "auto" },
            }}
            onClick={() => cambiarVista("menu")}
          >
            Regresar al Panel
          </Button>
        </Stack>
      </Box>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md="auto">
            <TextField
              select
              label="Modo"
              size="medium"
              value={modoConsulta}
              onChange={(e) => {
                const v = e.target.value;
                setModoConsulta(v);
                if (v === "dia") {
                  const h = hoyISO();
                  setFechaInicio(h);
                  setFechaFin(h);
                }
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="dia">Día</MenuItem>
              <MenuItem value="personalizada">Rango</MenuItem>
            </TextField>
          </Grid>

          {modoConsulta === "dia" ? (
            <Grid item xs={12} sm={6} md="auto">
              <TextField
                type="date"
                label="Fecha"
                size="medium"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setFechaFin(e.target.value);
                }}
                sx={{ minWidth: 140 }}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6} md="auto">
                <TextField
                  type="date"
                  label="Inicio"
                  size="medium"
                  InputLabelProps={{ shrink: true }}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  sx={{ minWidth: 140 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md="auto">
                <TextField
                  type="date"
                  label="Fin"
                  size="medium"
                  InputLabelProps={{ shrink: true }}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  sx={{ minWidth: 140 }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md="auto">
            <TextField
              select
              label="Pago"
              size="medium"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="tc">Tarjeta de crédito</MenuItem>
              <MenuItem value="td">Tarjeta de débito</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs />

          <Grid item>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button variant="contained" onClick={handleFiltrar} disabled={loading} sx={{ px: 3 }}>
                {loading ? "Cargando..." : "Aplicar"}
              </Button>

              <Button
                variant="text"
                color="secondary"
                onClick={limpiarFiltros}
                sx={{ fontWeight: 700 }}
              >
                Limpiar
              </Button>

              <IconButton onClick={handleFiltrar} title="Refrescar">
                <ReplayIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title={`Ventas (${textoRango})`}
            amount={totalVigentes}
            count={ticketsVigentes}
            avg={ticketPromVigente}
            color="success"
            hint={tipoPago ? `Filtrado por ${LABELS_PAGO[tipoPago]}` : undefined}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Canceladas"
            amount={totalCancelaciones}
            count={ticketsCanceladas}
            avg={ticketPromCancelada}
            color="error"
            hint="Basado en fecha de creación de la venta"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Devueltas"
            amount={totalDevoluciones}
            count={ticketsDevoluciones}
            avg={ticketPromDevolucion}
            color="info"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, p: 1.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Resumen" />
          <Tab label="Ventas" />
          <Tab label="Por tipo de pago" />
          <Tab label="Por categoría" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Devoluciones" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Cancelaciones" />
        </Tabs>

        <Divider sx={{ mb: 2 }} />

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StatsList
                title="Por tipo de pago (vigentes)"
                rows={statsPago.rows}
                total={statsPago.totales.total}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StatsList
                title="Por categoría (vigentes)"
                rows={statsCategoria.rows}
                total={statsCategoria.totales.total}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                * En categoría se prorratea el total de cada venta entre sus categorías para evitar doble conteo.
              </Typography>
            </Grid>
          </Grid>
        )}

        {tab === 1 &&
          (loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : ventasGroups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin ventas en el rango seleccionado.
            </Typography>
          ) : (
            <>
              <DayPagination
                groups={ventasGroups}
                page={pagina}
                setPage={setPagina}
                label="día"
              />

              <SalesTable
                rows={ventasRowsPagina}
                fechaFallback={fechaInicio}
                abrirTicket={abrirModalTicket}
                abrirDetalles={abrirModalDetalles}
                cancelarVenta={cancelarVenta}
                devolverVenta={devolverVenta}
              />
            </>
          ))}

        {tab === 2 && (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Selecciona un tipo de pago
            </Typography>

            <PaymentPicker
              stats={statsPago}
              selected={pagoSeleccionado}
              onSelect={(val) => setPagoSeleccionado(val === pagoSeleccionado ? "" : val)}
            />

            {!pagoSeleccionado ? (
              <Typography variant="body2" color="text.secondary">
                Elige un tipo de pago para ver las ventas correspondientes.
              </Typography>
            ) : loading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : ventasPorPago.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay ventas para {LABELS_PAGO[pagoSeleccionado] || pagoSeleccionado} en el rango seleccionado.
              </Typography>
            ) : (
              <SalesCardsGrid
                rows={ventasPorPago}
                abrirTicket={abrirModalTicket}
                abrirDetalles={abrirModalDetalles}
              />
            )}
          </Stack>
        )}

        {tab === 3 && (
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Selecciona una categoría
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {statsCategoria.rows.map((r) => {
                const value = r.label;
                const active = categoriaTabSel === value;

                return (
                  <Chip
                    key={value}
                    clickable
                    onClick={() => setCategoriaTabSel(active ? "" : value)}
                    label={`${value} · ${money(r.total)}`}
                    color={active ? "primary" : "default"}
                    variant={active ? "filled" : "outlined"}
                    sx={{ borderRadius: 2 }}
                  />
                );
              })}
            </Stack>

            {!categoriaTabSel ? (
              <Typography variant="body2" color="text.secondary">
                Elige una categoría para ver las ventas correspondientes.
              </Typography>
            ) : loading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : ventasPorCategoria.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay ventas para la categoría “{categoriaTabSel}”.
              </Typography>
            ) : (
              <SalesCardsGrid
                rows={ventasPorCategoria}
                abrirTicket={abrirModalTicket}
                abrirDetalles={abrirModalDetalles}
              />
            )}
          </Stack>
        )}

        {tab === 4 &&
          (loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : devolucionesGroups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin devoluciones en el rango seleccionado.
            </Typography>
          ) : (
            <>
              <DayPagination
                groups={devolucionesGroups}
                page={pagina}
                setPage={setPagina}
                label="día"
              />

              <SimpleList
                rows={devolucionesRowsPagina}
                loading={false}
                color="info"
                paymentFromSale
                onTicket={abrirModalTicket}
                onDetails={abrirModalDetalles}
              />
            </>
          ))}

        {tab === 5 &&
          (loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : cancelacionesGroups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin cancelaciones en el rango seleccionado.
            </Typography>
          ) : (
            <>
              <DayPagination
                groups={cancelacionesGroups}
                page={pagina}
                setPage={setPagina}
                label="día"
              />

              <SimpleList
                rows={cancelacionesRowsPagina}
                loading={false}
                color="error"
                paymentFromSale
                onTicket={abrirModalTicket}
                onDetails={abrirModalDetalles}
              />
            </>
          ))}
      </Paper>

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
    </Box>
  );
}