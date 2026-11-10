const enabled = value => [true, 1, "1", "true"].includes(value);

export const documentPhone = value => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
};

// The default routes resolve the POS belonging to the sale on the server.
export const saleDocumentPath = (saleId, output = "pdf") =>
  `/sales/${saleId}/documents/default/${output}`;

export function normalizeDocumentSetting(response) {
  if (!response) return null;
  const data = response.data ?? response;
  const documents = response.document_settings ?? data.document_settings;
  const action = response.document_action ?? data.document_action;
  if (!documents && !action) return data;
  const type = action?.document_type ?? documents?.document_type ?? "ticket";
  const delivery = action?.delivery_method ?? documents?.delivery_method ?? "print";
  const thermal = type === "ticket" && delivery === "print";
  return {
    ...data,
    document_type: type,
    delivery_method: delivery,
    enabled: enabled(documents?.is_enabled ?? data.enabled ?? data.is_enabled),
    app_type: thermal ? data.app_type : delivery === "whatsapp" ? "whatsapp" : delivery === "pdf" ? "document_pdf" : "document_print",
    auto_send_payload: thermal && enabled(data.auto_send_payload),
  };
}

export function documentActionMeta(setting) {
  if (!setting?.enabled) return null;
  const label = setting.app_type === "document_pdf" ? "Descargar PDF" : setting.app_type === "document_print" ? "Imprimir documento" : null;
  return label ? { label, text: label, color: "#2563eb" } : null;
}

export async function deliverDocumentPdf(client, saleId, print = false) {
  // Open during the click so browsers do not block the print window after fetch.
  const preview = print ? window.open("", "_blank") : null;
  if (print && !preview) throw new Error("Permite ventanas emergentes para imprimir el documento.");
  try {
    const { data } = await client.get(saleDocumentPath(saleId) + (print ? "" : "?download=1"), { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
    if (print) {
      preview.document.title = "Imprimir documento";
      const frame = preview.document.createElement("iframe");
      frame.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";
      if (print === true) frame.onload = () => { frame.contentWindow.focus(); frame.contentWindow.print(); };
      frame.src = url;
      preview.document.body.appendChild(frame);
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = `documento-venta-${saleId}.pdf`;
      link.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 300000);
  } catch (error) {
    preview?.close();
    throw error;
  }
}
