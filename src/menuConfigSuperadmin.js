import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CardMembershipRoundedIcon from "@mui/icons-material/CardMembershipRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

const superadminNavItems = [
  { path: "dashboard", label: "Dashboard", icon: DashboardRoundedIcon },
  { path: "tiendas", label: "Tiendas", icon: StoreRoundedIcon },
  { path: "ventas", label: "Ventas", icon: PaymentsRoundedIcon },
  { path: "suscripciones", label: "Suscripciones", icon: CardMembershipRoundedIcon },
  { path: "notificaciones", label: "Notificaciones", icon: NotificationsActiveRoundedIcon },
  { path: "banners", label: "Banners", icon: PhotoLibraryRoundedIcon },
  { path: "app-versiones", label: "Apps POS", icon: AndroidRoundedIcon },
  {path: "planes", label: "Planes", icon: WorkspacePremiumRoundedIcon,},
];

export default superadminNavItems;