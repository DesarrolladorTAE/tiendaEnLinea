import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import DatePicker from "react-datepicker";
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO } from "date-fns";
import { FiDownload, FiPrinter } from "react-icons/fi";
import "react-datepicker/dist/react-datepicker.css";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";

const HistorialRecargas = () => {
  const { pathname } = useLocation();
  const [recargas, setRecargas] = useState([]);
  const [filtro, setFiltro] = useState("hoy");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  useEffect(() => {
    axios.get("/ver-recargas").then((res) => setRecargas(res.data));
  }, []);

  const hoy = new Date();

  const recargasFiltradas = recargas.filter((r) => {
    const fecha = parseISO(r.created_at);
    switch (filtro) {
      case "hoy":
        return isSameDay(fecha, hoy);
      case "dia":
        return isSameDay(fecha, fechaSeleccionada);
      case "semana":
        return isSameWeek(fecha, hoy);
      case "mes":
        return isSameMonth(fecha, hoy);
      case "año":
        return isSameYear(fecha, hoy);
      default:
        return true;
    }
  });

  return (
    <LayoutOne headerTop="visible">
      <SEO titleTemplate="Historial de Recargas" />
      <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Historial de Recargas", path: pathname }]} />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
        📇 Historial de Recargas
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {['hoy', 'dia', 'semana', 'mes', 'año'].map((item) => (
            <Button
              key={item}
              variant={filtro === item ? "contained" : "outlined"}
              onClick={() => setFiltro(item)}
              color="primary"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Button>
          ))}

          {filtro === "dia" && (
            <DatePicker
              selected={fechaSeleccionada}
              onChange={(date) => setFechaSeleccionada(date)}
              customInput={<Button variant="outlined">Seleccionar Día</Button>}
            />
          )}

          {filtro === "mes" && (
            <Select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(Number(e.target.value))}
              size="small"
            >
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </MenuItem>
              ))}
            </Select>
          )}

          {filtro === "año" && (
            <Select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
              size="small"
            >
              {[2023, 2024, 2025, 2026].map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          )}
        </Box>

        <Paper elevation={3} sx={{ overflowX: "auto" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#0d1c71' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>Fecha</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Producto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Referencia</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Monto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Compañía</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Tipo</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Estado</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Opciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recargasFiltradas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(parseISO(r.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell>{r.producto?.Codigo || "N/A"}</TableCell>
                    <TableCell>{r.referencia}</TableCell>
                    <TableCell>${parseFloat(r.monto).toFixed(2)}</TableCell>
                    <TableCell>
                      {r.producto?.carrier?.Logotipo && (
                        <img
                          src={r.producto.carrier.Logotipo}
                          alt={r.producto.carrier.Nombre}
                          style={{ height: 20, marginRight: 5 }}
                        />
                      )}
                      {r.producto?.carrier?.Nombre || "Sin compañía"}
                    </TableCell>
                    <TableCell>
                      {r.producto?.Codigo?.startsWith("TEL") || r.producto?.Codigo?.startsWith("MOV") ? "Tiempo Aire" : "Paquete"}
                    </TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>
                      <IconButton><FiPrinter /></IconButton>
                      <IconButton><FiDownload /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {recargasFiltradas.length === 0 && (
          <Typography sx={{ mt: 2 }} color="text.secondary">
            No hay recargas para este filtro.
          </Typography>
        )}
      </Container>
    </LayoutOne>
  );
};

export default withAuth(HistorialRecargas);