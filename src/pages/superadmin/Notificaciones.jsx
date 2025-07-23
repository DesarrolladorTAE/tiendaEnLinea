// EnviarNotificacionConFiltros.jsx
import React, { useState, useEffect } from "react";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import {
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Modal,
  Divider,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { showSuccess, showError } from '../../utils/alerts';

const filtrosDisponibles = [
  { key: "demo", label: "🧪 Tiendas en DEMO" },
  { key: "expiradas", label: "⏰ Tiendas expiradas" },
  { key: "sin_fiscales", label: "📄 Tiendas sin datos fiscales" },
  { key: "facturacion", label: "🧾 Facturación a Clientes (Próximamente)", deshabilitado: true },
];

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#e3f2fd',
  color: '#0d47a1',
  padding: theme.spacing(2),
  borderRadius: '12px',
  border: '1px solid #90caf9',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, #2196f3, #64b5f6)',
  color: '#fff',
  padding: '10px 20px',
  fontWeight: 'bold',
  borderRadius: '10px',
  '&:hover': {
    background: 'linear-gradient(90deg, #1e88e5, #42a5f5)',
  },
}));

const ScrollableBox = styled(Box)(({ theme }) => ({
  maxHeight: 350,
  overflowY: 'auto',
  backgroundColor: '#e3f2fd',
  padding: theme.spacing(1),
  borderRadius: '8px',
  border: '1px solid #90caf9'
}));

const EnviarNotificacionConFiltros = () => {
  const [tiendas, setTiendas] = useState([]);
  const [tiendasFiltradas, setTiendasFiltradas] = useState([]);
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [filtros, setFiltros] = useState({ demo: false, expiradas: false, sin_fiscales: false });
  const [modoTodos, setModoTodos] = useState(false);
  const [tiendaIndividual, setTiendaIndividual] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    axiosSuperadmin.get("/admin/tiendas23").then((res) => setTiendas(res.data));
  }, []);

  useEffect(() => {
    filtrarTiendas();
  }, [filtros, tiendas]);

  const filtrarTiendas = () => {
    const hoy = new Date();
    let resultado = tiendas.filter((t) => {
      const cumpleDemo = filtros.demo && t.plan_id === 1;
      const cumpleExp = filtros.expiradas && new Date(t.plan_expiration) < hoy && t.plan_id >= 2;
      const cumpleFiscal =
        filtros.sin_fiscales && (!t.rfc || !t.domicilio_fac || !t.codigo_regimen || !t.razon_social);
      return cumpleDemo || cumpleExp || cumpleFiscal && t.plan_id >= 3;
    });
    setTiendasFiltradas(resultado);
    setTiendasSeleccionadas(resultado.map((t) => t.id));
  };

  const toggleFiltro = (key) => {
    if (key === "facturacion") return setModal(true);
    setFiltros({ ...filtros, [key]: !filtros[key] });
  };

  const toggleSeleccionTienda = (id) => {
    if (tiendasSeleccionadas.includes(id)) {
      setTiendasSeleccionadas(tiendasSeleccionadas.filter((tid) => tid !== id));
    } else {
      setTiendasSeleccionadas([...tiendasSeleccionadas, id]);
    }
  };

  const toggleModoTodos = () => {
    if (!modoTodos) {
      setTiendasSeleccionadas(tiendas.map(t => t.id));
      setTiendaIndividual("");
    } else {
      setTiendasSeleccionadas([]);
    }
    setModoTodos(!modoTodos);
  };

  const handleTiendaIndividual = (event) => {
    const id = event.target.value;
    setTiendaIndividual(id);
    setModoTodos(false);
    setTiendasSeleccionadas(id ? [id] : []);
  };

  const enviar = async () => {
    setLoading(true);
    try {
      await axiosSuperadmin.post("/admin/notificaciones/enviar", {
        mensaje,
        store_ids: tiendasSeleccionadas,
      });
      showSuccess("Mensaje enviado exitosamente");
      // Limpieza de estado
      setMensaje("");
      setFiltros({ demo: false, expiradas: false, sin_fiscales: false });
      setModoTodos(false);
      setTiendaIndividual("");
      setTiendasSeleccionadas([]);
      setTiendasFiltradas([]);
    } catch (e) {
      showError("Error al enviar mensaje");
    }
    setLoading(false);
  };

  return (
    <Box p={2} sx={{ background: '#f4faff', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">📢 Enviar Notificación</Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={10} lg={9}>
          <StyledPaper>
            <Grid container spacing={3} justifyContent="center" textAlign="center">
              <Grid item xs={12}>
                <Typography variant="h6">🎯 Filtros</Typography>
                <FormGroup row>
                  {filtrosDisponibles.map((f) => (
                    <FormControlLabel
                      key={f.key}
                      control={<Checkbox checked={filtros[f.key]} onChange={() => toggleFiltro(f.key)} disabled={f.deshabilitado || modoTodos || tiendaIndividual} />}
                      label={f.label}
                    />
                  ))}
                </FormGroup>
                <Divider sx={{ my: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="h6">🏪 Tiendas encontradas ({tiendasFiltradas.length})</Typography>
                <ScrollableBox>
                  <FormGroup>
                    {tiendasFiltradas.map((tienda) => (
                      <FormControlLabel
                        key={tienda.id}
                        control={
                          <Checkbox
                            checked={tiendasSeleccionadas.includes(tienda.id)}
                            onChange={() => toggleSeleccionTienda(tienda.id)}
                            disabled={modoTodos || tiendaIndividual}
                          />
                        }
                        label={tienda.name}
                      />
                    ))}
                  </FormGroup>
                </ScrollableBox>
              </Grid>

              <Grid item xs={12} md={5}>
                <Typography variant="h6">✉️ Mensaje</Typography>
                <TextField
                  placeholder="Escribe aquí el mensaje a enviar"
                  fullWidth
                  multiline
                  rows={isMobile ? 6 : 10}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  sx={{ mt: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={modoTodos} onChange={toggleModoTodos} color="primary" disabled={tiendaIndividual} />}
                  label="📦 Seleccionar TODAS las tiendas"
                />
                <Divider sx={{ my: 2 }} />
                <FormControl fullWidth disabled={modoTodos}>
                  <InputLabel>🎯 Una sola tienda</InputLabel>
                  <Select value={tiendaIndividual} onChange={handleTiendaIndividual} label="Una sola tienda">
                    <MenuItem value="">(Ninguna)</MenuItem>
                    {tiendas.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </StyledPaper>
        </Grid>
      </Grid>

      <Box mt={4} display="flex" justifyContent="center">
        <StyledButton onClick={enviar} disabled={loading || !mensaje || tiendasSeleccionadas.length === 0}>
          {loading ? <CircularProgress size={24} color="inherit" /> : "📨 ENVIAR NOTIFICACIÓN"}
        </StyledButton>
      </Box>

      <Modal open={modal} onClose={() => setModal(false)}>
        <Box sx={{ backgroundColor: 'white', p: 4, maxWidth: 400, mx: 'auto', mt: '20%', borderRadius: '10px' }}>
          <Typography variant="h6" fontWeight={600}>⚠️ Próximamente</Typography>
          <Typography sx={{ mt: 1 }}>Este filtro estará disponible muy pronto.</Typography>
          <Button onClick={() => setModal(false)} variant="contained" sx={{ mt: 3 }}>Cerrar</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default EnviarNotificacionConFiltros;
