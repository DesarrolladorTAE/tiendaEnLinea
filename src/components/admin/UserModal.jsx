import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from "@mui/material";

const UserModal = ({ open, handleClose, handleSubmit, modo, initialData }) => {
  const [formData, setFormData] = useState({
    name: "",
    apellidos: "",
    email: "",
    phone: "",
    role: "usuario",
    ganancias: 0,
  });

  useEffect(() => {
    if (modo === "editar" && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        apellidos: "",
        email: "",
        phone: "",
        role: "usuario",
        ganancias: 0,
      });
    }
  }, [modo, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "ganancias" ? parseFloat(value) : value,
    }));
  };

  const handleFormSubmit = () => {
    handleSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>
        {modo === "crear" ? "Crear nuevo usuario" : "Editar usuario"}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="normal"
          label="Nombre"
          fullWidth
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          label="Apellidos"
          fullWidth
          name="apellidos"
          value={formData.apellidos}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          label="Email"
          fullWidth
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={modo === "editar"}
        />
        <TextField
          margin="normal"
          label="Teléfono"
          fullWidth
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={modo === "editar"}
          inputProps={{ maxLength: 10 }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Rol</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="Rol"
          >
            <MenuItem value="usuario">Usuario</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">SuperAdmin</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="normal"
          label="Ganancia (%)"
          fullWidth
          name="ganancias"
          type="number"
          value={formData.ganancias}
          onChange={handleChange}
          inputProps={{ step: "0.1", min: "0" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleFormSubmit} variant="contained">
          {modo === "crear" ? "Crear" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
