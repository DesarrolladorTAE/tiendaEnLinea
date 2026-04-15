import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  alpha,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import LockClockRoundedIcon from "@mui/icons-material/LockClockRounded";

// --- Helpers ---
const capitalizeFirst = (s) =>
  s ? s.replace(/^\p{L}/u, (m) => m.toUpperCase()) : s;

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const safeDateFrom = (val) => {
  if (!val) return null;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, day] = val.split("-").map(Number);
    const d = new Date(y, m - 1, day);
    return isValidDate(d) ? d : null;
  }
  if (val instanceof Date) return isValidDate(val) ? val : null;
  const d = new Date(val);
  return isValidDate(d) ? d : null;
};

const fmtDay = (yyyyMMdd) => {
  const d = safeDateFrom(yyyyMMdd);
  if (!d) return "Fecha inválida";
  return capitalizeFirst(
    new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Mexico_City",
    }).format(d)
  );
};

const groupByDay = (rows = []) => {
  const map = new Map();
  const sinFecha = [];

  rows.forEach((r) => {
    const raw = r.fechaISO ?? r.created_at ?? r.fecha;
    const d = safeDateFrom(raw);

    if (!d) {
      sinFecha.push(r);
      return;
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });

  return { map, sinFecha };
};

const chipPago = (tipoPago) => {
  const code = (tipoPago || "").toString().toLowerCase();

  switch (code) {
    case "efectivo":
      return { label: "Efectivo", color: "success", variant: "outlined" };
    case "tc":
      return { label: "Tarjeta crédito", color: "primary", variant: "outlined" };
    case "td":
      return { label: "Tarjeta débito", color: "primary", variant: "outlined" };
    case "transferencia":
      return { label: "Transferencia", color: "info", variant: "outlined" };
    default:
      return { label: tipoPago || "—", color: "default", variant: "outlined" };
  }
};

const chipStatus = (row) => {
  const status = String(row?.invoice_status || "").toLowerCase();
  const hasError = !!row?.error_message;

  if (status === "timbrada") {
    return {
      label: row?.invoice_status_name || "Facturada",
      color: "success",
      variant: "filled",
      clickable: false,
    };
  }

  if (row?.fuera_de_rango) {
    return {
      label: "Fuera de rango",
      color: "default",
      variant: "filled",
      clickable: false,
    };
  }

  if (status === "error" || hasError) {
    return {
      label: row?.invoice_status_name || "Error al facturar",
      color: "error",
      variant: "filled",
      clickable: true,
    };
  }

  return {
    label: row?.invoice_status_name || "Pendiente",
    color: "warning",
    variant: "filled",
    clickable: false,
  };
};

const getClienteNombre = (row) => {
  const c = row?.client;
  if (!c) return "Sin cliente";
  return c?.nombre_alias || c?.razon_social || c?.rfc || "Cliente";
};

const parseMoney = (s) =>
  Number(String(s || "").replace(/[^0-9.-]+/g, "")) || 0;

const fmtMoney = (n) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function DocumentoSelector({ row, onVerPdf, onVerXml, dense = false }) {
  const [value, setValue] = useState("");

  const pdfDisponible = !!row?.invoice?.pdf_url;
  const xmlDisponible = !!row?.invoice?.xml_url;
  const disabled = !pdfDisponible && !xmlDisponible;

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);

    if (next === "pdf") onVerPdf?.(row);
    if (next === "xml") onVerXml?.(row);

    setTimeout(() => setValue(""), 150);
  };

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: dense ? 130 : 145,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.5,
          fontWeight: 700,
        },
      }}
      disabled={disabled}
    >
      <InputLabel id={`ver-doc-${row?.id}`}>Ver</InputLabel>
      <Select
        labelId={`ver-doc-${row?.id}`}
        value={value}
        label="Ver"
        onChange={handleChange}
        startAdornment={
          <VisibilityRoundedIcon
            sx={{ fontSize: 18, mr: 0.8, color: "text.secondary" }}
          />
        }
      >
        <MenuItem value="pdf" disabled={!pdfDisponible}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PictureAsPdfRoundedIcon fontSize="small" />
            <span>PDF</span>
          </Stack>
        </MenuItem>
        <MenuItem value="xml" disabled={!xmlDisponible}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CodeRoundedIcon fontSize="small" />
            <span>XML</span>
          </Stack>
        </MenuItem>
      </Select>
    </FormControl>
  );
}

