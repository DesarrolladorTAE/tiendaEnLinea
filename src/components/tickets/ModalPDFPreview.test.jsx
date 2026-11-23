import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { saveAs } from "file-saver";
import ModalPDFPreview from "./ModalPDFPreview";
import client from "../../config/axiosClient";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("file-saver", () => ({ saveAs: jest.fn() }));
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => "blob:preview"); URL.revokeObjectURL = jest.fn();
  client.get.mockResolvedValue({ data: new Blob(["pdf"], { type: "application/pdf" }) });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("loads authenticated PDFs, changes endpoint and revokes temporary URLs", async () => {
  const render = endpoint => act(async () => root.render(<ModalPDFPreview open endpoint={endpoint} onClose={jest.fn()} />));
  await render("/sales/1/documents/ticket/pdf");
  expect(client.get).toHaveBeenCalledWith("/sales/1/documents/ticket/pdf", expect.objectContaining({ responseType: "blob" }));
  expect(document.querySelector("iframe").src).toBe("blob:preview");
  await render("/sales/1/documents/nota_venta/pdf");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  expect(client.get).toHaveBeenLastCalledWith("/sales/1/documents/nota_venta/pdf", expect.any(Object));
});

test("shows an error instead of remaining on the loading screen", async () => {
  client.get.mockRejectedValue({ response: { data: { message: "No tienes acceso a esta venta" } } });
  await act(async () => root.render(<ModalPDFPreview open endpoint="/sales/2/documents/comprobante/pdf" />));
  expect(document.body.textContent).toContain("No tienes acceso a esta venta");
  expect(document.querySelector("iframe")).toBeNull();
});

test("downloads sale documents through the authenticated download endpoint", async () => {
  await act(async () => root.render(<ModalPDFPreview open endpoint="/sales/2/documents/nota_venta/pdf" downloadEndpoint="/sales/2/documents/nota_venta/pdf?download=1" nombreArchivo="nota.pdf" />));
  await act(async () => Simulate.click([...document.querySelectorAll("button")].find(button => button.textContent === "Descargar PDF")));
  expect(client.get).toHaveBeenLastCalledWith("/sales/2/documents/nota_venta/pdf?download=1", { responseType: "blob" });
  expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "nota.pdf");
});
