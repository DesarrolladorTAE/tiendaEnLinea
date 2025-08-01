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
  MenuItem,
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

  const abrirModalTicket = (ventaId) => {
    setVentaSeleccionada(ventaId);
    setModalTicketOpen(true);
  };

  const cargarVentasDelDia = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/ventas/mis-ventas", {
        params: {
          fecha_inicio: hoy,
          fecha_fin: hoy,
        },
      });
      setVentas(data);
    } catch (error) {
      console.error("Error al cargar ventas del día", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarVentasFiltradas = async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/ventas/mis-ventas", {
        params: {
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          tipo_pago: tipoPago || undefined,
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
    cargarVentasDelDia();
  }, []);

  const handleChangePage = (event, newPage) => setPagina(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPagina(0);
  };

  const getTotalVentas = () => {
    return ventas.reduce((acum, v) => acum + Number(v.total_amount || 0), 0);
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

      {/* Total de ventas con estilo */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: "#e8f5e9",
          border: "1px solid #a5d6a7",
          padding: 2,
          mb: 2,
          width: "fit-content",
          mx: "auto",
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          color="green"
          textAlign="center"
        >
          💵 Total de ventas Del Dia : ${getTotalVentas().toFixed(2)}
        </Typography>
      </Paper>

      {/* Filtros + Tabla */}
      <Grid container spacing={3}>
        {/* Filtros */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography fontWeight="bold" gutterBottom>
              Filtros
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
              <TextField
                select
                label="Tipo de pago"
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="tarjeta_credito">Tarjeta de crédito</MenuItem>
                <MenuItem value="tarjeta_debito">Tarjeta de débito</MenuItem>
              </TextField>
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
                onClick={cargarVentasDelDia}
              >
                Limpiar filtros
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Tabla */}
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
                        <TableCell><strong>Folio</strong></TableCell>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Total</strong></TableCell>
                        <TableCell><strong>Tipo de pago</strong></TableCell>
                        <TableCell><strong>Acciones</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ventas
                        .slice(
                          pagina * rowsPerPage,
                          pagina * rowsPerPage + rowsPerPage
                        )
                        .map((venta) => (
                          <TableRow key={venta.id} hover sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
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
                              {venta.tipo_pago?.replace("_", " ")?.toUpperCase() || "—"}
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
