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
import CancelIcon from "@mui/icons-material/Cancel";
import PrintIcon from "@mui/icons-material/Print";
import ReplayIcon from "@mui/icons-material/Replay";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import axiosClient from "../config/axiosClientPOS";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";

//Modales
import ModalTicketVenta from "./ModalTicketVenta";
import ModalCancelarVenta from "./ModalCancelarVenta";
import ModalDevolverVenta from "./ModalDevolverVenta";

export default function CancelaDevoluciones({ cambiarVista }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [pagina, setPagina] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalTicketAbierto, setModalTicketAbierto] = useState(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [modalDevolverAbierto, setModalDevolverAbierto] = useState(false);

  const handleFiltrar = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/ventas/mis-ventas", {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      });
      setVentas(data);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFiltrar();
  }, []);

  const handleChangePage = (event, newPage) => setPagina(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPagina(0);
  };

  const abrirModalAccion = (ventaId) => {
    console.log("Abrir acción para venta ID:", ventaId);
  };
  const abrirModalTicket = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalTicketAbierto(true);
  };

  const manejarCancelacion = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalCancelarAbierto(true);
  };

  const manejarDevolucion = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalDevolverAbierto(true);
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
            color="secondary"
            size="large"
            startIcon={<HistoryIcon />}
            sx={{
              borderRadius: 3,
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
            }}
            onClick={() => cambiarVista("historial")}
          >
            Historial
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
              type="date"
              label="Desde"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              fullWidth
            />
            <TextField
              type="date"
              label="Hasta"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              fullWidth
            />
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
                setFechaInicio(hoy);
                setFechaFin(hoy);
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
            🧾 Cancelaciones y Devoluciones
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : (
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
                      <strong>Estado</strong>
                    </TableCell>
                    <TableCell align="center">
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
                      <TableRow
                        key={venta.id}
                        hover
                        sx={{
                          backgroundColor:
                            venta.status === "cancelled"
                              ? "#ffebee"
                              : venta.status === "devuelta"
                              ? "#e3f2fd"
                              : venta.status === "partially_cancelled"
                              ? "#fff3e0"
                              : "inherit",
                        }}
                      >
                        <TableCell align="center">{venta.id}</TableCell>
                        <TableCell align="center">
                          {format(
                            parseISO(venta.created_at),
                            "d 'de' MMMM 'del' yyyy",
                            {
                              locale: es,
                            }
                          )}
                        </TableCell>
                        <TableCell align="center">
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
                          {!["efectivo", "tc", "td"].includes(
                            venta.payment_method
                          ) && (
                            <Chip label="—" variant="outlined" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              venta.status === "cancelled"
                                ? "Cancelada"
                                : venta.status === "partially_cancelled"
                                ? "Parcial"
                                : venta.status === "devuelta"
                                ? "Devuelta"
                                : venta.status === "paid"
                                ? "Pagada"
                                : "Desconocido"
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
                            size="small"
                            variant={
                              venta.status === "paid" ? "outlined" : "filled"
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            {venta.status === "cancelled" ? (
                              <>
                                <Chip
                                  label="Cancelada"
                                  color="error"
                                  size="small"
                                />
                                <IconButton
                                  color="primary"
                                  onClick={() => abrirModalTicket(venta.id)}
                                  title="Imprimir ticket"
                                >
                                  <PrintIcon />
                                </IconButton>
                              </>
                            ) : venta.status === "devuelta" ? (
                              <>
                                <Chip
                                  label="Devuelta"
                                  color="info"
                                  size="small"
                                />
                                <IconButton
                                  color="primary"
                                  onClick={() => abrirModalTicket(venta.id)}
                                  title="Imprimir ticket"
                                >
                                  <PrintIcon />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <IconButton
                                  color="error"
                                  onClick={() => manejarCancelacion(venta.id)}
                                  title="Cancelar venta"
                                >
                                  <CancelIcon />
                                </IconButton>

                                <IconButton
                                  color="info"
                                  onClick={() => manejarDevolucion(venta.id)}
                                  title="Devolver venta"
                                >
                                  <ReplayIcon />
                                </IconButton>
                              </>
                            )}
                          </Stack>
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
          <ModalTicketVenta
            open={modalTicketAbierto}
            onClose={() => setModalTicketAbierto(false)}
            ventaId={ventaSeleccionada}
          />

          <ModalCancelarVenta
            open={modalCancelarAbierto}
            onClose={() => setModalCancelarAbierto(false)}
            ventaId={ventaSeleccionada}
            onSuccess={handleFiltrar}
          />

          <ModalDevolverVenta
            open={modalDevolverAbierto}
            onClose={() => setModalDevolverAbierto(false)}
            ventaId={ventaSeleccionada}
          />
        </Paper>
      </Stack>
    </Box>
  );
}
