// utils/ticketHelpContent.js

const ticketHelpContent = {
  logo: {
    title: "🖼 Recomendaciones para el Logo",
    details: [
      "Formatos permitidos: PNG, JPG, JPEG, WEBP y SVG.",
      "Tamaño máximo permitido: 3MB.",
      "Se recomienda usar un logo limpio, centrado y con buen contraste.",
      "Para impresión térmica, funciona mejor un logo en negro sobre fondo blanco o transparente.",
      "Evita imágenes muy grandes, borrosas o con demasiados detalles finos.",
      "Configura el ancho máximo del logo según el tamaño del papel para evitar que se corte.",
    ],
  },

  direccion: {
    title: "📍 Formato de Dirección",
    details: [
      "Puedes capturar dirección, colonia, ciudad, estado, código postal o RFC.",
      "Usa saltos de línea para organizar mejor la información.",
      "Ejemplo:",
      "AV. RUIZ ALLENDE 23",
      "COL. CONSTITUYENTES",
      "ACAPULCO, GRO. C.P. 12360",
      "RFC: THQW762679I22",
      "Límite máximo: 300 caracteres.",
      "Procura que el texto sea corto y claro para una mejor impresión.",
    ],
  },

  mensajes: {
    title: "💬 Mensajes Personalizados",
    details: [
      "Puedes personalizar dos mensajes para el ticket.",
      "Mensaje 1: normalmente se usa como texto superior o mensaje principal.",
      "Mensaje 2: normalmente se usa como texto final o despedida.",
      "Cada mensaje permite hasta 125 caracteres.",
      'Ejemplos: "Gracias por su compra", "Vuelva pronto", "Conserve su ticket".',
      "Se recomienda usar textos breves para mantener una impresión limpia y legible.",
    ],
  },

  qr: {
    title: "📲 QR en el Ticket",
    details: [
      "QR Factura: muestra un código para dirigir al proceso de facturación, si tu configuración lo permite.",
      "QR Sitio Web: muestra un código para dirigir a tu página web o tienda en línea.",
      "Ambos códigos son opcionales.",
      "El tamaño del QR puede ajustarse desde la configuración técnica.",
      "Se recomienda no abusar del tamaño para evitar que el ticket quede demasiado largo.",
    ],
  },

  mostrar_iva: {
    title: "💡 Mostrar IVA Desglosado",
    details: [
      "Activa esta opción si deseas que el ticket muestre el desglose de IVA.",
      "Si está desactivada, solo se mostrará el total general sin separar el impuesto.",
      "Es útil para negocios que desean mayor claridad en el detalle de cobro.",
      "Esta configuración aplica al ticket impreso, no sustituye una factura electrónica.",
    ],
  },

  tecnica: {
    title: "⚙️ Configuración Técnica",
    details: [
      "Tamaño de papel: puedes usar 58 mm u 80 mm.",
      "Caracteres por línea: depende del tamaño del papel y del formato de impresión.",
      "IP y puerto: se usan cuando la impresora trabaja por red.",
      "Puerto común: 9100.",
      "Los tamaños de QR y el ancho del logo deben ajustarse según el papel para evitar cortes o desbordes.",
    ],
  },
};

export default ticketHelpContent;