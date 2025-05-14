import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation } from "react-router-dom";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { NumericFormat } from 'react-number-format';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  useTheme,
} from "@mui/material";

const SolicitarRecarga = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { control, handleSubmit, reset } = useForm({ defaultValues: { amount: "", receipt: undefined } });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const depositInfo = {
    bank: "🏦 Banco Ejemplo",
    accountNumber: "1234 5678 9012 3456",
    clabe: "012345678901234567",
    beneficiary: "TeLoRecargo S.A. de C.V.",
  };

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/ver-recargas");
      setHistory(data);
    } catch (error) {
      console.error("Error cargando historial", error);
    } finally { setLoading(false); }
  };

  const onSubmit = async ({ amount, receipt }) => {
    setSubmitting(true);
    const cleanAmount = amount.replace(/[$,]/g, '');
    const formData = new FormData();
    formData.append("monto", cleanAmount);
    if (receipt && receipt.length) formData.append("comprobante", receipt[0]);
    try {
      await axios.post("/recargar-saldo", formData, { headers: { "Content-Type": "multipart/form-data" } });
      Swal.fire({ icon: 'success', title: '🚀 Solicitud enviada', timer: 1500, showConfirmButton: false });
      reset(); fetchHistory();
    } catch (error) {
      Swal.fire({ icon: 'error', title: '❌ Error al solicitar recarga' });
      console.error(error);
    } finally { setSubmitting(false); }
  };

  const handleCopy = () => {
    const text = `${depositInfo.bank}\nNúmero de Cuenta: ${depositInfo.accountNumber}\nCLABE: ${depositInfo.clabe}\nBeneficiario: ${depositInfo.beneficiary}`;
    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({ icon: 'success', title: '✅ Datos copiados', timer: 1500, showConfirmButton: false });
    });
  };

  return (
    <LayoutOne headerTop="visible">
      <SEO titleTemplate="Solicitar Recarga" />
      <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Recarga", path: pathname }]} />
      <Container sx={{ mt: 4, mb: 4, px: { xs: 2, md: 0 } }}>
        <Typography variant="h4" align="center" gutterBottom>
          💳 Solicitar Recarga de Saldo
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            alignItems: 'stretch',
            mb: 4,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Paper sx={{ p: 3, textAlign: 'center', flex: 1 }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom>📋 Datos para Depósito</Typography>
              <Typography>{depositInfo.bank}</Typography>
              <Typography>🆔 Cuenta: {depositInfo.accountNumber}</Typography>
              <Typography>🔗 CLABE: {depositInfo.clabe}</Typography>
              <Typography>👤 Beneficiario: {depositInfo.beneficiary}</Typography>
              <Box mt={2}>
                <Button variant="contained" onClick={handleCopy} sx={{ textTransform: 'none' }}>📋 Copiar Datos</Button>
              </Box>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Paper sx={{ p: 3, flex: 1 }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom align="center">📝 Formulario de Solicitud</Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2, // espacio vertical entre campos
                  width: '100%',
                }}
              >
                <Controller
                  name="amount"
                  control={control}
                  rules={{ required: 'Ingresa un monto' }}
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <NumericFormat
                      value={value}
                      onValueChange={({ value: v }) => onChange(v)}
                      thousandSeparator=","
                      prefix="$"
                      suffix=" MXN"
                      customInput={TextField}
                      label="Monto a Recargar"
                      onBlur={onBlur}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{ width: { xs: '100%', sm: '80%' } }}
                    />
                  )}
                />

                <Controller
                  name="receipt"
                  control={control}
                  rules={{ required: "Sube tu comprobante" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="file"
                      inputProps={{ accept: "image/*,.pdf" }}
                      fullWidth
                      margin="dense"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      sx={{ width: { xs: '100%', sm: '80%' } }}
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {submitting ? <CircularProgress size={24} /> : '🚀 Enviar Solicitud'}
                </Button>
              </Box>
            </Paper>
          </motion.div>
        </Box>

        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 2 }}>📜 Historial de Solicitudes</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 300 }}>
              <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>Fecha</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Monto</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Estado</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Comprobante</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length ? history.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell>${parseFloat(r.monto).toFixed(2)}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>
                      {r.comprobante_url ? (
                        <a href={r.comprobante_url} target="_blank" rel="noopener noreferrer">📎 Ver Comprobante</a>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No hay solicitudes 😔</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </LayoutOne>
  );
};

export default withAuth(SolicitarRecarga);
