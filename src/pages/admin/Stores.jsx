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
  MenuItem,
} from "@mui/material";
import productsData from "../../data/products.json";

// Component memoizado
const ProductoRow = React.memo(({ prod }) => (
  <TableRow>
    <TableCell sx={{ fontSize: 24 }}>📦</TableCell>
    <TableCell>{prod.name}</TableCell>
    <TableCell>${prod.price.toFixed(2)}</TableCell>
    <TableCell>{prod.discount || 0}%</TableCell>
    <TableCell>{prod.totalStock}</TableCell>
  </TableRow>
));

const ITEMS_PER_PAGE = 10;

const InventoryTable = () => {
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");

  useEffect(() => {
    setProductos(productsData); // Simulación local
  }, []);

  const productosProcesados = useMemo(() => {
    return productos.map((producto) => ({
      ...producto,
      totalStock: producto.variation
        ? producto.variation.flatMap((v) => v.size).reduce((acc, sz) => acc + sz.stock, 0)
        : producto.stock ?? 0,
    }));
  }, [productos]);

  const categoriasUnicas = useMemo(() => {
    const cats = new Set();

    productos.forEach((p) => {
      if (typeof p.category === "string") {
        cats.add(p.category.trim().toLowerCase());
      } else if (Array.isArray(p.category)) {
        p.category.forEach((cat) => {
          if (typeof cat === "string") {
            cats.add(cat.trim().toLowerCase());
          }
        });
      }
    });

    return ["Todas", ...Array.from(cats)];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let filtrados = productosProcesados;

    if (busqueda.trim() !== "") {
      filtrados = filtrados.filter((p) => p.name.toLowerCase().includes(busqueda.toLowerCase()));
    }

    if (categoriaSeleccionada !== "Todas") {
      filtrados = filtrados.filter((p) => {
        if (typeof p.category === "string") {
          return p.category.trim().toLowerCase() === categoriaSeleccionada;
        } else if (Array.isArray(p.category)) {
          return p.category.some(
            (cat) => typeof cat === "string" && cat.trim().toLowerCase() === categoriaSeleccionada
          );
        }
        return false;
      });
    }

    return filtrados;
  }, [busqueda, categoriaSeleccionada, productosProcesados]);

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE);

  const productosPagina = useMemo(() => {
    const start = (pagina - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [pagina, productosFiltrados]);

  const handleChange = (event, value) => setPagina(value);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Typography variant="h5" gutterBottom>
            Inventario de Productos 📊
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
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
            />
            <TextField
              select
              label="Filtrar por categoría"
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value);
                setPagina(1);
              }}
              variant="outlined"
              size="small"
              fullWidth
            >
              {categoriasUnicas.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2")}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              border: "1px solid #eee",
              borderRadius: 1,
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>📷</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Descuento (%)</TableCell>
                    <TableCell>Stock Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosPagina.map((prod) => (
                    <ProductoRow key={prod.id} prod={prod} />
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
                onChange={handleChange}
                shape="rounded"
                color="primary"
              />
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryTable;
