// src/hooks/useLimitePOS.js
import { useTienda } from "../context/TiendaContext";

const useLimitePOS = () => {
  const { tienda, loading } = useTienda();

  const limites = {
    1: 1,
    2: 2,
    3: 5,
    4: 10,
  };

  const limitePermitido = tienda?.plan_id ? limites[tienda.plan_id] ?? 0 : 0;

  return {
    limitePermitido,
    cargando: loading,
  };
};

export default useLimitePOS;
