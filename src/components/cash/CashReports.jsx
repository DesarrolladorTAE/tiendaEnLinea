import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, FormControlLabel, Pagination, Paper, Stack, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import TrendingFlatOutlinedIcon from "@mui/icons-material/TrendingFlatOutlined";
import { cashBusinessDate, cashDateTime, cashError, cashMoney, cashTimeZone, downloadCashReport } from "../../utils/cashControl";
import { getPOSSaleStatus } from "../POS/saleStatus";

const detailPanel = { p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, borderColor: "#dbe4ed", minWidth: 0 };
const buttonSx = { minHeight: 44, borderRadius: 2, textTransform: "none", fontWeight: 700 };

function DifferenceChip({ value }) {
  if (typeof value !== "boolean") return null;
  return <Chip size="small" color={value ? "error" : "success"} label={value ? "Con diferencia" : "Sin diferencia"} sx={{ alignSelf: "start", fontWeight: 700 }} />;
}

function CashTable({ columns, children, keepTable = false }) {
  const mobileLabels = Object.fromEntries(columns.map((label, index) => [
    `& td:nth-of-type(${index + 1})::before`, { content: JSON.stringify(label) },
  ]));
  return (
    <TableContainer component={Paper} variant="outlined" tabIndex={keepTable ? 0 : undefined} role={keepTable ? "region" : undefined} aria-label={keepTable ? "Tabla de cortes de caja" : undefined} sx={(theme) => ({
      maxHeight: { sm: 360 }, borderRadius: 2, "& thead th": { bgcolor: "#edf3f9", color: "#273c51", fontWeight: 700 },
      ...(keepTable ? { "& table": { minWidth: 580 }, "& tbody tr:nth-of-type(even)": { bgcolor: "#f7fafc" } } : {
      [theme.breakpoints.down("sm")]: {
        border: 0, bgcolor: "transparent",
        "& table, & tbody": { display: "block" },
        "& thead": { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)" },
        "& tbody tr": { display: "grid", p: 1, mb: 1, border: "1px solid #dbe4ed", borderRadius: 2, bgcolor: "#f8fafc" },
        "& td": { display: "grid", gridTemplateColumns: "minmax(76px, 35%) minmax(0, 1fr)", gap: 1, px: 0.5, py: 0.75, border: 0, overflowWrap: "anywhere" },
        "& td::before": { fontWeight: 700, color: "#425b72" },
        ...mobileLabels,
      } }),
    })}>
      <Table size="small" stickyHeader role="table">
        <TableHead role="rowgroup"><TableRow role="row">{columns.map((column) => <TableCell key={column} scope="col">{column}</TableCell>)}</TableRow></TableHead>
        <TableBody role="rowgroup">{children}</TableBody>
      </Table>
    </TableContainer>
  );
}

function Inventory({ title, snapshot }) {
  return (
    <Stack component={Paper} variant="outlined" sx={detailPanel} spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Inventory2OutlinedIcon sx={{ color: "#25618a" }} />
        <Typography component="h3" variant="subtitle1" fontWeight={800}>{title}</Typography>
      </Stack>
      {!snapshot ? <Typography color="text.secondary">Captura pendiente.</Typography> : (
        <>
          <Typography variant="body2" color="text.secondary">Capturado el {cashDateTime(snapshot.captured_at)}</Typography>
          {snapshot.items?.length ? (
            <CashTable columns={["SKU", "Producto", "Variante", "Almacén", "Cantidad"]}>
              {snapshot.items.map((item) => (
                <TableRow role="row" key={[item.product_id, item.variant_id, item.warehouse_id].join("/")}>
                  <TableCell>{item.sku || "—"}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.variant || "—"}</TableCell>
                  <TableCell>{item.warehouse || "—"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                </TableRow>
              ))}
            </CashTable>
          ) : <Typography color="text.secondary">Sin productos en la captura.</Typography>}
        </>
      )}
    </Stack>
  );
}

