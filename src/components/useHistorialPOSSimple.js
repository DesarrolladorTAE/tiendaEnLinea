import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import axiosClientPOS from "../config/axiosClientPOS";

export const hoyISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });

const LABELS_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tc: "T. crédito",
  td: "T. débito",
};

export const etiquetaPagoVenta = (v) => {
  if (v?.payment_label) return v.payment_label;

  const pagos = Array.isArray(v?.payment_methods) ? v.payment_methods : [];
  if (!pagos.length) return "—";

  return pagos
    .map((p) => `${LABELS_PAGO[p.method] || p.method} ${money(p.total)}`)
    .join(" + ");
};

export const parseFechaLocal = (value) => {
  if (!value) return null;

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

export const formatFecha = (value) => {
  try {
    const fecha = parseFechaLocal(value);
    if (!fecha) return "—";

    return format(fecha, "d 'de' MMM yyyy", {
      locale: es,
    });
  } catch {
    return "—";
  }
};

export const formatFechaLarga = (value) => {
  try {
    const fecha = parseFechaLocal(value);
    if (!fecha) return "Sin fecha";

    return format(fecha, "d 'de' MMMM 'del' yyyy", {
      locale: es,
    });
  } catch {
    return "Sin fecha";
  }
};

export const fechaSoloDia = (value) => {
  if (!value) return "";

  const fecha = new Date(value);

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const STATUS_NO_CONTABLES = ["open", "credit"];

export const STATUS_CONTABLES = ["paid", "credit_paid"];

export const isPendiente = (row) =>
  STATUS_NO_CONTABLES.includes(row?.estadoRaw) ||
  STATUS_NO_CONTABLES.includes(row?.venta?.status);

export const isPagada = (row) =>
  STATUS_CONTABLES.includes(row?.estadoRaw) ||
  STATUS_CONTABLES.includes(row?.venta?.status);

const getColorByType = (type, estado) => {
  const status = String(estado || "").toLowerCase();

  // pendientes
  if (status === "open" || status === "credit") {
    return "warning";
  }

  // canceladas
  if (
    status === "cancelled" ||
    status === "partially_cancelled"
  ) {
    return "error";
  }

  // devoluciones
  if (
    status === "devuelta" ||
    status === "devuelta_parcial"
  ) {
    return "info";
  }

  // crédito pagado
  if (status === "credit_paid") {
    return "primary";
  }

  // pagadas normales
  return "success";
};

const getBgByType = (type, estado) => {
  const status = String(estado || "").toLowerCase();

  // pendientes
  if (status === "open" || status === "credit") {
    return "#fff3e0";
  }

  // canceladas
  if (
    status === "cancelled" ||
    status === "partially_cancelled"
  ) {
    return "#ffebee";
  }

  // devoluciones
  if (
    status === "devuelta" ||
    status === "devuelta_parcial"
  ) {
    return "#e3f2fd";
  }

  // crédito pagado
  if (status === "credit_paid") {
    return "#e8eaf6";
  }

  // pagadas normales
  return "#e8f5e9";
};

const getTypeLabel = (type, estado) => {
  const status = String(estado || "").toLowerCase();

  if (status === "open") {
    return "Pendiente";
  }

  if (status === "credit") {
    return "Crédito";
  }

  if (status === "credit_paid") {
    return "Crédito pagado";
  }

  if (status === "cancelled") {
    return "Cancelada";
  }

  if (status === "partially_cancelled") {
    return "Cancelada parcial";
  }

  if (status === "devuelta") {
    return "Devuelta";
  }

  if (status === "devuelta_parcial") {
    return "Devolución parcial";
  }

  return "Venta";
};

export const getBorderColor = (color) => {
  if (color === "warning") return "warning.light";
  if (color === "success") return "success.light";
  if (color === "info") return "info.light";
  if (color === "error") return "error.light";
  return "divider";
};

export const agruparPorDia = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    const key = fechaSoloDia(row.fecha);
    if (!key) return;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
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

  const [puntoVenta, setPuntoVenta] = useState("");
  const [trabajadorId, setTrabajadorId] = useState("");

  const [ventas, setVentas] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [cancelaciones, setCancelaciones] = useState([]);

  const [paginaDia, setPaginaDia] = useState(0);

  const handleFiltrar = async () => {
    setLoading(true);

    const params = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    if (tipoPago) params.payment_method = tipoPago;

    try {
      const { data } = await axiosClientPOS.get("/ventas/mis-ventas", {
        params,
      });

      setVentas(
        Array.isArray(data?.ventas)
          ? data.ventas
          : Array.isArray(data)
            ? data
            : [],
      );

      setDevoluciones(
        Array.isArray(data?.devoluciones) ? data.devoluciones : [],
      );

      setCancelaciones(
        Array.isArray(data?.cancelaciones) ? data.cancelaciones : [],
      );

      setPaginaDia(0);
    } catch (error) {
      console.error("Error al consultar historial:", error);
      setVentas([]);
      setDevoluciones([]);
      setCancelaciones([]);
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
    setPuntoVenta("");
    setTrabajadorId("");
    setPaginaDia(0);

    setTimeout(() => handleFiltrar(), 0);
  };

  useEffect(() => {
    handleFiltrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const devolucionesRows = useMemo(() => {
    return devoluciones.map((r) => ({
      id: `dev-${r.id}`,
      rowType: "devolucion",
      fecha: r.fecha || r.created_at,
      venta_id: r.sale?.id || r.sale_id || r.id,
      venta: r.sale || null,
      total: Number(r?.importe_afectado ?? r?.sale?.total_amount ?? 0),
      pago: r.sale ? etiquetaPagoVenta(r.sale) : "—",
      motivo: r.motivo || "—",
      estado: r.tipo || "Devuelta",
      estadoRaw: r.tipo || "devolucion",
      cliente: r.sale?.client || null,
    }));
  }, [devoluciones]);

  const cancelacionesRows = useMemo(() => {
    return cancelaciones.map((r) => ({
      id: `cancel-${r.id}`,
      rowType: "cancelacion",
      fecha: r.fecha || r.created_at,
      venta_id: r.sale?.id || r.sale_id || r.id,
      venta: r.sale || null,
      total: Number(r?.importe_afectado ?? r?.sale?.total_amount ?? 0),
      pago: r.sale ? etiquetaPagoVenta(r.sale) : "—",
      motivo: r.motivo || "—",
      estado: r.tipo || "Cancelada",
      estadoRaw: r.tipo || "cancelacion",
      cliente: r.sale?.client || null,
    }));
  }, [cancelaciones]);

  const ventasRows = useMemo(() => {
    return ventas.map((v) => ({
      id: `venta-${v.id}`,
      rowType: "venta",
      fecha: v.created_at,
      venta_id: v.id,
      venta: v,
      total: Number(v.total_amount || 0),
      pago: etiquetaPagoVenta(v),
      motivo: "—",
      estado:
        v.status === "open"
          ? "Venta pendiente"
          : v.status === "credit"
            ? "Crédito pendiente"
            : v.status === "credit_paid"
              ? "Crédito pagado"
              : v.status === "cancelled"
                ? "Cancelada"
                : v.status === "partially_cancelled"
                  ? "Parcial"
                  : v.status === "devuelta"
                    ? "Devuelta"
                    : v.status === "devuelta_parcial"
                      ? "Devolución parcial"
                      : v.status === "paid"
                        ? "Pagada"
                        : v.status || "—",
      estadoRaw: v.status,
      cliente: v.client || null,
    }));
  }, [ventas]);

  const historialRows = useMemo(() => {
    return [...ventasRows, ...devolucionesRows, ...cancelacionesRows].sort(
      (a, b) => {
        const fa = new Date(a.fecha || 0).getTime();
        const fb = new Date(b.fecha || 0).getTime();
        return fb - fa;
      },
    );
  }, [ventasRows, devolucionesRows, cancelacionesRows]);

  const historialRowsParaResumen = useMemo(() => {
    return historialRows.filter((row) => isPagada(row));
  }, [historialRows]);

  const historialGroups = useMemo(
    () => agruparPorDia(historialRows),
    [historialRows],
  );

  const rowsPaginaActual = historialGroups[paginaDia]?.rows || [];

  useEffect(() => {
    setPaginaDia(0);
  }, [fechaInicio, fechaFin, tipoPago, modoConsulta]);

  useEffect(() => {
    if (paginaDia > historialGroups.length - 1 && historialGroups.length > 0) {
      setPaginaDia(0);
    }
  }, [paginaDia, historialGroups.length]);

  const trabajadores = useMemo(() => [], []);

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

    puntoVenta,
    setPuntoVenta,
    trabajadorId,
    setTrabajadorId,
    trabajadores,

    paginaDia,
    setPaginaDia,

    historialRows,
    historialRowsParaResumen,
    historialGroups,
    rowsPaginaActual,

    handleFiltrar,
    limpiarFiltros,
  };
}