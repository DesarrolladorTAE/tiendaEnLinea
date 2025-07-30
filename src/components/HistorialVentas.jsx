import React, { useEffect, useState } from "react";
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
  TableContainer,
  TablePagination,
  TextField,
  IconButton,
  Grid,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PrintIcon from "@mui/icons-material/Print";
import axiosClient from "../config/axiosClientPOS";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ModalTicketVenta from "./ModalTicketVenta";

export default function HistorialPOS({ cambiarVista }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pagina, setPagina] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modalTicketOpen, setModalTicketOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const abrirModalTicket = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalTicketOpen(true);
  };

  // 🔹 Consulta inicial: todas las ventas
  const cargarVentasIniciales = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/ventas/pos/historial");
      setVentas(data);
    } catch (error) {
      console.error("Error al cargar el historial del POS", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Consulta filtrada
  const cargarVentasFiltradas = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/ventas/mis-ventas", {
        params: {
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
        },
      });
      setVentas(data);
    } catch (error) {
      console.error("Error al filtrar ventas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentasIniciales();
  }, []);

  const handleChangePage = (event, newPage) => setPagina(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPagina(0);
  };

  return (
    <Box>
      {/* Botones de navegación */}
      <Box display="flex" justifyContent="center" mb={4}>
        <Stack direction="row" spacing={3}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            sx={{
              backgroundColor: "#4CAF50",
              borderRadius: 3,
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
              "&:hover": {
                backgroundColor: "#45A049",
              },
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
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
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
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              borderWidth: 2,
              boxShadow: 2,
              "&:hover": {
                borderWidth: 2,
              },
            }}
            onClick={() => cambiarVista("menu")}
          >
            Regresar al Panel
          </Button>
        </Stack>
      </Box>

      {/* Filtros + Tabla lado a lado */}
      <Grid container spacing={3}>
        {/* 🔍 Filtros en columna izquierda */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight="bold" gutterBottom>
              Filtros por fecha
            </Typography>
            <Stack spacing={2}>
              <TextField
                type="date"
                label="Fecha inicio"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
              <TextField
                type="date"
                label="Fecha fin"
                InputLabelProps={{ shrink: true }}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={cargarVentasFiltradas}
              >
                Filtrar
              </Button>
              <Button
                variant="outlined"
                fullWidth
                color="secondary"
                onClick={cargarVentasIniciales}
              >
                Limpiar filtros
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* 📊 Tabla en columna derecha */}
        <Grid item xs={12} md={9}>
          <Paper elevation={4} sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Historial de Ventas del POS
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell>Folio</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Pagado</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ventas
                        .slice(
                          pagina * rowsPerPage,
                          pagina * rowsPerPage + rowsPerPage
                        )
                        .map((venta) => (
                          <TableRow key={venta.id}>
                            <TableCell>{venta.id}</TableCell>
                            <TableCell>
                              {format(
                                new Date(venta.created_at),
                                "d 'de' MMMM 'del' yyyy, HH:mm",
                                { locale: es }
                              )}
                            </TableCell>
                            <TableCell>
                              ${Number(venta.total_amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ${Number(venta.paid_amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>{venta.items_count}</TableCell>
                            <TableCell>
                              {venta.status === "paid"
                                ? "Pagado"
                                : "Pendiente"}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                color="primary"
                                onClick={() => abrirModalTicket(venta.id)}
                              >
                                <PrintIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

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
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modal para ver ticket */}
      <ModalTicketVenta
        open={modalTicketOpen}
        onClose={() => setModalTicketOpen(false)}
        ventaId={ventaSeleccionada}
      />
    </Box>
  );
}
