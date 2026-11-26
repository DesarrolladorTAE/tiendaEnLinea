import { useEffect, useRef, useState } from "react";

export function setupError(error, fallback) {
  const data = error?.response?.data;
  const fields = Object.fromEntries(Object.entries(data?.errors ?? {}).map(
    ([field, messages]) => [field, Array.isArray(messages) ? messages[0] : messages],
  ));
  return { message: data?.message || fallback, fields };
}

export function snapshotChanged(previous, current) {
  const byKey = (_, value) => value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]))
    : value;
  return JSON.stringify(previous, byKey) !== JSON.stringify(current, byKey);
}

export function useServiceSetupEditor(read, toDraft) {
  const snapshot = useRef();
  const locked = useRef(false);
  const pendingCheck = useRef();
  const [draft, setDraft] = useState(null);
  const [load, setLoad] = useState({ loading: true });
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoad({ loading: true });
    read(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      snapshot.current = data;
      setDraft(toDraft(data));
      setLoad({ loading: false });
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setLoad({ loading: false, ...setupError(error, "No se pudo cargar la configuración."), status: error.response?.status });
      }
    });
    return () => {
      controller.abort();
      pendingCheck.current?.abort();
    };
  }, [read, toDraft, revision]);

  async function save({ validate, write, checkLatest = false }) {
    if (locked.current || load.loading || load.message || draft === null) return;
    const fields = validate(draft);
    if (Object.keys(fields).length) {
      setFeedback({ fields, message: "Revisa los campos señalados antes de guardar." });
      return;
    }
    locked.current = true;
    setSaving(true);
    setFeedback(null);
    const controller = new AbortController();
    pendingCheck.current = controller;
    try {
      if (checkLatest) {
        const latest = await read(controller.signal);
        if (controller.signal.aborted) return;
        if (snapshotChanged(snapshot.current, latest)) {
          setFeedback({ message: "La configuración cambió desde que la abriste. Recarga los datos antes de volver a guardar." });
          return;
        }
      }
      const data = await write(draft);
      if (controller.signal.aborted) return;
      snapshot.current = data;
      setDraft(toDraft(data));
      setFeedback({ success: true, message: "Cambios guardados." });
    } catch (error) {
      if (!controller.signal.aborted) setFeedback(setupError(error, "No se pudo guardar la configuración."));
    } finally {
      locked.current = false;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  const reload = () => {
    setFeedback(null);
    setRevision((value) => value + 1);
  };
  return { draft, setDraft, load, feedback, saving, save, reload };
}
