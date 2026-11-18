import { useCallback, useEffect, useRef, useState } from "react";
import client from "../../config/axiosClientPOS";
import { canOpenCashWithoutPrompt, canSellWithCash, cashAlreadyCutMessage, cashBlockMessage, cashBusinessDate, cashError, cashPath, downloadCashReport } from "../../utils/cashControl";

export default function useCashStatus(posId) {
  const [result, setResult] = useState(null);
  const [downloads, setDownloads] = useState(null);
  const [lastCut, setLastCut] = useState(null);
  const request = useRef({ version: 0 }).current;
  const refresh = useCallback(async () => {
    if (!posId) return null;
    const id = ++request.version;
    try {
      const { data } = await client.get(cashPath(posId), { timeout: 10000 });
      if (id === request.version) setResult({ posId, status: data });
      return data;
    } catch (error) {
      if (id === request.version) {
        setResult({ posId, error: cashError(error, "No se pudo consultar la caja.") });
      }
      return null;
    }
  }, [posId, request]);

  useEffect(() => {
    void refresh();
    const interval = posId ? setInterval(refresh, 30000) : null;
    window.addEventListener("focus", refresh);
    return () => {
      request.version++;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [posId, refresh, request]);

  const current = result?.posId === posId ? result : null;
  const lastCutDate = lastCut?.posId === posId ? lastCut.date : null;
  const cutToday = current?.status?.cash_control_enabled === true &&
    current.status.session === null && lastCutDate === cashBusinessDate();
  const downloadOpening = useCallback(async (sessionId, formats = ["pdf", "xlsx"]) => {
    setDownloads({ posId, sessionId, pending: true });
    const results = await Promise.allSettled(formats.map((format) =>
      downloadCashReport(client, cashPath(posId), sessionId, format, true),
    ));
    const failed = formats.filter((_, index) => results[index].status === "rejected");
    setDownloads((current) => current?.sessionId === sessionId && current.posId === posId
      ? { posId, sessionId, failed }
      : current);
  }, [posId]);

  const openSession = useCallback(async (payload) => {
    const { data } = await client.post(`${cashPath(posId)}/open`, payload, { timeout: 10000 });
    if (data?.session?.id) void downloadOpening(data.session.id);
    return data;
  }, [downloadOpening, posId]);

  const verifyCheckout = useCallback(async () => {
    const status = await refresh();
    if (!status) return "No se pudo verificar el estado de caja. Intenta de nuevo.";
    if (canSellWithCash(status)) return null;
    if (status.session === null && lastCutDate === cashBusinessDate()) return cashAlreadyCutMessage;
    if (!canOpenCashWithoutPrompt(status)) return cashBlockMessage(status);

    let openingError;
    try {
      await openSession({});
    } catch (error) {
      openingError = error;
    }

    const updated = await refresh();
    if (canSellWithCash(updated)) return null;
    if (openingError) return cashError(openingError, "No se pudo abrir la caja para cobrar.");
    return updated ? cashBlockMessage(updated) : "No se pudo verificar la apertura de caja. Intenta de nuevo.";
  }, [lastCutDate, openSession, refresh]);

  return {
    status: current?.status,
    error: current?.error,
    canSell: canSellWithCash(current?.status),
    canOpenWithoutPrompt: !cutToday && canOpenCashWithoutPrompt(current?.status),
    cutToday,
    recordCut: (session) => setLastCut({ posId, date: session?.business_date?.slice(0, 10) }),
    refresh,
    verifyCheckout,
    openSession,
    downloadOpening,
    downloads: downloads?.posId === posId ? downloads : null,
  };
}
