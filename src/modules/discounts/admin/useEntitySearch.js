import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../../../config/axiosClient";
import { alertFromAxiosError } from "../../../utils/alerts";

function useDebouncedValue(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Búsqueda genérica a endpoint:
 * GET {apiBase}/{resource}?q=...&per_page=...&page=...
 */
export function useEntitySearch({ apiBase, resource, perPage = 20, enabled = true }) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const lastReqKey = useRef("");

  const endpoint = useMemo(() => {
    if (!apiBase) return "";
    return `${apiBase}/${resource}`;
  }, [apiBase, resource]);

  const fetchPage = useCallback(
    async (nextPage = 1, mode = "replace") => {
      if (!enabled || !endpoint) return;

      const reqKey = `${endpoint}|${dq}|${nextPage}|${perPage}`;
      lastReqKey.current = reqKey;

      setLoading(true);
      try {
        const res = await axiosClient.get(endpoint, {
          params: {
            q: dq || undefined,
            per_page: perPage,
            page: nextPage,
          },
        });

        // soporta list o paginado tipo Laravel
        const data = res?.data?.data;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

        // si llegó otra respuesta después, ignora esta
        if (lastReqKey.current !== reqKey) return;

        setItems((prev) => (mode === "append" ? [...prev, ...list] : list));

        // detectar “más páginas”
        if (data?.current_page && data?.last_page) {
          setHasMore(Number(data.current_page) < Number(data.last_page));
        } else {
          // si no hay meta, asumimos que si vinieron menos que perPage ya no hay más
          setHasMore(list.length === perPage);
        }

        setPage(nextPage);
      } catch (e) {
        console.error(e);
        alertFromAxiosError(e, "Error al cargar lista.");
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [enabled, endpoint, dq, perPage]
  );

  // cuando cambia el query, resetea a página 1
  useEffect(() => {
    if (!enabled) return;
    fetchPage(1, "replace");
  }, [dq, enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPage(page + 1, "append");
  }, [fetchPage, hasMore, loading, page]);

  return {
    q,
    setQ,
    loading,
    items,
    hasMore,
    loadMore,
    refetch: () => fetchPage(1, "replace"),
  };
}