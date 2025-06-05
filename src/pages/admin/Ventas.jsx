import React, { useEffect, useMemo, useState } from "react";
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
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
} from "@mui/material";

import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import EditNoteIcon from "@mui/icons-material/EditNote";
import axiosClient from "../../config/axiosClient";
import { RiFileExcel2Fill } from "react-icons/ri";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 7;

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filtroPuntoVenta, setFiltroPuntoVenta] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [puntosVenta, setPuntosVenta] = useState([]);

  const fetchVentas = (params = {}) => {
    axiosClient
      .get("/admin/ventas", { params })
      .then(({ data }) => {
        console.log("historial", data);
        setVentas(
          data.map((venta) => ({
            ...venta,
            total_amount: Number(venta.total_amount),
            paid_amount: Number(venta.paid_amount),
          }))
        );
        setPagina(1);
      })
      .catch((error) => {
        console.error("Error al obtener ventas:", error);
      });
  };

  const handleFiltrar = () => {
    const params = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (filtroPuntoVenta) params.pos_location_id = filtroPuntoVenta;
    fetchVentas(params);
  };

  useEffect(() => {
    axiosClient
      .get("/admin/pos")
      .then(({ data }) => {
        setPuntosVenta(data);
      })
      .catch((err) => {
        console.error("Error al cargar puntos de venta", err);
      });
  }, []);

  useEffect(() => {
    if (puntosVenta.length === 0) return;

    const today = new Date();
    const inicio = new Date(today.getFullYear(), today.getMonth(), 1);
    const fin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const yyyyMmDd = (date) => date.toISOString().split("T")[0];

    const fechaInicioStr = yyyyMmDd(inicio);
    const fechaFinStr = yyyyMmDd(fin);

    setFechaInicio(fechaInicioStr);
    setFechaFin(fechaFinStr);

    fetchVentas({
      fecha_inicio: fechaInicioStr,
      fecha_fin: fechaFinStr,
      ...(filtroPuntoVenta ? { pos_location_id: filtroPuntoVenta } : {}),
    });
  }, [puntosVenta]);

  const ventasFiltradas = useMemo(() => {
    if (!filtroPuntoVenta) return ventas;
    return ventas.filter(
      (v) =>
        v.pos_location?.id === filtroPuntoVenta || v.pos_location?.id === Number(filtroPuntoVenta)
    );
  }, [ventas, filtroPuntoVenta]);

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
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
      if (sortConfig.direction === "desc") {
        lista.reverse();
      }
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

  const confirmExport = () => {
    toast(
      (t) => (
        <span>
          ¿Quieres descargar el inventario?
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleExport(); // tu función real
              }}
              style={{
                background: "#217346",
                color: "white",
                border: "none",
                padding: "4px 10px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Sí
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: "#ddd",
                border: "none",
                padding: "4px 10px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              No
            </button>
          </div>
        </span>
      ),
      {
        duration: 10000,
      }
    );
  };

  const handleExport = () => {
    const params = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (filtroPuntoVenta) params.pos_location_id = filtroPuntoVenta;

    console.log("📤 Enviando filtros a exportar:", params);

    axiosClient
      .get("/admin/ventas/excel", {
        params,
        responseType: "blob",
      })
      .then((res) => {
        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const inicio = fechaInicio ? fechaInicio : "sin-fecha";
        const fin = fechaFin ? fechaFin : "sin-fecha";
        const nombreArchivo = `reporte-ventas-${inicio}_a_${fin}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Error al exportar reporte de ventas:", err);
        toast.error("Error al generar el archivo.");
      });
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h5">Historial de Ventas</Typography>

            <Tooltip title="Exportar a Excel" arrow>
              <IconButton onClick={confirmExport}>
                <RiFileExcel2Fill style={{ color: "#217346", fontSize: "1.8rem" }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="punto-venta-label">Punto de Venta</InputLabel>
              <Select
                labelId="punto-venta-label"
                value={filtroPuntoVenta}
                label="Punto de Venta"
                onChange={(e) => {
                  setFiltroPuntoVenta(e.target.value);
                  setPagina(1);
                }}
              >
                {puntosVenta.map((pv) => (
                  <MenuItem key={pv.id} value={pv.id}>
                    {pv.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Desde"
              size="small"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPagina(1);
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="Hasta"
              size="small"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPagina(1);
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <button
              onClick={handleFiltrar}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Filtrar
            </button>
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
                      sx={{ cursor: "pointer", width: 160 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Fecha {renderSortIcon("created_at")}
                      </Stack>
                    </TableCell>
                    <TableCell
                      onClick={() => requestSort("total_amount")}
                      sx={{ cursor: "pointer", width: 120 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Total {renderSortIcon("total_amount")}
                      </Stack>
                    </TableCell>
                    <TableCell
                      onClick={() => requestSort("pos_location.name")}
                      sx={{ cursor: "pointer", width: 200 }}
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
                        <IconButton
                          color="secondary"
                          onClick={() => window.open(`/api/sales/${venta.id}/ticket.pdf`, "_blank")}
                        >
                          <EditNoteIcon fontSize="small" />
                        </IconButton>
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
    </Box>
  );
}
