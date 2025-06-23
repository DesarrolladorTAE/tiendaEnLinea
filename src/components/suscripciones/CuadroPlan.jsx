import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  Box,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import axiosClient from "../../config/axiosClient";
import { showError } from "../../utils/alerts";
import planes from "../../utils/planes";
import Renovar from "../../pages/other/Renovar";

const PlanActualCard = () => {
  const [plan, setPlan] = useState(null);
  const [vigencia, setVigencia] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const formatearFecha = (fechaIso) => {
    const fecha = new Date(fechaIso);
    return `Fecha: ${fecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}  Hora: ${fecha.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  useEffect(() => {
    axiosClient
      .get("/perfil/mi-tienda")
      .then((res) => {
        const store = res.data;
        const encontrado = planes.find((p) => p.plan_id === store.plan_id);

        if (!encontrado) {
          showError("No se encontró el plan asignado a esta tienda.");
          return;
        }

        setPlan(encontrado);

        const fechaVigencia = store.plan_id === 1
          ? store.trial_ends_at
          : store.plan_expiration;

        if (fechaVigencia) {
          setVigencia(formatearFecha(fechaVigencia));

          const now = new Date();
          const fin = new Date(fechaVigencia);
          setIsExpired(fin < now);
        }
      })
      .catch(() => {
        showError("No se pudo cargar el plan actual.");
      });
  }, []);

  if (!plan) return null;

  return (
    <>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💼 Tu Plan Actual
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight="bold" color="primary">
              {plan.nombre}
            </Typography>
            <Chip
              label={isExpired ? "Inactivo" : "Activo"}
              color={isExpired ? "error" : "success"}
              variant="outlined"
              sx={{ fontWeight: "bold", fontSize: "0.9rem" }}
            />
          </Box>

          <Typography
            variant="body1"
            sx={{
              mt: 1,
              fontWeight: 500,
              color: "#444",
              fontSize: "1rem",
            }}
          >
            {vigencia || "Sin definir"}
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: "bold" }}>
            Beneficios incluidos:
          </Typography>

          <List>
            {plan.beneficios.map((beneficio, i) => (
              <ListItem key={i} disablePadding>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary={beneficio} />
              </ListItem>
            ))}
          </List>

          {isExpired && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setModalOpen(true)}
              sx={{ mt: 3 }}
              fullWidth
            >
              Renovar Plan
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Renovar Plan
          <IconButton
            aria-label="close"
            onClick={() => setModalOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Renovar />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanActualCard;
