// src/pages/Suscripciones.jsx
import React, { useState } from "react";
import { Typography, Button, Stack } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import CuadroPlan from "../../components/suscripciones/CuadroPlan";
import CuadroComplementos from "../../components/suscripciones/CuadroComplementos";
import ModalPlanes from "../../components/suscripciones/ModalPlanes";
import TablaHistorial from "../../components/suscripciones/TablaHistorial";

export default function Suscripciones() {
  const [modalOpen, setModalOpen] = useState(false);

  const handleVerPlanes = () => setModalOpen(true);
  const handleComoFunciona = () =>
    alert(
      "Aquí podrás gestionar tu plan, complementos y ver tu historial de pagos. Tu suscripción te da acceso a servicios exclusivos, facturación y más."
    );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Typography variant="h5">
          📦 Suscripciones
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CreditCardOutlinedIcon />}
            onClick={handleVerPlanes}
            color="primary"
          >
            Ver planes
          </Button>
          <Button
            variant="outlined"
            startIcon={<InfoOutlinedIcon />}
            onClick={handleComoFunciona}
            color="secondary"
          >
            ¿Cómo funciona?
          </Button>
        </Stack>
      </div>

      <div className="row">
        <div className="col-md-6">
          <CuadroPlan onRenovar={handleVerPlanes} />
        </div>
        <div className="col-md-6">
          <CuadroComplementos onGestionar={handleVerPlanes} />
        </div>
      </div>

      <ModalPlanes open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="mt-4">
        <TablaHistorial />
      </div>
    </div>
  );
}
