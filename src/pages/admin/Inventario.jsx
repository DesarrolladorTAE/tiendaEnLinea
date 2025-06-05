import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../config/axiosClient";
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
  Tooltip,
  Paper,
  Pagination,
  Stack,
  TextField,
  IconButton,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { RiFileExcel2Fill } from "react-icons/ri";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 7;

export default function InventoryTable() {
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    axiosClient
      .get("/inventario")
      .then(({ data }) => {
        setProductos(data.map((p) => ({ ...p, price: Number(p.price) })));
      })
      .catch((error) => {
        console.error("❌ Error al obtener inventario:", error);
      });
  }, []);

  const productosFiltrados = useMemo(() => {
    return busqueda
      ? productos.filter((p) => p.name.toLowerCase().includes(busqueda.toLowerCase()))
      : productos;
  }, [busqueda, productos]);

  const productosOrdenados = useMemo(() => {
    const lista = [...productosFiltrados];
    if (sortConfig.key) {
      lista.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return lista;
  }, [productosFiltrados, sortConfig]);

  const totalPaginas = Math.ceil(productosOrdenados.length / ITEMS_PER_PAGE);

  const productosPagina = useMemo(() => {
    const start = (pagina - 1) * ITEMS_PER_PAGE;
    return productosOrdenados.slice(start, start + ITEMS_PER_PAGE);
  }, [pagina, productosOrdenados]);

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
    axiosClient
      .get("/inventario/excel", { responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const fecha = new Date().toISOString().slice(0, 10);
        saveAs(blob, `inventario-${fecha}.xlsx`);
      })
      .catch((err) => {
        console.error("Error al exportar inventario:", err);
      });
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" gutterBottom>Inventario de Productos 📊</Typography>
            <Tooltip title="Exportar a Excel" arrow>
              <IconButton onClick={confirmExport}>
                <RiFileExcel2Fill style={{ color: "#217346", fontSize: "1.8rem"}} />
              </IconButton>
            </Tooltip>
          </Box>

          <TextField
            label="Buscar por nombre"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

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
                    <TableCell sx={{ width: 120 }}>Código</TableCell>

                    <TableCell
                      onClick={() => requestSort("name")}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        width: 220,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Nombre {renderSortIcon("name")}
                      </Stack>
                    </TableCell>

                    <TableCell
                      onClick={() => requestSort("price")}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        width: 120,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Precio {renderSortIcon("price")}
                      </Stack>
                    </TableCell>

                    <TableCell
                      onClick={() => requestSort("stock_total")}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        width: 140,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        Stock{renderSortIcon("stock_total")}
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {productosPagina.map((prod) => (
                    <TableRow key={prod.id} sx={{ "&:hover": { backgroundColor: "action.hover" } }}>
                      <TableCell>{prod.sku}</TableCell>
                      <TableCell>{prod.name}</TableCell>
                      <TableCell>${prod.price.toFixed(2)}</TableCell>
                      <TableCell>{prod.stock_total}</TableCell>
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
