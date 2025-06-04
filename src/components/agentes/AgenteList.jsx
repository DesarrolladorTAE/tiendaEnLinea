import React from "react";
import { Grid, Fade, Typography } from "@mui/material";
import AgenteCard from "./AgenteCard";

const AgenteList = ({ agentes, onEdit, onDelete }) => (
  <Grid container spacing={2}>
    {agentes.length > 0 ? (
      agentes.map((agente) => (
        <Fade in key={agente.id}>
          <Grid item xs={12}>
            <AgenteCard agente={agente} onEdit={onEdit} onDelete={onDelete} />
          </Grid>
        </Fade>
      ))
    ) : (
      <Typography variant="body2" sx={{ px: 2 }}>No hay agentes registrados.</Typography>
    )}
  </Grid>
);

export default AgenteList;
