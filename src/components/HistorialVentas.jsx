import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  CircularProgress, Stack, Button, Divider, TablePagination, TextField, IconButton,
  MenuItem, Grid, Tabs, Tab, LinearProgress, Card, CardContent, Chip, Tooltip, Avatar
} from "@mui/material";
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

import axiosClientPOS from "../config/axiosClientPOS"; // ventas
import axiosClient from "../config/axiosClient";       // categorías
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Modales
import ModalTicketVenta from "./ModalTicketVenta";
import ModalDetallesVenta from "./ModalDetallesVenta";
import ModalCancelarVenta from "./ModalCancelarVenta";
import ModalDevolverVenta from "./ModalDevolverVenta";

// ---- Constantes / Helpers ---------------------------------------------------
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
  (Number(n || 0)).toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

const ES_CANCELADA = (s) => ["cancelled", "devuelta", "partially_cancelled"].includes(s);

// ---- Subcomponentes UI ------------------------------------------------------
const KpiCard = ({ title, value, hint, color }) => (
  <Card sx={{ borderRadius: 3, height: "100%", borderColor: color ? `${color}.main` : undefined }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h5" fontWeight="bold" color={color || "inherit"}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </CardContent>
  </Card>
);

const BarRow = ({ label, right, percent }) => (
  <Stack spacing={0.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" noWrap title={label}>{label}</Typography>
      <Typography variant="body2" fontWeight="bold">{right}</Typography>
    </Stack>
    <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, percent))} />
  </Stack>
);

