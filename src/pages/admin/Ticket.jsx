import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, Checkbox, FormControlLabel, Paper, Modal, Divider
} from '@mui/material';
import axiosClient from '../../config/axiosClient';
import { showSuccess, showError } from '../../utils/alerts';

const TicketEditForm = ({ ticketId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    direccion: '',
    mensaje_1: '',
    mensaje_2: '',
    qr_factura: false,
    qr_sitio: false,
    logo: null,
    logo_preview: ''
  });

  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    if (ticketId) {
      axiosClient.get(`/tickets/${ticketId}`)
        .then(res => {
          const ticket = res.data.ticket;
          setFormData({
            direccion: ticket.direccion || '',
            mensaje_1: ticket.mensaje_1 || '',
            mensaje_2: ticket.mensaje_2 || '',
            qr_factura: ticket.qr_factura,
            qr_sitio: ticket.qr_sitio,
            logo: null,
            logo_preview: ticket.logo ? `/storage/${ticket.logo}` : ''
          });
        })
        .catch(() => showError('No se pudo cargar el ticket.'));
    }
  }, [ticketId]);

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      const file = files[0];
      setFormData({ ...formData, logo: file, logo_preview: URL.createObjectURL(file) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();

    for (let key in formData) {
      if (key !== 'logo_preview' && formData[key] !== null) {
        form.append(key, formData[key]);
      }
    }

    try {
      await axiosClient.post(`/tickets/${ticketId}?_method=PUT`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSuccess('Ticket actualizado correctamente');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      showError('Error al actualizar el ticket.');
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          ✏️ Editar Ticket
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Mensaje 1"
            name="mensaje_1"
            value={formData.mensaje_1}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Mensaje 2"
            name="mensaje_2"
            value={formData.mensaje_2}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />

          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="qr_factura"
                  checked={formData.qr_factura}
                  onChange={handleChange}
                />
              }
              label="QR Factura"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="qr_sitio"
                  checked={formData.qr_sitio}
                  onChange={handleChange}
                />
              }
              label="QR Sitio Web"
            />
          </Box>

          {formData.logo_preview && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Vista previa del logo
              </Typography>
              <img
                src={formData.logo_preview}
                alt="Logo"
                style={{ width: 250, borderRadius: 12 }}
              />
            </Box>
          )}

          <Button variant="outlined" component="label" fullWidth sx={{ my: 3 }}>
            Subir nuevo logo
            <input type="file" name="logo" hidden accept="image/*" onChange={handleChange} />
          </Button>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Guardar Cambios
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => setOpenPreview(true)}
            >
              Vista Previa
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Modal de Vista Previa */}
      <Modal open={openPreview} onClose={() => setOpenPreview(false)}>
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 4, width: 400, borderRadius: 4
          }}
        >
          <Typography variant="h6" mb={2}>🧾 Vista Previa del Ticket</Typography>
          {formData.logo_preview && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img
                src={formData.logo_preview}
                alt="Vista previa"
                style={{ width: 100, height: 100, objectFit: 'contain' }}
              />
            </Box>
          )}
          <Typography><strong>Dirección:</strong> {formData.direccion}</Typography>
          <Typography><strong>Mensaje 1:</strong> {formData.mensaje_1}</Typography>
          <Typography><strong>Mensaje 2:</strong> {formData.mensaje_2}</Typography>
          <Typography><strong>QR Factura:</strong> {formData.qr_factura ? 'Sí' : 'No'}</Typography>
          <Typography><strong>QR Sitio Web:</strong> {formData.qr_sitio ? 'Sí' : 'No'}</Typography>
        </Paper>
      </Modal>
    </>
  );
};

export default TicketEditForm;
