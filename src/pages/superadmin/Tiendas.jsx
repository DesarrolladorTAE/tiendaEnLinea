import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
  CircularProgress,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import DomainIcon from "@mui/icons-material/Domain";
import axiosSuperadmin from "../../config/axiosSuperadmin";

// Modales
import ModalDatosPersonales from "../../components/superadmin/modales/ModalDatosPersonales";
import ModalDatosFiscales from "../../components/superadmin/modales/ModalDatosFiscales";
import ModalTaeconta from "../../components/superadmin/modales/ModalDatosTaeconta";
import ModalPlanVencimiento from "../../components/superadmin/modales/ModalPlanVencimiento";

const VistaTiendas = () => {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  const [modal, setModal] = useState({ tipo: null, tienda: null });

  useEffect(() => {
    obtenerTiendas();
  }, []);

  const obtenerTiendas = async () => {
    setLoading(true);
    try {
      const res = await axiosSuperadmin.get("/admin/tiendas");
      setTiendas(res.data.data || []);
    } catch (err) {
      console.error("Error al cargar tiendas", err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarTiendas = () => {
    return tiendas
      .filter((tienda) => {
        if (filtroMes || filtroAnio) {
          const fecha = new Date(tienda.vence);
          if (isNaN(fecha)) return false;
          const mesTienda = fecha.getMonth() + 1;
          const anioTienda = fecha.getFullYear();
          if (
            (filtroMes && mesTienda !== parseInt(filtroMes)) ||
            (filtroAnio && anioTienda !== parseInt(filtroAnio))
          ) {
            return false;
          }
        }
        return true;
      })
      .filter((tienda) =>
        filtroPlan ? tienda.plan_id === parseInt(filtroPlan) : true
      )
      .filter((tienda) =>
        tienda.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
  };

  const tiendasFiltradas = filtrarTiendas();
  const totalPaginas = Math.ceil(tiendasFiltradas.length / itemsPorPagina);
  const tiendasPagina = tiendasFiltradas.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  );

  return (
    <Box p={3} sx={{ backgroundColor: "#121212", minHeight: "100vh" }}>
      <Typography variant="h5" sx={{ color: "#fff", mb: 2 }}>
        📦 Lista de Tiendas
      </Typography>

      {/* Filtros */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          label="Buscar por nombre"
          variant="outlined"
          size="small"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ backgroundColor: "#1e1e1e", input: { color: "#fff" }, label: { color: "#ccc" } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: "#ccc" }}>Mes</InputLabel>
          <Select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            label="Mes"
            sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}
          >
            <MenuItem value="">Todos</MenuItem>
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("es-MX", { month: "long" })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: "#ccc" }}>Año</InputLabel>
          <Select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
            label="Año"
            sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}
          >
            <MenuItem value="">Todos</MenuItem>
            {Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => (
              <MenuItem key={2024 + i} value={2024 + i}>{2024 + i}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ color: "#ccc" }}>Plan</InputLabel>
          <Select
            value={filtroPlan}
            onChange={(e) => setFiltroPlan(e.target.value)}
            label="Plan"
            sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value={1}>Demo</MenuItem>
            <MenuItem value={2}>Básico</MenuItem>
            <MenuItem value={3}>Negocio</MenuItem>
            <MenuItem value={4}>Profesional</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: "#1e1e1e" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#2c2c2c" }}>
                <TableCell sx={{ color: "#fff" }}>#</TableCell>
                <TableCell sx={{ color: "#fff" }}>Nombre</TableCell>
                <TableCell sx={{ color: "#fff" }}>Estado</TableCell>
                <TableCell sx={{ color: "#fff" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiendasPagina.map((tienda, index) => (
                <TableRow key={tienda.id} hover>
                  <TableCell sx={{ color: "#fff" }}>{(pagina - 1) * itemsPorPagina + index + 1}</TableCell>
                  <TableCell sx={{ color: "#fff" }}>{tienda.nombre}</TableCell>
                  <TableCell sx={{ color: tienda.estado === "Activa" ? "#4caf50" : "#f44336" }}>
                    {tienda.estado}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" title="Datos personales" onClick={() => setModal({ tipo: 'personales', tienda })}>
                      <PersonIcon />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#ffc107" }} title="Datos fiscales" onClick={() => setModal({ tipo: 'fiscales', tienda })}>
                      <AssignmentIndIcon />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#00bcd4" }} title="Taeconta" onClick={() => setModal({ tipo: 'taeconta', tienda })}>
                      <DomainIcon />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#9c27b0" }} title="Plan y vencimiento" onClick={() => setModal({ tipo: 'plan', tienda })}>
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={totalPaginas}
          page={pagina}
          onChange={(_, val) => setPagina(val)}
          color="primary"
          sx={{
            "& .MuiPaginationItem-root": { color: "#fff", borderColor: "#888" },
            "& .Mui-selected": { backgroundColor: "#1976d2", color: "#fff" },
          }}
        />
      </Box>

      <ModalDatosPersonales open={modal.tipo === 'personales'} tienda={modal.tienda} onClose={() => setModal({ tipo: null, tienda: null })} />
      <ModalDatosFiscales open={modal.tipo === 'fiscales'} tienda={modal.tienda} onClose={() => setModal({ tipo: null, tienda: null })} />
      <ModalTaeconta open={modal.tipo === 'taeconta'} tienda={modal.tienda} onClose={() => setModal({ tipo: null, tienda: null })} />
      <ModalPlanVencimiento open={modal.tipo === 'plan'} tienda={modal.tienda} onClose={() => setModal({ tipo: null, tienda: null })} />
    </Box>
  );
};

export default VistaTiendas;
