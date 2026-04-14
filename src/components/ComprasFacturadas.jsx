// ComprasSuscripcionesView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  Paper,
  Chip,
  Divider,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import DashboardIcon from "@mui/icons-material/Dashboard";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";

import axiosClient from "../config/axiosClientPOS";
import FiltersBar from "./FiltersBar";
import SalesTable from "./SalesTable";
import FacturarVentaDialog from "./ventas/FacturarVentaDialog";
import { showSuccess, showError } from "../utils/alerts";

import GateTaeconta from "./auth/GateTaeconta";
import useReglaTaeconta from "../hooks/useReglaTaeconta";

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

const paymentLabel = (code) => {
  const map = {
    efectivo: "Efectivo",
    tc: "Tarjeta crédito",
    td: "Tarjeta débito",
    transferencia: "Transferencia",
  };
  return map[code] || code || "—";
};

const folioFromSale = (v) =>
  v?.folio_venta || String(v?.id ?? "").padStart(6, "0");

export default function ComprasSuscripcionesView({
  cambiarVista,
  tituloMes: tituloMesProp,
  posLocationId: posLocationIdProp,
}) {
  const theme = useTheme();
  const { allowed } = useReglaTaeconta();

  const defaultMes = toYYYYMM(new Date());
  const [mes, setMes] = useState(defaultMes);
  const [folio, setFolio] = useState("");

  const [ventasRaw, setVentasRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openFacturar, setOpenFacturar] = useState(false);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [facturando, setFacturando] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);

  const resolvedPosLocationId =
    posLocationIdProp ||
    localStorage.getItem("pos_location_id") ||
    localStorage.getItem("POS_LOCATION_ID") ||
    null;

  useEffect(() => {
    let alive = true;

    (async () => {
      setClientesLoading(true);
      try {
        const params = resolvedPosLocationId
          ? { pos_location_id: resolvedPosLocationId }
          : {};

        const { data } = await axiosClient.get("/clientes", { params });

        if (alive) {
          setClientes(
            Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
          );
        }
      } catch {
        if (alive) setClientes([]);
      } finally {
        if (alive) setClientesLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [resolvedPosLocationId]);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const params = resolvedPosLocationId
        ? { pos_location_id: resolvedPosLocationId }
        : {};

      const { data } = await axiosClient.get("/pos/facturacion/ventas", {
        params,
      });

      setVentasRaw(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setVentasRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, [resolvedPosLocationId]);

  const updateVentaLocalFacturada = (ventaId, extra = {}) => {
    setVentasRaw((prev) =>
      (prev || []).map((venta) => {
        if (String(venta.id) !== String(ventaId)) return venta;

        return {
          ...venta,
          invoice_status: "timbrada",
          invoice_status_name: "Facturada",
          facturable: false,
          client: extra.client || venta.client || null,
          invoice: {
            ...(venta.invoice || {}),
            status: "timbrada",
            folio: extra.folio || venta?.invoice?.folio || null,
            serie: extra.serie || venta?.invoice?.serie || null,
            uuid: extra.uuid || venta?.invoice?.uuid || null,
            pdf_url: extra.pdf_url || venta?.invoice?.pdf_url || null,
            xml_url: extra.xml_url || venta?.invoice?.xml_url || null,
            timbrado_at: extra.timbrado_at || new Date().toISOString(),
          },
        };
      })
    );
  };

  const ventasRows = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);

    return (ventasRaw || [])
      .filter((v) => {
        const d = new Date(v.created_at);
        const inMonth = d.getFullYear() === y && d.getMonth() + 1 === m;
        const f = String(folioFromSale(v)).toLowerCase();
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
        invoice_status: v.invoice_status,
        invoice_status_name:
          v.invoice_status_name ||
          (v.invoice_status === "timbrada"
            ? "Facturada"
            : "Disponible para facturar"),
        facturable: v.facturable ?? v.invoice_status !== "timbrada",
        client: v.client || null,
        invoice: v.invoice || null,
      }));
  }, [ventasRaw, mes, folio]);

  const onChangeMes = (e) => setMes(e.target.value);
  const onChangeFolio = (e) => setFolio(e.target.value);
  const onSearch = () => {};

  const onFacturar = (row) => {
    if (!allowed) {
      showError("Acceso restringido", {
        html: "Esta acción requiere el plan/complemento de Taeconta activos.",
      });
      return;
    }

    if (row?.facturable === false) {
      showError("Esta venta ya está facturada.");
      return;
    }

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

  const onSubmitFactura = async ({
    ventaId,
    cliente_id,
    cliente_nuevo,
    usoCfdi,
  }) => {
    if (!ventaId) {
      showAlert("Error", "No se recibió el ID de la venta.", false);
      return;
    }

    try {
      setFacturando(true);

      const payload = {
        uso_cfdi: usoCfdi || "G03",
        ...(resolvedPosLocationId
          ? { pos_location_id: resolvedPosLocationId }
          : {}),
      };

      if (cliente_id) {
        payload.cliente_id = cliente_id;
      }

      if (cliente_nuevo) {
        payload.nombre_alias = cliente_nuevo.nombre_alias || "";
        payload.rfc = cliente_nuevo.rfc || "";
        payload.razon_social = cliente_nuevo.razon_social || "";
        payload.codigo_postal_fiscal = cliente_nuevo.codigo_postal_fiscal || "";
        payload.regimen_codigo = cliente_nuevo.regimen_codigo || "";
        payload.email = cliente_nuevo.email || "";
        payload.telefono = cliente_nuevo.telefono || "";
      }

      const { data: resp } = await axiosClient.post(
        `/pos/facturacion/ventas/${ventaId}/timbrar`,
        payload
      );

      if (resp?.ok === false) {
        showAlert(
          "Error al timbrar",
          resp?.message || "No fue posible facturar.",
          false
        );
        return;
      }

      const resultData = resp?.data || resp || {};
      const invoiceData = resultData?.invoice || resultData?.factura || {};

      updateVentaLocalFacturada(ventaId, {
        folio: invoiceData?.folio || resultData?.folio || null,
        serie: invoiceData?.serie || resultData?.serie || null,
        uuid: invoiceData?.uuid || resultData?.uuid || null,
        pdf_url: invoiceData?.pdf_url || resultData?.pdf_url || null,
        xml_url: invoiceData?.xml_url || resultData?.xml_url || null,
        timbrado_at:
          invoiceData?.timbrado_at ||
          resultData?.timbrado_at ||
          new Date().toISOString(),
        client: cliente_id
          ? clientes.find((c) => String(c.id) === String(cliente_id)) || null
          : cliente_nuevo
          ? {
              id: null,
              nombre_alias:
                cliente_nuevo?.nombre_alias || cliente_nuevo?.razon_social || null,
              razon_social: cliente_nuevo?.razon_social || null,
              rfc: cliente_nuevo?.rfc || null,
            }
          : null,
      });

      showAlert(
        "Venta timbrada ✅",
        `La venta ${ventaId} fue facturada correctamente.`,
        true
      );

      setOpenFacturar(false);
      setVentaActiva(null);
    } catch (err) {
      const d = err?.response?.data;

      if (d) {
        const norm = (s) =>
          String(s || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        const seen = new Set();

        const pushUnique = (label, raw) => {
          const val =
            typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
          const key = norm(val);
          if (!val || seen.has(key)) return null;
          seen.add(key);
          return `${label}:\n${val}`;
        };

        const bloques = [];

        const b1 = pushUnique("Mensaje", d.message);
        if (b1) bloques.push(b1);

        if (d.error) {
          const errTxt =
            typeof d.error === "string"
              ? d.error
              : JSON.stringify(d.error, null, 2);
          const b2 = pushUnique("Error", errTxt);
          if (b2) bloques.push(b2);
        }

        if (d.field) bloques.push(`Campo:\n${d.field}`);
        if (d.hint) bloques.push(`Sugerencia:\n${d.hint}`);

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

        if (d.tae_body) {
          const raw =
            typeof d.tae_body === "string"
              ? d.tae_body
              : JSON.stringify(d.tae_body, null, 2);
          const b3 = pushUnique("Respuesta TAE", raw);
          if (b3) bloques.push(b3);
        }

        const html = bloques
          .map((p) =>
            p
              .split("\n")
              .map((line) =>
                line.replace(/</g, "&lt;").replace(/>/g, "&gt;")
              )
              .join("<br>")
          )
          .join(
            '<hr style="border:none;height:1px;background:#eee;margin:12px 0;" />'
          );

        showError(undefined, { html });
      } else {
        const msg = err?.message || "Error desconocido al timbrar.";
        showError(msg);
      }
    } finally {
      setFacturando(false);
    }
  };

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
    <Box
      sx={{
        p: { xs: 2, md: 3, lg: 4 },
        minHeight: "100%",
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(180deg, ${alpha("#0b1220", 0.96)} 0%, ${alpha(
                "#111827",
                0.98
              )} 100%)`
            : `linear-gradient(180deg, ${alpha("#f8fbff", 1)} 0%, ${alpha(
                "#eef4ff",
                1
              )} 100%)`,
      }}
    >
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.2, md: 3 },
            borderRadius: 5,
            mb: 3,
            overflow: "hidden",
            position: "relative",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.12
                  )} 0%, ${alpha("#0f172a", 0.94)} 60%, ${alpha(
                    "#111827",
                    0.98
                  )} 100%)`
                : `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.12
                  )} 0%, ${alpha("#ffffff", 0.96)} 55%, ${alpha(
                    "#f6faff",
                    1
                  )} 100%)`,
            boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              right: -50,
              top: -50,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: alpha(theme.palette.primary.main, 0.08),
              filter: "blur(10px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 80,
              bottom: -60,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: alpha(theme.palette.success.main, 0.08),
              filter: "blur(10px)",
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center" mb={1.2}>
                <Chip
                  icon={<PointOfSaleRoundedIcon />}
                  label="Facturación POS"
                  color="primary"
                  variant="filled"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 700,
                    px: 0.8,
                  }}
                />
                <Chip
                  label={allowed ? "Taeconta activo" : "Acceso restringido"}
                  color={allowed ? "success" : "warning"}
                  variant="outlined"
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                />
              </Stack>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: -0.5,
                  fontSize: { xs: "1.7rem", md: "2.15rem" },
                }}
              >
                Ventas Facturables
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                  maxWidth: 780,
                }}
              >
                Consulta ventas del mes actual, filtra rápidamente por folio y
                genera facturas de forma más ordenada y profesional desde tu POS.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              width={{ xs: "100%", md: "auto" }}
            >
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshRoundedIcon />}
                onClick={reloadVentas}
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  px: 2.2,
                  py: 1.2,
                  fontWeight: 700,
                  textTransform: "none",
                  minWidth: { xs: "100%", sm: "auto" },
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: "blur(8px)",
                }}
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<DashboardIcon />}
                onClick={() => cambiarVista?.("menu")}
                sx={{
                  borderRadius: 3,
                  px: 2.4,
                  py: 1.2,
                  fontWeight: 800,
                  textTransform: "none",
                  minWidth: { xs: "100%", sm: "auto" },
                  boxShadow: `0 10px 25px ${alpha(
                    theme.palette.success.main,
                    0.24
                  )}`,
                }}
              >
                Regresar al Panel
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <GateTaeconta>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 5,
              overflow: "hidden",
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.88)
                  : "#fff",
              boxShadow: `0 16px 40px ${alpha(theme.palette.common.black, 0.06)}`,
            }}
          >
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                pt: { xs: 2, md: 2.5 },
                pb: 1.5,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1.2}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.5 }}
                  >
                    {tituloMes}
                  </Typography>
                </Box>

                <Chip
                  label={loading ? "Cargando ventas..." : `${ventasRows.length} registros`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: 999 }}
                />
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ px: { xs: 1.2, md: 2.2 }, pt: 2, pb: 1 }}>
              <FiltersBar
                mes={mes}
                folio={folio}
                onChangeMes={onChangeMes}
                onChangeFolio={onChangeFolio}
                onSearch={onSearch}
              />
            </Box>

            <Box sx={{ px: { xs: 1.2, md: 2.2 }, pb: 2.2 }}>
              <Box
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  background:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.background.default, 0.35)
                      : alpha(theme.palette.primary.main, 0.015),
                }}
              >
                <SalesTable
                  rows={ventasRows}
                  loading={loading}
                  onFacturar={onFacturar}
                />
              </Box>
            </Box>
          </Paper>
        </GateTaeconta>

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
          posLocationId={resolvedPosLocationId}
          onSubmitFactura={({ cliente_id, cliente_nuevo, usoCfdi }) =>
            onSubmitFactura({
              ventaId: ventaActiva?.id,
              cliente_id,
              cliente_nuevo,
              usoCfdi,
            })
          }
        />
      </Box>
    </Box>
  );
}