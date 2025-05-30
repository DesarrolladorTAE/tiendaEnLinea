import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  Grid,
  Button,
  Avatar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";

const AccountInfoPanel = ({ expanded, handleChange, user }) => {
  const [values, setValues] = useState({
    name: user?.name || "",
    apellidos: user?.apellidos || "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await axios.put("/users/profile", {
        name: values.name.trim(),
        apellidos: values.apellidos.trim(),
      });
      toast.success("Datos actualizados correctamente");
      // Actualiza redux/localStorage
      dispatch(setUser({ user: { ...user, ...res.data }, token: localStorage.getItem("token") }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudieron actualizar tus datos, intenta más tarde."
      );
    }
    setLoading(false);
  };

  return (
    <Accordion
      expanded={expanded === "panel1"}
      onChange={handleChange("panel1")}
      sx={{
        borderRadius: 3,
        mb: 2,
        background: "#f3f6fb",
        ".MuiAccordionSummary-root": { minHeight: 64 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Avatar sx={{ bgcolor: "#1976d2", mr: 2 }}>
          <AccountCircleIcon />
        </Avatar>
        <Typography fontWeight={600} fontSize={{ xs: 18, md: 20 }}>
          Información personal
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={values.name}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Apellidos"
              name="apellidos"
              value={values.apellidos}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Correo" value={user?.email || ""} disabled />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Teléfono" value={user?.phone || ""} disabled />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Saldo"
              value={`$${Number(user?.saldo || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ganancias"
              value={`${Number(user?.ganancias || 0).toFixed(2)}%`}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha de Registro"
              value={new Date(user?.created_at).toLocaleString("es-MX")}
              disabled
            />
          </Grid>
        </Grid>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </AccordionDetails>
    </Accordion>
  );
};

export default AccountInfoPanel;
