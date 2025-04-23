import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Grid,
  Button,
  Stack,
} from "@mui/material";
import { Replay, Visibility, VisibilityOff, Edit, Add, Delete, Save } from "@mui/icons-material";

const puntosDeVentaIniciales = [
  { id: 1, nombre: "Caja Principal", codigo: "POS-001", acceso: "abc123" },
  { id: 2, nombre: "Sucursal Norte", codigo: "POS-002", acceso: "def456" },
];

const POS = () => {
  const [puntos, setPuntos] = useState(puntosDeVentaIniciales);
  const [visibles, setVisibles] = useState({});
  const [editando, setEditando] = useState({});
  const [originales, setOriginales] = useState({});

  const toggleVisibilidad = (id) => setVisibles((v) => ({ ...v, [id]: !v[id] }));

  const generarCódigo = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleGenerate = (id) => {
    if (!originales[id]) {
      const actual = puntos.find((p) => p.id === id);
      setOriginales((o) => ({ ...o, [id]: { acceso: actual.acceso } }));
    }
    const nuevo = generarCódigo();
    setPuntos((ps) => ps.map((p) => (p.id === id ? { ...p, acceso: nuevo } : p)));
    setVisibles((v) => ({ ...v, [id]: true }));
    setEditando((e) => ({ ...e, [id]: true }));
  };

  const handleChangeNombre = (id, value) => {
    if (!originales[id]) {
      const actual = puntos.find((p) => p.id === id);
      setOriginales((o) => ({
        ...o,
        [id]: { nombre: actual.nombre, acceso: actual.acceso },
      }));
    }
    setPuntos((ps) => ps.map((p) => (p.id === id ? { ...p, nombre: value } : p)));
    setEditando((e) => ({ ...e, [id]: true }));
  };

  const hayCambios = (id) => {
    const orig = originales[id];
    if (!orig) return false;
    const act = puntos.find((p) => p.id === id);
    return orig.nombre !== act.nombre || orig.acceso !== act.acceso;
  };

  const guardarCambios = (id) => {
    setEditando((e) => ({ ...e, [id]: false }));
    setVisibles((v) => ({ ...v, [id]: false }));
    setOriginales((o) => {
      const { [id]: _, ...rest } = o;
      return rest;
    });
    // aquí podrías llamar a tu API para persistir
  };

  const agregarPunto = () => {
    const nextId = Math.max(0, ...puntos.map((p) => p.id)) + 1;
    const codigo = `POS-${nextId.toString().padStart(3, "0")}`;
    setPuntos((ps) => [...ps, { id: nextId, nombre: "", codigo, acceso: "" }]);
    setEditando((e) => ({ ...e, [nextId]: true }));
    setOriginales((o) => ({ ...o, [nextId]: { nombre: "", acceso: "" } }));
  };

  const eliminarPunto = (id) => {
    setPuntos((ps) => ps.filter((p) => p.id !== id));
    setVisibles((v) => {
      const { [id]: _, ...rest } = v;
      return rest;
    });
    setEditando((e) => {
      const { [id]: _, ...rest } = e;
      return rest;
    });
    setOriginales((o) => {
      const { [id]: _, ...rest } = o;
      return rest;
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Puntos de Venta 🏬</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={agregarPunto}>
          Nuevo punto de venta
        </Button>
      </Box>

      <Grid container spacing={2} alignItems="stretch">
        {puntos.map((pos) => (
          <Grid item xs={12} md={6} key={pos.id}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Nombre */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {editando[pos.id] ? (
                    <TextField
                      value={pos.nombre}
                      onChange={(e) => handleChangeNombre(pos.id, e.target.value)}
                      variant="standard"
                      fullWidth
                      InputProps={{
                        style: { fontSize: "1.25rem", fontWeight: 500 },
                      }}
                    />
                  ) : (
                    <Typography variant="h6">{pos.nombre || "Sin nombre"}</Typography>
                  )}
                  <IconButton
                    onClick={() => {
                      const actual = puntos.find((p) => p.id === pos.id);
                      if (!originales[pos.id]) {
                        setOriginales((o) => ({
                          ...o,
                          [pos.id]: {
                            nombre: actual.nombre,
                            acceso: actual.acceso,
                          },
                        }));
                      }
                      setEditando((e) => ({ ...e, [pos.id]: true }));
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Box>

                {/* Código POS */}
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Código POS: {pos.codigo}
                </Typography>

                {/* Código de acceso */}
                <TextField
                  label="Código de acceso"
                  variant="standard"
                  margin="none"
                  fullWidth
                  type={visibles[pos.id] ? "text" : "password"}
                  value={pos.acceso}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        {/* siempre ocupa espacio */}
                        <IconButton
                          onClick={() => handleGenerate(pos.id)}
                          sx={{
                            visibility: visibles[pos.id] ? "visible" : "hidden",
                          }}
                        >
                          <Replay />
                        </IconButton>
                        <IconButton onClick={() => toggleVisibilidad(pos.id)}>
                          {visibles[pos.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      minHeight: 40,
                      paddingTop: 0,
                      paddingBottom: 0,
                    },
                    "& .MuiInputBase-input": {
                      padding: 0,
                      fontFamily: "monospace",
                    },
                  }}
                />
              </CardContent>

              {/* Siempre renderizamos SAVE + DELETE, pero SAVE puede estar invisible */}
              <Box px={2} pb={2}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => guardarCambios(pos.id)}
                    sx={{
                      visibility: hayCambios(pos.id) ? "visible" : "hidden",
                    }}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => eliminarPunto(pos.id)}
                  >
                    Eliminar
                  </Button>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default POS;
