import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  useMediaQuery,
  Button,
  Paper,
  TextField,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";


import useHistorialPOSSimple from "./useHistorialPOSSimple";

import HistorialPOSFilters from "./HistorialPOSFilters";
import HistorialPOSResumen from "./HistorialPOSResumen";
import HistorialPOSTable from "./HistorialPOSTable";

import ModalTicketVenta from "./ModalTicketVenta";
import ModalDetallesVenta from "./ModalDetallesVenta";
import ModalCancelarVenta from "./ModalCancelarVenta";
import ModalDevolverVenta from "./ModalDevolverVenta";
import ModalClienteVenta from "./ModalClienteVenta";

export default function HistorialPOSPage({ posLocationId: terminalId, classicNavigation }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    loading,
    modoConsulta,
    setModoConsulta,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    tipoPago,
    setTipoPago,
    historialRows,
    historialGroups,
    rowsPaginaActual,
    paginaDia,
    setPaginaDia,
    handleFiltrar,
    limpiarFiltros,
    summary,
    posLocationId: historyPosLocationId,
  } = useHistorialPOSSimple();
  const posLocationId = terminalId ?? historyPosLocationId;

  const [ticketId, setTicketId] = useState(null);
  const [detallesId, setDetallesId] = useState(null);
  const [cancelarId, setCancelarId] = useState(null);
  const [devolverId, setDevolverId] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [folio, setFolio] = useState("");
  const [folioError, setFolioError] = useState(false);

  const buscarFolio = (event) => {
    event.preventDefault();
    if (!posLocationId) return;
    const id = folio.trim().replace(/^#\s*/, "").replace(/^0+/, "");
    if (!/^[1-9]\d*$/.test(id)) {
      setFolioError(true);
      return;
    }
    setFolioError(false);
    setDetallesId(id);
  };

  const filters = (
    <HistorialPOSFilters classic={Boolean(classicNavigation)}
      modoConsulta={modoConsulta}
      setModoConsulta={setModoConsulta}
      fechaInicio={fechaInicio}
      setFechaInicio={setFechaInicio}
      fechaFin={fechaFin}
      setFechaFin={setFechaFin}
      tipoPago={tipoPago}
      setTipoPago={setTipoPago}
      onApply={handleFiltrar}
      onClear={limpiarFiltros}
      loading={loading}
    />
  );

  return (
    <Stack spacing={{ xs: 2, sm: 3 }} sx={{ minWidth: 0 }}>
      <Paper
        elevation={0}
        sx={classicNavigation ? {
          p: { xs: 2, sm: 3 }, borderRadius: 5, border: "1px solid", borderColor: "divider",
          background: "linear-gradient(135deg, #eee, #fff)", boxShadow: "0 18px 45px #0001",
        } : {
          p: { xs: 2, sm: 3 },
          borderRadius: { xs: 3, sm: 4 },
          bgcolor: "#1d2025",
          color: "#fff",
          borderTop: "3px solid #ffc107",
          boxShadow: "0 10px 22px rgba(23,25,28,.14)",
        }}
      >
        {classicNavigation ? (
          <Stack direction={{ xs: "column", lg: "row" }} alignItems={{ lg: "center" }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 26, md: 36 } }}>Historial de Ventas</Typography>
              <Typography color="text.secondary">Movimientos, pagos, créditos, facturas, cancelaciones y devoluciones.</Typography>
            </Box>
            {classicNavigation}
          </Stack>
        ) : <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
            <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0, borderRadius: 2, bgcolor: "#ffc107", color: "#17191c" }}>
              <HistoryOutlinedIcon />
            </Box>
            <Typography component="h2" sx={{ color: "#fff !important", fontWeight: 800, fontSize: { xs: 21, sm: 28 } }}>
              Historial de ventas
            </Typography>
          </Stack>
          {filters}
        </Stack>}
      </Paper>
      {classicNavigation && filters}

      <HistorialPOSResumen
        summary={summary}
        rows={historialRows}
      />

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box component="form" role="search" aria-label="Buscar venta por folio" onSubmit={buscarFolio}
          sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) auto" }, gap: 1, alignItems: "start", width: "100%", maxWidth: { sm: 460 } }}>
          <TextField
            id="pos-sale-folio"
            size="small"
            label="Folio de venta (ID)"
            placeholder="Ej. 84353"
            value={folio}
            onChange={(event) => {
              setFolio(event.target.value);
              setFolioError(false);
            }}
            error={folioError}
            helperText={folioError ? "Ingresa un folio numérico válido." : undefined}
            inputProps={{ inputMode: "numeric" }}
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "#fff", minHeight: 44, borderRadius: 2 },
            }}
          />
          <Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />} disabled={!posLocationId}
            sx={{ bgcolor: classicNavigation ? "primary.main" : "#ffc107", color: classicNavigation ? "#fff" : "#17191c", minHeight: 44, borderRadius: 2, fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: classicNavigation ? "primary.dark" : "#ffe082" } }}>
            Buscar folio
          </Button>
        </Box>
      </Paper>

      {historialGroups.length > 0 ? (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "#eef1f5",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
            >
              <Box>
                <Typography
                  fontWeight={900}
                  fontSize={18}
                >
                  {historialGroups[paginaDia]?.label}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {historialGroups[paginaDia]?.total} movimientos registrados
                </Typography>
              </Box>

              {historialGroups.length > 1 ? (
                <Stack
                  direction="row"
                  spacing={1}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={paginaDia <= 0}
                    onClick={() =>
                      setPaginaDia((prev) =>
                        Math.max(prev - 1, 0)
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    Anterior
                  </Button>

                  <Button
                    size="small"
                    variant="contained"
                    disabled={
                      paginaDia >= historialGroups.length - 1
                    }
                    onClick={() =>
                      setPaginaDia((prev) =>
                        Math.min(
                          prev + 1,
                          historialGroups.length - 1
                        )
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    Siguiente
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          </Paper>

          <HistorialPOSTable
            rows={rowsPaginaActual}
            isMobile={isMobile}
            onTicket={setTicketId}
            onDetalles={setDetallesId}
            onCliente={setClienteData}
            onCancelar={setCancelarId}
            onDevolver={setDevolverId}
          />
        </>
      ) : (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: "center",
            borderRadius: 5,
            border: "1px dashed",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,250,252,.92))",
          }}
        >
          <Typography
            fontWeight={900}
            sx={{
              fontSize: {
                xs: "1.1rem",
                md: "1.3rem",
              },
            }}
          >
            No hay movimientos disponibles
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 520,
              mx: "auto",
            }}
          >
            Intente cambiar el rango de fechas o el método de pago para
            visualizar movimientos.
          </Typography>
        </Paper>
      )}

      <ModalTicketVenta
        open={Boolean(ticketId)}
        ventaId={ticketId}
        posLocationId={posLocationId}
        onClose={() => setTicketId(null)}
      />

      <ModalDetallesVenta
        key={`${posLocationId}/${detallesId}`}
        open={Boolean(detallesId)}
        ventaId={detallesId}
        requiredPosLocationId={posLocationId ?? null}
        onClose={() => setDetallesId(null)}
      />

      <ModalCancelarVenta
        open={Boolean(cancelarId)}
        ventaId={cancelarId}
        onClose={() => setCancelarId(null)}
        onSuccess={handleFiltrar}
      />

      <ModalDevolverVenta
        open={Boolean(devolverId)}
        ventaId={devolverId}
        onClose={() => setDevolverId(null)}
        onSuccess={handleFiltrar}
      />

      <ModalClienteVenta
        open={Boolean(clienteData)}
        ventaId={clienteData?.ventaId}
        clienteActualId={clienteData?.clienteActualId}
        posLocationId={posLocationId}
        onClose={() => setClienteData(null)}
        onSuccess={handleFiltrar}
      />
    </Stack>
  );
}
