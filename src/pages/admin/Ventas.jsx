import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Pagination,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import axiosClient from "../../config/axiosClient";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import TicketVenta from "../../components/tickets/TicketVenta";

const ITEMS_PER_PAGE = 7;

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filtroFecha, setFiltroFecha] = useState("todos");
  const [openTicket, setOpenTicket] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const ticketRef = useRef();

  useEffect(() => {
    axiosClient
      .get("/admin/ventas")
      .then(({ data }) => {
        setVentas(
          data.data.map((venta) => ({
            ...venta,
            total_amount: Number(venta.total_amount),
            paid_amount: Number(venta.paid_amount),
          }))
        );
      })
      .catch((error) => {
        console.error("Error al obtener ventas:", error);
      });
  }, []);

  const filtrarPorFecha = (ventas) => {
    const ahora = new Date();
    return ventas.filter((venta) => {
      const fechaVenta = new Date(venta.created_at);

      if (filtroFecha === "hoy") {
        return fechaVenta.toDateString() === ahora.toDateString();
      }

      if (filtroFecha === "7dias") {
        const hace7Dias = new Date();
        hace7Dias.setDate(ahora.getDate() - 7);
        return fechaVenta >= hace7Dias;
      }

      if (filtroFecha === "mes") {
        return (
          fechaVenta.getMonth() === ahora.getMonth() &&
          fechaVenta.getFullYear() === ahora.getFullYear()
        );
      }

      return true; // "todos"
    });
  };

  const ventasFiltradas = useMemo(() => {
    let ventasFiltradas = filtrarPorFecha(ventas);

    if (busqueda) {
      ventasFiltradas = ventasFiltradas.filter(
        (v) =>
          v.pos_location?.name.toLowerCase().includes(busqueda.toLowerCase()) ||
          v.status.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    return ventasFiltradas;
  }, [busqueda, ventas, filtroFecha]);

  const ventasOrdenadas = useMemo(() => {
    const lista = [...ventasFiltradas];
    if (sortConfig.key) {
      lista.sort((a, b) => {
        let aVal, bVal;

        if (sortConfig.key === "pos_location.name") {
          aVal = a.pos_location?.name?.toLowerCase() || "";
          bVal = b.pos_location?.name?.toLowerCase() || "";
        } else {
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
          if (typeof aVal === "string") aVal = aVal.toLowerCase();
          if (typeof bVal === "string") bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return lista;
  }, [ventasFiltradas, sortConfig]);

  const totalPaginas = Math.ceil(ventasOrdenadas.length / ITEMS_PER_PAGE);

  const ventasPagina = useMemo(() => {
    const start = (pagina - 1) * ITEMS_PER_PAGE;
    return ventasOrdenadas.slice(start, start + ITEMS_PER_PAGE);
  }, [pagina, ventasOrdenadas]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setPagina(1);
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <KeyboardArrowUpIcon fontSize="small" />
      ) : (
        <KeyboardArrowDownIcon fontSize="small" />
      );
    }
    return <KeyboardArrowUpIcon fontSize="small" sx={{ opacity: 0.3 }} />;
  };

  const handleOpenTicket = (venta) => {
    setVentaSeleccionada(venta);
    setOpenTicket(true);
  };

  const handleCloseTicket = () => {
    setOpenTicket(false);
    setVentaSeleccionada(null);
  };

  const handlePrint = () => {
    if (ticketRef.current) {
      const printWindow = window.open("", "_blank", "width=600,height=800");
      printWindow.document.write("<html><head><title>Ticket</title></head><body>");
      printWindow.document.write(ticketRef.current.innerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Typography variant="h5" gutterBottom>
            Historial de Ventas
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Buscar por estado o punto de venta"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              variant="outlined"
              size="small"
              fullWidth
            />

            <FormControl size="small" fullWidth sx={{ minWidth: 180 }}>
              <InputLabel>Filtrar por fecha</InputLabel>
              <Select
                value={filtroFecha}
                label="Filtrar por fecha"
                onChange={(e) => {
                  setFiltroFecha(e.target.value);
                  setPagina(1);
                }}
              >
                <MenuItem value="todos">Todas</MenuItem>
                <MenuItem value="hoy">Hoy</MenuItem>
                <MenuItem value="7dias">Últimos 7 días</MenuItem>
                <MenuItem value="mes">Este mes</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              border: "1px solid #eee",
              borderRadius: 1,
            }}
          >
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      onClick={() => requestSort("created_at")}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        width: 160,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Fecha {renderSortIcon("created_at")}
                      </Stack>
                    </TableCell>

                    <TableCell
                      onClick={() => requestSort("total_amount")}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        width: 120,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Total {renderSortIcon("total_amount")}
                      </Stack>
                    </TableCell>

                    <TableCell
                      onClick={() => requestSort("pos_location.name")}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        width: 200,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Punto de Venta {renderSortIcon("pos_location.name")}
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ width: 120 }}>Estado</TableCell>

                    <TableCell sx={{ width: 100 }} align="center">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {ventasPagina.map((venta) => (
                    <TableRow
                      key={venta.id}
                      sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                    >
                      <TableCell>{new Date(venta.created_at).toLocaleString()}</TableCell>
                      <TableCell>${venta.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{venta.pos_location?.name || "-"}</TableCell>
                      <TableCell>{venta.status === "paid" ? "Pagado" : venta.status}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleOpenTicket(venta)}>
                            <EditNoteIcon fontSize="small" />
                          </IconButton>
                          <IconButton>
                            <MoreHorizIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #eee" }}>
            <Stack spacing={2} alignItems="center">
              <Pagination
                count={totalPaginas}
                page={pagina}
                onChange={(_, v) => setPagina(v)}
                shape="rounded"
                color="primary"
              />
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openTicket} onClose={handleCloseTicket} maxWidth="xs" fullWidth>
        <DialogContent>
          {ventaSeleccionada && (
            <div ref={ticketRef}>
              <TicketVenta
                venta={ventaSeleccionada}
                tienda={{
                  nombre: "Mi Tienda Ejemplo",
                  direccion: "Calle Falsa 123",
                  telefono: "555-555-5555",
                }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrint} variant="contained" color="primary">
            Imprimir Ticket
          </Button>
          <Button onClick={handleCloseTicket} variant="outlined" color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
