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
  Paper,
  Pagination,
  Stack,
  TextField,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

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

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Typography variant="h5" gutterBottom>
            Inventario de Productos 📊
          </Typography>

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
                    <TableCell sx={{ width: 120 }}>SKU</TableCell>

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
