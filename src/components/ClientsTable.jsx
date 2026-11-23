import React from "react";
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer
} from "@mui/material";

export default function ClientsTable({ rows = [] }) {
  return (
    <Paper elevation={2}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell align="right">Compras</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.nombre}</TableCell>
                <TableCell align="right">{c.compras}</TableCell>
                <TableCell align="right">{c.total}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  Sin clientes en el mes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
