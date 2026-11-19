import React, { useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import client from "../../config/axiosClientPOS";
import { cashAlreadyCutMessage, cashBlockMessage, cashDateTime, cashError, cashMoney, cashPath, hasCashSchedule, parseCashAmount } from "../../utils/cashControl";
import { CashHistory, CashReport } from "./CashReports";
import { cashPanel } from "./CashDialog";

const actionButton = { minHeight: 44, borderRadius: 2, textTransform: "none", fontWeight: 700 };

export default function PosCashPage({ cash, posId }) {
  const [view, setView] = useState("operation");
  const [entry, setEntry] = useState(null);
  const [report, setReport] = useState(null);
  const [openingReport, setOpeningReport] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const path = cashPath(posId);
  const { status, refresh } = cash;
  const session = status?.session;
  const enabled = status?.cash_control_enabled === true;
  const scheduled = hasCashSchedule(status);
  const optional = !session && status?.opening_amount_required === false;
  const sessionKey = session?.id ?? "opening";
  const amount = entry?.sessionKey === sessionKey ? entry.amount : "";
  const parsed = parseCashAmount(amount);

  const run = async (action) => {
    if (lock.current || !status) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (action === "opening-report") {
        const { data } = await client.get(`${path}/history/${session.id}`);
        setReport({ ...data, inventory: data.inventory?.opening });
        setOpeningReport(true);
      } else {
        const opening = action === "open";
        const payload = opening ? (parsed === null ? {} : { opening_amount: parsed }) : { closing_amount: parsed };
        const data = opening ? await cash.openSession(payload) : (await client.post(`${path}/close`, payload)).data;
        if (!opening) cash.recordCut(data.session?.business_date ? data.session : session);
        setReport(data);
        setOpeningReport(opening);
        setEntry(null);
      }
      setView("report");
    } catch (err) {
      setError(cashError(err, err?.response?.status === 409
        ? "El control de caja está desactivado. La tienda puede activarlo en el admin."
        : "No se pudo completar la operación de caja."));
    } finally {
      if (action !== "opening-report") await refresh();
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ "& .MuiButton-root": actionButton }}>
      <Stack direction={{ xs: "column", sm: "row" }} useFlexGap flexWrap="wrap" gap={1} role="group" aria-label="Secciones de caja"
        sx={{ bgcolor: "#eef2f6", borderRadius: 3, p: 1, "& .MuiButton-contained": { bgcolor: "#263749", boxShadow: "none" }, "& .MuiButton-outlined": { bgcolor: "#fff" } }}>
        <Button startIcon={<AccountBalanceWalletOutlinedIcon />} variant={view === "operation" ? "contained" : "outlined"} aria-pressed={view === "operation"} disabled={busy} onClick={() => setView("operation")}>{session ? "Hacer corte" : "Operación"}</Button>
        {report && <Button startIcon={<ReceiptLongOutlinedIcon />} variant={view === "report" ? "contained" : "outlined"} aria-pressed={view === "report"} disabled={busy} onClick={() => setView("report")}>Último reporte</Button>}
        <Button startIcon={<HistoryOutlinedIcon />} variant={view === "history" ? "contained" : "outlined"} aria-pressed={view === "history"} disabled={busy} onClick={() => setView("history")}>Historial de cortes</Button>
      </Stack>
      {view === "history" && <Paper elevation={0} sx={cashPanel}><CashHistory client={client} path={path} /></Paper>}
      {view === "report" && <Paper elevation={0} sx={cashPanel}><CashReport client={client} path={path} report={report} opening={openingReport} /></Paper>}
      {view === "operation" && (
        <>
          {error && <Alert severity="error">{error}</Alert>}
          {cash.error && <Alert severity="error" action={<Button color="inherit" onClick={refresh}>Reintentar</Button>}>{cash.error}</Alert>}
          {!status && !cash.error && <CircularProgress size={24} aria-label="Consultando caja" />}
          {status && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1.2fr)" }, gap: 2, alignItems: "start" }}>
              <Paper elevation={0} sx={{ ...cashPanel, bgcolor: "#f7fafc", borderColor: "#d9e4ec" }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ bgcolor: "#fff3cc", color: "#785900", p: 1, borderRadius: 2, display: "grid" }}><AccountBalanceWalletOutlinedIcon /></Box>
                    <Typography component="h2" variant="h6" fontWeight={800}>Estado de caja</Typography>
                  </Stack>
                  <Chip sx={{ alignSelf: "start", fontWeight: 700 }} icon={session ? <LockOpenOutlinedIcon /> : <LockOutlinedIcon />} color={session ? "success" : enabled && !cash.cutToday ? "warning" : "default"} label={session ? "Caja abierta" : cash.cutToday ? "Corte realizado" : enabled ? "Caja sin abrir" : "Control desactivado"} />
                  <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                    <ScheduleOutlinedIcon fontSize="small" />
                    <Typography variant="body2">{scheduled ? `Horario de caja ${status.schedule.open.slice(0, 5)}–${status.schedule.close.slice(0, 5)} · Ciudad de México` : "Horario libre"}</Typography>
                  </Stack>
                  {!enabled && <Alert severity="info">El control de caja está desactivado. La tienda administra esta opción.</Alert>}
                  {cash.cutToday && <Alert severity="info">{cashAlreadyCutMessage}</Alert>}
                  {enabled && !cash.canSell && session && <Alert severity="warning">{cashBlockMessage(status)}</Alert>}
                  {session && (
                    <Stack spacing={1}>
                      <Typography variant="body2">Apertura {cashDateTime(session.opened_at)} · Fondo inicial {cashMoney(session.opening_amount)}</Typography>
                      {session.authorized_until && <Typography variant="body2">Tiempo extra hasta {cashDateTime(session.authorized_until)}</Typography>}
                      <Button variant="outlined" startIcon={<Inventory2OutlinedIcon />} sx={{ alignSelf: { sm: "start" } }} disabled={busy} onClick={() => run("opening-report")}>Ver inventario inicial</Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>
              {(session || (enabled && !cash.cutToday)) && (
                <Stack spacing={2} sx={{ ...cashPanel, bgcolor: "background.paper" }} component="form" key={sessionKey} onSubmit={(event) => {
                  event.preventDefault();
                  if (parsed !== null || (optional && !amount.trim())) void run(session ? "close" : "open");
                }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ bgcolor: session ? "#fff3cc" : "#e0f4ea", color: session ? "#785900" : "#146447", p: 1, borderRadius: 2, display: "grid" }}>
                      {session ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />}
                    </Box>
                    <Typography component="h2" variant="h6" fontWeight={800}>{session ? "Cerrar caja" : "Apertura de caja"}</Typography>
                  </Stack>
                  {optional && <Typography variant="body2" color="text.secondary">Puedes iniciar la caja con $0 antes de vender.</Typography>}
                  {session && <Alert severity="warning">Al confirmar el corte, se guardará el inventario final y se bloquearán las ventas. {scheduled ? "Podrás abrir la caja de nuevo el siguiente día." : "Puedes volver a abrir la caja hoy para seguir vendiendo."}</Alert>}
                  <TextField
                    label={session ? "Efectivo contado (MXN)" : "Fondo inicial (MXN)"}
                    value={amount}
                    onChange={(event) => setEntry({ sessionKey, amount: event.target.value })}
                    inputProps={{ inputMode: "decimal" }}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    required={!optional}
                    disabled={busy}
                    error={Boolean(amount.trim()) && parsed === null}
                    helperText={amount.trim() && parsed === null ? "Ingresa un importe no negativo con hasta dos decimales." : undefined}
                  />
                  <Button sx={{ alignSelf: { sm: "start" } }} type="submit" variant="contained" color={session ? "warning" : "success"} startIcon={session ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />} disabled={busy || (parsed === null && (!optional || Boolean(amount.trim())))}>
                    {busy ? "Guardando…" : session ? "Confirmar corte" : optional && !amount.trim() ? "Iniciar sin fondo" : "Abrir caja"}
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
