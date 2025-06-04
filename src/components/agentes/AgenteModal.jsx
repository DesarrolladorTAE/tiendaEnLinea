import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
} from "@mui/material";

const AgenteModal = ({
  open,
  handleClose,
  editingAgente,
  handleEditChange,
  saveEditedAgente,
}) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>✏️ Editar Agente</DialogTitle>
    <DialogContent>
      <TextField
        fullWidth
        label="Nombre"
        name="name"
        value={editingAgente?.name || ""}
        onChange={handleEditChange}
        sx={{ mt: 1 }}
      />
      <TextField
        fullWidth
        label="Apellidos"
        name="apellidos"
        value={editingAgente?.apellidos || ""}
        onChange={handleEditChange}
        sx={{ mt: 2 }}
      />
      <TextField
        fullWidth
        label="Teléfono"
        name="phone"
        value={editingAgente?.phone || ""}
        onChange={handleEditChange}
        sx={{ mt: 2 }}
      />
      <TextField
        fullWidth
        label="Saldo"
        name="saldo"
        type="number"
        inputProps={{ step: "0.01", min: "0" }}
        value={editingAgente?.saldo ?? ""}
        onChange={handleEditChange}
        sx={{ mt: 2 }}
      />

      <Grid container spacing={1} sx={{ mt: 2 }}>
        <Grid item xs={8}>
          <TextField
            fullWidth
            label="Código (opcional)"
            name="codigo"
            value={editingAgente?.codigo || ""}
            onChange={handleEditChange}
          />
        </Grid>
        <Grid item xs={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              const random = Math.floor(10000000 + Math.random() * 90000000);
              handleEditChange({
                target: { name: "codigo", value: random.toString() },
              });
            }}
          >
            🎲 Generar
          </Button>
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>Cancelar</Button>
      <Button onClick={saveEditedAgente} variant="contained">
        Guardar
      </Button>
    </DialogActions>
  </Dialog>
);

export default AgenteModal;
