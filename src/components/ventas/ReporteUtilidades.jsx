import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Stack, 
} from '@mui/material';
import dayjs from 'dayjs';

export default function ReporteUtilidades() {
  const [inicio, setInicio] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fin, setFin] = useState(dayjs().format('YYYY-MM-DD'));

  const generarReporte = () => {
    const url = `/reporte-utilidades?inicio=${inicio}&fin=${fin}&pos=todas`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Reporte de Utilidades!!!
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
        <TextField
          label="Fecha Inicio"
          type="date"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Fecha Fin"
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Stack>

      <Button
        variant="contained"
        color="primary"
        onClick={generarReporte}
        sx={{ mt: 3 }}
      >
        Generar PDF
      </Button>
    </Box>
  );
}