const StatsList = ({ title, rows, total, limit = 6 }) => {
  const slice = rows.slice(0, limit);
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
        <Typography variant="body2" color="text.secondary">{money(total)}</Typography>
      </Stack>
      <Stack spacing={1.25}>
        {slice.map((r) => (
          <BarRow key={r.key} label={`${r.label} · ${r.ventas} ventas`} right={money(r.total)} percent={(r.total / (total || 1)) * 100} />
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
  rows, pagina, rowsPerPage, onPage, onRpp, fechaFallback,
  abrirTicket, abrirDetalles, cancelarVenta, devolverVenta
}) => (
  <>
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
          {rows
            .slice(pagina * rowsPerPage, pagina * rowsPerPage + rowsPerPage)
            .map((venta) => {
              const bg =
                venta.status === "cancelled" ? "#ffebee"
                : venta.status === "partially_cancelled" ? "#fff8e1"
                : venta.status === "devuelta" ? "#e3f2fd"
                : "inherit";

              return (
                <TableRow key={venta.id} hover sx={{ backgroundColor: bg }}>
                  <TableCell align="center">#{venta.id}</TableCell>
                  <TableCell align="center">
                    {venta.created_at
                      ? format(parseISO(venta.created_at.slice(0, 10)), "d 'de' MMMM 'del' yyyy", { locale: es })
                      : format(parseISO(fechaFallback), "d 'de' MMMM 'del' yyyy", { locale: es })}
                  </TableCell>
                  <TableCell align="center">{money(venta.total_amount)}</TableCell>
                  <TableCell align="center">
                    {LABELS_PAGO[venta.payment_method]
                      ? <Chip label={LABELS_PAGO[venta.payment_method]} size="small" />
                      : <Chip label="—" variant="outlined" size="small" />}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                      {(venta.categories && venta.categories.length > 0)
                        ? venta.categories.slice(0, 3).map((c) => (
                            <Chip key={c.id} size="small" variant="outlined" label={c.name} />
                          ))
                        : <Chip size="small" variant="outlined" label="Sin categoría" />}
                      {(venta.categories?.length || 0) > 3 && (
                        <Chip size="small" variant="outlined" label={`+${venta.categories.length - 3}`} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={
                        venta.status === "cancelled" ? "Cancelada"
                        : venta.status === "partially_cancelled" ? "Parcial"
                        : venta.status === "devuelta" ? "Devuelta"
                        : venta.status === "paid" ? "Pagada"
                        : "—"
                      }
                      color={
                        venta.status === "cancelled" ? "error"
                        : venta.status === "partially_cancelled" ? "warning"
                        : venta.status === "devuelta" ? "info"
                        : venta.status === "paid" ? "success"
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

                      {/* Acciones solo cuando NO está ya cancelada/devuelta */}
                      {!(ES_CANCELADA(venta.status)) && (
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
    <TablePagination
      component="div"
      count={rows.length}
      page={pagina}
      onPageChange={onPage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRpp}
      labelRowsPerPage="Filas por página"
      rowsPerPageOptions={[5, 10, 25]}
    />
  </>
);

const PaymentPicker = ({ stats, selected, onSelect }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap">
    {stats.rows.map((r) => {
      const value = r.key;
      const active = selected === value;
      return (
        <Chip
          key={value}
          clickable
          onClick={() => onSelect(value)}
          label={`${LABELS_PAGO[value] || value} · ${money(r.total)}`}
          icon={ICONS_PAGO[value] || <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>{(LABELS_PAGO[value] || "?")[0]}</Avatar>}
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
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Stack spacing={0}>
                <Typography variant="subtitle2" color="text.secondary">Folio</Typography>
                <Typography variant="h6" fontWeight="bold">#{v.id}</Typography>
              </Stack>
              <Chip size="small" label={LABELS_PAGO[v.payment_method] || "—"} />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {v.created_at
                ? format(parseISO(v.created_at.slice(0, 10)), "d 'de' MMMM 'del' yyyy", { locale: es })
                : "Fecha no disponible"}
            </Typography>

            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              {money(v.total_amount)}
            </Typography>

            {(v.categories?.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {v.categories.slice(0, 6).map((c) => (
                  <Chip key={c.id} size="small" variant="outlined" label={c.name} />
                ))}
                {v.categories.length > 6 && (
                  <Chip size="small" variant="outlined" label={`+${v.categories.length - 6}`} />
                )}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip size="small" variant="outlined" label="Sin categoría" />
              </Stack>
            ))}

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button size="small" variant="contained" onClick={() => abrirTicket(v.id)} startIcon={<PrintIcon />}>Ticket</Button>
              <Button size="small" variant="outlined" onClick={() => abrirDetalles(v.id)} startIcon={<VisibilityIcon />}>Detalles</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// ---- Componente principal ----------------------------------------------------
export default function HistorialPOS({ cambiarVista }) {
  // Estado base
  const [modoConsulta, setModoConsulta] = useState("dia");
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tipoPago, setTipoPago] = useState(""); // filtro general
  const [catList, setCatList] = useState([]);   // categorías admin
  const [categoriaId, setCategoriaId] = useState(""); // "" todas
  const [pagina, setPagina] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tab, setTab] = useState(0);

  // Modales
  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [modalDevolverOpen, setModalDevolverOpen] = useState(false);

  // Para historial de cancelaciones desde el mismo dataset
  const canceladasLista = useMemo(
    () => ventas.filter(v => ES_CANCELADA(v.status)),
    [ventas]
  );

  // Traer ventas (solo cuando aplicas o hay éxito en modal)
  const handleFiltrar = async () => {
    setLoading(true);
    const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
    if (tipoPago) params.payment_method = tipoPago;
    try {
      const { data } = await axiosClientPOS.get("/ventas/mis-ventas", { params });
      setVentas(Array.isArray(data) ? data : []);
      setPagina(0);
    } catch (error) {
      console.error("Error al filtrar ventas", error);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFiltrar(); }, []); // primer render

  // Traer categorías (opcional; no usamos select de categoría aquí, pero se deja por si lo reactivas)
  useEffect(() => {
    axiosClient.get("/admin/categories")
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : data?.data || [];
        setCatList(arr.map((c) => ({ id: c.id, name: c.name ?? c.nombre ?? String(c.id) })));
      })
      .catch(() => setCatList([]));
  }, []);

  // Filtrado base por categoría (si vuelves a activar el select)
  const categoriaSeleccionadaNombre = useMemo(() => {
    if (!categoriaId) return "";
    const found = catList.find((c) => String(c.id) === String(categoriaId));
    return (found?.name || "").trim();
  }, [categoriaId, catList]);

  const ventasFiltradas = useMemo(() => {
    if (!categoriaId) return ventas;
    return ventas.filter((v) =>
      (v.categories || []).some((c) => String(c.id) === String(categoriaId)) ||
      (v.items || []).some((it) => {
        const ids = (it?.category_ids || []).map(String);
        const names = (it?.category_names || []).map((n) => (n || "").trim());
        const byId = ids.includes(String(categoriaId));
        const byName = !!categoriaSeleccionadaNombre && names.includes(categoriaSeleccionadaNombre);
        return byId || byName;
      })
    );
  }, [ventas, categoriaId, categoriaSeleccionadaNombre]);

  // Separación VIGENTES vs CANCELADAS (para todo lo demás)
  const ventasVigentes = useMemo(
    () => ventasFiltradas.filter(v => !ES_CANCELADA(v.status)),
    [ventasFiltradas]
  );
  const ventasCanceladas = useMemo(
    () => ventasFiltradas.filter(v => ES_CANCELADA(v.status)),
    [ventasFiltradas]
  );

  // KPIs (solo VIGENTES)
  const totalVigentes = useMemo(
    () => ventasVigentes.reduce((ac, v) => ac + Number(v.total_amount || 0), 0),
    [ventasVigentes]
  );
  const ticketsVigentes = ventasVigentes.length;
  const ticketPromVigente = ticketsVigentes ? totalVigentes / ticketsVigentes : 0;

  // KPIs (CANCELADAS)
  const totalCanceladas = useMemo(
    () => ventasCanceladas.reduce((ac, v) => ac + Number(v.total_amount || 0), 0),
    [ventasCanceladas]
  );
  const ticketsCanceladas = ventasCanceladas.length;
  const ticketPromCancelada = ticketsCanceladas ? totalCanceladas / ticketsCanceladas : 0;

  const textoRango =
    modoConsulta === "dia"
      ? format(parseISO(fechaInicio), "d 'de' MMMM 'del' yyyy", { locale: es })
      : `${format(parseISO(fechaInicio), "d 'de' MMMM 'del' yyyy", { locale: es })} – ${format(parseISO(fechaFin), "d 'de' MMMM 'del' yyyy", { locale: es })}`;

  // Estadística pagos (VIGENTES)
  const statsPago = useMemo(() => {
    const map = new Map();
    ventasVigentes.forEach((v) => {
      const key = v.payment_method || "—";
      const cur = map.get(key) || { ventas: 0, total: 0 };
      cur.ventas += 1;
      cur.total += Number(v.total_amount || 0);
      map.set(key, cur);
    });
    const rows = Array.from(map.entries()).map(([pago, val]) => ({
      key: pago, label: LABELS_PAGO[pago] || pago, ventas: val.ventas, total: val.total
    })).sort((a, b) => b.total - a.total);
    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);
    return { rows, totales: { ventas: totVentas, total: totImporte } };
  }, [ventasVigentes]);

  // Estadística pagos (CANCELADAS)
  const statsPagoCancel = useMemo(() => {
    const map = new Map();
    ventasCanceladas.forEach((v) => {
      const key = v.payment_method || "—";
      const cur = map.get(key) || { ventas: 0, total: 0 };
      cur.ventas += 1;
      cur.total += Number(v.total_amount || 0);
      map.set(key, cur);
    });
    const rows = Array.from(map.entries()).map(([pago, val]) => ({
      key: pago, label: LABELS_PAGO[pago] || pago, ventas: val.ventas, total: val.total
    })).sort((a, b) => b.total - a.total);
    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);
    return { rows, totales: { ventas: totVentas, total: totImporte } };
  }, [ventasCanceladas]);

  // Estadística categorías (VIGENTES, prorrateo; incluye Sin categoría)
  const statsCategoria = useMemo(() => {
    const map = new Map();
    ventasVigentes.forEach((v) => {
      const names = (v.categories || []).map(c => (c?.name || "").trim()).filter(Boolean);
      const set = new Set(names);
      if (set.size === 0) set.add("Sin categoría");
      const prorrata = Number(v.total_amount || 0) / set.size;
      set.forEach((name) => {
        const cur = map.get(name) || { ventas: 0, total: 0 };
        cur.ventas += 1; cur.total += prorrata; map.set(name, cur);
      });
    });
    const rows = Array.from(map.entries()).map(([label, val]) => ({
      key: label, label, ventas: val.ventas, total: val.total
    })).sort((a, b) => b.total - a.total);
    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);
    return { rows, totales: { ventas: totVentas, total: totImporte } };
  }, [ventasVigentes]);

  // Estadística categorías (CANCELADAS)
  const statsCategoriaCancel = useMemo(() => {
    const map = new Map();
    ventasCanceladas.forEach((v) => {
      const names = (v.categories || []).map(c => (c?.name || "").trim()).filter(Boolean);
      const set = new Set(names);
      if (set.size === 0) set.add("Sin categoría");
      const prorrata = Number(v.total_amount || 0) / set.size;
      set.forEach((name) => {
        const cur = map.get(name) || { ventas: 0, total: 0 };
        cur.ventas += 1; cur.total += prorrata; map.set(name, cur);
      });
    });
    const rows = Array.from(map.entries()).map(([label, val]) => ({
      key: label, label, ventas: val.ventas, total: val.total
    })).sort((a, b) => b.total - a.total);
    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);
    return { rows, totales: { ventas: totVentas, total: totImporte } };
  }, [ventasCanceladas]);

  // Estado para tabs "Por tipo de pago" y "Por categoría" (VIGENTES)
  const [pagoSeleccionado, setPagoSeleccionado] = useState("");
  const ventasPorPago = useMemo(() => {
    if (!pagoSeleccionado) return [];
    return ventasVigentes.filter((v) => v.payment_method === pagoSeleccionado);
  }, [ventasVigentes, pagoSeleccionado]);

  const [categoriaTabSel, setCategoriaTabSel] = useState(""); // nombre
  const ventasPorCategoria = useMemo(() => {
    if (!categoriaTabSel) return [];
    return ventasVigentes.filter((v) => {
      const names = (v.categories || []).map(c => (c?.name || "").trim());
      if (categoriaTabSel === "Sin categoría") return names.length === 0;
      return names.includes(categoriaTabSel);
    });
  }, [ventasVigentes, categoriaTabSel]);

  // Handlers tabla
  const handleChangePage = (_, newPage) => setPagina(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPagina(0); };

  // Abrir modales
  const abrirModalTicket = (ventaId) => { setVentaSeleccionada(ventaId); setModalTicketOpen(true); };
  const abrirModalDetalles = (ventaId) => { setVentaSeleccionada(ventaId); setModalDetallesOpen(true); };
  const cancelarVenta = (ventaId) => { setVentaSeleccionada(ventaId); setModalCancelarOpen(true); };
  const devolverVenta = (ventaId) => { setVentaSeleccionada(ventaId); setModalDevolverOpen(true); };

  // ---- Render ----------------------------------------------------------------
  return (
    <Box sx={{ p: 4 }}>
      {/* Navegación principal */}
      <Box display="flex" justifyContent="center" mb={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="center" width={{ xs: "100%", md: "auto" }}>
          <Button variant="contained" color="success" size="large" startIcon={<ShoppingCartIcon />}
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: "bold", textTransform: "none", boxShadow: 3, width: { xs: "100%", md: "auto" } }}
            onClick={() => cambiarVista("venta")}>Ventas</Button>
          <Button variant="contained" color="warning" size="large" startIcon={<ReceiptLongIcon />}
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: "bold", textTransform: "none", boxShadow: 3, width: { xs: "100%", md: "auto" } }}
            onClick={() => cambiarVista("facturas")}>Facturas</Button>
          <Button variant="outlined" color="success" size="large" startIcon={<DashboardIcon />}
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: "bold", textTransform: "none", borderWidth: 2, boxShadow: 2, "&:hover": { borderWidth: 2 }, width: { xs: "100%", md: "auto" } }}
            onClick={() => cambiarVista("menu")}>Regresar al Panel</Button>
        </Stack>
      </Box>

      {/* Filtros superiores */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Modo */}
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

          {/* Fechas */}
          {modoConsulta === "dia" ? (
            <Grid item xs={12} sm={6} md="auto">
              <TextField
                type="date"
                label="Fecha"
                size="medium"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); setFechaFin(e.target.value); }}
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

          {/* Tipo de pago */}
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

          {/* Acciones */}
          <Grid item>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button variant="contained" onClick={handleFiltrar} disabled={loading} sx={{ px: 3 }}>
                {loading ? "Cargando..." : "Aplicar"}
              </Button>
              <Button
                variant="text"
                color="secondary"
                onClick={() => {
                  const h = hoyISO();
                  setModoConsulta("dia");
                  setFechaInicio(h);
                  setFechaFin(h);
                  setTipoPago("");
                  setCategoriaId("");
                  setPagoSeleccionado("");
                  setCategoriaTabSel("");
                  handleFiltrar();
                }}
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

      <Stack sx={{ flex: 1 }} spacing={2}>
        {/* KPIs: SOLO VIGENTES y bloque aparte de CANCELADAS */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <KpiCard title={`Ventas vigentes (${textoRango})`} value={money(totalVigentes)} hint={tipoPago ? `Filtrado por ${LABELS_PAGO[tipoPago]}` : "Todas las formas de pago"} />
          </Grid>
          <Grid item xs={12} md={3}>
            <KpiCard title="# Tickets vigentes" value={ticketsVigentes} hint="Cantidad de ventas" />
          </Grid>
          <Grid item xs={12} md={3}>
            <KpiCard title="Ticket prom. vigente" value={money(ticketPromVigente)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <KpiCard title="Canceladas (importe)" value={money(totalCanceladas)} hint={`# ${ticketsCanceladas}`} color="error" />
          </Grid>
        </Grid>

        <Paper sx={{ borderRadius: 3, p: 1.5 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
            <Tab label="Resumen" />
            <Tab label="Ventas" />
            <Tab label="Por tipo de pago" />
            <Tab label="Por categoría" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="Cancelaciones (historial)" />
          </Tabs>
          <Divider sx={{ mb: 2 }} />

          {/* Resumen */}
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StatsList title="Por tipo de pago (vigentes)" rows={statsPago.rows} total={statsPago.totales.total} />
              </Grid>
              <Grid item xs={12} md={6}>
                <StatsList title="Por categoría (vigentes)" rows={statsCategoria.rows} total={statsCategoria.totales.total} />
              </Grid>

              <Grid item xs={12} md={6}>
                <StatsList title="Canceladas · por pago" rows={statsPagoCancel.rows} total={statsPagoCancel.totales.total} />
              </Grid>
              <Grid item xs={12} md={6}>
                <StatsList title="Canceladas · por categoría" rows={statsCategoriaCancel.rows} total={statsCategoriaCancel.totales.total} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  * En categoría se prorratea el total de cada venta entre sus categorías para evitar doble conteo.
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Ventas (SOLO vigentes) con acciones */}
          {tab === 1 && (
            loading ? (
              <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
            ) : (
              <SalesTable
                rows={ventasFiltradas}
                pagina={pagina}
                rowsPerPage={rowsPerPage}
                onPage={handleChangePage}
                onRpp={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPagina(0); }}
                fechaFallback={fechaInicio}
                abrirTicket={(id) => { setVentaSeleccionada(id); setModalTicketOpen(true); }}
                abrirDetalles={(id) => { setVentaSeleccionada(id); setModalDetallesOpen(true); }}
                cancelarVenta={(id) => { setVentaSeleccionada(id); setModalCancelarOpen(true); }}
                devolverVenta={(id) => { setVentaSeleccionada(id); setModalDevolverOpen(true); }}
              />
            )
          )}

          {/* Por tipo de pago (vigentes) */}
          {tab === 2 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight="bold">Selecciona un tipo de pago</Typography>
              <PaymentPicker
                stats={statsPago}
                selected={pagoSeleccionado}
                onSelect={(val) => setPagoSeleccionado(val === pagoSeleccionado ? "" : val)}
              />
              {!pagoSeleccionado ? (
                <Typography variant="body2" color="text.secondary">Elige un tipo de pago para ver las ventas correspondientes.</Typography>
              ) : loading ? (
                <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
              ) : ventasPorPago.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No hay ventas para {LABELS_PAGO[pagoSeleccionado] || pagoSeleccionado} en el rango seleccionado.</Typography>
              ) : (
                <SalesCardsGrid
                  rows={ventasPorPago}
                  abrirTicket={(id) => { setVentaSeleccionada(id); setModalTicketOpen(true); }}
                  abrirDetalles={(id) => { setVentaSeleccionada(id); setModalDetallesOpen(true); }}
                />
              )}
            </Stack>
          )}

          {/* Por categoría (vigentes) */}
          {tab === 3 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight="bold">Selecciona una categoría</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
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
                <Typography variant="body2" color="text.secondary">Elige una categoría para ver las ventas correspondientes.</Typography>
              ) : loading ? (
                <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
              ) : ventasPorCategoria.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No hay ventas para la categoría “{categoriaTabSel}” en el rango seleccionado.</Typography>
              ) : (
                <SalesCardsGrid
                  rows={ventasPorCategoria}
                  abrirTicket={(id) => { setVentaSeleccionada(id); setModalTicketOpen(true); }}
                  abrirDetalles={(id) => { setVentaSeleccionada(id); setModalDetallesOpen(true); }}
                />
              )}
            </Stack>
          )}

          {/* Cancelaciones (historial + KPIs) */}
          {tab === 4 && (
            loading ? (
              <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
            ) : (
              <>
                <Grid container spacing={2} sx={{ px: 2, pb: 1 }}>
                  <Grid item xs={12} md={4}>
                    <KpiCard title="Canceladas (importe)" value={money(totalCanceladas)} hint={`Periodo: ${textoRango}`} color="error" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <KpiCard title="# Canceladas" value={ticketsCanceladas} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <KpiCard title="Ticket prom. cancelada" value={money(ticketPromCancelada)} />
                  </Grid>
                </Grid>

                {ventasCanceladas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
                    No hay cancelaciones/devoluciones en el rango seleccionado.
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 440, overflowY: "auto", px: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell align="center"><strong>Folio</strong></TableCell>
                          <TableCell align="center"><strong>Fecha</strong></TableCell>
                          <TableCell align="center"><strong>Total</strong></TableCell>
                          <TableCell align="center"><strong>Pago</strong></TableCell>
                          <TableCell align="center"><strong>Estado</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ventasCanceladas.map((v) => (
                          <TableRow
                            key={v.id}
                            sx={{
                              backgroundColor:
                                v.status === "cancelled" ? "#ffebee"
                                : v.status === "partially_cancelled" ? "#fff8e1"
                                : "#e3f2fd",
                            }}
                          >
                            <TableCell align="center">#{v.id}</TableCell>
                            <TableCell align="center">
                              {v.created_at
                                ? format(parseISO(v.created_at.slice(0, 10)), "d 'de' MMMM 'del' yyyy", { locale: es })
                                : "—"}
                            </TableCell>
                            <TableCell align="center">{money(v.total_amount)}</TableCell>
                            <TableCell align="center">{LABELS_PAGO[v.payment_method] || "—"}</TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={
                                  v.status === "cancelled" ? "Cancelada"
                                  : v.status === "partially_cancelled" ? "Parcial"
                                  : "Devuelta"
                                }
                                color={
                                  v.status === "cancelled" ? "error"
                                  : v.status === "partially_cancelled" ? "warning"
                                  : "info"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </>
            )
          )}
        </Paper>
      </Stack>

      {/* Modales */}
      <ModalTicketVenta
        open={modalTicketOpen}
        onClose={() => setModalTicketOpen(false)}
        ventaId={ventaSeleccionada}
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
        onSuccess={() => { setModalCancelarOpen(false); handleFiltrar(); }}
      />
      <ModalDevolverVenta
        open={modalDevolverOpen}
        onClose={() => setModalDevolverOpen(false)}
        ventaId={ventaSeleccionada}
        onSuccess={() => { setModalDevolverOpen(false); handleFiltrar(); }}
      />
    </Box>
  );
}
