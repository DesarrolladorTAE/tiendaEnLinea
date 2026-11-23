// IndexedDB retains the exact receipt Blob as well as the original POST body.
// Never store an external Telorecargo credential here.
let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open("mtelmx-telorecargo", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(new Error("No se pudo abrir el almacenamiento de pedidos. Habilita el almacenamiento antes de enviar.")); };
    request.onblocked = () => { database = null; reject(new Error("Cierra otras pestañas para habilitar el almacenamiento de pedidos.")); };
  });
  return database;
}
async function transact(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", mode);
    const request = action(tx.objectStore("drafts"));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = tx.onabort = () => reject(new Error("No se pudo guardar el pedido. No envíes una operación nueva mientras exista un intento pendiente."));
  });
}
const keyFor = (posId, kind) => {
  if (!Number.isInteger(Number(posId)) || Number(posId) <= 0) throw new Error("No se pudo identificar el POS para recuperar sus pedidos.");
  return `${posId}:${kind}`;
};
export const readDraft = (posId, kind) => transact("readonly", (store) => store.get(keyFor(posId, kind)));
export async function saveDraft(posId, kind, draft) {
  // A second tab must not overwrite an unresolved order with a different key.
  const db = await openDatabase();
  const key = keyFor(posId, kind);
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    const store = tx.objectStore("drafts");
    const request = store.get(key);
    let conflict = false;
    request.onsuccess = () => {
      if (request.result && request.result.key !== draft.key) { conflict = true; tx.abort(); }
      else store.put(draft, key);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(new Error(conflict ? "Existe otro pedido guardado en este POS. Recarga el módulo para recuperarlo antes de enviar." : "No se pudo guardar el pedido. No se envió una nueva operación."));
  });
}
export async function clearDraft(posId, kind, expectedKey) {
  const db = await openDatabase(); const key = keyFor(posId, kind);
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite"); const store = tx.objectStore("drafts"); const request = store.get(key);
    request.onsuccess = () => { if (request.result?.key === expectedKey) store.delete(key); else tx.abort(); };
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(new Error("El pedido guardado cambió en otra pestaña. Recupera el estado antes de continuar."));
  });
}
