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
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import axiosClient from "../../config/axiosClient";
import { showError } from "../../utils/alerts";
import planes from "../../utils/planes";
// ⬇️ Usa tu Modal de planes y complementos
import ModalPlanesComplementos from "../../components/suscripciones/ModalPlanes"; 


const PlanActualCard = () => {
  const [plan, setPlan] = useState(null);
  const [vigencia, setVigencia] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

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

        const demo = Number(store.plan_id) === 1;
        setIsDemo(demo);

        const fechaVigencia = demo ? store.trial_ends_at : store.plan_expiration;

        if (fechaVigencia) {
          setVigencia(formatearFecha(fechaVigencia));
          const now = new Date();
          const fin = new Date(fechaVigencia);
          setIsExpired(fin < now);
        }
      })
      .catch(() => showError("No se pudo cargar el plan actual."));
  }, []);

  if (!plan) return null;

  const actionLabel = isDemo ? "Activa tu tienda" : "Adelanta tu pago";
  const actionColor = isDemo ? "success" : "secondary";

  return (
    <>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💼 Tu Plan Actual
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
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

          <Typography variant="body1" sx={{ mt: 1, fontWeight: 500, color: "#444" }}>
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

          {/* Acciones */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            {/* Botón dinámico: siempre visible */}
            <Button
              variant="contained"
              color={actionColor}
              onClick={() => setModalOpen(true)}
              fullWidth
            >
              {actionLabel}
            </Button>

            {/* Botón de renovar: solo si ya está vencido (abre el mismo modal) */}
            {isExpired && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setModalOpen(true)}
                fullWidth
              >
                Renovar Plan
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Modal de Planes y Complementos */}
      <ModalPlanesComplementos
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default PlanActualCard;
