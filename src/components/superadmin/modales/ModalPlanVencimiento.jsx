import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import axiosSuperadmin from "../../../config/axiosSuperadmin";

const ModalPlanVencimiento = ({ open, onClose, tienda }) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false); // futuro botón de guardar

  useEffect(() => {
    if (open && tienda?.id) {
      cargarDatos();
    }
  }, [open, tienda]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await axiosSuperadmin.get(`/admin/tiendas/${tienda.id}/plan`);
      setInfo(res.data);
    } catch (err) {
      console.error("Error al cargar datos del plan", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setTimeout(() => {
      // Simulación de lógica futura de guardar
      setGuardando(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        📋 Plan y vencimiento - {tienda?.nombre || "Tienda"}
      </DialogTitle>
      <DialogContent dividers>
        {loading || !info ? (
          <CircularProgress />
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography>
              <strong>Plan actual:</strong> {info.nombre_plan}
            </Typography>
            <Typography>
              <strong>Fecha de vencimiento:</strong>{" "}
              {info.vence
                ? new Date(info.vence)
                    .toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .replace(" de ", " de ")
                    .replace(/(\d{4})$/, "del $1")
                : "—"}
            </Typography>

            <Typography>
              <strong>Estado:</strong>{" "}
              <Chip
                label={info.estado}
                color={info.estado === "Activa" ? "success" : "error"}
                size="small"
              />
            </Typography>
            <Typography>
              <strong>Productos registrados:</strong>{" "}
              {info.productos_registrados}
            </Typography>
            <Typography>
              <strong>Límite permitido:</strong> {info.limite_permitido}
            </Typography>
            <Typography>
              <strong>¿Dentro del rango?</strong>{" "}
              <Chip
                label={info.en_rango ? "✅ Sí" : "⚠️ No"}
                color={info.en_rango ? "success" : "warning"}
                size="small"
              />
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          color="primary"
          disabled={guardando || loading}
          startIcon={
            guardando ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalPlanVencimiento;
