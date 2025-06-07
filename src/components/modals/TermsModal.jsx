// src/components/modals/TermsModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  Checkbox,
  FormControlLabel
} from "@mui/material";

const TermsModal = ({ open, onClose, onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  const handleClose = () => {
    setAccepted(false);
    onClose();
  };

  const handleAccept = () => {
    if (accepted && typeof onAccept === "function") {
      onAccept();
    }
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          bgcolor: "white",
          width: "90%",
          maxWidth: 800,
          mx: "auto",
          my: "5%",
          p: 0,
          borderRadius: 2,
          boxShadow: 24,
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
        }}
      >
        {/* Contenido scrollable */}
        <Box sx={{ p: 4, overflowY: "auto", flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            📜 TÉRMINOS Y CONDICIONES DE USO – TeLoRecargo.com®
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            {`Un producto de Tecnologías Administrativas ELAD®

1️⃣ Objeto del servicio
TeLoRecargo.com® es una plataforma digital desarrollada por Tecnologías Administrativas ELAD® que permite a usuarios registrados vender recargas de tiempo aire electrónico de forma rápida, sencilla y desde cualquier dispositivo con acceso a internet.
📌 Este sistema está enfocado exclusivamente en la venta de recargas de tiempo aire. No incluye la venta de productos o servicios como pagos de CFE, Telmex, etc.

✅ 2️⃣ Aceptación
El uso del sistema implica la aceptación plena y sin reservas de estos Términos y Condiciones. Al registrarse, el usuario reconoce haberlos leído y comprendido.

🧑‍💻 3️⃣ Registro y uso de la cuenta
Para operar en TeLoRecargo.com®, el Usuario debe:
• Registrarse con datos reales y verificables.
• Crear usuario y contraseña bajo su responsabilidad.
• Tener acceso a internet en su dispositivo.

💳 4️⃣ Proceso de compra y uso de saldo
• Las compras se realizan mediante depósito o transferencia.
• Se debe subir el comprobante (captura) a la plataforma.
• Una vez validado, el saldo se abona en menos de 30 minutos (en horario laboral).
⚠️ El saldo es prepagado, no reembolsable y se usa solo para recargas.

🎁 5️⃣ Bonificación por compra
• TLR otorga un +3.5% en cada compra.
• Este bono puede cambiar o suspenderse sin previo aviso.
💡 Puede llegar a 5% si hay acuerdo con la administración.

🧾 6️⃣ Autofacturación
• El usuario puede generar su factura desde el panel.
• Las facturas se emiten bajo el RFC registrado.
• Deben generarse dentro del mes fiscal correspondiente.

🔒 7️⃣ Responsabilidad del usuario
El usuario debe:
• Verificar el número y monto antes de recargar.
• Subir comprobantes válidos.
• No duplicar ni manipular pagos.
• Mantener confidencial su acceso.
🚫 El mal uso implica bloqueo o cancelación sin reembolso.

⚠️ 8️⃣ Límites de responsabilidad
TLR no se responsabiliza por:
• Problemas bancarios.
• Fallas de operadores móviles.
• Errores del Usuario al operar el sistema.

📞 9️⃣ Soporte y disponibilidad
🕘 Lunes a viernes: 9:00 a.m. – 5:00 p.m.
🕑 Sábados: 9:00 a.m. – 2:00 p.m.
📱 Soporte por WhatsApp.
🕓 El sistema está disponible 24/7, salvo mantenimiento o interrupciones externas.

🛠️ 🔟 Cambios en los términos
TLR puede modificar estos términos sin previo aviso.
El uso continuo de la plataforma implica aceptación automática.

🔐 1️⃣1️⃣ Protección de datos
Los datos personales se tratan con estricta confidencialidad.
📜 Solo serán compartidos si lo exige la ley.

🔚 1️⃣2️⃣ Terminación del servicio
TLR podrá suspender cuentas por:
• Actividades sospechosas.
• Incumplimiento de estos términos.
Sin obligación de reembolso.

⚖️ 1️⃣3️⃣ Jurisdicción
Cualquier controversia será resuelta conforme a las leyes mexicanas, ante tribunales en Acapulco, Guerrero.

🧠 1️⃣4️⃣ Definiciones clave
• Usuario: Persona registrada en el sistema.
• Saldo: Crédito prepagado para recargas.
• TLR: TeLoRecargo.com®
• Autofactura: CFDI generado por el usuario desde el sistema.

🛡️ 1️⃣5️⃣ Seguridad de la cuenta
El Usuario es responsable de proteger sus credenciales.
TLR no asume responsabilidad por accesos no autorizados por negligencia del usuario.

🚫 1️⃣6️⃣ Fraudes y conductas prohibidas
No está permitido:
• Usar datos falsos.
• Subir comprobantes falsos o alterados.
• Automatizar procesos con bots.
• Usar el sistema para fines ilícitos.
⚠️ Las cuentas serán canceladas sin aviso ni reembolso. Posibles acciones legales.

💼 1️⃣7️⃣ Uso comercial del sistema
Si operas con fines comerciales, deberás declararlo.
Las cuentas con alto volumen podrían requerir verificación fiscal adicional.

📜 1️⃣8️⃣ Facturación por terceros
Solo puede facturar el titular del RFC registrado.
Está prohibida la facturación cruzada sin autorización.

🌐 1️⃣9️⃣ Restricciones territoriales
La plataforma está diseñada para uso en territorio mexicano.
El acceso desde otros países no está garantizado ni soportado.

✍️ 2️⃣0️⃣ Aceptación electrónica
Todos los registros digitales y acciones del usuario en la plataforma tienen validez legal equivalente a una firma física bajo la NOM-151 y el Código de Comercio.

📬 2️⃣1️⃣ Contacto
📧 contacto@telorecargo.com
📱 Soporte disponible en WhatsApp desde tu sesión.
Gracias por confiar en una solución 100% mexicana.
TeLoRecargo.com® – Recarga, factura y gana.`}
          </Typography>
        </Box>

        {/* Divider visual */}
        <Divider />

        {/* Footer con checkbox y botones */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 2,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
            }
            label="He leído y acepto los términos"
          />
          <Box display="flex" gap={1}>
            <Button onClick={handleClose} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={handleAccept}
              variant="contained"
              color="primary"
              disabled={!accepted}
            >
              Aceptar términos
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default TermsModal;
