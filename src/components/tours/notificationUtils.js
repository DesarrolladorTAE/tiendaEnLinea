export function bookingNotificationPayload(form) {
  const channels = form.notification_channels ?? [];
  if (!Array.isArray(channels) || channels.length > 2 || new Set(channels).size !== channels.length || channels.some(channel => !["email", "whatsapp"].includes(channel))) {
    throw new Error("Selecciona canales de aviso válidos.");
  }
  const phone = String(form.buyer_phone ?? "").trim();
  const email = String(form.buyer_email ?? "").trim();
  const whatsapp = channels.includes("whatsapp") ? String(form.buyer_whatsapp_phone ?? "").trim() : "";
  if (!/^[0-9]{10}$/.test(phone)) throw new Error("El teléfono de contacto debe tener exactamente 10 dígitos, sin +52.");
  if (channels.includes("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ingresa un correo válido para recibir los avisos.");
  if (whatsapp && !/^\+[1-9][0-9]{7,14}$/.test(whatsapp)) throw new Error("El WhatsApp debe incluir + y de 8 a 15 dígitos, sin espacios ni guiones.");
  return {
    buyer_phone: phone,
    buyer_email: email,
    buyer_whatsapp_phone: whatsapp || undefined,
    notification_channels: [...channels],
    notification_channel: channels[0] || "none",
  };
}

export function bookingNotificationLabel(booking) {
  const channels = Array.isArray(booking.notification_channels) ? booking.notification_channels : [booking.notification_channel];
  return channels.filter(channel => ["email", "whatsapp"].includes(channel)).map(channel => channel === "email" ? "Correo electrónico" : "WhatsApp").join(" y ") || "Sin avisos";
}