export function CashReport({ client, path, report, opening = false }) {
  const [download, setDownload] = useState("");
  const [error, setError] = useState("");
  const { session, inventory, sales, payments_by_method: methods } = report;
  const hasDifference = report.has_difference ?? session.has_difference;
  const exportFile = async (format, initial) => {
    setDownload(`${format}-${initial}`);
    setError("");
    try {
      await downloadCashReport(client, path, session.id, format, initial);
    } catch (err) {
      setError(cashError(err, "No se pudo descargar el archivo."));
    } finally {
      setDownload("");
    }
  };
  const exports = (initial) => ["pdf", "xlsx"].map((format) => (
    <Button key={format} sx={buttonSx} startIcon={<FileDownloadOutlinedIcon />} variant="outlined" disabled={Boolean(download)} onClick={() => exportFile(format, initial)}>
      {download === `${format}-${initial}` ? "Descargando…" : `${initial ? "Inventario inicial" : "Corte"} · ${format === "pdf" ? "PDF" : "Excel"}`}
    </Button>
  ));
  const totals = [
    ["Fondo inicial", report.opening_amount ?? session.opening_amount, AccountBalanceWalletOutlinedIcon, "#eff6ff", "#1e4e87"],
    ["Efectivo esperado", report.expected_cash, TrendingFlatOutlinedIcon, "#f2edff", "#5e3a85"],
    ["Efectivo contado", report.closing_amount, PaymentsOutlinedIcon, "#eaf8f1", "#206348"],
    ["Diferencia", report.cash_difference, PointOfSaleOutlinedIcon,
      hasDifference === false ? "#eaf8f1" : hasDifference === true ? "#fff0ed" : "#f1f5f9",
      hasDifference === false ? "#206348" : hasDifference === true ? "#972d26" : "#425b72"],
  ];

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Stack spacing={1.5} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#182738", color: "#fff", borderTop: "3px solid #ffc107" }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box sx={{ display: "grid", placeItems: "center", flexShrink: 0, width: 40, height: 40, borderRadius: 2, bgcolor: "#ffc107", color: "#182738" }}><ReceiptLongOutlinedIcon /></Box>
          <Typography component="h2" variant="h6" sx={{ color: "inherit", fontWeight: 800 }}>{opening ? "Reporte de apertura" : "Reporte de caja"} #{session.id}</Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} gap={{ xs: 0.5, sm: 3 }} sx={{ "& .MuiTypography-root": { color: "#fff" } }}>
          <Typography variant="body2">Apertura · {cashDateTime(session.opened_at)}</Typography>
          <Typography variant="body2">{session.closed_at ? `Corte · ${cashDateTime(session.closed_at)}` : "Sesión abierta"}</Typography>
        </Stack>
        {!opening && <DifferenceChip value={hasDifference} />}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.25 }}>
        {(opening ? totals.slice(0, 1) : totals).map(([label, amount, Icon, background, color]) => (
          <Stack key={label} spacing={0.6} sx={{ p: { xs: 1.25, sm: 1.75 }, minWidth: 0, bgcolor: background, color, borderRadius: 2.5, overflowWrap: "anywhere" }}>
            <Icon fontSize="small" />
            <Typography variant="body2" sx={{ color: "inherit" }}>{label}</Typography>
            <Typography sx={{ color: "inherit", fontSize: { xs: "1.05rem", sm: "1.25rem" }, fontWeight: 800 }}>{cashMoney(amount)}</Typography>
          </Stack>
        ))}
      </Box>
      <Stack component={Paper} variant="outlined" sx={detailPanel} spacing={1.25}>
        <Typography component="h3" variant="subtitle1" fontWeight={800}>Descargas</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} useFlexGap flexWrap="wrap" gap={1}>{exports(true)}{session.closed_at && exports(false)}</Stack>
      </Stack>
      {!opening && (
        <>
          <Stack component={Paper} variant="outlined" sx={detailPanel} spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}><PaymentsOutlinedIcon sx={{ color: "#206348" }} /><Typography component="h3" variant="subtitle1" fontWeight={800}>Pagos por método</Typography></Stack>
            {Object.entries(methods ?? {}).map(([method, amount]) => (
              <Stack key={method} direction="row" gap={1} justifyContent="space-between" sx={{ bgcolor: "#edf7f1", color: "#206348", borderRadius: 2, px: 1.5, py: 1, overflowWrap: "anywhere" }}>
                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{method}</Typography>
                <Typography variant="body2" fontWeight={800}>{cashMoney(amount)}</Typography>
              </Stack>
            ))}
            {!Object.keys(methods ?? {}).length && <Typography color="text.secondary">Sin pagos registrados.</Typography>}
          </Stack>
          <Stack component={Paper} variant="outlined" sx={detailPanel} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}><PointOfSaleOutlinedIcon sx={{ color: "#25618a" }} /><Typography component="h3" variant="subtitle1" fontWeight={800}>Ventas ({report.sales_count ?? sales?.length ?? 0})</Typography></Stack>
            {sales?.length ? (
              <CashTable columns={["Venta", "Fecha", "Estado", "Total", "Pagos"]}>
                {sales.map((sale) => {
                  const { label, color, icon } = getPOSSaleStatus(sale);
                  return (
                  <TableRow role="row" key={sale.id}>
                    <TableCell>#{sale.id}</TableCell>
                    <TableCell>{cashDateTime(sale.sold_at ?? sale.created_at)}</TableCell>
                    <TableCell><Chip size="small" color={color} icon={icon} label={label} sx={{ maxWidth: "100%", height: "auto", minHeight: 24, "& .MuiChip-label": { whiteSpace: "normal" } }} /></TableCell>
                    <TableCell>{cashMoney(sale.total_amount)}</TableCell>
                    <TableCell>{(sale.payments ?? []).map((payment) =>
                      `${payment.method ?? payment.payment_method ?? "Pago"} ${cashMoney(payment.amount)}`,
                    ).join(" · ") || "—"}</TableCell>
                  </TableRow>
                  );
                })}
              </CashTable>
            ) : <Typography color="text.secondary">Sin ventas registradas.</Typography>}
          </Stack>
        </>
      )}
      <Inventory title="Inventario inicial" snapshot={opening ? inventory : inventory?.opening} />
      {!opening && <Inventory title="Inventario final" snapshot={inventory?.closing} />}
    </Stack>
  );
}

