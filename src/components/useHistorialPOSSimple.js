import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axiosClientPOS from "../config/axiosClientPOS";

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const parseDateSafe = (value) => {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return null;

  return d;
};

export const formatFecha = (value) => {
  try {
    const d = parseDateSafe(value);
    if (!d) return "—";

    return format(d, "d MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
};

export const formatHora = (value) => {
  try {
    const d = parseDateSafe(value);
    if (!d) return "—";

    return format(d, "hh:mm a", { locale: es });
  } catch {
    return "—";
  }
};

export const formatFechaLarga = (value) => {
  try {
    if (value === "sin_fecha") return "Sin fecha registrada";

    const d = parseDateSafe(`${value}T00:00:00`);
    if (!d) return "Sin fecha registrada";

    return format(d, "d 'de' MMMM 'del' yyyy", {
      locale: es,
    });
  } catch {
    return "Sin fecha registrada";
  }
};

export const fechaSoloDia = (value) => {
  const d = parseDateSafe(value);

  if (!d) return "sin_fecha";

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const agruparPorDia = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    const key = fechaSoloDia(row.date || row.fecha || row.created_at);

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });

  return Array.from(map.entries())
    .sort((a, b) => {
      if (a[0] === "sin_fecha") return 1;
      if (b[0] === "sin_fecha") return -1;
      return a[0] < b[0] ? 1 : -1;
    })
    .map(([date, items]) => ({
      date,
      label: formatFechaLarga(date),
      rows: items,
      total: items.length,
    }));
};

export default function useHistorialPOSSimple() {
  const [loading, setLoading] = useState(true);

  const [modoConsulta, setModoConsulta] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tipoPago, setTipoPago] = useState("");

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [paginaDia, setPaginaDia] = useState(0);

  const [posLocationId, setPosLocationId] = useState(null);

  const handleFiltrar = async () => {
    setLoading(true);

    const params = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    if (tipoPago) params.payment_method = tipoPago;

    try {
      const { data } = await axiosClientPOS.get("/pos/historial-unificado", {
        params,
      });

      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setSummary(data?.summary || {});
      setPosLocationId(data?.pos_location_id || null);
      setPaginaDia(0);
    } catch (error) {
      console.error("Error al consultar historial:", error);
      setRows([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    const h = hoyISO();

    setModoConsulta("dia");
    setFechaInicio(h);
    setFechaFin(h);
    setTipoPago("");
    setPaginaDia(0);

    setTimeout(() => handleFiltrar(), 0);
  };

  useEffect(() => {
    handleFiltrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const historialGroups = useMemo(() => agruparPorDia(rows), [rows]);

  const rowsPaginaActual = historialGroups[paginaDia]?.rows || [];

  useEffect(() => {
    setPaginaDia(0);
  }, [fechaInicio, fechaFin, tipoPago, modoConsulta]);

  return {
    loading,

    modoConsulta,
    setModoConsulta,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    tipoPago,
    setTipoPago,

    paginaDia,
    setPaginaDia,

    summary,
    posLocationId,

    historialRows: rows,
    historialRowsParaResumen: rows.filter((r) => r.affects_cash_total),
    historialGroups,
    rowsPaginaActual,

    handleFiltrar,
    limpiarFiltros,
  };
}
