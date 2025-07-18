import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  CircularProgress,
  Popover,
  Button,
} from "@mui/material";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import { showSuccess, showError } from "../../utils/alerts";

const TiendasPorVencer = () => {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificandoTodas, setNotificandoTodas] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [enviandoIndividual, setEnviandoIndividual] = useState(false);

  const cargarTiendas = () => {
    setLoading(true);
    axiosSuperadmin
      .get("/admin/tiendas-vencer")
      .then((res) => setTiendas(res.data.data || []))
      .catch(() => showError("No se pudo cargar la tabla."))
      .finally(() => setLoading(false));
  };

  const formatearFechaLarga = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const opciones = { day: "numeric", month: "long", year: "numeric" };
    return fecha.toLocaleDateString("es-MX", opciones);
  };

  useEffect(() => {
    cargarTiendas();
  }, []);

  const handleRowClick = (event, tienda) => {
    setAnchorEl(event.currentTarget);
    setSelectedTienda(tienda);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTienda(null);
  };

  const enviarNotificacion = async () => {
    if (!selectedTienda) return;
    setEnviandoIndividual(true);
    try {
      await axiosSuperadmin.post("/admin/tiendas-vencer/notificar", {
        store_id: selectedTienda.id,
      });
      showSuccess("Notificación enviada a " + selectedTienda.nombre);
    } catch {
      showError("No se pudo enviar el mensaje.");
    } finally {
      setEnviandoIndividual(false);
      handleClose();
    }
  };

  const enviarNotificacionMasiva = async () => {
    setNotificandoTodas(true);
    try {
      const res = await axiosSuperadmin.post("/admin/tiendas-vencer/notificar");
      const exitosas = res.data.resultados.filter(
        (r) => r.estado === "Enviado"
      );
      showSuccess(`Se enviaron ${exitosas.length} mensajes correctamente.`);
    } catch (err) {
      showError("No se pudo enviar la notificación masiva.");
    } finally {
      setNotificandoTodas(false);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "popover-tiendas" : undefined;

  return (
    <Box mt={5}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">⏳ Tiendas por Vencer este Mes</Typography>
        <Button
          variant="contained"
          color="secondary"
          disabled={notificandoTodas || tiendas.length === 0}
          onClick={enviarNotificacionMasiva}
          startIcon={notificandoTodas ? <CircularProgress size={20} /> : null}
        >
          {notificandoTodas ? "Enviando..." : "Enviar a todas"}
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 400,
            overflow: "auto",
            border: "1px solid #ddd",
            borderRadius: 2,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Días restantes</TableCell>
                <TableCell>Plan</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...tiendas]
                .sort((a, b) => a.dias_restantes - b.dias_restantes)
                .map((tienda) => {
                  const dias = Math.floor(tienda.dias_restantes);
                  const yaVencio = dias < 0;

                  return (
                    <TableRow
                      key={tienda.id}
                      hover
                      onClick={(e) => handleRowClick(e, tienda)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: yaVencio ? "#ffebee" : "#e8f5e9", // rojo si ya venció, verde si aún no
                      }}
                    >
                      <TableCell>{tienda.nombre}</TableCell>
                      <TableCell>{dias}</TableCell>
                      <TableCell>{tienda.plan_nombre}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {selectedTienda && (
          <Box p={2} maxWidth={300}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedTienda.nombre}
            </Typography>
            <Typography>📞 Tel: {selectedTienda.telefono || "N/D"}</Typography>
            <Typography>
              {selectedTienda.dias_restantes < 0
                ? `Venció el ${formatearFechaLarga(selectedTienda.vence)}`
                : `Vence el ${formatearFechaLarga(selectedTienda.vence)}`}
            </Typography>

            <Box mt={2} textAlign="right">
              <Button onClick={handleClose} sx={{ mr: 1 }}>
                Cerrar
              </Button>
              <Button
                variant="contained"
                onClick={enviarNotificacion}
                disabled={enviandoIndividual}
                startIcon={
                  enviandoIndividual ? <CircularProgress size={20} /> : null
                }
              >
                {enviandoIndividual ? "Enviando..." : "Enviar WhatsApp"}
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default TiendasPorVencer;