function WhatsappSelector({ row, onEnviarWhatsapp, dense = false }) {
  const [value, setValue] = useState("");

  const pdfDisponible = !!row?.invoice?.pdf_url;
  const xmlDisponible = !!row?.invoice?.xml_url;
  const disabled = !pdfDisponible && !xmlDisponible;

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);

    if (next === "pdf") onEnviarWhatsapp?.(row, "pdf");
    if (next === "xml") onEnviarWhatsapp?.(row, "xml");

    setTimeout(() => setValue(""), 150);
  };

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: dense ? 150 : 170,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.5,
          fontWeight: 700,
        },
      }}
      disabled={disabled}
    >
      <InputLabel id={`wa-doc-${row?.id}`}>WhatsApp</InputLabel>
      <Select
        labelId={`wa-doc-${row?.id}`}
        value={value}
        label="WhatsApp"
        onChange={handleChange}
        startAdornment={
          <WhatsAppIcon
            sx={{ fontSize: 18, mr: 0.8, color: "success.main" }}
          />
        }
      >
        <MenuItem value="pdf" disabled={!pdfDisponible}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SendRoundedIcon fontSize="small" />
            <span>Enviar PDF</span>
          </Stack>
        </MenuItem>
        <MenuItem value="xml" disabled={!xmlDisponible}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SendRoundedIcon fontSize="small" />
            <span>Enviar XML</span>
          </Stack>
        </MenuItem>
      </Select>
    </FormControl>
  );
}

