import React, { useState, useEffect } from "react";
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
import axiosClient from "../../config/axiosClient";
import cogoToast from "cogo-toast";

const POS = () => {
  const [puntos, setPuntos] = useState([]);
  const [limite, setLimite] = useState(2);
  const [visibles, setVisibles] = useState({});
  const [editando, setEditando] = useState({});

  // 1) Carga inicial de puntos desde la API
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosClient.get("/store/pos");
        setPuntos(data.list);
        setLimite(data.max);
      } catch (err) {
        console.error("Error al cargar POS:", err);
      }
    })();
  }, []);

  // Genera un código de 6 dígitos aleatorio
  const generarCódigo = () => Math.floor(100000 + Math.random() * 900000).toString();

  // A) Añadir una fila temporal en modo edición
  const agregarPunto = () => {
    if (puntos.length >= limite) {
      cogoToast.warn(`Solo se permiten hasta ${limite} puntos de venta.`, {
        position: "top-center",
        hideAfter: 4,
      });
      return;
    }

    const tempId = `new-${Date.now()}`;
    const access_code = generarCódigo();
    setPuntos((ps) => [
      ...ps,
      {
        id: tempId,
        name: "",
        code: "",
        access_code,
      },
    ]);
    setEditando((e) => ({ ...e, [tempId]: true }));
    setVisibles((v) => ({ ...v, [tempId]: true }));
  };

  // B) Guardar cambios: POST si es nuevo, PUT si ya existe
  const guardarCambios = async (id) => {
    const punto = puntos.find((p) => p.id === id);

    if (String(id).startsWith("new-")) {
      try {
        const { data } = await axiosClient.post("/store/pos", {
          name: punto.name,
          access_code: punto.access_code,
        });

        const creado = data.pos;
        setPuntos((ps) => ps.map((x) => (x.id === id ? creado : x)));

        setEditando((e) => {
          const { [id]: _, ...rest } = e;
          return rest;
        });
        setVisibles((v) => {
          const { [id]: _, ...rest } = v;
          return rest;
        });

        cogoToast.success("Punto de venta creado exitosamente!", { position: "top-center" });
      } catch (err) {
        cogoToast.error("Error al crear el POS. Inténtalo de nuevo.", { position: "top-center" });
        console.error("Error creando POS:", err);
      }
    } else {
      try {
        await axiosClient.put(`/pos/${id}`, {
          name: punto.name,
          access_code: punto.access_code,
        });

        setEditando((e) => ({ ...e, [id]: false }));
        setVisibles((v) => ({ ...v, [id]: false }));

        cogoToast.success("Punto de venta actualizado.", { position: "top-center" });
      } catch (err) {
        cogoToast.error("Error al actualizar el POS.", { position: "top-center" });
        console.error("Error actualizando POS:", err);
      }
    }
  };

  // C) Regenerar access_code: solo PUT en POS ya existentes
  const handleGenerate = async (id) => {
    const nuevo = generarCódigo();

    if (String(id).startsWith("new-")) {
      // solo actualiza localmente
      setPuntos((ps) => ps.map((p) => (p.id === id ? { ...p, access_code: nuevo } : p)));
      setVisibles((v) => ({ ...v, [id]: true }));
      setEditando((e) => ({ ...e, [id]: true }));
      return;
    }

    // PUT inmediato para POS persistido
    try {
      await axiosClient.put(`/pos/${id}`, { access_code: nuevo });
      setPuntos((ps) => ps.map((p) => (p.id === id ? { ...p, access_code: nuevo } : p)));
      setVisibles((v) => ({ ...v, [id]: true }));
      setEditando((e) => ({ ...e, [id]: true }));
    } catch (err) {
      console.error("Error regenerando access_code:", err);
    }
  };

  // D) Cambiar nombre en local
  const handleChangeNombre = (id, value) => {
    setPuntos((ps) => ps.map((p) => (p.id === id ? { ...p, name: value } : p)));
    setEditando((e) => ({ ...e, [id]: true }));
  };

  // E) Mostrar/ocultar input de access_code
  const toggleVisibilidad = (id) => {
    setVisibles((v) => ({ ...v, [id]: !v[id] }));
  };

  // F) Eliminar punto: DELETE si existe, o solo local si es nuevo
  const eliminarPunto = async (id) => {
    if (!String(id).startsWith("new-")) {
      try {
        await axiosClient.delete(`/pos/${id}`);

        setPuntos((ps) => ps.filter((p) => p.id !== id));
        setEditando((e) => {
          const { [id]: _, ...rest } = e;
          return rest;
        });
        setVisibles((v) => {
          const { [id]: _, ...rest } = v;
          return rest;
        });

        cogoToast.info("Punto de venta eliminado.", { position: "top-center" });
      } catch (err) {
        cogoToast.error("Error al eliminar el POS. Intenta nuevamente.", {
          position: "top-center",
        });
        console.error("Error eliminando POS:", err);
      }
    } else {
      setPuntos((ps) => ps.filter((p) => p.id !== id));
      setEditando((e) => {
        const { [id]: _, ...rest } = e;
        return rest;
      });
      setVisibles((v) => {
        const { [id]: _, ...rest } = v;
        return rest;
      });

      cogoToast.info("Punto de venta descartado antes de guardar.", { position: "top-center" });
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Gestión de Puntos de Venta</Typography>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="success"
            href="/prueba/pos"
            target="_blank"
            sx={{
              color: "white", // siempre blanco
              "&:hover": {
                backgroundColor: "#2e7d32", // tono más oscuro opcional
                color: "white",
              },
            }}
          >
            Ir al Punto de Venta
          </Button>

          <Button variant="contained" startIcon={<Add />} onClick={agregarPunto}>
            Nuevo punto
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Grid container spacing={2}>
          {puntos.map((pos) => (
            <Grid key={pos.id} size={{ xs: 12, md: 4 }}>
              <Card
                variant="outlined"
                sx={{ display: "flex", flexDirection: "column", height: "100%" }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Nombre */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    {editando[pos.id] ? (
                      <TextField
                        required
                        value={pos.name}
                        onChange={(e) => handleChangeNombre(pos.id, e.target.value)}
                        fullWidth
                        variant="standard"
                        InputProps={{ style: { fontSize: "1.25rem", fontWeight: 500 } }}
                      />
                    ) : (
                      <Typography variant="h6">{pos.name || "Sin nombre"}</Typography>
                    )}
                    <IconButton onClick={() => setEditando((e) => ({ ...e, [pos.id]: true }))}>
                      <Edit />
                    </IconButton>
                  </Box>

                  {/* Código POS */}
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Código POS: {pos.code || "—"}
                  </Typography>

                  {/* Código de acceso */}
                  <TextField
                    label="Código de acceso"
                    variant="standard"
                    fullWidth
                    type={visibles[pos.id] ? "text" : "password"}
                    value={pos.access_code}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleGenerate(pos.id)}
                            sx={{ visibility: visibles[pos.id] ? "visible" : "hidden" }}
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
                      "& .MuiInputBase-root": { minHeight: 40, py: 0 },
                      "& .MuiInputBase-input": { p: 0, fontFamily: "monospace" },
                    }}
                  />
                </CardContent>

                {/* Botones Guardar / Eliminar */}
                <Box px={2} pb={2}>
                  <Stack direction="row" spacing={1}>
                    <Button
                      startIcon={<Save />}
                      onClick={() => guardarCambios(pos.id)}
                      disabled={!pos.name?.trim()}
                      sx={{ visibility: editando[pos.id] ? "visible" : "hidden" }}
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
    </Box>
  );
};

export default POS;
