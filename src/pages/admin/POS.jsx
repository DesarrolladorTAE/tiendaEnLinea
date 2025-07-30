// POS.jsx (principal)
import React, { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import cogoToast from "cogo-toast";
import useLimitePOS from "../../hooks/useLimitePOS";
import { useTienda } from "../../context/TiendaContext";
import POSHeader from "../../components/adminpos/POSHeader";
import POSCard from "../../components/adminpos/POSCard";
import { useNavigate } from "react-router-dom";

const POS = () => {
  const [puntos, setPuntos] = useState([]);
  const { limitePermitido: limite } = useLimitePOS();
  const [visibles, setVisibles] = useState({});
  const [editando, setEditando] = useState({});
  const { tienda } = useTienda();

  const navigate = useNavigate();

  const nombrePlan = tienda?.plan_id
    ? tienda?.nombre_plan || `Plan ${tienda.plan_id}`
    : "Desconocido";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosClient.get("/store/pos");
        setPuntos(data.list);
      } catch (err) {
        console.error("Error al cargar POS:", err);
      }
    })();
  }, []);

  const iniciarSesionPOS = (pos) => {
    navigate("/admin/prueba/pos", {
      state: { pos }, // ← Enviamos el objeto del punto de venta
    });
  };

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
    setPuntos((ps) => [...ps, { id: tempId, name: "", code: "", access_code }]);
    setEditando((e) => ({ ...e, [tempId]: true }));
    setVisibles((v) => ({ ...v, [tempId]: true }));
  };
  const handleChangeNombre = (id, nuevoNombre) => {
    actualizarCampo(id, "name", nuevoNombre);
  };
  const toggleVisibilidad = (id) => {
    setVisibles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleGenerate = (id) => {
    const nuevoCodigo = generarCódigo();
    setPuntos((ps) =>
      ps.map((p) => (p.id === id ? { ...p, access_code: nuevoCodigo } : p))
    );
    setEditando((e) => ({ ...e, [id]: true }));
  };

  const generarCódigo = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const actualizarCampo = (id, campo, valor) => {
    setPuntos((ps) =>
      ps.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
    setEditando((e) => ({ ...e, [id]: true }));
  };

  const guardarCambios = async (id) => {
    const punto = puntos.find((p) => p.id === id);
    try {
      if (String(id).startsWith("new-")) {
        const { data } = await axiosClient.post("/store/pos", punto);
        setPuntos((ps) => ps.map((x) => (x.id === id ? data.pos : x)));
      } else {
        await axiosClient.put(`/pos/${id}`, punto);
      }
      setEditando((e) => ({ ...e, [id]: false }));
      cogoToast.success("Guardado exitosamente", { position: "top-center" });
    } catch (err) {
      cogoToast.error("Error al guardar POS", { position: "top-center" });
    }
  };

  const eliminarPunto = async (id) => {
    if (!String(id).startsWith("new-")) {
      try {
        await axiosClient.delete(`/pos/${id}`);
      } catch (err) {
        return cogoToast.error("No se pudo eliminar", {
          position: "top-center",
        });
      }
    }
    setPuntos((ps) => ps.filter((p) => p.id !== id));
    cogoToast.info("Punto eliminado", { position: "top-center" });
  };

  return (
    <Box p={3}>
      <POSHeader
        puntosLength={puntos.length}
        limite={limite}
        agregarPunto={agregarPunto}
      />

      <Box mt={3}>
        <Grid container spacing={2}>
          {puntos.map((pos) => (
            <Grid key={pos.id} item xs={12} sm={6} md={4}>
              <POSCard
                pos={pos}
                editando={editando}
                visibles={visibles}
                handleChangeNombre={handleChangeNombre}
                toggleVisibilidad={toggleVisibilidad}
                handleGenerate={handleGenerate}
                guardarCambios={guardarCambios}
                eliminarPunto={eliminarPunto}
                setEditando={setEditando}
                onIniciarSesion={iniciarSesionPOS}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default POS;
