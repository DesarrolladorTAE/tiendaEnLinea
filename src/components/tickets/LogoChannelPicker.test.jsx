import React, { act } from "react";
import { createRoot } from "react-dom/client";
import LogoChannelPicker from "./LogoChannelPicker";
import client from "../../config/axiosClient";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn() } }));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const selection = { type: "ticket", channel: "pdf", branchId: "123" };
const cards = () => [...host.querySelectorAll("button")];

test("shows a logo thumbnail for PDF and a missing logo for printing", async () => {
  client.get.mockResolvedValue({ data: { config: { logo: null, show_logo: true } } });
  await act(async () => root.render(<LogoChannelPicker selection={selection} config={{ show_logo: true }} logo="https://example.test/pdf.png" />));
  expect(cards()[0].textContent).toContain("Con logo");
  expect(cards()[0].querySelector("img").src).toBe("https://example.test/pdf.png");
  expect(cards()[1].textContent).toContain("Sin logo");
  expect(client.get).toHaveBeenCalledWith("/document-settings/ticket/payload", { params: { branch_id: "123" } });
});

test("distinguishes a hidden stored logo and labels pending edits", async () => {
  client.get.mockResolvedValue({ data: { config: { logo_url: "https://example.test/print.png", show_logo: false } } });
  await act(async () => root.render(<LogoChannelPicker selection={selection} config={{ show_logo: true }} logo="https://example.test/new.png" pending />));
  expect(cards()[0].textContent).toContain("Cambio sin guardar");
  expect(cards()[1].textContent).toContain("Oculto");
  expect(cards()[1].querySelector("img").src).toBe("https://example.test/print.png");
});

test("does not claim the logo is missing when reading the other output fails", async () => {
  client.get.mockRejectedValue(new Error("offline"));
  await act(async () => root.render(<LogoChannelPicker selection={selection} config={{ show_logo: true }} logo="" />));
  expect(cards()[1].textContent).toContain("Sin consultar");
  expect(cards()[1].textContent).not.toContain("Sin logo");
});
