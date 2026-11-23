// src/hooks/useClientesGate.js
import { useMemo } from "react";
import useCategoriaPadreGate from "./useCategoriaPadreGate";

/**
 * Reutiliza la misma fuente de plan que ya usas en categorías.
 * Si luego tienes un hook más general de planes, aquí solo cambias el import.
 */
export default function useClientesGate(totalClientes = 0) {
  const { planId, openPlanesModal } = useCategoriaPadreGate();

  const normalizedPlanId = Number(planId || 0);

  const canView = true;
  const canViewHistory = true;

  const clientsLimit = useMemo(() => {
    if (normalizedPlanId === 2) return 0;
    if (normalizedPlanId === 3) return 50;
    return null; // demo y avanzado ilimitado
  }, [normalizedPlanId]);

  const canCreate = useMemo(() => {
    if (normalizedPlanId === 2) return false;
    if (normalizedPlanId === 3) return totalClientes < 50;
    return true;
  }, [normalizedPlanId, totalClientes]);

  const canEdit = useMemo(() => {
    if (normalizedPlanId === 2) return false;
    return true;
  }, [normalizedPlanId]);

  const canDelete = useMemo(() => {
    if (normalizedPlanId === 2) return false;
    return true;
  }, [normalizedPlanId]);

  const reasonClientsBlocked = useMemo(() => {
    if (normalizedPlanId === 2) {
      return "🔒 Plan Negocio: puedes consultar clientes e historial, pero no registrar, editar ni eliminar.";
    }

    if (normalizedPlanId === 3 && totalClientes >= 50) {
      return "🔒 Plan Profesional: alcanzaste el límite de 50 clientes.";
    }

    return "";
  }, [normalizedPlanId, totalClientes]);

  return {
    planId: normalizedPlanId,
    canView,
    canViewHistory,
    canCreate,
    canEdit,
    canDelete,
    clientsLimit,
    reasonClientsBlocked,
    openPlanesModal,
  };
}