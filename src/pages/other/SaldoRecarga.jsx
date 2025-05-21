import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { NumericFormat } from "react-number-format";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const SolicitarRecarga = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const user = useSelector((state) => state.user.user);
  const referencia = `TLR${user?.id}`;

  const { control, handleSubmit, reset } = useForm({ defaultValues: { amount: "" } });
  const [receiptFile, setReceiptFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const depositInfo = {
    bank: "🏦 Banco 𝗕𝗕𝗩𝗔",
    accountNumber: "0116325122",
    clabe: "012261001163251221",
    beneficiary: "𝐓𝐞𝐜𝐧𝐨𝐥𝐨𝐠í𝐚𝐬 𝐀𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐢𝐯𝐚𝐬 𝐄𝐥𝐚𝐝 𝐒 𝐝𝐞 𝐑𝐋 𝐝𝐞 𝐂𝐕",
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/ver-recargastra");
      setHistory(data);
    } catch (error) {
      console.error("Error cargando historial", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async ({ amount }) => {
    setSubmitting(true);
    const cleanAmount = amount.replace(/[$,]/g, "");
    const formData = new FormData();
    formData.append("monto", cleanAmount);
    if (receiptFile) {
      // console.log("Archivo seleccionado:", receiptFile);
      formData.append("comprobante", receiptFile);
    }

    try {
      // console.log("Enviando FormData:");
      for (let pair of formData.entries()) {
        // console.log(pair[0], pair[1]);
      }

      await axios.post("/recargar-saldo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        icon: "success",
        title: "🚀 Solicitud enviada",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        reset({ amount: "" }); // limpia el campo de monto
        setReceiptFile(null); // limpia el archivo
        fetchHistory(); // actualiza historial
      });

      reset();
      setReceiptFile(null);
      fetchHistory();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "❌ Error al solicitar recarga",
      }).then(() => {
        reset({ amount: "" }); // limpia el campo de monto
        setReceiptFile(null); // limpia el archivo
        fetchHistory(); // actualiza historial
      });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    const text = `
${depositInfo.bank}
Número de Cuenta: ${depositInfo.accountNumber}
CLABE: ${depositInfo.clabe}
Beneficiario: ${depositInfo.beneficiary}
Referencia: ${referencia}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        icon: "success",
        title: "✅ Datos copiados con referencia",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  };

  const historyFiltrada = history.filter((item) => {
    if (filtroEstado === "todos") return true;
    return item.status === filtroEstado;
  });

  return (
    <LayoutOne headerTop="visible">
      <SEO titleTemplate="Solicitar Recarga" />
      <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Recarga", path: pathname }]} />
      <Container sx={{ mt: 4, mb: 4, px: { xs: 2, md: 0 } }}>
        <Typography variant="h4" align="center" gutterBottom>
          💳 Solicitar Recarga de Saldo
        </Typography>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, alignItems: "stretch", mb: 4 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ flex: 1 }}>
            <Paper sx={{ p: 3, textAlign: "center" }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom>
                📋 Datos para Depósito
              </Typography>
              <Typography>{depositInfo.bank}</Typography>
              <Typography>🆔 Cuenta: {depositInfo.accountNumber}</Typography>
              <Typography>🔗 CLABE: {depositInfo.clabe}</Typography>
              <Typography>👤 Beneficiario: {depositInfo.beneficiary}</Typography>
              <Typography>🔖 Referencia: <strong>{referencia}</strong></Typography>
              <Typography fontSize={13} color="text.secondary">
                Usa esta referencia como concepto al hacer tu depósito
              </Typography>
              <Box mt={2}>
                <Button variant="contained" onClick={handleCopy} sx={{ textTransform: "none" }}>
                  📋 Copiar Datos
                </Button>
              </Box>
            </Paper>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ flex: 1 }}>
            <Paper sx={{ p: 3 }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom align="center">
                📝 Formulario de Solicitud
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                encType="multipart/form-data"
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              >

                <Controller
                  name="amount"
                  control={control}
                  rules={{ required: "Ingresa un monto" }}
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
                      sx={{ width: { xs: "100%", sm: "80%" } }}
                    />
                  )}
                />

                <TextField
                  key={receiptFile ? "hasFile" : "noFile"} // fuerza reinicio visual
                  type="file"
                  inputProps={{ accept: "image/*,.pdf" }}
                  fullWidth
                  margin="dense"
                  onChange={(e) => setReceiptFile(e.target.files?.[0])}
                  sx={{ width: { xs: "100%", sm: "80%" } }}
                />

                {receiptFile && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Archivo seleccionado: {receiptFile.name}
                    </Typography>

                    {receiptFile.type.startsWith("image/") && (
                      <Box mt={2}>
                        <img
                          src={URL.createObjectURL(receiptFile)}
                          alt="Vista previa"
                          style={{ maxWidth: "100%", borderRadius: "8px" }}
                        />
                      </Box>
                    )}
                  </>
                )}



                <Button type="submit" variant="contained" disabled={submitting} sx={{ px: 4, py: 1.5 }}>
                  {submitting ? <CircularProgress size={24} /> : "🚀 Enviar Solicitud"}
                </Button>
              </Box>
            </Paper>
          </motion.div>
        </Box>

        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 2 }}>
          📜 Historial de Compras de Saldo
        </Typography>

        <FormControl sx={{ mb: 2, minWidth: 200 }}>
          <InputLabel>Filtrar por Estado</InputLabel>
          <Select value={filtroEstado} label="Filtrar por Estado" onChange={(e) => setFiltroEstado(e.target.value)}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="aprobado">Aprobado</MenuItem>
            <MenuItem value="rechazado">Rechazado</MenuItem>
          </Select>
        </FormControl>

        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 300 }}>
              <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
                <TableRow>
                  <TableCell sx={{ color: "#fff" }}>Fecha</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Monto</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Referencia</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Descripción</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Estado</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Comprobante</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyFiltrada.length ? (
                  historyFiltrada.map((r) => (
                    <TableRow
                      key={r.id}
                      sx={{
                        backgroundColor:
                          r.status === 'pendiente'
                            ? 'rgba(246, 234, 8, 0.1)'     // Amarillo claro
                            : r.status === 'aprobado'
                              ? 'rgba(76, 175, 80, 0.1)'      // Verde claro
                              : r.status === 'rechazado'
                                ? 'rgba(244, 67, 54, 0.1)'      // Rojo claro
                                : 'inherit',
                      }}
                    >
                      <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>${parseFloat(r.monto).toFixed(2)}</TableCell>
                      <TableCell>{r.referencia}</TableCell>
                      <TableCell>{r.descripcion}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color:
                              r.status === 'pendiente'
                                ? 'warning.main'
                                : r.status === 'aprobado'
                                  ? 'success.main'
                                  : r.status === 'rechazado'
                                    ? 'error.main'
                                    : 'text.primary',
                          }}
                        >
                          {r.status}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {r.comprobante_url ? (
                          <a href={r.comprobante_url} target="_blank" rel="noopener noreferrer">
                            📎 Ver
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay Compras 😔
                    </TableCell>
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
