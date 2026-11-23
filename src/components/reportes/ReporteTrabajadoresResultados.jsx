import React from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const number = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
});

function SummaryCard({ title, value, accent = false }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${
          accent ? alpha(COLORS.accent, 0.35) : alpha("#000", 0.08)
        }`,
        bgcolor: accent ? alpha(COLORS.accent, 0.14) : "#fff",
        minHeight: 92,
      }}
    >
      <CardContent sx={{ p: 1.6 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            mt: 0.5,
            fontWeight: 900,
            color: COLORS.black,
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function LabelValue({ label, value, strong = false }) {
  return (
    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: strong ? 900 : 700,
          color: COLORS.black,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function ReporteTrabajadoresResultados({
  loading = false,
  data = null,
  error = "",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const rows = data?.rows || [];
  const totales = data?.totales || {};

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(2, 1fr)" },
          gap: 1.25,
        }}
      >
        <SummaryCard
          title="Cantidad total"
          value={number.format(totales?.total_cantidad || 0)}
          accent
        />
        <SummaryCard
          title="Total vendido"
          value={money.format(totales?.total_vendido || 0)}
        />
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ p: 1.5 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.black }}>
              Resultado del reporte
            </Typography>

            <Chip
              label={`${rows.length} registro(s)`}
              sx={{
                fontWeight: 900,
                bgcolor: alpha("#000", 0.04),
                border: `1px solid ${alpha("#000", 0.08)}`,
              }}
            />
          </Stack>

          <Divider />

          {loading ? (
            <Box
              sx={{
                minHeight: 220,
                display: "grid",
                placeItems: "center",
                p: 2,
              }}
            >
              <Stack alignItems="center" spacing={1.2}>
                <CircularProgress size={34} />
                <Typography variant="body2" color="text.secondary">
                  Consultando reporte...
                </Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(COLORS.danger, 0.2)}`,
                }}
              >
                {error}
              </Alert>
            </Box>
          ) : !data ? (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="info"
                sx={{
                  borderRadius: 2.5,
                  bgcolor: alpha("#000", 0.03),
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              >
                Configura tus filtros y presiona <strong>Buscar</strong>.
              </Alert>
            </Box>
          ) : !rows.length ? (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="warning"
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              >
                No se encontraron resultados con los filtros seleccionados.
              </Alert>
            </Box>
          ) : isMobile ? (
            <Stack spacing={1.2} sx={{ p: 1.2 }}>
              {rows.map((row, index) => (
                <Card
                  key={`${row.fecha}-${row.worker_id}-${row.product_id}-${index}`}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha("#000", 0.08)}`,
                    bgcolor: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <CardContent sx={{ p: 1.4 }}>
                    <Stack spacing={1.2}>
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 900,
                              color: COLORS.black,
                              lineHeight: 1.15,
                              wordBreak: "break-word",
                            }}
                          >
                            {row.product_name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.35, fontWeight: 700 }}
                          >
                            {row.worker_name || "Sin trabajador"}
                          </Typography>
                        </Box>

                        <Chip
                          label={row.fecha || "-"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: alpha(COLORS.accent, 0.18),
                            border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
                            flexShrink: 0,
                          }}
                        />
                      </Stack>

                      <Divider />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1.2,
                        }}
                      >
                        <LabelValue
                          label="Cantidad"
                          value={number.format(row.cantidad || 0)}
                        />
                        <LabelValue
                          label="Precio unitario"
                          value={money.format(row.precio_unitario || 0)}
                        />
                      </Box>

                      <Box
                        sx={{
                          borderRadius: 2.5,
                          p: 1.1,
                          bgcolor: alpha("#000", 0.025),
                          border: `1px solid ${alpha("#000", 0.06)}`,
                        }}
                      >
                        <LabelValue
                          label="Total final"
                          value={money.format(row.total || 0)}
                          strong
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha("#000", 0.03) }}>
                    <TableCell sx={{ fontWeight: 900 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Trabajador</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Producto</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Cantidad
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Precio unitario
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900 }}>
                      Total final
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={`${row.fecha}-${row.worker_id}-${row.product_id}-${index}`}
                      hover
                      sx={{
                        "& td": {
                          borderBottom: `1px solid ${alpha("#000", 0.06)}`,
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {row.fecha || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 800, color: COLORS.black }}
                        >
                          {row.worker_name || "Sin trabajador"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {row.product_name}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        {number.format(row.cantidad || 0)}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {money.format(row.precio_unitario || 0)}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {money.format(row.total || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}