export default function SalesTable({
  rows = [],
  loading = false,
  onFacturar,
  onVerPdf,
  onVerXml,
  onEnviarWhatsapp,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { days, grouped, sinFecha } = useMemo(() => {
    const { map, sinFecha } = groupByDay(rows);
    const keys = Array.from(map.keys()).sort((a, b) => {
      const da = safeDateFrom(a)?.getTime() ?? 0;
      const db = safeDateFrom(b)?.getTime() ?? 0;
      return db - da;
    });

    return { days: keys, grouped: map, sinFecha };
  }, [rows]);

  const [dayIndex, setDayIndex] = useState(0);
  const [dense, setDense] = useState(true);
  const [viewAll, setViewAll] = useState(false);

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorRow, setErrorRow] = useState(null);

  useEffect(() => {
    setDayIndex(0);
  }, [days.length]);

  const hasDays = days.length > 0;
  const dayKey = hasDays ? days[dayIndex] : null;
  const dayRows = hasDays ? grouped.get(dayKey) : [];
  const rowsShown = viewAll ? rows : dayRows;

  const totalDia = useMemo(
    () => rowsShown.reduce((acc, r) => acc + parseMoney(r.total), 0),
    [rowsShown]
  );

  const handleOpenError = (row) => {
    if (!row?.error_message) return;
    setErrorRow(row);
    setErrorDialogOpen(true);
  };

  const handleCloseError = () => {
    setErrorDialogOpen(false);
    setErrorRow(null);
  };

  const MobileCard = ({ row, idx }) => {
    const pago = chipPago(row.tipoPago);
    const status = chipStatus(row);
    const cliente = getClienteNombre(row);
    const facturada = row.facturable === false && !row?.fuera_de_rango;
    const fueraDeRango = !!row?.fuera_de_rango;
    const puedeVerDocumentos = !!row?.puede_ver_documentos;

    return (
      <Paper
        key={row.id ?? idx}
        elevation={0}
        sx={{
          p: 1.35,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          background:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.9)
              : "#fff",
          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Stack spacing={1.1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Box minWidth={0}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700 }}
              >
                Folio
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: "0.98rem",
                  lineHeight: 1.1,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {row.folio}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "1rem",
                color: "success.main",
                whiteSpace: "nowrap",
              }}
            >
              {row.total}
            </Typography>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarTodayRoundedIcon
              sx={{ fontSize: 16, color: "text.secondary" }}
            />
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontSize: ".83rem" }}
            >
              {row.fecha}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <PaymentsRoundedIcon
              sx={{ fontSize: 16, color: "text.secondary" }}
            />
            <Chip
              size="small"
              label={pago.label}
              color={pago.color}
              variant={pago.variant}
              sx={{ fontWeight: 700, maxWidth: "100%" }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <PersonRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: ".83rem",
                fontWeight: 600,
              }}
            >
              {cliente}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedRoundedIcon
              sx={{ fontSize: 16, color: "text.secondary" }}
            />
            <Chip
              size="small"
              label={status.label}
              color={status.color}
              variant={status.variant}
              onClick={status.clickable ? () => handleOpenError(row) : undefined}
              sx={{
                fontWeight: 700,
                maxWidth: "100%",
                cursor: status.clickable ? "pointer" : "default",
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <TagRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ID venta: {row.id}
            </Typography>
          </Stack>

          {puedeVerDocumentos ? (
            <Stack spacing={0.8}>
              <DocumentoSelector
                row={row}
                onVerPdf={onVerPdf}
                onVerXml={onVerXml}
                dense
              />
              <WhatsappSelector
                row={row}
                onEnviarWhatsapp={onEnviarWhatsapp}
                dense
              />
            </Stack>
          ) : fueraDeRango ? (
            <Chip
              icon={<LockClockRoundedIcon />}
              label="No facturable por mes anterior"
              color="default"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          ) : (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              startIcon={<ReceiptLongIcon />}
              onClick={() => onFacturar?.(row)}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                fontWeight: 800,
                py: 0.9,
                boxShadow: 0,
              }}
            >
              Facturar
            </Button>
          )}
        </Stack>
      </Paper>
    );
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          boxShadow: `0 14px 36px ${
            theme.palette.mode === "dark"
              ? "rgba(0,0,0,.28)"
              : "rgba(15,23,42,.06)"
          }`,
        }}
      >
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            pt: 1.2,
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            background:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.default, 0.35)
                : "linear-gradient(180deg,#fafbff,#fff)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Tooltip title="Día anterior">
              <span>
                <IconButton
                  size="small"
                  onClick={() =>
                    setDayIndex((i) => Math.min(i + 1, days.length - 1))
                  }
                  disabled={!hasDays || dayIndex >= days.length - 1 || viewAll}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Día siguiente">
              <span>
                <IconButton
                  size="small"
                  onClick={() => setDayIndex((i) => Math.max(i - 1, 0))}
                  disabled={!hasDays || dayIndex <= 0 || viewAll}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Chip
              variant="outlined"
              label={
                loading
                  ? "Cargando…"
                  : viewAll
                  ? "Todos los registros"
                  : hasDays
                  ? fmtDay(dayKey)
                  : "Sin registros"
              }
              sx={{ fontWeight: 800 }}
            />

            {hasDays && !viewAll && (
              <Chip
                color="primary"
                label={`Día ${dayIndex + 1} de ${days.length}`}
                sx={{ fontWeight: 800 }}
              />
            )}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              variant={viewAll ? "contained" : "outlined"}
              startIcon={<ViewWeekIcon />}
              onClick={() => setViewAll((v) => !v)}
              sx={{ textTransform: "none", borderRadius: 2.5, fontWeight: 800 }}
            >
              {viewAll ? "Ver por día" : "Ver todos"}
            </Button>

            <Tooltip title="Ir al día actual">
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setViewAll(false);
                    setDayIndex(0);
                  }}
                  disabled={!hasDays}
                >
                  <TodayIcon />
                </IconButton>
              </span>
            </Tooltip>

            {!isMobile && (
              <FormControlLabel
                control={
                  <Switch
                    checked={dense}
                    onChange={(e) => setDense(e.target.checked)}
                    size="small"
                  />
                }
                label="Compacta"
                sx={{ ml: 0.5 }}
              />
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={`Total ${viewAll ? "listado" : "del día"}: $${fmtMoney(totalDia)}`}
            color="success"
            variant="outlined"
            sx={{ fontWeight: 800 }}
          />

          {sinFecha.length > 0 && (
            <Chip
              size="small"
              variant="outlined"
              color="warning"
              label={`Registros sin fecha: ${sinFecha.length}`}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>

        {isMobile ? (
          <Box sx={{ p: 1.2 }}>
            {loading ? (
              <Stack spacing={1.2}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    sx={{
                      p: 1.3,
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Stack spacing={1}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="rounded" height={34} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : rowsShown.length > 0 ? (
              <Stack spacing={1.1}>
                {rowsShown.map((r, idx) => (
                  <MobileCard key={r.id ?? idx} row={r} idx={idx} />
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  py: 5,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                Sin registros
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer
            sx={{
              overflowX: "auto",
              maxHeight: 600,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Table stickyHeader size={dense ? "small" : "medium"}>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? theme.palette.background.paper
                          : "#f8faff",
                      color: "text.primary",
                      fontWeight: 800,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <TableCell>Folio</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Tipo de pago</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={140} /></TableCell>
                      <TableCell><Skeleton variant="text" width={140} /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={120} height={28} /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      <TableCell align="center">
                        <Skeleton variant="rounded" width={220} height={32} sx={{ mx: "auto" }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rowsShown.length > 0 ? (
                  rowsShown.map((r, idx) => {
                    const pago = chipPago(r.tipoPago);
                    const status = chipStatus(r);
                    const cliente = getClienteNombre(r);
                    const fueraDeRango = !!r?.fuera_de_rango;
                    const puedeVerDocumentos = !!r?.puede_ver_documentos;

                    return (
                      <TableRow
                        key={r.id ?? `${dayKey}-${idx}`}
                        hover
                        sx={{
                          "&:nth-of-type(odd)": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.02)"
                                : "rgba(2,6,23,0.012)",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontWeight: 700,
                          }}
                        >
                          {r.folio}
                        </TableCell>

                        <TableCell>{r.fecha}</TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>
                          {cliente}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size={dense ? "small" : "medium"}
                            label={status.label}
                            color={status.color}
                            variant={status.variant}
                            onClick={status.clickable ? () => handleOpenError(r) : undefined}
                            sx={{
                              fontWeight: 700,
                              cursor: status.clickable ? "pointer" : "default",
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {r.total}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size={dense ? "small" : "medium"}
                            label={pago.label}
                            color={pago.color}
                            variant={pago.variant}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          {puedeVerDocumentos ? (
                            <Stack
                              direction="row"
                              spacing={0.8}
                              justifyContent="center"
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <DocumentoSelector
                                row={r}
                                onVerPdf={onVerPdf}
                                onVerXml={onVerXml}
                                dense={dense}
                              />

                              <WhatsappSelector
                                row={r}
                                onEnviarWhatsapp={onEnviarWhatsapp}
                                dense={dense}
                              />
                            </Stack>
                          ) : fueraDeRango ? (
                            <Chip
                              icon={<LockClockRoundedIcon />}
                              label="Mes anterior / bloqueada"
                              color="default"
                              variant="outlined"
                              sx={{ fontWeight: 700 }}
                            />
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              size={dense ? "small" : "medium"}
                              startIcon={<ReceiptLongIcon />}
                              onClick={() => onFacturar?.(r)}
                              sx={{
                                textTransform: "none",
                                borderRadius: 2.5,
                                fontWeight: 800,
                                boxShadow: 0,
                              }}
                            >
                              Facturar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 6, color: "text.secondary" }}
                    >
                      Sin registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 600 }}
          >
            {rowsShown.length} registro(s) visibles
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              onClick={() => setDayIndex((i) => Math.min(i + 1, days.length - 1))}
              disabled={!hasDays || dayIndex >= days.length - 1 || viewAll}
            >
              <ChevronLeftIcon />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => setDayIndex((i) => Math.max(i - 1, 0))}
              disabled={!hasDays || dayIndex <= 0 || viewAll}
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

      <Dialog
        open={errorDialogOpen}
        onClose={handleCloseError}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
          Error de facturación
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Venta: <b>{errorRow?.folio || errorRow?.id || "—"}</b>
            </Typography>

            <Box
              sx={(theme) => ({
                p: 2,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(244,67,54,0.10)"
                    : "rgba(244,67,54,0.06)",
                border: "1px solid rgba(244,67,54,0.25)",
                color: "text.primary",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "0.95rem",
              })}
            >
              {errorRow?.error_message || "No hay detalle del error disponible."}
            </Box>

            {!!errorRow?.error_history?.length && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                  Historial de intentos
                </Typography>

                <Stack spacing={1}>
                  {errorRow.error_history.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Intento {index + 1}
                        {item?.created_at ? ` · ${item.created_at}` : ""}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {item?.error_message || "Sin detalle"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseError} color="error" variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}