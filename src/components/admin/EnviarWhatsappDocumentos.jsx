import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography, Stack, Paper,
  InputLabel, OutlinedInput
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import axios from 'axios';

const EnviarWhatsappDocumentos = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [pdf, setPdf] = useState(null);
  const [xml, setXml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('message', message);
    if (pdf) formData.append('pdf', pdf);
    if (xml) formData.append('xml', xml);

    try {
      const res = await axios.post(
        'https://telorecargo.com/api/enviar-documentos-whatsapp',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResultado(res.data);
    } catch (error) {
      setResultado({
        error: true,
        message: error.response?.data?.message || 'Error inesperado',
        detalles: error.response?.data || {}
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Enviar Documentos por WhatsApp
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Número(s) de WhatsApp"
            placeholder="Ej: 7441234567,7447654321"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <TextField
            label="Mensaje (opcional)"
            multiline
            minRows={3}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <InputLabel>Archivo PDF</InputLabel>
          <OutlinedInput
            type="file"
            fullWidth
            inputProps={{ accept: 'application/pdf' }}
            onChange={(e) => setPdf(e.target.files[0])}
          />
          <InputLabel>Archivo XML</InputLabel>
          <OutlinedInput
            type="file"
            fullWidth
            inputProps={{ accept: '.xml,text/xml,application/xml' }}
            onChange={(e) => setXml(e.target.files[0])}
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={<UploadFile />}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar por WhatsApp'}
          </Button>

          {resultado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Resultado:
              </Typography>
              <pre style={{ fontSize: 13, background: '#f5f5f5', padding: '1rem' }}>
                {JSON.stringify(resultado, null, 2)}
              </pre>
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default EnviarWhatsappDocumentos;
