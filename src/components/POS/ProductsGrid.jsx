import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import ProductCard from "./ProductCard";

export default function ProductsGrid({ products, ...rowProps }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: "rgba(25,28,32,0.12)", overflow: "hidden", boxShadow: "0 10px 24px rgba(0,0,0,0.06)" }}>
      <Table size="small" aria-label="Productos del punto de venta" sx={{ tableLayout: "fixed", "& .MuiTableCell-root": { px: { xs: 1.25, sm: 2 }, py: 1.25, borderColor: "rgba(0,0,0,0.06)" }, "& tbody tr:last-child td": { borderBottom: 0 }, "& tbody tr:hover": { bgcolor: "rgba(255,186,8,0.08)" } }}>
        <TableHead sx={{ bgcolor: "#1c1f24", "& th": { fontWeight: 900, color: "#ffba08", fontSize: "0.8rem", borderColor: "#1c1f24" } }}>
          <TableRow>
            <TableCell sx={{ width: { xs: 76, sm: 88 } }}>Imagen</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell align="right" sx={{ width: { xs: 55, sm: 80 } }}>Stock</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} {...rowProps} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
