import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { keyframes } from "@emotion/react";

const girar = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const ComprasFacturadas = ({ cambiarVista }) => {
  return (
    <Box p={4}>
      {/* Botón regresar al panel */}
      <Box display="flex" justifyContent="center" mb={4}>
        <Stack direction="row" spacing={3}>
          <Button
            variant="outlined"
            color="success"
            size="large"
            startIcon={<DashboardIcon />}
            sx={{
              borderRadius: 3,
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              borderWidth: 2,
              boxShadow: 2,
              "&:hover": {
                borderWidth: 2,
              },
            }}
            onClick={() => cambiarVista("menu")}
          >
            Regresar al Panel
          </Button>
        </Stack>
      </Box>

      {/* Contenido principal */}
      <Paper elevation={3} sx={{ padding: 4, textAlign: "center" }}>
        <Stack direction="column" alignItems="center" spacing={2}>
          <SettingsIcon
            sx={{
              fontSize: 60,
              animation: `${girar} 3s linear infinite`,
              color: "gray",
            }}
          />
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Función en desarrollo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            La autofacturación a clientes estará disponible próximamente.
          </Typography>

          <Divider sx={{ width: "100%", my: 2 }} />

          <Chip
            label="Disponible en el Plan Profesional"
            color="warning"
            icon={<StarIcon />}
            sx={{ fontSize: "1rem", paddingX: 2 }}
          />

          <Box mt={2} textAlign="left">
            <Typography variant="h6" gutterBottom>
              Detalles del Plan Profesional
            </Typography>
            <Typography>
              <strong>Precio mensual:</strong> $449 MXN
            </Typography>
            <Typography sx={{ mt: 1, mb: 1 }}>
              <em>Para negocios que venden más y quieren cobrar en línea</em>
            </Typography>

            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Beneficios incluidos:
            </Typography>
            <List dense>
              {[
                "Todo lo anterior",
                "Hasta 5 puntos de venta",
                "Productos ilimitados",
                "Carrito con integración a pasarela de pago (Stripe / Conekta)",
                "Reportes detallados",
                "Soporte técnico por WhatsApp",
                "Acceso desde múltiples dispositivos",
              ].map((beneficio, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={beneficio} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle1" fontWeight="bold" mt={2}>
              Promociones:
            </Typography>
            <List dense>
              {[
                { paga: 5, recibe: 6 },
                { paga: 10, recibe: 12 },
              ].map((promo, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <LocalOfferIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Paga ${promo.paga} y recibe ${promo.recibe} meses`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ComprasFacturadas;
