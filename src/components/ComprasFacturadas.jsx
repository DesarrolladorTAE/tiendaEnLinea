import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from "@mui/material";

const ComprasFacturadas = () => {
  const compras = [
    { id: 1, fecha: "2025-07-29", total: 560.0, folio: "A001" },
    { id: 2, fecha: "2025-07-28", total: 320.5, folio: "A002" },
  ];

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Compras Facturadas
      </Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Folio</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {compras.map((compra) => (
              <TableRow key={compra.id}>
                <TableCell>{compra.folio}</TableCell>
                <TableCell>{compra.fecha}</TableCell>
                <TableCell>${compra.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ComprasFacturadas;
