// TablaTiendas.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Typography,
  TextField,
  Pagination,
  Fade,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import AddIcon from "@mui/icons-material/Add";
import ModalHistorialSuscripciones from "./ModalHistorialSuscripciones.jsx";
import ModalAgregarSuscripcion from "./ModalAgregarSuscripcion";
import planes from "../../utils/planes";

const filasPorPagina = 10;

const TablaTiendas = ({ tiendas }) => {
  // ===== Estado local de datos para poder mutarlos sin recargar =====
  const [data, setData] = useState(() => Array.isArray(tiendas) ? tiendas : []);

  useEffect(() => {
    // si cambian desde el padre, sincroniza
    setData(Array.isArray(tiendas) ? tiendas : []);
  }, [tiendas]);

  useEffect(() => {
    console.log("TIENDAS RECIBIDAS:", tiendas);
  }, [tiendas]);

  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [abrirHistorial, setAbrirHistorial] = useState(false);
  const [abrirAgregar, setAbrirAgregar] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mostrarFecha, setMostrarFecha] = useState(null);

  const estaVencido = (fecha) => {
    if (!fecha) return true;
    return new Date(fecha) < new Date();
  };

  // ====== filtros y paginado sobre "data" local ======
  const tiendasFiltradas = useMemo(
    () =>
      (data || [])
        .filter((t) => Boolean(t.is_active))
        .filter((t) => (t.name || "").toLowerCase().includes(filtro.toLowerCase())),
    [data, filtro]
  );

  const totalPaginas = Math.ceil(tiendasFiltradas.length / filasPorPagina) || 1;
  const tiendasPaginadas = useMemo(
    () =>
      tiendasFiltradas.slice(
        (pagina - 1) * filasPorPagina,
        pagina * filasPorPagina
      ),
    [tiendasFiltradas, pagina]
  );

  useEffect(() => {
    setPagina(1);
  }, [filtro]);

  const limpiarFiltro = () => setFiltro("");

  const obtenerNombrePlan = (planId) => {
    if (!planId) return "Sin plan activo";
    const plan = planes.find((p) => p.plan_id === planId);
    return plan ? plan.nombre : "Desconocido";
  };

  // ====== callback cuando el modal guarda exitosamente ======
  const handleModalSaved = (updated) => {
    if (!updated || !updated.id) {
      // si no regresa la tienda completa, no hacemos nada
      setAbrirAgregar(false);
      setTiendaSeleccionada(null);
      return;
    }
    setData((prev) =>
      (prev || []).map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
    setAbrirAgregar(false);
    setTiendaSeleccionada(null);

    // Si se está viendo el diálogo de fecha de esa tienda, también refresca
    if (mostrarFecha && mostrarFecha.id === updated.id) {
      setMostrarFecha((prev) => ({ ...(prev || {}), ...updated }));
    }
  };

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="start" alignItems="center" gap={2}>
        <TextField
          label="Buscar tienda"
          variant="outlined"
          size="small"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          sx={{ width: 250 }}
        />
        <Button onClick={limpiarFiltro} size="small" color="primary">
          Limpiar
        </Button>
      </Box>

      <Fade in timeout={800}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: 4, backgroundColor: "#e3f2fd" }}
        >
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#bbdefb" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiendasPaginadas.map((tienda, index) => (
                <TableRow
                  key={tienda.id}
                  sx={{
                    transition: "0.2s",
                    backgroundColor: index % 2 === 0 ? "#e3f2fd" : "#e1f5fe",
                    "&:hover": {
                      backgroundColor: "#b3e5fc",
                      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                      transform: "scale(1.005)",
                    },
                  }}
                >
                  <TableCell>{tienda.name}</TableCell>
                  <TableCell>
                    {tienda.plan_id ? (
                      obtenerNombrePlan(tienda.plan_id)
                    ) : (
                      <Chip label="Sin plan activo" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={estaVencido(tienda.plan_expiration) ? "Inactiva" : "Activa"}
                      color={estaVencido(tienda.plan_expiration) ? "error" : "success"}
                      onClick={() => setMostrarFecha(tienda)}
                      sx={{ cursor: "pointer" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Historial de suscripciones">
                      <IconButton
                        onClick={() => {
                          setTiendaSeleccionada(tienda);
                          setAbrirHistorial(true);
                        }}
                        sx={{ color: "#2196F3" }}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Agregar suscripción">
                      <IconButton
                        onClick={() => {
                          setTiendaSeleccionada(tienda);
                          setAbrirAgregar(true);
                        }}
                        sx={{ color: "#FF9800" }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {tiendasPaginadas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography align="center" sx={{ py: 2, opacity: 0.8 }}>
                      No hay tiendas que coincidan con tu búsqueda.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Fade>

      {totalPaginas > 1 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Pagination
            count={totalPaginas}
            page={pagina}
            onChange={(e, value) => setPagina(value)}
            color="primary"
          />
        </Box>
      )}

      {mostrarFecha && (
        <Dialog
          open
          onClose={() => setMostrarFecha(null)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Información de expiración</DialogTitle>
          <DialogContent>
            <Typography>
              {!mostrarFecha.plan_expiration
                ? `La versión demo terminó el ${new Date(
                    mostrarFecha.trial_ends_at
                  ).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : estaVencido(mostrarFecha.plan_expiration)
                ? `Esta tienda venció el ${new Date(
                    mostrarFecha.plan_expiration
                  ).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : `Esta tienda vencerá el ${new Date(
                    mostrarFecha.plan_expiration
                  ).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`}
            </Typography>
          </DialogContent>
        </Dialog>
      )}

      {abrirHistorial && tiendaSeleccionada && (
        <ModalHistorialSuscripciones
          open={abrirHistorial}
          onClose={() => setAbrirHistorial(false)}
          tienda={tiendaSeleccionada}
        />
      )}

      {abrirAgregar && tiendaSeleccionada && (
        <ModalAgregarSuscripcion
          open={abrirAgregar}
          onClose={() => {
            setAbrirAgregar(false);
            setTiendaSeleccionada(null);
          }}
          tienda={tiendaSeleccionada}
          onSaved={handleModalSaved}  
        />
      )}
    </Box>
  );
};

export default TablaTiendas;
