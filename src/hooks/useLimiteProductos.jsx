import { useTienda } from "../context/TiendaContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminUi } from "../context/AdminUiContext";
import axiosClient from "../config/axiosClient";

const useLimiteProductos = (branchIdOverride) => {
  const { selectedBranch } = useAdminUi();
  const branchId = branchIdOverride === undefined ? selectedBranch?.id : branchIdOverride;
  const { tienda, loading } = useTienda();
  const scope = `${tienda?.id ?? ""}:${branchId ?? ""}`;
  const requestId = useRef(0);
  const [resolvedScope, setResolvedScope] = useState(null);
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
      const currentRequest = ++requestId.current;
      if (!tienda || loading || !branchId) {
        setTotalProductos(null);
        setResolvedScope(null);
        setErrorLimite(!loading && !branchId ? "Selecciona una sucursal para consultar el límite." : null);
        setCargandoProductos(false);
        return;
      }
      setCargandoProductos(true);
      setErrorLimite(null);
      setTotalProductos(null);
      try {
        const res = await axiosClient.get(`/admin/branches/${branchId}/products`);
        if (currentRequest !== requestId.current) return;
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
        setResolvedScope(scope);
      } catch (error) {
        if (currentRequest !== requestId.current) return;
        setResolvedScope(scope);
        console.error("Error al obtener productos:", error);
        setErrorLimite("No se pudo consultar el total de productos.");
      } finally {
        if (currentRequest === requestId.current) setCargandoProductos(false);
      }
  }, [tienda, loading, branchId, scope]);

  useEffect(() => {
    actualizarLimite();
    return () => { requestId.current += 1; };
  }, [actualizarLimite]);

  const consultando = loading || cargandoProductos || Boolean(branchId && resolvedScope !== scope);
  const puedeCrear = Boolean(branchId) && !consultando && !errorLimite && totalProductos !== null && totalProductos < limitePermitido;

  return {
    puedeCrear,
    totalProductos: resolvedScope === scope ? totalProductos : null,
    limitePermitido,
    actualizarLimite,
    errorLimite,
    cargando: consultando,
  };
};

export default useLimiteProductos;
