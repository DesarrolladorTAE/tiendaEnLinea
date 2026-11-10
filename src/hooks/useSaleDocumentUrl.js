import { useEffect, useState } from "react";
import { saleDocumentPath } from "../utils/saleDocument";

export default function useSaleDocumentUrl(client, open, saleId) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setUrl("");
    setError("");
    if (!open || !saleId) return;
    let active = true;
    let objectUrl;
    client.get(saleDocumentPath(saleId), { responseType: "blob" }).then(({ data }) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      setUrl(objectUrl);
    }).catch(() => { if (active) setError("No se pudo cargar el documento de la venta."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [client, open, saleId]);
  return { url, error };
}
