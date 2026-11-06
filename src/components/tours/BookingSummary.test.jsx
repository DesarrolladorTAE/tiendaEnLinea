import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BookingSummary from "./BookingSummary";

test("accepted reservation keeps its outstanding balance and shows both preferences without claiming delivery", () => {
  const html = renderToStaticMarkup(<BookingSummary booking={{ id: 1, status: "confirmed", payment_status: "partial", total: "1520.00", paid_amount: "760.00", remaining_amount: "760.00", notification_channels: ["email", "whatsapp"] }} />);
  expect(html).toContain("Aceptada / confirmada");
  expect(html).toContain("Reserva aceptada con saldo pendiente");
  expect(html).toContain("Correo electrónico y WhatsApp");
  expect(html).toContain("no confirma que los mensajes hayan sido entregados");
});

test("cancellation does not claim a refund", () => {
  const html = renderToStaticMarkup(<BookingSummary booking={{ id: 1, status: "cancelled", payment_status: "partial" }} />);
  expect(html).toContain("no registra ni ejecuta un reembolso");
});
