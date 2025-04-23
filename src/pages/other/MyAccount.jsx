import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  Grid,
  Button,
  Box,
  Paper,
  Fade,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import { useLocation } from "react-router-dom";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import withAuth from "../../components/withAuth";

const MyAccount = () => {
  const { pathname } = useLocation();
  const user = useSelector((state) => state.user.user);

  const [expanded, setExpanded] = useState("panel1");

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <SEO titleTemplate="Mi Cuenta" description="Página de cuenta del usuario." />
        <LayoutOne headerTop="visible">
          <Breadcrumb
            pages={[
              { label: "Inicio", path: "/" },
              { label: "Mi Cuenta", path: pathname },
            ]}
          />

          <Box pt={5} pb={10}>
            <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
              <Typography variant="h4" gutterBottom>
                Mi Cuenta
              </Typography>
              <Accordion expanded={expanded === "panel1"} onChange={handleChange("panel1")}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <AccountCircleIcon sx={{ mr: 1 }} /> Información personal
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Nombre" defaultValue={user?.name || ""} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Apellidos" defaultValue={user?.apellidos || ""} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Correo" value={user?.email || ""} disabled />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Teléfono" defaultValue={user?.phone || ""} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Saldo" value={`$${Number(user?.saldo || 0).toFixed(2)}`} disabled />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Ganancias" value={`${Number(user?.ganancias || 0).toFixed(2)}%`} disabled />
                    </Grid>
                    {/* <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Rol" value={user?.role || "usuario"} disabled />
                    </Grid> */}
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Fecha de Registro" value={new Date(user?.created_at).toLocaleString()} disabled />
                    </Grid>
                  </Grid>
                  <Box mt={2}>
                    <Button variant="contained" color="primary">
                      Guardar Cambios
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === "panel2"} onChange={handleChange("panel2")}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <LockIcon sx={{ mr: 1 }} /> Cambiar contraseña
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth type="password" label="Nueva contraseña" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth type="password" label="Confirmar contraseña" />
                    </Grid>
                  </Grid>
                  <Box mt={2}>
                    <Button variant="contained" color="primary">
                      Actualizar Contraseña
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Box>
        </LayoutOne>
      </Box>
    </Fade>
  );
};

export default withAuth(MyAccount);