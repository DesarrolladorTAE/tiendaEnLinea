import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography, InputAdornment } from "@mui/material";
import { sendToBridge } from "../../components/POS/printPayloadBridge";
import { downloadRechargeTicket, telorecargoPOS } from "./service";
import { errorMessage } from "./model";

const automaticAttempts = new Set();

export default function RechargeTicketActions({ operation, posLocationId, autoPrint = false }) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);
  const [phone, setPhone] = useState(operation?.referencia || "");
  const lock = useRef(false);

  const eligible = operation?.status === "confirmada" && Boolean(operation?.sale_id);
  async function run(action) {
    if (lock.current || !eligible) return;
    lock.current = true; setBusy(action); setMessage(null);
    try {
      if (action === "pdf") await downloadRechargeTicket(operation.id, operation.ticket_pdf_url);
      else if (action === "whatsapp") {
        if (!/^\d{10}$/.test(phone)) throw new Error("Ingresa un número de WhatsApp de 10 dígitos.");
        await telorecargoPOS.sendWhatsapp(operation.sale_id, phone);
        setMessage({ severity: "success", text: "Ticket enviado por WhatsApp." });
      } else {
        const response = await telorecargoPOS.printPayload(operation);
        if (!response?.ok || !response.payload) throw new Error(response?.message || "No se pudo obtener el ticket.");
        const sent = await sendToBridge(response.payload);
        if (!sent) throw new Error("No se encontró una aplicación conectada para imprimir. Conéctala y vuelve a intentar la impresión.");
        setMessage({ severity: "success", text: "Ticket enviado a la aplicación de impresión." });
      }
    } catch (err) {
      setMessage({ severity: "error", text: err.response?.status === 409 ? "La recarga todavía no tiene una venta confirmada disponible para imprimir." : errorMessage(err) });
    } finally { lock.current = false; setBusy(""); }
  }
  useEffect(() => {
    if (!eligible || !autoPrint || !posLocationId || automaticAttempts.has(`${posLocationId}:${operation.id}`)) return;
    let alive = true;

    telorecargoPOS.printConfig(posLocationId).then((config) => {
      if (alive && config?.enabled && config?.auto_send_payload && config?.app_type && config.app_type !== "whatsapp" && !automaticAttempts.has(`${posLocationId}:${operation.id}`)) { automaticAttempts.add(`${posLocationId}:${operation.id}`); void run("print"); }
    }).catch((err) => { if (alive) setMessage({ severity: "error", text: errorMessage(err) }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, operation?.id, autoPrint, posLocationId]);
  if (!eligible) return null;
  return <Stack spacing={2} className="trc-ticket-actions">
    <Box><Typography className="trc-eyebrow">COMPROBANTE</Typography><Typography variant="h6" fontWeight={850}>Tu ticket, como lo prefieras</Typography><Typography variant="body2" color="text.secondary">Imprime una copia o compártela con tu cliente.</Typography></Box>
    {message && <Alert severity={message.severity}>{message.text}</Alert>}
    {busy && <Stack direction="row" gap={1} role="status"><CircularProgress size={18} />Procesando ticket...</Stack>}
    <Stack className="trc-ticket-buttons" direction="row" gap={1} flexWrap="wrap"><Button startIcon={<PictureAsPdfRoundedIcon />} disabled={Boolean(busy)} variant="outlined" onClick={() => run("pdf")}>Ver ticket PDF</Button><Button disabled={Boolean(busy)} variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => run("print")}>Imprimir ticket</Button></Stack>
    <Box className="trc-whatsapp-card"><Box className="trc-whatsapp-intro"><WhatsAppIcon /><Box><Typography fontWeight={800}>Envío por WhatsApp</Typography><Typography variant="caption">Una copia digital para tu cliente</Typography></Box></Box><Box className="trc-whatsapp-form"><TextField fullWidth size="small" label="Número de WhatsApp" InputProps={{ startAdornment: <InputAdornment position="start">+52</InputAdornment> }} value={phone} disabled={Boolean(busy)} inputProps={{ inputMode: "tel", maxLength: 10 }} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} /><Button startIcon={<WhatsAppIcon />} color="success" variant="contained" disabled={Boolean(busy)} onClick={() => run("whatsapp")}>Enviar ticket</Button></Box></Box>
  </Stack>;
}
