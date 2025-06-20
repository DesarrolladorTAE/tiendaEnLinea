import React, { useState } from "react";
import { Tabs, Tab, Box, Typography, Container, Paper } from "@mui/material";
import EditarDatosPersonales from "../../components/micuenta/EditarDatosPersonales";
import EditarDatosFiscales from "../../components/micuenta/EditarDatosFiscales";
import EditarNumeroTelefonico from "../../components/micuenta/EditarNumeroTelefonico";
import EditarContrasena from "../../components/micuenta/EditarContrasena";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ mt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MiCuenta() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, newIndex) => {
    setTabIndex(newIndex);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "#111827",
          fontWeight: "bold",
        }}
      >
        <span role="img" aria-label="cuenta">
          👤
        </span>{" "}
        Mi cuenta
      </Typography>

      <Paper
        sx={{ backgroundColor: "#111827", color: "#fff", borderRadius: 2 }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="inherit"
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
          >
            <Tab label="Datos personales" />
            <Tab label="Datos fiscales" />
            <Tab label="Teléfono" />
            <Tab label="Contraseña" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabIndex} index={0}>
            <EditarDatosPersonales />
          </TabPanel>
          <TabPanel value={tabIndex} index={1}>
            <EditarDatosFiscales />
          </TabPanel>
          <TabPanel value={tabIndex} index={2}>
            <EditarNumeroTelefonico />
          </TabPanel>
          <TabPanel value={tabIndex} index={3}>
            <EditarContrasena />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}
