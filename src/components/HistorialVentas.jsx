import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
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
  TablePagination,
  TextField,
  IconButton,
  MenuItem,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import axiosClientPOS from "../config/axiosClientPOS"; // para ventas
import axiosClient from "../config/axiosClient";       // para categorías
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import ModalTicketVenta from "./ModalTicketVenta";
import ModalDetallesVenta from "./ModalDetallesVenta";

const LABELS_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "Tarjeta de crédito",
  td: "Tarjeta de débito",
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const money = (n) =>
  (Number(n || 0)).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

export default function HistorialPOS({ cambiarVista }) {
  const [modoConsulta, setModoConsulta] = useState("dia");
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tipoPago, setTipoPago] = useState(""); // "" = todos

  // === NUEVO: categorías desde backend (/admin/categories) ===
  const [catList, setCatList] = useState([]); // [{id, name}]
  const [categoriaId, setCategoriaId] = useState(""); // "" = todas

  const [pagina, setPagina] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);

  const abrirModalTicket = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalTicketOpen(true);
  };

  const abrirModalDetalles = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalDetallesOpen(true);
  };

  // Traer ventas (por día o rango) + filtro de pago en backend si existe
// Traer ventas
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

  useEffect(() => {
    handleFiltrar(); // primer render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// Traer categorías (solo aquí usas axiosClient normal)
useEffect(() => {
  axiosClient
    .get("/admin/categories")
    .then(({ data }) => {
      const arr = Array.isArray(data) ? data : data?.data || [];
      const norm = arr.map((c) => ({
        id: c.id,
        name: c.name ?? c.nombre ?? String(c.id),
      }));
      setCatList(norm);
    })
    .catch((err) => {
      console.error("❌ Error al cargar categorías", err);
      setCatList([]);
    });
}, []);

  // Fallback: categorías detectadas desde los items de ventas (si el backend no devolvió)
  const categoriasDetectadas = useMemo(() => {
    const set = new Set();
    for (const v of ventas) {
      (v.items || []).forEach((it) => {
        const cat = (it?.category_name || "").trim();
        if (cat) set.add(cat);
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [ventas]);

  // Buscar el nombre de la categoría seleccionada por ID (para empatar por nombre cuando falte el ID en items)
  const categoriaSeleccionadaNombre = useMemo(() => {
    if (!categoriaId) return "";
    const found = catList.find((c) => String(c.id) === String(categoriaId));
    return (found?.name || "").trim();
  }, [categoriaId, catList]);

  // Ventas filtradas por categoría (cliente)
  const ventasFiltradas = useMemo(() => {
    if (!categoriaId) return ventas;

    return ventas.filter((v) => {
      const items = v.items || [];
      return items.some((it) => {
        const itCatId = it?.category_id;
        const itCatName = (it?.category_name || "").trim();

        const matchById =
          itCatId != null && String(itCatId) === String(categoriaId);
        const matchByName =
          !!categoriaSeleccionadaNombre &&
          itCatName === categoriaSeleccionadaNombre;

        return matchById || matchByName;
      });
    });
  }, [ventas, categoriaId, categoriaSeleccionadaNombre]);

  const totalVentasFiltradas = useMemo(
    () =>
      ventasFiltradas.reduce((ac, v) => ac + Number(v.total_amount || 0), 0),
    [ventasFiltradas]
  );

  const textoTotalVentas =
    modoConsulta === "dia"
      ? `💵 Total de ventas del día: ${money(totalVentasFiltradas)}.`
      : `💵 Total de ventas del ${format(parseISO(fechaInicio), "d 'de' MMMM 'del' yyyy", { locale: es })} al ${format(parseISO(fechaFin), "d 'de' MMMM 'del' yyyy", { locale: es })}: ${money(totalVentasFiltradas)}.`;

  // Estadística: por tipo de pago
  const statsPago = useMemo(() => {
    const map = new Map(); // payment_method -> { ventas, total }
    ventasFiltradas.forEach((v) => {
      const key = v.payment_method || "—";
      const cur = map.get(key) || { ventas: 0, total: 0 };
      cur.ventas += 1;
      cur.total += Number(v.total_amount || 0);
      map.set(key, cur);
    });
    const rows = Array.from(map.entries()).map(([pago, val]) => ({
      grupo: LABELS_PAGO[pago] || pago,
      ventas: val.ventas,
      total: val.total,
      promedio: val.ventas ? val.total / val.ventas : 0,
    }));
    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);
    return {
      rows,
      totales: {
        ventas: totVentas,
        total: totImporte,
        promedio: totVentas ? totImporte / totVentas : 0,
      },
    };
  }, [ventasFiltradas]);

  // Estadística: por categoría (agrupa por nombre disponible)
  const statsCategoria = useMemo(() => {
    const map = new Map(); // categoriaName -> { ventas, total }
    ventasFiltradas.forEach((v) => {
      const cats = new Set(
        (v.items || [])
          .map((it) => (it?.category_name || "").trim())
          .filter(Boolean)
      );
      const n = cats.size || 1;
      const prorrata = Number(v.total_amount || 0) / n;

      if (cats.size) {
        cats.forEach((c) => {
          const cur = map.get(c) || { ventas: 0, total: 0 };
          cur.ventas += 1;
          cur.total += prorrata;
          map.set(c, cur);
        });
      } else {
        const key = "Sin categoría";
        const cur = map.get(key) || { ventas: 0, total: 0 };
        cur.ventas += 1;
        cur.total += Number(v.total_amount || 0);
        map.set(key, cur);
      }
    });

    const rows = Array.from(map.entries())
      .map(([cat, val]) => ({
        grupo: cat || "Sin categoría",
        ventas: val.ventas,
        total: val.total,
        promedio: val.ventas ? val.total / val.ventas : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const totVentas = rows.reduce((a, r) => a + r.ventas, 0);
    const totImporte = rows.reduce((a, r) => a + r.total, 0);
    return {
      rows,
      totales: {
        ventas: totVentas,
        total: totImporte,
        promedio: totVentas ? totImporte / totVentas : 0,
      },
    };
  }, [ventasFiltradas]);

  const handleChangePage = (_, newPage) => setPagina(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPagina(0);
  };

  // Fuente de opciones para el <select> de Categoría:
  // 1) Preferimos las del backend (catList)
  // 2) Si vienen vacías, usamos las detectadas en ventas (fallback)
  const opcionesCategoria = useMemo(() => {
    if (catList.length > 0) {
      return catList.map((c) => ({ value: String(c.id), label: c.name }));
    }
    // fallback por nombre
    return categoriasDetectadas.map((n) => ({ value: n, label: n }));
  }, [catList, categoriasDetectadas]);

  const usaIdsDeBackend = catList.length > 0;

  return (
    <Box sx={{ p: 4 }}>
      {/* Botones de navegación */}
      <Box display="flex" justifyContent="center" mb={4}>
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
              fontSize: "1rem",
              boxShadow: 3,
              width: { xs: "100%", md: "auto" },
            }}
            onClick={() => cambiarVista("venta")}
          >
            Ventas
          </Button>

          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<ReplayIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
            }}
            onClick={() => cambiarVista("cancelaciones")}
          >
            Cancelaciones / Devoluciones
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
              fontSize: "1rem",
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
              fontSize: "1rem",
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

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Filtros */}
        <Paper elevation={3} sx={{ width: { xs: "100%", md: 320 }, p: 3, borderRadius: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Filtros
            </Typography>
            <IconButton size="small" onClick={handleFiltrar} title="Refrescar">
              <ReplayIcon />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TextField
              select
              label="Modo de consulta"
              value={modoConsulta}
              size="small"
              onChange={(e) => {
                const val = e.target.value;
                setModoConsulta(val);
                if (val === "dia") {
                  const h = hoyISO();
                  setFechaInicio(h);
                  setFechaFin(h);
                }
              }}
              fullWidth
            >
              <MenuItem value="dia">Ventas del día</MenuItem>
              <MenuItem value="personalizada">Personalizada</MenuItem>
            </TextField>

            {modoConsulta === "dia" ? (
              <TextField
                type="date"
                label="Fecha"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setFechaFin(e.target.value);
                }}
                fullWidth
              />
            ) : (
              <>
                <TextField
                  type="date"
                  label="Fecha inicio"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="Fecha fin"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  fullWidth
                />
              </>
            )}

            <TextField
              select
              label="Tipo de pago"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="tc">Tarjeta de crédito</MenuItem>
              <MenuItem value="td">Tarjeta de débito</MenuItem>
            </TextField>

            {/* === NUEVO: Categoría con datos del backend (IDs) y fallback por nombre === */}
            <TextField
              select
              label="Categoría"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              size="small"
              fullWidth
              helperText={
                usaIdsDeBackend
                  ? "Filtra por categoría (desde el backend)"
                  : "Filtra por categoría detectada desde ventas"
              }
            >
              <MenuItem value="">Todas</MenuItem>
              {opcionesCategoria.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="contained" fullWidth onClick={handleFiltrar} disabled={loading}>
              {loading ? "Filtrando..." : "Aplicar filtros"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => {
                const h = hoyISO();
                setModoConsulta("dia");
                setFechaInicio(h);
                setFechaFin(h);
                setTipoPago("");
                setCategoriaId("");
                handleFiltrar();
              }}
            >
              Limpiar filtros
            </Button>
          </Stack>
        </Paper>

        {/* Contenido principal */}
        <Stack spacing={3} sx={{ flex: 1 }}>
          {/* Total */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #a5d6a7",
              backgroundColor: "#e8f5e9",
            }}
          >
            <Typography align="center" fontWeight="bold" color="green">
              {textoTotalVentas}
            </Typography>
          </Paper>

          {/* Tabla de ventas */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Historial de Ventas del POS
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell align="center">
                          <strong>Folio</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Fecha</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Total</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Tipo de pago</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Acciones</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ventasFiltradas
                        .slice(
                          pagina * rowsPerPage,
                          pagina * rowsPerPage + rowsPerPage
                        )
                        .map((venta) => (
                          <TableRow key={venta.id} hover>
                            <TableCell align="center">{venta.id}</TableCell>
                            <TableCell align="center">
                              {venta.created_at
                                ? format(
                                    parseISO(venta.created_at.slice(0, 10)),
                                    "d 'de' MMMM 'del' yyyy",
                                    { locale: es }
                                  )
                                : format(
                                    parseISO(fechaInicio),
                                    "d 'de' MMMM 'del' yyyy",
                                    { locale: es }
                                  )}
                            </TableCell>
                            <TableCell align="center">
                              {money(venta.total_amount)}
                            </TableCell>
                            <TableCell align="center">
                              {LABELS_PAGO[venta.payment_method] ? (
                                <Chip
                                  label={LABELS_PAGO[venta.payment_method]}
                                  color={
                                    venta.payment_method === "efectivo"
                                      ? "success"
                                      : venta.payment_method === "transferencia"
                                      ? "primary"
                                      : venta.payment_method === "tc"
                                      ? "error"
                                      : venta.payment_method === "td"
                                      ? "info"
                                      : "default"
                                  }
                                  size="small"
                                />
                              ) : (
                                <Chip label="—" variant="outlined" size="small" />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                              >
                                <IconButton
                                  color="primary"
                                  onClick={() => abrirModalTicket(venta.id)}
                                  title="Imprimir / Ticket"
                                >
                                  <PrintIcon />
                                </IconButton>
                                <IconButton
                                  color="secondary"
                                  onClick={() => abrirModalDetalles(venta.id)}
                                  title="Detalles"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>

                <TablePagination
                  component="div"
                  count={ventasFiltradas.length}
                  page={pagina}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Filas por página"
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </Paper>

          {/* Tabla de Estadística por Tipo de Pago */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Estadística por Tipo de Pago
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Tipo de pago</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong># Ventas</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Ticket promedio</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Importe total</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsPago.rows.map((r) => (
                    <TableRow key={r.grupo}>
                      <TableCell>{r.grupo}</TableCell>
                      <TableCell align="right">{r.ventas}</TableCell>
                      <TableCell align="right">{money(r.promedio)}</TableCell>
                      <TableCell align="right">{money(r.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{statsPago.totales.ventas}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{money(statsPago.totales.promedio)}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{money(statsPago.totales.total)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>

          {/* Tabla de Estadística por Categoría */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Estadística por Categoría
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Categoría</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong># Ventas</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Ticket promedio*</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Importe total*</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsCategoria.rows.map((r) => (
                    <TableRow key={r.grupo}>
                      <TableCell>{r.grupo}</TableCell>
                      <TableCell align="right">{r.ventas}</TableCell>
                      <TableCell align="right">{money(r.promedio)}</TableCell>
                      <TableCell align="right">{money(r.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{statsCategoria.totales.ventas}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{money(statsCategoria.totales.promedio)}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{money(statsCategoria.totales.total)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Typography variant="caption" color="text.secondary">
              * Cuando una venta tiene productos de varias categorías, se prorratea el total de la venta entre las categorías presentes para evitar doble conteo.
            </Typography>
          </Paper>
        </Stack>
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
    </Box>
  );
}
