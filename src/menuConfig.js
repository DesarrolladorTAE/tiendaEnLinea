import { patch } from "@mui/material";

const adminNavItems = [
  { path: "/admin/products", label: "🛒 Productos" },
  { path: "/admin/promociones", label: "🚨 Promociones" },
  {path: "/admin/Almacenes", label: "🏢 Almacenes"},
  { path: "/admin/categorias", label: "📂 Categorías" },
  // { path: "/admin/inventario", label: "🏬 Inventario" },
  { path: "/admin/pos", label: "🏬 Punto de Venta" },
  { path: "/admin/reportes", label: "📓 Reportes" },
  // { path: "/admin/compra", label: "📦Entradas Producto" },

  { path: "/admin/ticket", label: "📄Personaliza tu Ticket"},
  
   { path: "/admin/mi-sitio", label: "🌐 Sitio Web" },
  { path: "/admin/complementos", label: "🔌 Complementos"},
  { path: "/admin/membresia", label: "📑 Suscripciones"},

  { path: "/admin/micuenta", label: "🪪Mi Cuenta"},
];

export default adminNavItems;
