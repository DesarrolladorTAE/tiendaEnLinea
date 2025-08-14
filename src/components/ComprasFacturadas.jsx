// ComprasSuscripcionesView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Grid, Stack, Button, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import axiosClient from "../config/axiosClientPOS"; // cliente con auth:sanctum
import FiltersBar from "./FiltersBar";
import SalesTable from "./SalesTable";

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

  // --- Carga inicial de ventas del POS autenticado ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Si luego filtras por mes en backend: { params: { mes } }
        const { data } = await axiosClient.get("/ventas/pos/historial");
        if (alive) setVentasRaw(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setVentasRaw([]);
        // Puedes loguear el error si quieres: console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
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

  // --- (Pendiente) Clientes del mes ---
  const clientesRows = useMemo(() => {
    // Cuando tengas el cliente en Sale (o una API de top clientes), lo rellenamos aquí.
    return [];
  }, []);

  // --- Handlers UI ---
  const onChangeMes = (e) => setMes(e.target.value);
  const onChangeFolio = (e) => setFolio(e.target.value);
  const onSearch = () => {}; // el filtrado por folio ya es reactivo

  const onClickFacturar = (row) => {
    // Aquí abres tu modal o navegas al flujo de timbrado
    console.log("Facturar venta:", row);
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

      {/* Encabezado */}
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
      {/* Contenido */}
      <Grid container spacing={2}>
        {/* Filtros */}
        <Grid item xs={12}>
          <FiltersBar
            mes={mes}
            folio={folio}
            onChangeMes={onChangeMes}
            onChangeFolio={onChangeFolio}
            onSearch={onSearch}
          />
        </Grid>

        {/* Tabla */}
        <Grid item xs={12}>
          <SalesTable
            rows={loading ? [] : ventasRows}
            onClickFacturar={onClickFacturar}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
