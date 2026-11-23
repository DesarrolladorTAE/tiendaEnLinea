import { deliverDocumentPdf, documentPhone, normalizeDocumentSetting, saleDocumentPath } from "./saleDocument";

test.each(["nota_venta", "comprobante"])("%s never uses thermal transport or automatic payload", document_type => {
  const setting = normalizeDocumentSetting({ enabled: true, app_type: "windows_usb", auto_send_payload: true,
    document_settings: { document_type, delivery_method: "print", is_enabled: true } });
  expect(setting.app_type).toBe("document_print");
  expect(setting.auto_send_payload).toBe(false);
});

test("download and WhatsApp settings work without a thermal app and preserve disabled state", () => {
  expect(normalizeDocumentSetting({ document_action: { document_type: "ticket", delivery_method: "pdf" }, enabled: true }).app_type).toBe("document_pdf");
  expect(normalizeDocumentSetting({ document_settings: { document_type: "comprobante", delivery_method: "whatsapp", is_enabled: "0" } })).toMatchObject({ enabled: false, app_type: "whatsapp" });
  expect(normalizeDocumentSetting({ enabled: true, app_type: "windows_usb" })).toEqual({ enabled: true, app_type: "windows_usb" });
  expect(saleDocumentPath(123)).toBe("/sales/123/documents/default/pdf");
  expect(documentPhone("55 1234 5678")).toBe("525512345678");
});

test("letter printing fetches the selected document PDF and prints it, without requesting payload", async () => {
  jest.useFakeTimers();
  const print = jest.fn(), focus = jest.fn();
  const frame = { style: {}, contentWindow: { print, focus } };
  const preview = { document: { createElement: jest.fn(() => frame), body: { appendChild: jest.fn() } }, close: jest.fn() };
  jest.spyOn(window, "open").mockReturnValue(preview);
  URL.createObjectURL = jest.fn(() => "blob:selected-document");
  URL.revokeObjectURL = jest.fn();
  const client = { get: jest.fn().mockResolvedValue({ data: new Blob(["pdf"]) }) };
  await deliverDocumentPdf(client, 456, true);
  expect(client.get).toHaveBeenCalledTimes(1);
  expect(client.get).toHaveBeenCalledWith("/sales/456/documents/default/pdf", { responseType: "blob" });
  expect(frame.src).toBe("blob:selected-document");
  frame.onload();
  expect(print).toHaveBeenCalledTimes(1);
  jest.runOnlyPendingTimers();
  jest.restoreAllMocks();
  jest.useRealTimers();
});
