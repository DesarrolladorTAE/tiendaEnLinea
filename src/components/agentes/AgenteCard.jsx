import React from "react";
import { Box, Typography, Paper, Button, Chip } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const AgenteCard = ({ agente, onEdit, onDelete }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="h6">
          👤 {agente.name} {agente.apellidos} <Chip label="Activo" color="success" size="small" />
        </Typography>
        <Typography>📱 Teléfono: {agente.phone}</Typography>
        <Typography>🔐 Código: {agente.password}</Typography>
        <Typography>💸 Saldo: ${Number(agente.saldo).toFixed(2)}</Typography>
      </Box>
      <Box>
        <Button color="primary" onClick={() => onEdit(agente)}><Edit /></Button>
        <Button color="error" onClick={() => onDelete(agente)}><Delete /></Button>
      </Box>
    </Box>
  </Paper>
);

export default AgenteCard;
