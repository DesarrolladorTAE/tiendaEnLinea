import { useEffect, useRef, useState } from "react";
import { clearDraft, readDraft, saveDraft } from "./drafts";
import { entity, errorMessage, operationFromError, quoteRejectedBeforeSend, terminal } from "./model";
import { telorecargoPOS } from "./service";

export default function useDurableOrder(posId, funding = false, onConfirmed) {
  const kind = funding ? "funding" : "recharge";
  const [draft, setDraft] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requiresQuote, setRequiresQuote] = useState(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    let alive = true; mounted.current = true;
    readDraft(posId, kind).then((value) => { if (alive) { setDraft(value || null); setRetryUntil(value?.retryUntil || 0); setReady(true); } }).catch((err) => { if (alive) setError(errorMessage(err)); });
    return () => { alive = false; mounted.current = false; };
  }, [posId, kind]);
  useEffect(() => {
    if (!retryUntil) return undefined;
    const timer = setTimeout(() => setRetryUntil(0), Math.max(0, retryUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [retryUntil]);

  async function keep(next) {
    await saveDraft(posId, kind, next);
    if (mounted.current) setDraft(next);
  }
  async function submit(candidate) {
    if (locked.current || !ready) return;
    if (Date.now() < retryUntil) { setError(`Espera hasta ${new Date(retryUntil).toLocaleTimeString("es-MX")} antes de volver a enviar.`); return; }
    locked.current = true; setBusy(true); setError(""); setRequiresQuote(false);
    const original = draft || candidate;
    let persisted = false;
    if (!original) { locked.current = false; setBusy(false); return; }
    try {
      // The durable transaction must commit BEFORE sending money-related POSTs.
      await keep(original);
      persisted = true;
      const response = await (funding ? telorecargoPOS.funding(original) : telorecargoPOS.recharge(original));
      const operation = entity(response);
      const next = { ...original, operation: operation?.id ? operation : original.operation, responseCode: response?.code };
      await keep(next);
      if (terminal(next.operation, funding)) await onConfirmed?.(next.operation);
    } catch (err) {
      if (!funding && !draft && persisted && quoteRejectedBeforeSend(err)) {
        try {
          await clearDraft(posId, kind, original.key);
          if (mounted.current) { setDraft(null); setRequiresQuote(true); setError("La cotización fue rechazada antes de realizar la recarga. Cotiza de nuevo y confirma nuevamente los importes."); }
          return;
        } catch (storageError) { if (mounted.current) setError(errorMessage(storageError)); return; }
      }
      const operation = operationFromError(err);
      if (err.response?.status === 429 && persisted) {
        const header = err.response.headers?.["retry-after"];
        const wait = /^\d+$/.test(String(header)) ? Number(header) * 1000 : Date.parse(header) - Date.now();
        const until = Date.now() + (Number.isFinite(wait) && wait > 0 ? wait : 60000);
        try { await keep({ ...original, ...(operation ? { operation } : {}), retryUntil: until }); if (mounted.current) setRetryUntil(until); }
        catch (storageError) { if (mounted.current) setError(errorMessage(storageError)); }
      }
      if (operation && err.response?.status !== 429) {
        try { await keep({ ...original, operation, responseCode: err.response?.data?.code }); }
        catch (storageError) { if (mounted.current) setError(errorMessage(storageError)); }
      }
      if (mounted.current) setError(`${errorMessage(err)} Conserva este pedido y su clave; no generes otro para el mismo cobro.`);
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  async function updateOperation(operation) {
    if (!draft?.operation?.id || Number(draft.operation.id) !== Number(operation.id)) return;
    await keep({ ...draft, operation });
    if (terminal(operation, funding)) await onConfirmed?.(operation);
  }
  async function refresh() {
    if (!draft?.operation?.id || locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await updateOperation(entity(await (funding ? telorecargoPOS.fundingDetail(draft.operation.id) : telorecargoPOS.detail(draft.operation.id)))); }
    catch (err) { setError(errorMessage(err)); }
    finally { locked.current = false; setBusy(false); }
  }
  async function startNew() {
    if (!draft || !terminal(draft.operation, funding) || locked.current) return;
    setError(""); setBusy(true); locked.current = true;
    try { await clearDraft(posId, kind, draft.key); setDraft(null); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); locked.current = false; }
  }
  return { draft, ready, busy, error, requiresQuote, retryUntil, submit, refresh, updateOperation, startNew };
}
