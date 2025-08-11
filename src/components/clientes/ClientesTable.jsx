// src/components/clientes/ClientesTable.jsx
import React from "react";
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function ClientesTable({ rows = [], onEdit, onDelete }) {
  return (
    <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  bgcolor: (t) => (t.palette.mode === "dark" ? t.palette.background.paper : "#f7f7fb"),
                  color: "text.primary",
                  fontWeight: 700,
                },
              }}
            >
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Sin clientes
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.nombre_alias}</TableCell>
                  <TableCell>{r.email || "—"}</TableCell>
                  <TableCell>{r.telefono || "—"}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit?.(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => onDelete?.(r)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
