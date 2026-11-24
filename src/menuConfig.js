import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

export const storeAdminNavItems = [
  { path: "/admin/envios", label: "Envíos de productos", description: "Métodos, puntos de entrega y seguimiento", icon: LocalShippingOutlinedIcon },
  { path: "/admin/micuenta", label: "Mi cuenta", description: "Datos personales, fiscales y seguridad", icon: AccountCircleRoundedIcon },
  { path: "/admin/membresia", label: "Suscripciones", description: "Consulta y administra tu plan", icon: WorkspacePremiumRoundedIcon },
  { path: "/admin/complementos", label: "Complementos", description: "Amplía las funciones de tu tienda", icon: AutoAwesomeRoundedIcon },
];

const adminNavItems = [
  { path: "/admin/products", label: "Productos", icon: Inventory2OutlinedIcon },
  { path: "/admin/services", label: "Servicios", icon: HandymanOutlinedIcon },
  { path: "/admin/Almacenes", label: "Almacenes", icon: WarehouseOutlinedIcon },
  { path: "/admin/trabajadores-areas", label: "Trabajadores", icon: BadgeOutlinedIcon },
  { path: "/admin/categorias", label: "Categorías", icon: CategoryOutlinedIcon },
  { path: "/admin/pos", label: "Punto de Venta", icon: PointOfSaleOutlinedIcon },
  { path: "/admin/integraciones/telorecargo", label: "Recargas Telorecargo", icon: SmartphoneOutlinedIcon },
  { path: "/admin/reportes", label: "Reportes", icon: BarChartOutlinedIcon },
  { path: "/admin/compra", label: "Entradas de producto", icon: MoveToInboxOutlinedIcon },
  { path: "/admin/ticket", label: "Tickets y comprobantes", icon: ReceiptLongOutlinedIcon },
  { path: "/admin/mi-sitio", label: "Sitio Web", icon: LanguageOutlinedIcon },
  { path: "/admin/marca-blanca", label: "Marca blanca", icon: PaletteOutlinedIcon },
];

export default adminNavItems;
