import RechargeFields from "./RechargeFields";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography, useMediaQuery } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { customerPhone } from "./checkout";
import TelorecargoLogo from "../../components/TelorecargoLogo";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import FundingInstructions, { FundingSchedule } from "./FundingInstructions";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { telorecargoPOS, downloadRechargeTicket } from "./service";
import { catalogPage, cents, complete, decimal, entity, errorMessage, fundingBody, money, newKey, rechargeBody, terminal } from "./model";
import HistoryPanel, { OperationStatus } from "./HistoryPanel";
import useDurableOrder from "./useDurableOrder";
import { ModuleHeader, CarrierBadge, CompanySelector } from "./presentation";
import { companyList, companyForProduct, companyPriority, retryAfterTime } from "./companies";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddCardOutlinedIcon from "@mui/icons-material/AddCardOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

const methods = { efectivo: "Efectivo", td: "Tarjeta de débito", tc: "Tarjeta de crédito", transferencia: "Transferencia" };
const panel = { p: { xs: 2, md: 3 }, borderRadius: 3, minWidth: 0 };

export default function POSTelorecargo({ posLocationId, onBack }) {
  const [tab, setTab] = useState(0);
  const [state, setState] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");
  const [balanceError, setBalanceError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [catalog, setCatalog] = useState(null);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companiesBusy, setCompaniesBusy] = useState(false);
  const [companiesReady, setCompaniesReady] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [companiesVersion, setCompaniesVersion] = useState(0);
  const [companiesRetryAt, setCompaniesRetryAt] = useState(0);
  const [carrierFilter, setCarrierFilter] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [product, setProduct] = useState(null);
  const [quote, setQuote] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const mobileCheckout = useMediaQuery("(max-width:599px)");
  const [phone, setPhone] = useState("");
  const [confirmPhone, setConfirmPhone] = useState("");
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectionError, setSelectionError] = useState("");
  const [worker, setWorker] = useState("");
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([{ method: "efectivo", amount: "", referencia: "", ultimos_4: "" }]);
  const [cashReceived, setCashReceived] = useState("");
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [file, setFile] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const fileInput = useRef(null);
  const balanceLock = useRef(false);
  const actionLock = useRef(false);
  const initialCompanyChoice = useRef(false);

  async function refreshBalance() {
    if (balanceLock.current) return;
    balanceLock.current = true; setBalanceError("");
    try { setBalance(entity(await telorecargoPOS.balance())); }
    catch (err) { setBalance(null); setBalanceError(errorMessage(err)); }
    finally { balanceLock.current = false; }
  }
  async function loadState() {
    setBusy(true); setError("");
    try { const value = entity(await telorecargoPOS.state()); setState(value); if (value.configured) await refreshBalance(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  function operationConfirmed(operation) {
    setRevision((value) => value + 1);
    if (complete(operation) || operation.status === "confirmado") void refreshBalance();
  }
  const order = useDurableOrder(posLocationId, false, operationConfirmed);
  const deposit = useDurableOrder(posLocationId, true, operationConfirmed);
  useEffect(() => { if (order.requiresQuote) setQuote(null); }, [order.requiresQuote]);
  useEffect(() => { void loadState(); }, []);
  useEffect(() => {
    if (!state?.configured) return undefined;
    let alive = true; setCompaniesBusy(true); setCompaniesError("");
    telorecargoPOS.companies().then((response) => {
      if (!alive) return;
      const rows = companyList(response); setCompanies(rows);
      if (!initialCompanyChoice.current) {
        initialCompanyChoice.current = true;
        if (rows[0] && companyPriority(rows[0]) < 3) setCarrierFilter(String(rows[0].id));
      }
    }).catch((err) => {
      if (alive) { setCompaniesError(errorMessage(err)); setCompaniesRetryAt(retryAfterTime(err)); }
    }).finally(() => { if (alive) { setCompaniesBusy(false); setCompaniesReady(true); } });
    return () => { alive = false; };
  }, [state?.configured, companiesVersion]);
  useEffect(() => {
    if (!companiesRetryAt) return undefined;
    const timer = setTimeout(() => setCompaniesRetryAt(0), Math.max(0, companiesRetryAt - Date.now()));
    return () => clearTimeout(timer);
  }, [companiesRetryAt]);
  useEffect(() => {
    if (!state?.configured || !companiesReady || tab !== 0) return undefined;
    let alive = true; setCatalogBusy(true); setCatalogError(""); setCatalog(null);
    telorecargoPOS.products({ page: productPage, per_page: 20, ...(carrierFilter ? { carrier_id: carrierFilter } : {}) }).then((response) => { if (alive) setCatalog(catalogPage(response)); }).catch((err) => { if (alive) setCatalogError(errorMessage(err)); }).finally(() => { if (alive) setCatalogBusy(false); });
    return () => { alive = false; };
  }, [state?.configured, companiesReady, tab, productPage, carrierFilter, catalogVersion]);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([telorecargoPOS.workers(posLocationId), telorecargoPOS.customers(posLocationId)]).then(([workerResult, customerResult]) => {
      if (!alive) return;
      const list = (value) => { const data = entity(value); return Array.isArray(data) ? data : []; };
      if (workerResult.status === "fulfilled") setWorkers(list(workerResult.value));
      if (customerResult.status === "fulfilled") setCustomers(list(customerResult.value));
      if (workerResult.status === "rejected" || customerResult.status === "rejected") setSelectionError("No se pudo cargar algún selector de vendedor o cliente. Puedes continuar sin asignarlo; no se enviará un ID manual.");
    });
    return () => { alive = false; };
  }, [posLocationId]);

  function chooseCompany(value) {
    initialCompanyChoice.current = true;
    setCarrierFilter(value); setProductPage(1); setProduct(null); setQuote(null);
    setCatalog(null); setCatalogVersion((current) => current + 1);
    setPhone(""); setConfirmPhone(""); setCustomer(null); setError(""); setCheckoutOpen(true);
  }
  function chooseCustomer(value) {
    setCustomer(value);
    setPhone(customerPhone(value)); setConfirmPhone("");
  }
  async function getQuote(selectedProduct = product) {
    if (!selectedProduct || actionLock.current) return;
    actionLock.current = true; setBusy(true); setError(""); setQuote(null);
    try {
      const value = entity(await telorecargoPOS.quote(String(selectedProduct.Codigo))); setQuote(value);
      setPayments([{ method: "efectivo", amount: String(value.total_cobrar), referencia: "", ultimos_4: "" }]); setCashReceived("");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); actionLock.current = false; }
  }
  function prepareRecharge(event) {
    event.preventDefault(); setError("");
    try {
      if (phone !== confirmPhone) throw new Error("Los números de teléfono no coinciden.");
      const body = rechargeBody(quote, phone, payments, worker, customer?.id);
      const appliedCash = body.pagos.filter((payment) => payment.method === "efectivo").reduce((sum, payment) => sum + cents(payment.amount), 0);
      if (cashReceived && cents(cashReceived) < appliedCash) throw new Error("El efectivo recibido no puede ser menor al efectivo aplicado.");
      setConfirmation({ funding: false, draft: { key: newKey(), body, summary: { ...quote }, createdAt: new Date().toISOString() } });
    } catch (err) { setError(errorMessage(err)); }
  }
  function prepareDeposit(event) {
    event.preventDefault(); setError("");
    try { const body = fundingBody(amount, bankReference, file); setConfirmation({ funding: true, draft: { key: newKey(true), body, file, fileName: file.name, createdAt: new Date().toISOString() } }); }
    catch (err) { setError(errorMessage(err)); }
  }
  async function sendConfirmed() {
    if (!confirmation || actionLock.current) return;
    actionLock.current = true;
    try {
      if (!confirmation.funding && Date.parse(confirmation.draft.summary.expires_at) <= Date.now()) throw new Error("La cotización venció antes de enviar. Cotiza otra vez y confirma el nuevo total.");
      const pending = confirmation; setConfirmation(null);
      if (!pending.funding) setCheckoutOpen(false);
      await (pending.funding ? deposit : order).submit(pending.draft);
      if (pending.funding) { setFile(null); if (fileInput.current) fileInput.current.value = ""; }
    } catch (err) { setError(errorMessage(err)); setConfirmation(null); }
    finally { actionLock.current = false; }
  }
  function updatePayment(index, key, value) { setPayments((current) => current.map((payment, position) => position === index ? { ...payment, [key]: value } : payment)); }
  const change = (() => { try { const cash = payments.filter((payment) => payment.method === "efectivo").reduce((sum, payment) => sum + cents(payment.amount || "0"), 0); return cashReceived ? money(decimal(Math.max(0, cents(cashReceived) - cash))) : "—"; } catch { return "—"; } })();
  const summary = (value) => <Box className="trc-charge-summary">{[["Recarga al teléfono", value.importe_recarga], ["Comisión", value.comision], ["Total a cobrar", value.total_cobrar]].map(([label, amount]) => <Box key={label}><Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Typography variant="caption">{label}</Typography><Typography variant="h6" fontWeight={850}>{money(amount)}</Typography></Paper></Box>)}</Box>;
  const savedOrder = (hook, funding = false) => hook.draft && <Paper variant="outlined" sx={panel}><Stack spacing={2}>
    <Typography variant="h6" fontWeight={850}>{funding ? "Solicitud guardada" : "Pedido guardado"}</Typography><OperationStatus operation={hook.draft.operation} />
    <Typography>{funding ? "Referencia bancaria" : "Teléfono"}: {hook.draft.body.referencia}</Typography>
    {funding ? <Typography>Abono solicitado: {money(hook.draft.body.monto)} · {hook.draft.fileName}</Typography> : <>{summary(hook.draft.summary)}{hook.draft.body.pagos.map((payment, index) => <Typography key={index} variant="body2">{methods[payment.method]}: {money(payment.amount)}</Typography>)}</>}
    <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>Pedido: {hook.draft.key}</Typography>
    {hook.retryUntil > Date.now() && <Typography variant="caption">Espera hasta {new Date(hook.retryUntil).toLocaleTimeString("es-MX")} para volver a enviar este pedido.</Typography>}
    {complete(hook.draft.operation) ? <Alert severity="success">Recarga confirmada y venta #{hook.draft.operation.sale_id} registrada.</Alert> : hook.draft.operation?.status === "rechazada" ? <Alert severity="error">{funding ? "Solicitud rechazada. Revisa el depósito con administración y el proveedor." : "Rechazo definitivo. Si ya recibiste dinero, solicita a la tienda resolver su devolución."}</Alert> : funding && hook.draft.operation?.status === "pendiente" ? <Alert severity="info">Solicitud enviada. El saldo aún no está acreditado. No crees otra solicitud para el mismo depósito.</Alert> : funding && hook.draft.operation?.status === "confirmado" ? <Alert severity="success">El proveedor aprobó la solicitud de saldo.</Alert> : <Alert severity="warning">El resultado aún no está finalizado. Conserva este pedido. Repetirlo mantiene los mismos datos y la misma clave; no crees otro para este cobro.</Alert>}
    <Stack direction="row" gap={1} flexWrap="wrap">
      {!terminal(hook.draft.operation, funding) && <Button variant="contained" disabled={hook.busy || Date.now() < hook.retryUntil} onClick={() => hook.submit()}>Reintentar el mismo pedido</Button>}
      {hook.draft.operation?.id && <Button disabled={hook.busy} onClick={hook.refresh}>Consultar estado / recuperar</Button>}
      {!funding && complete(hook.draft.operation) && <Button disabled={hook.busy} onClick={async () => { try { await downloadRechargeTicket(hook.draft.operation.id); } catch (err) { setError(errorMessage(err)); } }}>Ticket PDF</Button>}
      {terminal(hook.draft.operation, funding) && <Button disabled={hook.busy} onClick={async () => { await hook.startNew(); if (!funding) { setQuote(null); setPhone(""); } }}>Iniciar {funding ? "otra solicitud" : "otra recarga"}</Button>}
    </Stack>
  </Stack></Paper>;

  return <Box className="trc-module"><Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 0, sm: 2, md: 3 } }}><Stack spacing={3}>
    <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} sx={{ alignSelf: "flex-start" }}>Volver al menú POS</Button>
    <ModuleHeader mode="pos" title="Recargas Telorecargo" description="Recargas móviles, saldo y comprobantes en un solo espacio." icon={TelorecargoLogo} status={`POS #${posLocationId}`} statusColor="primary" />
    {error && <Alert severity="error">{error}</Alert>}{balanceError && <Alert severity="warning">{balanceError}</Alert>}
    {[error, balanceError, order.error, deposit.error].some((value) => value.includes("La sesión venció")) && <Button component="a" href="/prueba/pos">Volver al inicio de sesión POS</Button>}
    {state === null && <Button disabled={busy} onClick={loadState}>{busy ? "Consultando integración…" : "Reintentar conexión"}</Button>}
    {state && !state.configured && <Alert severity="warning" action={<Button disabled={busy} onClick={loadState}>Actualizar</Button>}>La tienda debe configurar Telorecargo. La clave externa se administra únicamente desde el panel de la tienda.</Alert>}
    {state?.configured && <Paper className="trc-balance" variant="outlined" sx={panel}><Stack direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between" alignItems={{ sm: "center" }}><Box><Stack direction="row" alignItems="center" gap={1} sx={{ mb: .5 }}><AccountBalanceWalletOutlinedIcon fontSize="small" /><Typography variant="body2">Saldo compartido de la tienda</Typography></Stack><Typography variant="h4" fontWeight={850}>{balance ? money(balance.saldo) : "Sin consultar"}</Typography><Typography className="trc-balance-caption" variant="caption">Comisión actual: {money(state.comision)} · El saldo puede cambiar por otros POS.</Typography></Box><Button disabled={busy} onClick={async () => { setBusy(true); try { await refreshBalance(); } finally { setBusy(false); } }}>Actualizar saldo</Button></Stack></Paper>}
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto"><Tab icon={<PhoneAndroidRoundedIcon fontSize="small" />} iconPosition="start" label="Vender recarga" /><Tab icon={<AddCardOutlinedIcon fontSize="small" />} iconPosition="start" label="Solicitar saldo" /><Tab icon={<HistoryOutlinedIcon fontSize="small" />} iconPosition="start" label="Historial de recargas" /><Tab icon={<ReceiptLongOutlinedIcon fontSize="small" />} iconPosition="start" label="Solicitudes de saldo" /></Tabs>
    {tab === 0 && <>
      {order.error && <Alert severity="error">{order.error}</Alert>}{!order.ready && <Alert severity="info">Preparando recuperación del pedido guardado. No se enviarán recargas hasta terminar.</Alert>}
      {savedOrder(order)}
      {!order.draft && order.ready && state?.configured && <Paper variant="outlined" sx={panel}>
        <Stack spacing={2}>
          {companiesBusy && <Typography role="status">Cargando compañías y logotipos…</Typography>}
          {companiesError && <Alert severity="warning">{companiesError}</Alert>}
          {!companiesBusy && !companiesError && !companies.length && <Typography>No hay compañías disponibles.</Typography>}
          {companiesRetryAt > Date.now() && <Typography variant="caption">Puedes actualizar las compañías después de las {new Date(companiesRetryAt).toLocaleTimeString("es-MX")}.</Typography>}
          <CompanySelector companies={companies} value={carrierFilter} disabled={busy || catalogBusy || companiesBusy || Date.now() < companiesRetryAt} onChange={chooseCompany} />
          <Button disabled={companiesBusy || Date.now() < companiesRetryAt} onClick={() => setCompaniesVersion((value) => value + 1)} sx={{ alignSelf: "flex-start" }}>Actualizar compañías</Button>
        </Stack>
      </Paper>}
      {!order.draft && order.ready && state?.configured && <Dialog open={checkoutOpen} onClose={busy || order.busy || confirmation ? undefined : () => setCheckoutOpen(false)} fullWidth maxWidth="lg" fullScreen={mobileCheckout} aria-labelledby="trc-checkout-title" className="trc-checkout-dialog" PaperProps={{ className: "trc-module trc-checkout-paper" }}><DialogTitle component="div" id="trc-checkout-title" className="trc-checkout-heading"><Box><Typography component="span" className="trc-eyebrow">RECARGA MÓVIL</Typography><Typography component="h2" variant="h5" fontWeight={850}>Recarga a {companies.find((company) => String(company.id) === carrierFilter)?.Nombre || "tu compañía"}</Typography></Box><Stack direction="row" alignItems="center" gap={1}><CarrierBadge company={companies.find((company) => String(company.id) === carrierFilter)} /><IconButton aria-label="Cerrar recarga" disabled={busy || order.busy || Boolean(confirmation)} onClick={() => setCheckoutOpen(false)}><CloseRoundedIcon /></IconButton></Stack></DialogTitle><DialogContent dividers><Stack spacing={2.5}>{error && <Alert severity="error" role="alert">{error}</Alert>}<Stack component="form" id="trc-recharge-form" onSubmit={prepareRecharge} spacing={2.5}><RechargeFields catalog={catalog} catalogBusy={catalogBusy} catalogError={catalogError} busy={busy} product={product} onProduct={(row) => { if (row) { setProduct(row); void getQuote(row); } }} page={productPage} onPage={setProductPage} onRefresh={() => setCatalogVersion((value) => value + 1)} onQuote={() => getQuote()} quote={quote} customers={customers} customer={customer} onCustomer={chooseCustomer} phone={phone} onPhone={(value) => { setPhone(value); setConfirmPhone(""); }} confirmPhone={confirmPhone} onConfirmPhone={setConfirmPhone} />
        {selectionError && <Alert severity="info">{selectionError}</Alert>}
        <TextField select label="Vendedor (opcional)" value={worker} onChange={(event) => setWorker(event.target.value)}><MenuItem value="">Sin asignar</MenuItem>{workers.filter((row) => row.is_active !== false && row.is_active !== 0).map((row) => <MenuItem value={row.id} key={row.id}>{row.name || row.nombre}</MenuItem>)}</TextField>
        <Typography fontWeight={800}>Pagos aplicados</Typography><Typography variant="caption">Estos datos registran el cobro; no ejecutan cargos bancarios. La recarga y la comisión se cobran en una sola venta.</Typography>
        {payments.map((payment, index) => <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}><Stack spacing={1.5}><Stack direction={{ xs: "column", sm: "row" }} gap={1.5}><TextField select fullWidth label="Medio" value={payment.method} onChange={(event) => updatePayment(index, "method", event.target.value)}>{Object.entries(methods).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField><TextField fullWidth required label="Importe aplicado" value={payment.amount} inputProps={{ inputMode: "decimal" }} onChange={(event) => updatePayment(index, "amount", event.target.value)} /></Stack>{payment.method !== "efectivo" && <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}><TextField fullWidth required label="Referencia del cobro" value={payment.referencia} onChange={(event) => updatePayment(index, "referencia", event.target.value)} /><TextField required label="Últimos 4 dígitos" value={payment.ultimos_4} inputProps={{ pattern: "[0-9]{4}", maxLength: 4, inputMode: "numeric" }} onChange={(event) => updatePayment(index, "ultimos_4", event.target.value)} /></Stack>}{payments.length > 1 && <Button color="error" onClick={() => setPayments((current) => current.filter((_, position) => position !== index))}>Quitar pago</Button>}</Stack></Paper>)}
        <Button disabled={payments.length >= 10} onClick={() => setPayments((current) => [...current, { method: "efectivo", amount: "", referencia: "", ultimos_4: "" }])}>Agregar medio de pago</Button>
        {payments.some((payment) => payment.method === "efectivo") && <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }}><TextField label="Efectivo recibido (opcional)" value={cashReceived} inputProps={{ inputMode: "decimal" }} onChange={(event) => setCashReceived(event.target.value)} /><Typography>Cambio: {change}</Typography></Stack>}