const weekLabel = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" });
const mexicoOffset = new Intl.DateTimeFormat("en-US", { timeZone: cashTimeZone, timeZoneName: "longOffset" });

function shiftDate(date, days) {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function mexicoMidnight(date) {
  const offset = mexicoOffset.formatToParts(new Date(`${date}T12:00:00Z`))
    .find(({ type }) => type === "timeZoneName").value.slice(3);
  return `${date}T00:00:00${offset || "+00:00"}`;
}

export function CashHistory({ client, path }) {
  const today = cashBusinessDate();
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const currentWeek = shiftDate(today, -((weekday + 6) % 7));
  const [weekOffset, setWeekOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [differenceOnly, setDifferenceOnly] = useState(false);
  const [id, setId] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [history, setHistory] = useState(null);
  const [result, setResult] = useState(null);
  const monday = shiftDate(currentWeek, weekOffset * 7);
  const sunday = shiftDate(monday, 6);
  const from = mexicoMidnight(monday);
  const to = mexicoMidnight(shiftDate(monday, 7));
  const key = `${path}#${from}/${page}/${differenceOnly}/${attempt}`;
  const reportKey = `${path}/${id}#${attempt}`;

  useEffect(() => {
    if (id != null) return;
    const controller = new AbortController();
    client.get(`${path}/history`, {
      signal: controller.signal,
      params: { from, to, page, ...(differenceOnly ? { has_difference: 1 } : {}) },
    }).then(({ data }) => {
      if (!controller.signal.aborted) setHistory({ key, data });
    }).catch((err) => {
      if (!controller.signal.aborted) setHistory({ key, error: cashError(err, "No se pudo cargar el historial de caja.") });
    });
    return () => controller.abort();
  }, [client, differenceOnly, from, id, key, page, path, to]);

  useEffect(() => {
    if (id == null) return;
    const controller = new AbortController();
    client.get(`${path}/history/${id}`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setResult({ key: reportKey, data });
    }).catch((err) => {
      if (!controller.signal.aborted) setResult({ key: reportKey, error: cashError(err, "No se pudo cargar el reporte de caja.") });
    });
    return () => controller.abort();
  }, [client, id, path, reportKey]);

  const list = history?.key === key ? history : null;
  const current = id ? (result?.key === reportKey ? result : null) : list;
  const sessions = list?.data?.data ?? [];
  const changeWeek = (change) => {
    setWeekOffset((offset) => offset + change);
    setPage(1);
  };
  return (
    <Stack spacing={2}>
      {!id && <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "#182738", color: "#fff", borderTop: "3px solid #ffc107" }}>
        <Box sx={{ display: "grid", placeItems: "center", flexShrink: 0, width: 40, height: 40, borderRadius: 2, bgcolor: "#ffc107", color: "#182738" }}><HistoryOutlinedIcon /></Box>
        <Box><Typography component="h2" variant="h6" sx={{ color: "inherit", fontWeight: 800 }}>Historial de cortes</Typography><Typography variant="body2" sx={{ color: "#d6e2ef" }}>Consulta las aperturas, los cortes y el reporte de cada sesión.</Typography></Box>
      </Stack>}
      {!id && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ p: 1.5, bgcolor: "#eef4f9", borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ScheduleOutlinedIcon sx={{ color: "#25618a" }} />
            <Box aria-live="polite">
              <Typography fontWeight={800}>{weekOffset === 0 ? "Esta semana" : "Semana seleccionada"}</Typography>
              <Typography variant="body2">{weekLabel.format(new Date(monday))} – {weekLabel.format(new Date(sunday))}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <Button size="small" sx={buttonSx} startIcon={<ChevronLeftOutlinedIcon />} onClick={() => changeWeek(-1)}>Anterior</Button>
            <Button size="small" sx={buttonSx} endIcon={<ChevronRightOutlinedIcon />} disabled={weekOffset === 0} onClick={() => changeWeek(1)}>Siguiente</Button>
          </Stack>
        </Stack>
      )}
      {!id && <FormControlLabel label="Solo cortes con diferencia" control={<Switch checked={differenceOnly} onChange={(_, checked) => {
        setDifferenceOnly(checked);
        setPage(1);
      }} />} />}
      {id && <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} sx={{ ...buttonSx, alignSelf: { sm: "start" } }} onClick={() => setId(null)}>Volver a los cortes</Button>}
      {!current && <CircularProgress size={24} aria-label="Cargando historial" />}
      {current?.error && <Alert severity="error" action={<Button color="inherit" onClick={() => setAttempt(attempt + 1)}>Reintentar</Button>}>{current.error}</Alert>}
      {id && current?.data && (
        <CashReport key={id} client={client} path={path} report={current.data} />
      )}
      {!id && list?.data && (
        <>
          {sessions.length ? (
            <>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "block", sm: "none" } }}>Desliza la tabla para ver todas las columnas.</Typography>
            <CashTable keepTable columns={["Sesión", "Estado", "Apertura", "Corte", "Diferencia", "Reporte"]}>
              {sessions.map((session) => (
                <TableRow hover key={session.id}>
                  <TableCell component="th" scope="row">#{session.id}</TableCell>
                  <TableCell><Chip size="small" label={session.closed_at ? "Cerrada" : "Abierta"} color={session.closed_at ? "default" : "success"} /></TableCell>
                  <TableCell>{cashDateTime(session.opened_at)}</TableCell>
                  <TableCell>{session.closed_at ? cashDateTime(session.closed_at) : "Pendiente"}</TableCell>
                  <TableCell><DifferenceChip value={session.has_difference} /></TableCell>
                  <TableCell><Button sx={buttonSx} variant="outlined" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => setId(session.id)} aria-label={`Ver reporte de caja ${session.id}`}>Ver reporte</Button></TableCell>
                </TableRow>
              ))}
            </CashTable>
            </>
          ) : <Alert severity="info">{differenceOnly ? "No hay cortes con diferencia en esta semana." : "No hay cortes de caja en esta semana."}</Alert>}
          {list.data.last_page > 1 && <Pagination sx={{ alignSelf: "center" }} color="primary" size="small" siblingCount={0} page={page} count={list.data.last_page} onChange={(_, value) => setPage(value)} />}
        </>
      )}
    </Stack>
  );
}
