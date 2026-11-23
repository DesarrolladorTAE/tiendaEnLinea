import React from "react";
import { Alert } from "@mui/material";
import { alpha } from "@mui/material/styles";

const COLORS = {
  accent: "#f9b233",
};

export default function RestrictionAlert({ nombrePlanActual }) {
  return (
    <Alert
      severity="warning"
      sx={{
        borderRadius: 2.5,
        bgcolor: alpha(COLORS.accent, 0.10),
        border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
      }}
    >
      <b>Tu plan actual es {nombrePlanActual}.</b>
      <br />
      Esta función solo está disponible en <b>Plan Profesional</b> y <b>Plan Avanzado</b>.
      <br />
      Puedes visualizar la información y los formularios, pero para crear, guardar, actualizar o eliminar necesitas adquirir un plan compatible.
    </Alert>
  );
}