</Stack></Stack></DialogContent><DialogActions className="trc-checkout-actions"><Typography variant="caption">Revisa tus datos antes de enviar.</Typography><Box><Button disabled={busy || order.busy} onClick={() => setCheckoutOpen(false)} variant="outlined">Cancelar</Button><Button type="submit" form="trc-recharge-form" variant="contained" size="large" disabled={!quote || busy || order.busy || !/^\d{10}$/.test(phone) || phone !== confirmPhone}>Revisar y enviar recarga</Button></Box></DialogActions></Dialog>}
    </>}
    {tab === 1 && <>
      {deposit.error && <Alert severity="error">{deposit.error}</Alert>}{!deposit.ready && <Alert severity="info">Recuperando la solicitud guardada…</Alert>}
      {savedOrder(deposit, true)}
      {!deposit.draft && deposit.ready && state?.configured && <Box className="trc-funding-layout"><FundingInstructions telorecargoUserId={balance?.telorecargo_user_id ?? state?.telorecargo_user_id} /><Paper variant="outlined" sx={panel}><Stack component="form" spacing={2} onSubmit={prepareDeposit}><Typography component="h2" variant="h6" fontWeight={850}>Solicitar abono de saldo</Typography><FundingSchedule /><Alert severity="info">Adjuntar el comprobante no acredita saldo, no crea una venta ni registra una salida de caja. La aprobación depende del proveedor.</Alert><TextField required label="Monto del depósito (MXN)" value={amount} onChange={(event) => setAmount(event.target.value)} inputProps={{ inputMode: "decimal" }} /><TextField required fullWidth label="Referencia bancaria" value={bankReference} onChange={(event) => setBankReference(event.target.value)} helperText="Captura la referencia o clave de rastreo de tu comprobante." inputProps={{ maxLength: 100 }} /><Button component="label" variant="outlined">{file ? file.name : "Adjuntar comprobante JPG, PNG o PDF (máximo 2 MB)"}<input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /></Button><Button type="submit" variant="contained" disabled={!file || !bankReference.trim() || deposit.busy}>Revisar solicitud de saldo</Button></Stack></Paper></Box>}
    </>}
    {tab === 2 && <HistoryPanel revision={revision} onOperation={async (operation) => { await order.updateOperation(operation); }} />}
    {tab === 3 && <HistoryPanel funding revision={revision} onOperation={async (operation) => { await deposit.updateOperation(operation); if (operation.status === "confirmado") void refreshBalance(); }} />}
    <Dialog open={Boolean(confirmation)} onClose={() => setConfirmation(null)} fullWidth maxWidth="sm" fullScreen={mobileCheckout} PaperProps={{ className: "trc-module trc-confirm-paper" }}><DialogTitle>{confirmation?.funding ? "Confirmar solicitud de saldo" : "Confirmar recarga y registrar cobro"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {confirmation?.funding ? <><Typography>Abono solicitado: {money(confirmation.draft.body.monto)}</Typography><Typography>Referencia bancaria: {confirmation.draft.body.referencia}</Typography><Typography>Comprobante: {confirmation.draft.fileName}</Typography><Alert severity="info">Se enviará para revisión; no es una acreditación inmediata.</Alert></> : confirmation && <><Typography variant="h5" fontWeight={850}>Teléfono: {confirmation.draft.body.referencia}</Typography><Typography>{confirmation.draft.summary.nombre}</Typography>{summary(confirmation.draft.summary)}<Divider />{confirmation.draft.body.pagos.map((payment, index) => <Typography key={index}>{methods[payment.method]}: {money(payment.amount)}</Typography>)}<Alert severity="warning">Verifica el teléfono y que el cobro real corresponda a estos pagos. La recarga no tiene reversión desde este sistema y su ticket no es un CFDI.</Alert></>}
    </Stack></DialogContent><DialogActions><Button onClick={() => setConfirmation(null)}>Volver a revisar</Button><Button variant="contained" onClick={sendConfirmed}>Confirmar y enviar</Button></DialogActions></Dialog>
  </Stack></Container></Box>;
}
