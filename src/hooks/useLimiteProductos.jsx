import { useTienda } from "../context/TiendaContext";
import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";

const useLimiteProductos = () => {
  const { tienda, loading } = useTienda();
  const [totalProductos, setTotalProductos] = useState(0);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const limites = {
    1: 10,
    2: 100,
    3: Infinity,
    4: Infinity,
  };

  const limitePermitido = tienda?.plan_id ? limites[tienda.plan_id] ?? 0 : 0;

  useEffect(() => {
    const fetchProductos = async () => {
      if (!tienda || loading) return;

      try {
        const res = await axiosClient.get("/admin/products");
        setTotalProductos(res.data.length || 0);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      } finally {
        setCargandoProductos(false);
      }
    };

    fetchProductos();
  }, [tienda, loading]);

  const puedeCrear = totalProductos < limitePermitido;

  return {
    puedeCrear,
    totalProductos,
    limitePermitido,
    cargando: loading || cargandoProductos,
  };
};

export default useLimiteProductos;
