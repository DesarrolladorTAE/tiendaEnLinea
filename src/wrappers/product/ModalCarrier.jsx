import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import RecargaForm from "./RecargaForm";
import RecargaStatus from "./RecargaStatus";
import RecargaResultado from "./RecargaResultado";
import RecargaStepIcon from "./RecargaStepIcon"; // Asegúrate de que este path sea correcto

const ModalCarrier = ({ isOpen, onClose, carrier, productos }) => {
  const [etapa, setEtapa] = useState(1);
  const [estadoRecarga, setEstadoRecarga] = useState({
    loading: false,
    error: null,
    data: null,
  });

  const handleStartRecarga = (payload, hacerRecarga) => {
    setEtapa(2);
    setEstadoRecarga({ loading: true, error: null, data: null });

    hacerRecarga(payload)
      .then((res) => {
        // ✅ Verifica que venga la propiedad transaccion
        const resultadoEstructurado = {
          transaccion: {
            ...res.transaccion,
            referencia: payload.numero, // complemento para asegurar consistencia
          },
        };

        setEstadoRecarga({
          loading: false,
          error: null,
          data: resultadoEstructurado,
        });
        setEtapa(3);
      })
      .catch((err) => {
        setEstadoRecarga({
          loading: false,
          error: err?.response?.data?.message || "Error desconocido",
          data: null,
        });
      });
  };

  const reset = () => {
    setEtapa(1);
    setEstadoRecarga({ loading: false, error: null, data: null });
  };

  const pasos = ["Ingresar datos", "Procesando recarga", "Recarga completada"];

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Recarga a {carrier?.Nombre}
          <Box
            component="img"
            src={carrier?.Logotipo}
            alt={carrier?.Nombre}
            sx={{ height: 40, borderRadius: 1 }}
          />
        </Box>
      </DialogTitle>

      {/* Stepper superior */}
      <Box px={3} pt={1}>
        <Stepper activeStep={etapa - 1} alternativeLabel>
          {pasos.map((label, index) => (
            <Step key={index}>
              <StepLabel StepIconComponent={RecargaStepIcon}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Contenido dinámico */}
      {etapa === 1 && (
        <RecargaForm
          carrier={carrier}
          productos={productos}
          onNext={handleStartRecarga}
          onCancel={onClose}
        />
      )}

      {etapa === 2 && (
        <RecargaStatus estado={estadoRecarga} onRetry={() => setEtapa(1)} />
      )}

      {etapa === 3 && (
        <RecargaResultado
          resultado={estadoRecarga.data}
          onClose={onClose}
          onReiniciar={reset}
        />
      )}

      {etapa === 1 && (
        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ModalCarrier;
