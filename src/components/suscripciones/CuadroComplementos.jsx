// src/components/suscripciones/CuadroComplementos.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
  Alert,
  Stack,
  Box,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import axiosClient from "../../config/axiosClient";
import catalogoComplementos from "../../utils/complementos";

const CuadroComplementos = () => {
  const [complementosActivos, setComplementosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosClient
      .get("/mis-complementos")
      .then((res) => {
        const idsContratados = (res.data.data || []).map((c) => c.id);
        const filtrados = catalogoComplementos.filter((c) =>
          idsContratados.includes(c.complemento_id)
        );
        setComplementosActivos(filtrados);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card elevation={3} sx={{ backgroundColor: "#1f2937", color: "#fff" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="info">
          ➕ Complementos Activos
        </Typography>

        {loading ? (
          <CircularProgress color="inherit" />
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            ❌ Error al cargar complementos. Intenta más tarde.
          </Alert>
        ) : complementosActivos.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            ⚠️ No tienes ningún complemento contratado.
          </Alert>
        ) : (
          <List>
            {complementosActivos.map((item) => (
              <ListItem
                key={item.complemento_id}
                divider
                alignItems="flex-start"
              >
                <ListItemIcon>
                  <AddCircleOutlineIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography
                        variant="body1"
                        component="span"
                        sx={{ color: "#fff" }}
                      >
                        {item.nombre}
                      </Typography>

                      {item.tipo === "único" && (
                        <Chip
                          label="Pago Único"
                          size="small"
                          sx={{
                            backgroundColor: "#10b981",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                          }}
                        />
                      )}
                      {item.desde && (
                        <Chip
                          label="Desde"
                          variant="outlined"
                          size="small"
                          sx={{
                            backgroundColor: "#4b5563",
                            color: "#facc15",
                            fontSize: "0.75rem",
                          }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        component="span"
                        color="#cbd5e1"
                        display="block"
                      >
                        💲{" "}
                        {item.precio.toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </Typography>
                      {item.nota && (
                        <Typography
                          variant="caption"
                          component="span"
                          color="#9ca3af"
                          display="block"
                        >
                          📝 {item.nota}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default CuadroComplementos;
