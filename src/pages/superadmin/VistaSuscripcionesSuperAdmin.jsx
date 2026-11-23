import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import TablaTiendas from "../../components/subs-admin/TablaTiendas";

const VistaSuscripcionesSuperAdmin = () => {
  const [tiendas, setTiendas] = useState([]);

  useEffect(() => {
    obtenerTiendas();
  }, []);

  const obtenerTiendas = async () => {
    try {
      const res = await axiosSuperadmin.get("/admin/tiendaslol");
      setTiendas(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar tiendas:", error);
    }
  };

  return (
<div style={{ paddingTop: "32px", paddingBottom: "24px" }}>
  <Typography variant="h6" fontWeight="bold" gutterBottom>
    🏬 Suscripciones
  </Typography>

  <TablaTiendas tiendas={tiendas} />
</div>

  );
};

export default VistaSuscripcionesSuperAdmin;
