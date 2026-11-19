import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Pagination, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { cashDateTime, cashError, cashMoney, downloadCashReport } from "../../utils/cashControl";

function CashTable({ columns, children }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
      <Table size="small" stickyHeader>
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}

function Inventory({ title, snapshot }) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {!snapshot ? <Typography color="text.secondary">Captura pendiente.</Typography> : (
        <>
          <Typography variant="body2" color="text.secondary">Capturado el {cashDateTime(snapshot.captured_at)}</Typography>
          {snapshot.items?.length ? (
            <CashTable columns={["SKU", "Producto", "Variante", "Almacén", "Cantidad"]}>
              {snapshot.items.map((item) => (
                <TableRow key={[item.product_id, item.variant_id, item.warehouse_id].join("/")}>
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
    <Button key={format} variant="outlined" disabled={Boolean(download)} onClick={() => exportFile(format, initial)}>
      {download === `${format}-${initial}` ? "Descargando…" : `${initial ? "Inventario inicial" : "Corte"} · ${format === "pdf" ? "PDF" : "Excel"}`}
    </Button>
  ));
  const totals = [
    ["Fondo inicial", report.opening_amount ?? session.opening_amount],
    ["Efectivo esperado", report.expected_cash],
    ["Efectivo contado", report.closing_amount],
    ["Diferencia", report.cash_difference],
  ];

  return (
    <Stack spacing={2} divider={<Divider flexItem />}>
      <Stack spacing={1}>
        <Typography variant="h6">{opening ? "Reporte de apertura" : "Reporte de caja"} #{session.id}</Typography>
        <Typography variant="body2">Apertura {cashDateTime(session.opened_at)} · {session.closed_at ? `Corte ${cashDateTime(session.closed_at)}` : "Sesión abierta"}</Typography>
        {opening ? <Typography>Fondo inicial {cashMoney(session.opening_amount)}</Typography> : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1 }}>
            {totals.map(([label, amount]) => (
              <Paper variant="outlined" sx={{ p: 1.5 }} key={label}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography fontWeight={700}>{cashMoney(amount)}</Typography>
              </Paper>
            ))}
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>{exports(true)}{session.closed_at && exports(false)}</Stack>
      </Stack>
      {!opening && (
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={700}>Pagos por método</Typography>
          {Object.entries(methods ?? {}).map(([method, amount]) => (
            <Typography key={method} variant="body2">{method} · {cashMoney(amount)}</Typography>
          ))}
          {!Object.keys(methods ?? {}).length && <Typography color="text.secondary">Sin pagos registrados.</Typography>}
          <Typography variant="subtitle1" fontWeight={700}>Ventas ({report.sales_count ?? sales?.length ?? 0})</Typography>
          {sales?.length ? (
            <CashTable columns={["Venta", "Fecha", "Estado", "Total", "Pagos"]}>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>#{sale.id}</TableCell>
                  <TableCell>{cashDateTime(sale.sold_at ?? sale.created_at)}</TableCell>
                  <TableCell>{sale.status}</TableCell>
                  <TableCell>{cashMoney(sale.total_amount)}</TableCell>
                  <TableCell>{(sale.payments ?? []).map((payment) =>
                    `${payment.method ?? payment.payment_method ?? "Pago"} ${cashMoney(payment.amount)}`,
                  ).join(" · ") || "—"}</TableCell>
                </TableRow>
              ))}
            </CashTable>
          ) : <Typography color="text.secondary">Sin ventas registradas.</Typography>}
        </Stack>
      )}
      <Inventory title="Inventario inicial" snapshot={opening ? inventory : inventory?.opening} />
      {!opening && <Inventory title="Inventario final" snapshot={inventory?.closing} />}
    </Stack>
  );
}

export function CashHistory({ client, path }) {
  const [page, setPage] = useState(1);
  const [id, setId] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const query = id ? `/history/${id}` : `/history?page=${page}`;
  const key = `${path}${query}#${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    client.get(path + query, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch((err) => {
      if (!controller.signal.aborted) setResult({ key, error: cashError(err, "No se pudo cargar el historial de caja.") });
    });
    return () => controller.abort();
  }, [client, key, path, query]);

  const current = result?.key === key ? result : null;
  return (
    <Stack spacing={2}>
      {!id && <Box><Typography variant="h6" fontWeight={800}>Historial de cortes</Typography><Typography variant="body2" color="text.secondary">Consulta las aperturas, los cortes y el reporte de cada sesión.</Typography></Box>}
      {id && <Button sx={{ alignSelf: "start" }} onClick={() => setId(null)}>Volver a los cortes</Button>}
      {!current && <CircularProgress size={24} aria-label="Cargando historial" />}
      {current?.error && <Alert severity="error" action={<Button color="inherit" onClick={() => setAttempt(attempt + 1)}>Reintentar</Button>}>{current.error}</Alert>}
      {current?.data && (id ? (
        <CashReport key={id} client={client} path={path} report={current.data} />
      ) : (
        <>
          {current.data.data?.length ? (
            <><Box sx={{ display: { xs: "none", md: "block" } }}><CashTable columns={["Sesión", "Apertura", "Corte", "Reporte"]}>
              {current.data.data.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>#{session.id}</TableCell>
                  <TableCell>{cashDateTime(session.opened_at)}</TableCell>
                  <TableCell>{session.closed_at ? cashDateTime(session.closed_at) : "Abierta"}</TableCell>
                  <TableCell><Button variant="outlined" onClick={() => setId(session.id)} aria-label={`Ver reporte de caja ${session.id}`}>Ver reporte</Button></TableCell>
                </TableRow>
              ))}
            </CashTable></Box><Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>{current.data.data.map(session => <Paper key={session.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}><Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography fontWeight={800}>Sesión #{session.id}</Typography><Chip size="small" label={session.closed_at ? "Cerrada" : "Abierta"} color={session.closed_at ? "default" : "success"} /></Stack>
              <Box sx={{ bgcolor: "#f7f8fa", borderRadius: 2, p: 1.5 }}><Typography variant="body2" color="text.secondary">Apertura</Typography><Typography fontWeight={700}>{cashDateTime(session.opened_at)}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Corte</Typography><Typography fontWeight={700}>{session.closed_at ? cashDateTime(session.closed_at) : "Aún abierta"}</Typography></Box>
              <Button fullWidth variant="outlined" onClick={() => setId(session.id)} aria-label={`Ver reporte de caja ${session.id}`}>Ver reporte</Button>
            </Stack></Paper>)}</Stack></>
          ) : <Alert severity="info">Todavía no hay sesiones de caja.</Alert>}
          {current.data.last_page > 1 && <Pagination page={page} count={current.data.last_page} onChange={(_, value) => setPage(value)} />}
        </>
      ))}
    </Stack>
  );
}
