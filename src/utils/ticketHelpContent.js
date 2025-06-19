// utils/ticketHelpContent.js

const ticketHelpContent = {
  logo: {
    title: '🖼 Recomendaciones para el Logo',
    details: [
      'Formatos permitidos: JPG o PNG',
      'Tamaño máximo: 3MB',
      'Resolución sugerida: hasta 300x300px',
      'Fondo blanco y negro o transparente',
      'Usa una versión negativa para impresión térmica (negro sobre blanco)',
    ],
  },
  direccion: {
    title: '📍 Formato de Dirección',
    details: [
      'Usa saltos de línea para separar calle, colonia y código postal',
      'Ejemplo:',
      'AV. RUIZ ALLENDE 23 COL. CONSTITUYENTES',
      'ACAPULCO, GRO. C.P. 12360',
      'RFC: THQW762679I22',
      'Límite recomendado: hasta 3 líneas de 40 caracteres',
    ],
  },
  mensajes: {
    title: '💬 Mensajes Personalizados',
    details: [
      'Puedes personalizar dos mensajes:',
      '- Mensaje 1 (despues de la compra)',
      '- Mensaje 2 (al pie del ticket)',
      'Límite: 25 caracteres cada uno (con espacios)',
      'Ejemplos: "Gracias por su compra", "Vuelva pronto"',
    ],
  },
  qr: {
    title: '� QR en el Ticket',
    details: [
      'QR Factura: Enlace para que el cliente escanee y facture su compra. "PRÓXIMAMENTE"',
      'QR Sitio Web: Enlace directo a tu página web o tienda en línea.',
      'Ambos códigos QR son opcionales y se muestran solo si los activas.',
    ],
  },
};

export default ticketHelpContent;
