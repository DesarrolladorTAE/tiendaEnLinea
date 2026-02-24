import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  Box,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import RecargaForm from "./RecargaForm";
import RecargaStatus from "./RecargaStatus";
import RecargaResultado from "./RecargaResultado";
import RecargaStepIcon from "./RecargaStepIcon";

const ModalCarrier = ({ isOpen, onClose, carrier, productos }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [etapa, setEtapa] = useState(1);
  const [estadoRecarga, setEstadoRecarga] = useState({
    loading: false,
    error: null,
    data: null,
    errorMeta: null, // ✅ agrega esto
  });

  useEffect(() => {
    if (!isOpen) {
      setEtapa(1);
      setEstadoRecarga({ loading: false, error: null, data: null, errorMeta: null });
    }
  }, [isOpen]);

  const handleStartRecarga = (payload, hacerRecarga) => {
    setEtapa(2);
    setEstadoRecarga({ loading: true, error: null, data: null });

    hacerRecarga(payload)
      .then((res) => {
        const resultadoEstructurado = {
          transaccion: {
            ...res.transaccion,
            referencia: payload.numero,
          },
        };

        setEstadoRecarga({ loading: false, error: null, data: resultadoEstructurado, errorMeta: null });
        setEtapa(3);
      })
      .catch((err) => {
        const status = err?.response?.status;
        const data = err?.response?.data;

        const esBloqueoReciente =
          status === 429 || data?.error === "RECARGA_RECIENTE" || /espera/i.test(data?.message || "");

        setEstadoRecarga({
          loading: false,
          error:
            data?.message ||
            data?.error ||
            (typeof data === "string" ? data : null) ||
            err?.message ||
            "Error desconocido",
          data: null,
          errorMeta: esBloqueoReciente ? data : null, // ✅ AQUÍ SE MANDA a RecargaStatus
        });
      });
  };

  const reset = () => {
    setEtapa(1);
    setEstadoRecarga({ loading: false, error: null, data: null });
  };

  const pasos = ["Ingresar datos", "Procesando recarga", "Recarga completada"];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
          border: "1px solid rgba(15,23,42,0.10)",
          boxShadow: "0 26px 70px rgba(2,6,23,0.18)",
          background: "#fff",
          height: fullScreen ? "100dvh" : "auto",
          maxHeight: fullScreen ? "100dvh" : { xs: "92vh", md: "90vh" },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ p: { xs: 2, md: 2.5 }, background: "#fff" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1.5} flexWrap="wrap">
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontWeight: 950, color: "#0b1220", fontSize: { xs: 16, md: 18 } }}>
              Recarga a{" "}
              <Box component="span" sx={{ color: "#0b5ed7" }}>
                {carrier?.Nombre || "Carrier"}
              </Box>
            </Box>
            <Box sx={{ mt: 0.4, color: "rgba(11,18,32,0.62)", fontSize: 13 }}>
              Proceso seguro y rápido.
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: { xs: 88, sm: 110 },
                height: { xs: 44, sm: 50 },
                borderRadius: 2.2,
                border: "1px solid rgba(15,23,42,0.10)",
                background: "rgba(2,6,23,0.02)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                px: 1,
              }}
            >
              <Box
                component="img"
                src={carrier?.Logotipo}
                alt={carrier?.Nombre}
                sx={{
                  maxWidth: "92%",
                  maxHeight: "80%",
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </Box>

            <IconButton
              onClick={onClose}
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(15,23,42,0.10)",
                background: "rgba(2,6,23,0.02)",
                "&:hover": { background: "rgba(2,6,23,0.06)" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mt: 2, borderColor: "rgba(15,23,42,0.08)" }} />

        <Box sx={{ pt: 1.8 }}>
          <Stepper
            activeStep={etapa - 1}
            alternativeLabel
            sx={{
              "& .MuiStepLabel-label": {
                fontWeight: 900,
                fontSize: 12.5,
                color: "rgba(11,18,32,0.70)",
              },
              "& .MuiStepLabel-label.Mui-active": { color: "#0b5ed7" },
              "& .MuiStepLabel-label.Mui-completed": { color: "rgba(11,18,32,0.80)" },
              "& .MuiStepConnector-line": { borderColor: "rgba(0,123,255,0.22)" },
            }}
          >
            {pasos.map((label, index) => (
              <Step key={index}>
                <StepLabel StepIconComponent={RecargaStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogTitle>

      {/* ✅ CONTENIDO scrolleable */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          background: "#fff",
        }}
      >
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
      </Box>
    </Dialog>
  );
};

export default ModalCarrier;