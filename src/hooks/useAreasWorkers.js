import { useCallback, useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";
import {
  alertFromAxiosError,
  showConfirm,
  showSuccess,
} from "../utils/alerts";

export function useAreasWorkers({ branchId, canManage }) {
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingPosLocations, setLoadingPosLocations] = useState(true);

  const [areas, setAreas] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [posLocations, setPosLocations] = useState([]);

  const [areaSearch, setAreaSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [filterPosLocation, setFilterPosLocation] = useState("");
  const [filterAreaId, setFilterAreaId] = useState("");

  const fetchPosLocations = useCallback(async () => {
    if (!branchId) {
      setPosLocations([]);
      setLoadingPosLocations(false);
      return;
    }

    setLoadingPosLocations(true);
    try {
      const { data } = await axiosClient.get(`/pos-locations/simple`, {
        params: {
          branch_id: branchId,
          paginate: false,
        },
      });

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setPosLocations(list);
    } catch (_) {
      setPosLocations([]);
    } finally {
      setLoadingPosLocations(false);
    }
  }, [branchId]);

  const fetchAreas = useCallback(async () => {
    if (!branchId) {
      setAreas([]);
      setLoadingAreas(false);
      return;
    }

    setLoadingAreas(true);
    try {
      const { data } = await axiosClient.get(`/work-areas`, {
        params: {
          branch_id: branchId,
          pos_location_id: filterPosLocation || undefined,
          search: areaSearch || undefined,
          paginate: false,
        },
      });

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setAreas(list);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar las áreas");
      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  }, [branchId, filterPosLocation, areaSearch]);

  const fetchWorkers = useCallback(async () => {
    if (!branchId) {
      setWorkers([]);
      setLoadingWorkers(false);
      return;
    }

    setLoadingWorkers(true);
    try {
      const { data } = await axiosClient.get(`/workers`, {
        params: {
          branch_id: branchId,
          pos_location_id: filterPosLocation || undefined,
          work_area_id: filterAreaId || undefined,
          search: workerSearch || undefined,
          paginate: false,
        },
      });

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setWorkers(list);
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron cargar los trabajadores");
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  }, [branchId, filterPosLocation, filterAreaId, workerSearch]);

  useEffect(() => {
    fetchPosLocations();
  }, [fetchPosLocations]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleDeleteArea = useCallback(
    async (row) => {
      if (!canManage) return;

      const ok = await showConfirm(
        `¿Eliminar el área "${row?.name || "Área"}"?`,
        "Sí, eliminar"
      );
      if (!ok) return;

      try {
        await axiosClient.delete(`/work-areas/${row.id}`);
        setAreas((prev) => prev.filter((x) => Number(x.id) !== Number(row.id)));
        await showSuccess("Área eliminada");
      } catch (err) {
        alertFromAxiosError(err, "No se pudo eliminar el área");
      }
    },
    [canManage]
  );

  const handleToggleArea = useCallback(
    async (row) => {
      if (!canManage) return;

      try {
        const { data } = await axiosClient.post(
          `/work-areas/${row.id}/toggle-status`
        );

        const fresh = data?.data || row;
        setAreas((prev) =>
          prev.map((x) => (Number(x.id) === Number(row.id) ? fresh : x))
        );

        await showSuccess("Estado actualizado");
      } catch (err) {
        alertFromAxiosError(err, "No se pudo actualizar el estado");
      }
    },
    [canManage]
  );

  const handleDeleteWorker = useCallback(
    async (row) => {
      if (!canManage) return;

      const ok = await showConfirm(
        `¿Eliminar al trabajador "${row?.first_name || ""} ${row?.last_name || ""}"?`,
        "Sí, eliminar"
      );
      if (!ok) return;

      try {
        await axiosClient.delete(`/workers/${row.id}`);
        setWorkers((prev) => prev.filter((x) => Number(x.id) !== Number(row.id)));
        await showSuccess("Trabajador eliminado");
      } catch (err) {
        alertFromAxiosError(err, "No se pudo eliminar el trabajador");
      }
    },
    [canManage]
  );

  const handleToggleWorker = useCallback(
    async (row) => {
      if (!canManage) return;

      try {
        const { data } = await axiosClient.patch(`/workers/${row.id}/toggle-status`);
        const fresh = data?.data || row;

        setWorkers((prev) =>
          prev.map((x) => (Number(x.id) === Number(row.id) ? fresh : x))
        );

        await showSuccess("Estado actualizado");
      } catch (err) {
        alertFromAxiosError(err, "No se pudo actualizar el estado");
      }
    },
    [canManage]
  );

  const handleSavedAreaFromDialog = useCallback((saved) => {
    setAreas((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const idx = list.findIndex((x) => Number(x.id) === Number(saved?.id));
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
      return list;
    });
  }, []);

  const handleSavedWorker = useCallback((saved) => {
    setWorkers((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const idx = list.findIndex((x) => Number(x.id) === Number(saved?.id));
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
      return list;
    });
  }, []);

  return {
    loadingAreas,
    loadingWorkers,
    loadingPosLocations,
    areas,
    workers,
    posLocations,
    areaSearch,
    setAreaSearch,
    workerSearch,
    setWorkerSearch,
    filterPosLocation,
    setFilterPosLocation,
    filterAreaId,
    setFilterAreaId,
    fetchAreas,
    fetchWorkers,
    fetchPosLocations,
    handleDeleteArea,
    handleToggleArea,
    handleDeleteWorker,
    handleToggleWorker,
    handleSavedAreaFromDialog,
    handleSavedWorker,
  };
}