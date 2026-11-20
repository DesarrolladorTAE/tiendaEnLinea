import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import ProductCard from "./ProductCard";

export default function ProductsGrid({ products, ...rowProps }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table size="small" aria-label="Productos del punto de venta" sx={{ tableLayout: "fixed", "& .MuiTableCell-root": { px: { xs: 1, sm: 1.5 } } }}>
        <TableHead sx={{ bgcolor: "action.hover" }}>
          <TableRow>
            <TableCell sx={{ width: { xs: "23%", sm: "20%" } }}>SKU</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell align="right" sx={{ width: { xs: 60, sm: 80 } }}>Piezas</TableCell>
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
