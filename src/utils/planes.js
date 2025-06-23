// src/utils/planes.js
const planes = [
  {
    plan_id: 1,
    nombre: "Plan DEMO",
    precio_mensual: 0,
    demo: true,
    duracion_dias: 14,
    descripcion: "Para conocer la plataforma sin compromiso",
    beneficios: [
      "Hasta 2 puntos de venta",
      "Hasta 10 productos",
      "Catálogo compartible por WhatsApp",
      "Subdominio personalizado (ej. tutienda.mitiendaenlineamx.com)",
      "Carrito de compras para WhatsApp (sin pagos)",
      "Control básico de inventarios",
      "Reporte diario de ventas",
      "Envío de tickets por correo",
      "Soporte por correo"
    ],
    promociones: []
  },
  {
    plan_id: 2,
    nombre: "Plan Negocio",
    precio_mensual: 199,
    descripcion: "Para emprendedores que venden por WhatsApp o en físico",
    beneficios: [
      "Hasta 2 puntos de venta",
      "Hasta 100 productos",
      "Subdominio personalizado",
      "Carrito de compras para WhatsApp",
      "Control de inventarios",
      "Registro manual de compras",
      "Tickets por correo y WhatsApp",
      "Reportes mensuales",
      "Soporte por correo y WhatsApp"
    ],
    restricciones: [
      "No incluye facturación electrónica",
      "No incluye importación masiva"
    ],
    promociones: [
      { paga: 5, recibe: 6 },
      { paga: 10, recibe: 12 }
    ]
  },
  {
    plan_id: 3,
    nombre: "Plan Profesional",
    precio_mensual: 449,
    descripcion: "Para negocios que venden más y quieren cobrar en línea",
    beneficios: [
      "Todo lo anterior",
      "Hasta 5 puntos de venta",
      "Productos ilimitados",
      "Carrito con integración a pasarela de pago (Stripe / Conekta)",
      "Reportes detallados",
      "Soporte técnico por WhatsApp",
      "Acceso desde múltiples dispositivos"
    ],
    complementosDisponibles: ["autofacturacion", "importacion"],
    promociones: [
      { paga: 5, recibe: 6 },
      { paga: 10, recibe: 12 }
    ]
  },
  {
    plan_id: 4,
    nombre: "Plan Avanzado",
    precio_mensual: 899,
    descripcion: "Para negocios grandes o con sucursales",
    beneficios: [
      "Todo lo anterior",
      "Hasta 10 puntos de venta",
      "Dominio personalizado incluido (www.tutienda.com.mx)",
      "Reportes por tienda, agente y sucursal",
      "Branding avanzado en tickets y tienda",
      "Capacitación mensual",
      "Soporte técnico prioritario"
    ],
    incluyeSinCosto: ["importacion"],
    complementosOpcionales: ["autofacturacion"],
    promociones: [
      { paga: 5, recibe: 6 },
      { paga: 10, recibe: 12 }
    ]
  }
];

export default planes;
