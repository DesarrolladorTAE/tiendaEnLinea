import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography, Stack, Paper
} from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import axios from 'axios';

const EnviarWhatsappDocumentos = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [xmlUrl, setXmlUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    try {
      const payload = {
        phone,
        message,
        ...(pdfUrl && { pdf_url: pdfUrl }),
        ...(xmlUrl && { xml_url: xmlUrl }),
      };

      const res = await axios.post(
        'https://telorecargo.com/api/enviar-documentos-whatsapp',
        payload
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
          <TextField
            label="URL del archivo PDF"
            placeholder="https://ejemplo.com/archivo.pdf"
            fullWidth
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
          />
          <TextField
            label="URL del archivo XML"
            placeholder="https://ejemplo.com/archivo.xml"
            fullWidth
            value={xmlUrl}
            onChange={(e) => setXmlUrl(e.target.value)}
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
