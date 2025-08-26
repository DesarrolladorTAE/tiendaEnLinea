// ComprasSuscripcionesView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, Stack, Button, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import axiosClient from "../config/axiosClientPOS"; // cliente con auth:sanctum
import FiltersBar from "./FiltersBar";
import SalesTable from "./SalesTable";
import FacturarVentaDialog from "./ventas/FacturarVentaDialog";
import { showSuccess, showError } from "../utils/alerts";

// --- Utils ---
const toYYYYMM = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMoney = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// Mapeo simple de métodos de pago (ajusta si manejas más)
const paymentLabel = (code) => {
  const map = {
    efectivo: "Efectivo",
    tc: "Tarjeta crédito",
    td: "Tarjeta débito",
    transferencia: "Transferencia",
  };
  return map[code] || code || "—";
};

// Usa id como folio visible si tu API no expone uno propio
const folioFromSale = (v) => String(v?.id ?? "").padStart(6, "0");

export default function ComprasSuscripcionesView({
  cambiarVista,
  tituloMes: tituloMesProp, // opcional externo
}) {
  // --- Estado de filtros ---
  const defaultMes = toYYYYMM(new Date());
  const [mes, setMes] = useState(defaultMes);
  const [folio, setFolio] = useState("");

  // --- Estado de datos ---
  const [ventasRaw, setVentasRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Estado para facturación ---
  const [openFacturar, setOpenFacturar] = useState(false);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [facturando, setFacturando] = useState(false);

  // --- Clientes (para el modal) ---
  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);

  // Cargar clientes base
  useEffect(() => {
    let alive = true;
    (async () => {
      setClientesLoading(true);
      try {
        const { data } = await axiosClient.get("/clientes"); // <-- sin params
        if (alive) setClientes(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setClientes([]);
      } finally {
        if (alive) setClientesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --- Carga inicial de ventas del POS autenticado ---
  const fetchVentas = async () => {
    setLoading(true);
    try {
      // Si luego filtras por mes en backend: { params: { mes } }
      const { data } = await axiosClient.get("/ventas/pos/historial");
      setVentasRaw(Array.isArray(data) ? data : []);
    } catch (err) {
      setVentasRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchVentas();
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --- Filtrado por mes y folio en cliente ---
  const ventasRows = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    return (ventasRaw || [])
      .filter((v) => {
        const d = new Date(v.created_at);
        const inMonth = d.getFullYear() === y && d.getMonth() + 1 === m;
        const f = folioFromSale(v).toLowerCase();
        const byFolio = folio ? f.includes(folio.toLowerCase()) : true;
        return inMonth && byFolio;
      })
      .map((v) => ({
        id: v.id,
        folio: folioFromSale(v),
        fechaISO: v.created_at,
        fecha: formatDate(v.created_at),
        total: `$${formatMoney(v.total_amount)}`,
        tipoPago: paymentLabel(v.payment_method),
      }));
  }, [ventasRaw, mes, folio]);

  // --- Handlers UI ---
  const onChangeMes = (e) => setMes(e.target.value);
  const onChangeFolio = (e) => setFolio(e.target.value);
  const onSearch = () => {}; // el filtrado por folio ya es reactivo

  const onFacturar = (row) => {
    setVentaActiva(row);
    setOpenFacturar(true);
  };

  const showAlert = (titulo, cuerpo, ok = true) => {
    const text = [titulo, cuerpo].filter(Boolean).join("\n\n");
    return ok ? showSuccess(text) : showError(text);
  };

  const reloadVentas = async () => {
    await fetchVentas();
  };

  /**
   * Crea cliente (si aplica) y timbra la venta seleccionada.
   * Espera: { ventaId, cliente_id?, cliente_nuevo?, usoCfdi? }
   */
  const onSubmitFactura = async ({ ventaId, cliente_id, cliente_nuevo, usoCfdi }) => {
    if (!ventaId) {
      showAlert("Error", "No se recibió el ID de la venta.", false);
      return;
    }
    try {
      setFacturando(true);

      // 1) Resolver cliente_id: crear si viene cliente_nuevo
      let clienteId = cliente_id ?? null;
      if (!clienteId && cliente_nuevo) {
        try {
          const { data: created } = await axiosClient.post("/clientes", cliente_nuevo);
          clienteId = created?.id ?? created?.data?.id;
          if (!clienteId) {
            showAlert("Error al crear cliente", "La API no devolvió un ID de cliente.", false);
            return;
          }
        } catch (err) {
          const msg = err?.response?.data?.message || "No fue posible crear el cliente.";
          showAlert("Error al crear cliente", msg, false);
          return;
        }
      }

      if (!clienteId) {
        showAlert("Datos incompletos", "Selecciona un cliente o captura uno nuevo.", false);
        return;
      }

      // 2) Timbrar la venta con el cliente y uso de CFDI seleccionado
      const payload = {
        cliente_id: clienteId,
        sales: [ventaId],
        usoCfdi: usoCfdi || "G03", // default
        fail_fast: true,           // para que el backend regrese 422 inmediato
      };

      const { data: resp, status } = await axiosClient.post("/admin/facturar/ventas", payload);
      console.log("[FACTURAR] status:", status, resp);

      // 3) Interpretar respuesta (200 OK, 207 multi-estatus o error)
      if (status === 200 || status === 207) {
        const ventas = Array.isArray(resp?.ventas) ? resp.ventas : [];
        const actual = ventas.find((v) => String(v.sale_id) === String(ventaId));

        if (!actual) {
          showAlert("Timbrado", resp?.mensaje || "Operación realizada.");
        } else {
          if (actual.ok) {
            const enlaces = [
              actual.pdf_url ? `PDF: ${actual.pdf_url}` : null,
              actual.xml_url ? `XML: ${actual.xml_url}` : null,
            ]
              .filter(Boolean)
              .join("\n");
            const extras = (actual.alertas || []).join("\n- ");
            showAlert(
              "Venta timbrada ✅",
              `Folio interno: ${ventaId}\nFactura ID: ${actual.factura_id || "—"}${
                enlaces ? `\n\n${enlaces}` : ""
              }${extras ? `\n\nAlertas:\n- ${extras}` : ""}`,
              true
            );
          } else if (actual.status === "saltada") {
            showAlert("Venta saltada", (actual.alertas || []).join("\n- ") || "Ya estaba facturada.", false);
          } else {
            const errTxt =
              typeof actual.error === "string"
                ? actual.error
                : JSON.stringify(actual.error || {}, null, 2);
            showAlert("Error al timbrar", errTxt, false);
          }
        }

        // 4) Refrescar tabla
        await reloadVentas();
        return;
      }

      showAlert("Respuesta inesperada", JSON.stringify(resp || {}, null, 2), false);
} catch (err) {
  const d = err?.response?.data;
  if (d) {
    // Normalizador y set contra duplicados
    const norm = (s) => String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    const seen = new Set();

    const pushUnique = (label, raw) => {
      const val = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
      const key = norm(val);
      if (!val || seen.has(key)) return null;
      seen.add(key);
      return `${label}:\n${val}`;
    };

    const bloques = [];

    // message
    const b1 = pushUnique("Mensaje", d.message);
    if (b1) bloques.push(b1);

    // error (si es igual a message, se ignorará)
    if (d.error) {
      const errTxt = typeof d.error === "string" ? d.error : JSON.stringify(d.error, null, 2);
      const b2 = pushUnique("Error", errTxt);
      if (b2) bloques.push(b2);
    }

    // field / hint (normalmente distintos)
    if (d.field) bloques.push(`Campo:\n${d.field}`);
    if (d.hint)  bloques.push(`Sugerencia:\n${d.hint}`);

    // tae_errors (cada línea deduplicada vs. message/error)
    if (Array.isArray(d.tae_errors) && d.tae_errors.length) {
      const list = d.tae_errors
        .map((e) => String(e || ""))
        .filter((e) => {
          const key = norm(e);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      if (list.length) {
        bloques.push(`TAE:\n- ${list.join("\n- ")}`);
      }
    }

    // tae_body (no siempre llega)
    if (d.tae_body) {
      const raw = typeof d.tae_body === "string" ? d.tae_body : JSON.stringify(d.tae_body, null, 2);
      const b3 = pushUnique("Respuesta TAE", raw);
      if (b3) bloques.push(b3);
    }

    // Render bonito (ver B)
    const html = bloques
      .map((p) =>
        p
          .split("\n")
          .map((line) => line.replace(/</g, "&lt;").replace(/>/g, "&gt;")) // escapar
          .join("<br>")
      )
      .join('<hr style="border:none;height:1px;background:#eee;margin:12px 0;" />');

    // usa showError con html (ver B)
    showError(undefined, { html });

  } else {
    const msg = err?.message || "Error desconocido al timbrar.";
    showError(msg);
  }
} finally {
  setFacturando(false);
}

  };

  // Helper (respeta acentos y Unicode)
  const capitalizeFirst = (s) => s.replace(/^\p{L}/u, (m) => m.toUpperCase());

  const tituloMes =
    tituloMesProp ||
    `Mes actual: ${capitalizeFirst(
      new Intl.DateTimeFormat("es-MX", {
        month: "long",
        year: "numeric",
      }).format(
        new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1, 1)
      )
    )}`;

  return (
    <Box p={4}>
      {/* Regresar */}
      <Box display="flex" justifyContent="center" mb={3}>
        <Stack direction="row" spacing={3}>
          <Button
            variant="outlined"
            color="success"
            size="large"
            startIcon={<DashboardIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
            }}
            onClick={() => cambiarVista?.("menu")}
          >
            Regresar al Panel
          </Button>
        </Stack>
      </Box>

      {/* Contenido */}
      <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
        {/* Tabla */}
        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{
              mb: 1.5,
              fontWeight: 700,
              color: "primary.main",
              letterSpacing: 0.5,
              display: "inline-block",
              borderBottom: (theme) =>
                `3px solid ${
                  theme.palette.mode === "dark"
                    ? theme.palette.primary.light
                    : theme.palette.primary.main
                }`,
              pb: 0.5,
            }}
          >
            {tituloMes}
          </Typography>

          <FiltersBar
            mes={mes}
            folio={folio}
            onChangeMes={onChangeMes}
            onChangeFolio={onChangeFolio}
            onSearch={onSearch}
          />

          <SalesTable rows={loading ? [] : ventasRows} onFacturar={onFacturar} />
        </Grid>
      </Grid>

      {/* MODAL: colócalo al final, fuera de la tabla */}
      <FacturarVentaDialog
        open={openFacturar}
        onClose={() => setOpenFacturar(false)}
        venta={{
          id: ventaActiva?.id,
          folio: ventaActiva?.folio,
          fecha: ventaActiva?.fecha,
          total: ventaActiva?.total,
          tipoPago: ventaActiva?.tipoPago,
        }}
        clientes={clientes}
        loading={clientesLoading || facturando}
        onSubmitFactura={({ cliente_id, cliente_nuevo, usoCfdi }) =>
          onSubmitFactura({
            ventaId: ventaActiva?.id,
            cliente_id,
            cliente_nuevo,
            usoCfdi, // se envía al endpoint /admin/facturar/ventas
          })
        }
      />
    </Box>
  );
}
