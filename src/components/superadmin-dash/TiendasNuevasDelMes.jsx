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

const TiendasNuevasDelMes = () => {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);

  useEffect(() => {
    axiosSuperadmin
      .get("/admin/tiendas-del-mes")
      .then((res) => {
        setTiendas(res.data.data || []);
      })
      .catch((err) => {
        console.error("Error al obtener tiendas nuevas:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (event, tienda) => {
    setAnchorEl(event.currentTarget);
    setSelectedTienda(tienda);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTienda(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "popover-tiendas" : undefined;

  const formatearFechaLarga = (fechaISO) => {
    if (!fechaISO) return "N/D";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Box mt={5}>
      <Typography variant="h6" gutterBottom>
        🆕 Tiendas Nuevas del Mes
      </Typography>

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
          <Table stickyHeader size="small" sx={{ minWidth: 200 }}>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>¿Activa?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiendas.map((tienda, idx) => (
                <TableRow
                  key={idx}
                  hover
                  onClick={(e) => handleRowClick(e, tienda)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{tienda.nombre}</TableCell>
                  <TableCell>
                    {tienda.estado === "Activa" ? "✅ Sí" : "❌ No"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {selectedTienda && (
          <Box p={2} maxWidth={600}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedTienda.nombre}
            </Typography>
            <Typography>📞 Tel: {selectedTienda.telefono || "N/D"}</Typography>
            <Typography>📦 Plan: {selectedTienda.plan || "Sin plan"}</Typography>
            <Typography>
              🗓️ Registro:{" "}
              {formatearFechaLarga(selectedTienda.fecha_creacion)}
            </Typography>
            <Typography>
              ⏳ Vencimiento:{" "}
              {formatearFechaLarga(selectedTienda.fecha_vencimiento)}
            </Typography>
            <Box mt={2} textAlign="right">
              <Button size="small" onClick={handleClose}>
                Cerrar
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default TiendasNuevasDelMes;
