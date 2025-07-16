// src/hooks/useComplementosActivos.js
import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";
import catalogoComplementos from "../utils/complementos";

const useComplementosActivos = () => {
  const [complementos, setComplementos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axiosClient
      .get("/mis-complementos")
      .then((res) => {
        const ids = (res.data.data || []).map((c) => c.id);
        const activos = catalogoComplementos.filter((c) =>
          ids.includes(c.complemento_id)
        );
        setComplementos(activos);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return {
    complementos,
    loading,
    error,
    tieneComplemento: (clave) =>
      complementos.some((c) => c.clave === clave || c.complemento_id === clave),
  };
};

export default useComplementosActivos;
