import React from "react";
import {
  Grid,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CasinoIcon from "@mui/icons-material/Casino";
import SaveIcon from "@mui/icons-material/Save";

const AgenteForm = ({
  form,
  handleChange,
  handleSubmit,
  generarCodigo,
  loading,
}) => (
  <Box display="flex" justifyContent="center">
    <Paper
      elevation={4}
      sx={{ maxWidth: 800, width: "100%", p: 4, borderRadius: 4 }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        gutterBottom
        textAlign="center"
      >
        📝 Registro de Nuevo Agente
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Nombre(s) del agente"
            name="name"
            fullWidth
            value={form.name}
            onChange={handleChange}
            InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1 }} /> }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Apellidos"
            name="apellidos"
            fullWidth
            value={form.apellidos}
            onChange={handleChange}
            InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1 }} /> }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Teléfono"
            name="phone"
            fullWidth
            value={form.phone}
            onChange={handleChange}
            InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1 }} /> }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Saldo inicial"
            name="saldo"
            type="number"
            fullWidth
            value={form.saldo}
            onChange={handleChange}
            InputProps={{
              startAdornment: <MonetizationOnIcon sx={{ mr: 1 }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <TextField
            label="Código"
            name="codigo"
            fullWidth
            value={form.codigo}
            onChange={handleChange}
            InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
          />
        </Grid>
        <Grid item xs={4} sm={3} md={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={generarCodigo}
            fullWidth
            sx={{
              minWidth: 0,
              px: 1,
              py: 1,
              bgcolor: "#8e24aa",
              "&:hover": { bgcolor: "#7b1fa2" },
              fontSize: "1.2rem",
            }}
          >
            <CasinoIcon fontSize="small" />
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                px: 4,
                py: 1.2,
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: 3,
                textTransform: "none",
                boxShadow: 3,
              }}
              startIcon={<SaveIcon />}
            >
              {loading ? <CircularProgress size={20} /> : "Guardar"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  </Box>
);

export default AgenteForm;
