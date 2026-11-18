import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Chip, CircularProgress, FormControlLabel, Stack, Switch, TextField, Typography,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import client from "../../config/axiosClient";
import { cashDateTime, cashError, cashPath, cashTimeZone } from "../../utils/cashControl";
import { CashHistory } from "./CashReports";
import CashDialog, { cashPanel } from "./CashDialog";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminCashDialog({ pos, onClose }) {
  const [history, setHistory] = useState(false);
  const [status, setStatus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [until, setUntil] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const path = cashPath(pos.id);
  const load = useCallback(async (signal) => {
    try {
      const { data } = await client.get(path, { signal });
      if (signal?.aborted) return;
      setStatus(data);
      setSettings({
        cash_control_enabled: data.cash_control_enabled === true,
        cash_opening_amount_required: data.opening_amount_required === true,
        cash_open_time: data.schedule?.open?.slice(0, 5) ?? "",
        cash_close_time: data.schedule?.close?.slice(0, 5) ?? "",
      });
    } catch (err) {
      if (!signal?.aborted) setError(cashError(err, "No se pudo consultar la caja."));
    }
  }, [path]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const set = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async (event, extend) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (!extend && Boolean(settings.cash_open_time) !== Boolean(settings.cash_close_time)) {
      setError("Indica ambas horas o deja ambas vacías para usar horario libre.");
      return;
    }
    setBusy(true);
    try {
      if (extend) {
        const date = dayjs.tz(until, cashTimeZone);
        if (!date.isValid() || date.valueOf() <= Date.now()) {
          setError("Indica una fecha y hora futuras en Ciudad de México.");
          return;
        }
        await client.post(`${path}/extend`, { authorized_until: date.format("YYYY-MM-DDTHH:mm:ssZ") });
        setNotice("Tiempo extra autorizado.");
      } else {
        await client.put(`${path}/schedule`, {
          ...settings,
          cash_open_time: settings.cash_open_time || null,
          cash_close_time: settings.cash_close_time || null,
        });
        setNotice("Configuración guardada.");
      }
      await load();
    } catch (err) {
      setError(cashError(err, "No se pudieron guardar los cambios de caja."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <CashDialog titleId="admin-cash-title" posName={pos.name || pos.code} busy={busy} onClose={onClose}>
      <Stack spacing={2.5}>
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} role="group" aria-label="Secciones de caja">
          <Button variant={history ? "outlined" : "contained"} aria-pressed={!history} disabled={busy} onClick={() => setHistory(false)}>Configuración</Button>
          <Button variant={history ? "contained" : "outlined"} aria-pressed={history} disabled={busy} onClick={() => setHistory(true)}>Historial de cortes</Button>
        </Stack>
        {history ? <CashHistory client={client} path={path} /> : (
          <>
            {error && <Alert severity="error" action={!settings && <Button color="inherit" onClick={() => { setError(""); void load(); }}>Reintentar</Button>}>{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            {!settings && !error && <CircularProgress size={24} aria-label="Cargando configuración" />}
            {settings && (
              <>
                <Stack spacing={1.5} sx={cashPanel} component="form" onSubmit={(event) => save(event, false)}>
                  <FormControlLabel label="Activar control de caja" control={<Switch checked={settings.cash_control_enabled} disabled={busy} onChange={(_, checked) => set("cash_control_enabled", checked)} />} />
                  <FormControlLabel label="Pedir fondo inicial antes de cobrar" control={<Switch checked={settings.cash_opening_amount_required} disabled={busy || !settings.cash_control_enabled} onChange={(_, checked) => set("cash_opening_amount_required", checked)} />} />
                  <Typography variant="body2" color="text.secondary">
                    {!settings.cash_control_enabled
                      ? "El POS puede cobrar sin abrir caja."
                      : settings.cash_opening_amount_required
                        ? "El operador declara el fondo y abre la caja antes de cobrar."
                        : "La caja se abre automáticamente con fondo de $0 al cobrar por primera vez."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Horario de Ciudad de México. Deja ambas horas vacías para usar horario libre.</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField label="Hora de apertura" type="time" value={settings.cash_open_time} onChange={(event) => set("cash_open_time", event.target.value)} InputLabelProps={{ shrink: true }} disabled={busy} />
                    <TextField label="Hora de cierre" type="time" value={settings.cash_close_time} onChange={(event) => set("cash_close_time", event.target.value)} InputLabelProps={{ shrink: true }} disabled={busy} />
                  </Stack>
                  <Button variant="contained" type="submit" disabled={busy} sx={{ alignSelf: "start" }}>Guardar configuración</Button>
                </Stack>
                <Stack spacing={1.5} sx={cashPanel} component="form" onSubmit={(event) => save(event, true)}>
                  <Typography variant="h6">Tiempo extra</Typography>
                  <Chip sx={{ alignSelf: "start" }} label={status.session ? `Caja abierta #${status.session.id}` : "Sin sesión de caja abierta"} />
                  {status.session?.authorized_until && <Typography variant="body2">Autorizado hasta {cashDateTime(status.session.authorized_until)}</Typography>}
                  {status.cash_control_enabled && status.session && (
                    <>
                      <TextField type="datetime-local" label="Autorizar hasta (Ciudad de México)" value={until} onChange={(event) => setUntil(event.target.value)} InputLabelProps={{ shrink: true }} required disabled={busy} />
                      <Button type="submit" variant="outlined" disabled={busy || !until} sx={{ alignSelf: "start" }}>Autorizar tiempo extra</Button>
                    </>
                  )}
                </Stack>
              </>
            )}
          </>
        )}
      </Stack>
    </CashDialog>
  );
}
