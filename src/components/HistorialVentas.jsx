import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  useMediaQuery,
  Button,
  Paper,
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";

import useHistorialPOSSimple from "./useHistorialPOSSimple";

import HistorialPOSFilters from "./HistorialPOSFilters";
import HistorialPOSResumen from "./HistorialPOSResumen";
import HistorialPOSTable from "./HistorialPOSTable";

import ModalTicketVenta from "./ModalTicketVenta";
import ModalDetallesVenta from "./ModalDetallesVenta";
import ModalCancelarVenta from "./ModalCancelarVenta";
import ModalDevolverVenta from "./ModalDevolverVenta";
import ModalClienteVenta from "./ModalClienteVenta";

export default function HistorialPOSPage({ cambiarVista }) {
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
    posLocationId,
  } = useHistorialPOSSimple();

  const [ticketId, setTicketId] = useState(null);
  const [detallesId, setDetallesId] = useState(null);
  const [cancelarId, setCancelarId] = useState(null);
  const [devolverId, setDevolverId] = useState(null);
  const [clienteData, setClienteData] = useState(null);

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
          borderRadius: 5,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(15,23,42,.04), rgba(255,255,255,.96))",
          boxShadow: "0 18px 45px rgba(15,23,42,.07)",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={950}
              sx={{
                fontSize: {
                  xs: "1.7rem",
                  md: "2.2rem",
                },
              }}
            >
              Historial de Ventas
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Movimientos, pagos, créditos, facturas, cancelaciones y
              devoluciones.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            sx={{
              width: {
                xs: "100%",
                md: "auto",
              },
            }}
          >
            <Button
              fullWidth={isMobile}
              variant="contained"
              color="inherit"
              startIcon={<DashboardCustomizeRoundedIcon />}
              onClick={() => cambiarVista?.("menu")}
              sx={{
                borderRadius: 3,
                fontWeight: 900,
                textTransform: "none",
                minHeight: 46,
                bgcolor: "grey.900",
                color: "#fff",
                "&:hover": {
                  bgcolor: "grey.800",
                },
              }}
            >
              Regresar al panel
            </Button>

            <Button
              fullWidth={isMobile}
              variant="outlined"
              startIcon={<PointOfSaleRoundedIcon />}
              onClick={() => cambiarVista?.("venta")}
              sx={{
                borderRadius: 3,
                fontWeight: 900,
                textTransform: "none",
                minHeight: 46,
              }}
            >
              Ventas
            </Button>

            <Button
              fullWidth={isMobile}
              variant="outlined"
              startIcon={<PendingActionsRoundedIcon />}
              onClick={() => cambiarVista?.("ventas_pendientes")}
              sx={{
                borderRadius: 3,
                fontWeight: 900,
                textTransform: "none",
                minHeight: 46,
              }}
            >
              Pendientes
            </Button>

            <Button
              fullWidth={isMobile}
              variant="outlined"
              startIcon={<CreditScoreRoundedIcon />}
              onClick={() => cambiarVista?.("credito_fiado")}
              sx={{
                borderRadius: 3,
                fontWeight: 900,
                textTransform: "none",
                minHeight: 46,
              }}
            >
              Crédito
            </Button>

            <Button
              fullWidth={isMobile}
              variant="outlined"
              startIcon={<ReceiptLongRoundedIcon />}
              onClick={() => cambiarVista?.("facturas")}
              sx={{
                borderRadius: 3,
                fontWeight: 900,
                textTransform: "none",
                minHeight: 46,
              }}
            >
              Facturas
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <HistorialPOSFilters
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

      <HistorialPOSResumen
        summary={summary}
        rows={historialRows}
      />

      {historialGroups.length > 0 ? (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,250,252,.92))",
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
        open={Boolean(detallesId)}
        ventaId={detallesId}
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