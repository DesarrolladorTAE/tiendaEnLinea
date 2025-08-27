import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Chip,
  CircularProgress,
  Button,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/es";
import axios from "../../config/axiosSuperadmin";

// Componentes
import SuscripcionesTable from "./components/SuscripcionesTable";
import TimbrarPGModal from "./components/TimbrarPGModal";
import TimbrarPorTiendaModal from "./components/TimbrarPorTiendaModal";

dayjs.locale("es");

export default function ComprasSuscripciones() {
  const [compras, setCompras] = useState([]);
  const [filtroStore, setFiltroStore] = useState("");
  const [filtroMes, setFiltroMes] = useState(dayjs().format("YYYY-MM"));
  const [cargando, setCargando] = useState(false);
  const [seleccion, setSeleccion] = useState([]); // array de subscription_ids
  const [abrirPG, setAbrirPG] = useState(false);
  const [abrirTienda, setAbrirTienda] = useState(false);

  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });

  const fetchCompras = async () => {
    setCargando(true);
    try {
      const res = await axios.get("admin/compras-suscripciones/todas");
      setCompras(res.data || []);
    } catch (err) {
      console.error("Error al cargar compras", err);
      setToast({ open: true, type: "error", msg: "Error al cargar compras" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");
  const getMesFormateado = () =>
    capitalizar(dayjs(filtroMes + "-01").format("MMMM [de] YYYY"));

  // === Reglas de elegibilidad ===
  // Se puede facturar durante TODO el mes de la compra y hasta 72 horas después de que termine ese mes.
  // Además: debe ser del mes filtrado y no estar facturada.
  const esDelMesActualFiltro = (item) =>
    filtroMes ? String(item.fecha).startsWith(filtroMes) : true;

  const dentroDeVentanaMesMas72h = (item) => {
    const finMesCompra = dayjs(item.fecha).endOf("month").endOf("day");
    const limite = finMesCompra.add(72, "hour");
    // ventana ABIERTA: ahora <= límite (incluye todo el mes y 72h después)
    return dayjs().isBefore(limite) || dayjs().isSame(limite);
  };

  const noFacturada = (item) => !Boolean(item.facturado);
  const esPG = (row) => Boolean(row.facturado_pg || row.enPG);
  const facturadaTienda = (row) => Boolean(row.pdf_url && row.xml_url);

  const comprasFiltradas = useMemo(() => {
    return (compras || [])
      .filter((it) =>
        filtroStore
          ? (it.tienda || "").toLowerCase().includes(filtroStore.toLowerCase())
          : true
      )
      .filter((it) =>
        filtroMes ? String(it.fecha).startsWith(filtroMes) : true
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [compras, filtroStore, filtroMes]);

  const comprasElegibles = useMemo(() => {
    return comprasFiltradas.filter(
      (it) =>
        esDelMesActualFiltro(it) &&
        noFacturada(it) &&
        dentroDeVentanaMesMas72h(it)
    );
  }, [comprasFiltradas]);

  const totalMes = useMemo(() => {
    return comprasFiltradas.reduce((acc, it) => acc + Number(it.monto || 0), 0);
  }, [comprasFiltradas]);

  // PG puede mezclar tiendas, pero debe estar dentro de la ventana
  const puedeTimbrarPG = () => {
    if (seleccion.length === 0) return false;
    const setSel = new Set(seleccion);
    return comprasFiltradas
      .filter((it) => setSel.has(it.id))
      .every(
        (it) =>
          esDelMesActualFiltro(it) &&
          noFacturada(it) &&
          dentroDeVentanaMesMas72h(it)
      );
  };

  // Por tienda: mismas reglas + SOLO UNA tienda
  const tiendasEnSeleccion = useMemo(() => {
    const setSel = new Set(seleccion);
    return new Set(
      comprasFiltradas
        .filter((it) => setSel.has(it.id))
        .map((it) => it.store_id)
    );
  }, [seleccion, comprasFiltradas]);

  const puedeTimbrarPorTienda = () => {
    if (seleccion.length === 0) return false;
    if (tiendasEnSeleccion.size !== 1) return false; // SOLO una tienda
    const setSel = new Set(seleccion);
    return comprasFiltradas
      .filter((it) => setSel.has(it.id))
      .every(
        (it) =>
          esDelMesActualFiltro(it) &&
          noFacturada(it) &&
          dentroDeVentanaMesMas72h(it)
      );
  };

  const onTimbradoOk = (msg = "Timbrado exitoso") => {
    setToast({ open: true, type: "success", msg });
    setSeleccion([]);
    fetchCompras();
  };
  const onTimbradoError = (msg = "El timbrado falló") => {
    setToast({ open: true, type: "error", msg });
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Ventas del Mes ✅
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <TextField
          label="Buscar tienda"
          value={filtroStore}
          onChange={(e) => setFiltroStore(e.target.value)}
        />
        <TextField
          label="Filtrar por Mes"
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      <Box mb={3} mt={2} p={2} bgcolor="#f5f5f5" borderRadius={2}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color="secondary"
          align="center"
        >
          📆 Mes actual: {getMesFormateado()}
        </Typography>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="success.main"
          align="center"
        >
          💰 Total vendido: ${totalMes.toFixed(2)} MXN
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          🧾 Se puede facturar durante el mes de la compra y hasta{" "}
          <b>72 horas</b> después de que termine ese mes.
        </Typography>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          mt={2}
          justifyContent="center"
        >
          <Chip label={`Elegibles: ${comprasElegibles.length}`} color="info" />
          <Chip
            label={`Seleccionadas: ${seleccion.length}`}
            color={seleccion.length ? "primary" : "default"}
          />
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Acciones
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="secondary"
              disabled={!puedeTimbrarPG()}
              onClick={() => setAbrirPG(true)}
            >
              Facturar a Público General
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!puedeTimbrarPorTienda()}
              onClick={() => setAbrirTienda(true)}
              title={
                tiendasEnSeleccion.size > 1
                  ? "Selecciona suscripciones de una sola tienda"
                  : undefined
              }
            >
              Facturar por tienda
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {cargando ? (
        <CircularProgress />
      ) : (
        <SuscripcionesTable
          rows={comprasFiltradas}
          seleccion={seleccion}
          setSeleccion={setSeleccion}
          filtroMes={filtroMes}
        />
      )}

      {/* Modal PG */}
      <TimbrarPGModal
        open={abrirPG}
        onClose={() => setAbrirPG(false)}
        seleccion={seleccion}
        rowsAll={comprasFiltradas}
        onOk={onTimbradoOk}
        onError={onTimbradoError}
      />
      {/* Modal por tienda */}
      <TimbrarPorTiendaModal
        open={abrirTienda}
        onClose={() => setAbrirTienda(false)}
        seleccion={seleccion}
        rowsAll={comprasFiltradas} // agrupar por tienda y calcular totales/estatus
        onOk={onTimbradoOk}
        onError={onTimbradoError}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.type}
          variant="filled"
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
