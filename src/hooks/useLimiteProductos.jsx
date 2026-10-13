import { useTienda } from "../context/TiendaContext";
import { useCallback, useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";

const useLimiteProductos = () => {
  const { tienda, loading } = useTienda();
  const [totalProductos, setTotalProductos] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorLimite, setErrorLimite] = useState(null);

  const limites = {
    1: 10,
    2: 100,
    3: Infinity,
    4: Infinity,
  };

  const limitePermitido = tienda?.plan_id ? limites[tienda.plan_id] ?? 0 : 0;

  const actualizarLimite = useCallback(async () => {
      if (!tienda || loading) {
        setCargandoProductos(false);
        return;
      }
      setCargandoProductos(true);
      setErrorLimite(null);
      try {
        const res = await axiosClient.get("/admin/products");
        const data = res.data;
        // Laravel may return a collection or a paginated resource.
        const total = data?.total ?? data?.meta?.total ?? data?.products?.total ?? data?.data?.total;
        const list = Array.isArray(data) ? data : data?.products ?? data?.data;
        if (total != null && Number.isFinite(Number(total)) && Number(total) >= 0) {
          setTotalProductos(Number(total));
        } else if (Array.isArray(list)) {
          setTotalProductos(list.length);
        } else {
          throw new Error("La respuesta no incluye un total de productos válido.");
        }
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setErrorLimite("No se pudo consultar el total de productos.");
      } finally {
        setCargandoProductos(false);
      }
  }, [tienda, loading]);

  useEffect(() => {
    actualizarLimite();
  }, [actualizarLimite]);

  const puedeCrear = !loading && !cargandoProductos && !errorLimite && totalProductos !== null && totalProductos < limitePermitido;

  return {
    puedeCrear,
    totalProductos,
    limitePermitido,
    actualizarLimite,
    errorLimite,
    cargando: loading || cargandoProductos,
  };
};

export default useLimiteProductos;
