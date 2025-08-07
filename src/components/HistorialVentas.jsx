import React, { useEffect, useState } from "react";
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
import axiosClient from "../config/axiosClientPOS";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import ModalTicketVenta from "./ModalTicketVenta";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ModalDetallesVenta from "./ModalDetallesVenta";
import ReplayIcon from "@mui/icons-material/Replay";

export default function HistorialPOS({ cambiarVista }) {
  const [modoConsulta, setModoConsulta] = useState("dia");
  const hoy = new Date().toISOString().slice(0, 10);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [tipoPago, setTipoPago] = useState("");
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

  // Función para manejar la lógica del botón filtrar
  const handleFiltrar = async () => {
    setLoading(true);

    const params = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    // Solo agrega el filtro si está definido y no está vacío
    if (tipoPago && tipoPago !== "") {
      params.payment_method = tipoPago;
    }

    try {
      const { data } = await axiosClient.get("/ventas/mis-ventas", { params });
      // console.log("👉 Datos de ventas desde el backend:", data);
      setVentas(data);
    } catch (error) {
      console.error("Error al filtrar ventas", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalVentas = () => {
    return ventas.reduce((acum, v) => acum + Number(v.total_amount || 0), 0);
  };

  const textoTotalVentas =
    modoConsulta === "dia"
      ? `💵 Total de ventas del día: $ ${getTotalVentas().toFixed(
          2
        )} pesos MXN.`
      : `💵 Total de ventas del ${format(
          parseISO(fechaInicio),
          "d 'de' MMMM 'del' yyyy",
          { locale: es }
        )} al ${format(parseISO(fechaFin), "d 'de' MMMM 'del' yyyy", {
          locale: es,
        })}: $ ${getTotalVentas().toFixed(2)} pesos MXN.`;

  useEffect(() => {
    handleFiltrar(); // para que cargue las ventas del día en el primer render
  }, []);

  const handleChangePage = (event, newPage) => setPagina(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPagina(0);
  };

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
              paddingX: 3,
              paddingY: 1.5,
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
              "&:hover": {
                borderWidth: 2,
              },
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
        <Paper
          elevation={3}
          sx={{ width: { xs: "100%", md: 300 }, p: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Filtros
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <TextField
              select
              label="Modo de consulta"
              value={modoConsulta}
              size="small"
              onChange={(e) => {
                setModoConsulta(e.target.value);
                if (e.target.value === "dia") {
                  setFechaInicio(hoy);
                  setFechaFin(hoy);
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

            <Button
              variant="contained"
              fullWidth
              onClick={handleFiltrar}
              disabled={loading}
            >
              {loading ? "Filtrando..." : "Filtrar"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => {
                setModoConsulta("dia");
                setFechaInicio(hoy);
                setFechaFin(hoy);
                setTipoPago("");
                handleFiltrar();
              }}
            >
              Limpiar filtros
            </Button>
          </Stack>
        </Paper>

        {/* Tabla */}
        <Paper sx={{ flex: 1, p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Historial de Ventas del POS
          </Typography>

          <Box
            sx={{
              backgroundColor: "#e8f5e9",
              border: "1px solid #a5d6a7",
              borderRadius: 1,
              p: 2,
              mb: 2,
              textAlign: "center",
            }}
          >
            <Typography fontWeight="bold" color="green">
              {textoTotalVentas}
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      align="center"
                      sx={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <strong>Folio</strong>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <strong>Fecha</strong>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <strong>Tipo de pago</strong>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ textAlign: "center", verticalAlign: "middle" }}
                    >
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventas
                    .slice(
                      pagina * rowsPerPage,
                      pagina * rowsPerPage + rowsPerPage
                    )
                    .map((venta) => (
                      <TableRow key={venta.id} hover>
                        <TableCell
                          align="center"
                          sx={{ textAlign: "center", verticalAlign: "middle" }}
                        >
                          {venta.id}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ textAlign: "center", verticalAlign: "middle" }}
                        >
                          {format(
                            parseISO(fechaInicio),
                            "d 'de' MMMM 'del' yyyy",
                            { locale: es }
                          )}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ textAlign: "center", verticalAlign: "middle" }}
                        >
                          ${Number(venta.total_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ textAlign: "center", verticalAlign: "middle" }}
                        >
                          {venta.payment_method === "efectivo" && (
                            <Chip
                              label="Efectivo"
                              color="success"
                              size="small"
                            />
                          )}
                          {venta.payment_method === "tc" && (
                            <Chip
                              label="Tarjeta de crédito"
                              color="error"
                              size="small"
                            />
                          )}
                          {venta.payment_method === "td" && (
                            <Chip
                              label="Tarjeta de débito"
                              color="info"
                              size="small"
                            />
                          )}
                          {venta.payment_method === "transferencia" && (
                            <Chip
                              label="Transferencia"
                              color="primary"
                              size="small"
                            />
                          )}
                          {!["efectivo", "tc", "td", "transferencia"].includes(
                            venta.payment_method
                          ) && (
                            <Chip label="—" variant="outlined" size="small" />
                          )}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="100%"
                          >
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                color="primary"
                                onClick={() => abrirModalTicket(venta.id)}
                              >
                                <PrintIcon />
                              </IconButton>
                              <IconButton
                                color="secondary"
                                onClick={() => abrirModalDetalles(venta.id)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Stack>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <TablePagination
            component="div"
            count={ventas.length}
            page={pagina}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
            rowsPerPageOptions={[5, 10, 25]}
          />
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
    </Box>
  );
}
