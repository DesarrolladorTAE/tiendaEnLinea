import React, { useState, forwardRef } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "../../store/slices/userSlice";
import AnimatedModal from "../AnimatedModal";

const drawerWidth = 270;

const ListItemLink = forwardRef(function ListItemLink(
  { icon, primary, to, onClick },
  ref
) {
  return (
    <Box
      component={NavLink}
      to={to}
      onClick={onClick}
      ref={ref}
      sx={{
        textDecoration: "none",
        color: "inherit",
        "&.active .MuiListItem-root": {
          backgroundColor: "#39495e",
        },
      }}
    >
      <ListItem
        disableGutters
        sx={{
          px: 3,
          py: 1.5,
          borderRadius: 1,
          "&:hover": {
            backgroundColor: "#283142",
          },
        }}
      >
        {icon && <ListItemIcon sx={{ color: "#fff" }}>{icon}</ListItemIcon>}
        <ListItemText primary={primary} />
      </ListItem>
    </Box>
  );
});

const Sidebar = ({ open, onClose, variant = "temporary" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showByeModal, setShowByeModal] = useState(false);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/admin/users" },
    {
      text: "Ventas De Saldo",
      icon: <ShoppingCartIcon />,
      path: "/admin/purchases",
    },
    {
      text: "Notificaciones",
      icon: <NotificationsIcon />,
      path: "/admin/notifications",
    },
  ];

  const handleLogout = () => {
    dispatch(clearUser());
    setShowByeModal(true);
    setTimeout(() => {
      setShowByeModal(false);
      navigate("/loginmui");
    }, 3000);
  };

  const goToStore = () => {
    navigate("/home-fashion-three");
  };

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant={variant}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: (theme) =>
            variant === "permanent"
              ? theme.zIndex.appBar - 1
              : theme.zIndex.modal + 1,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "#1b2a41",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            top: 0,
            left: 0,
            position: variant === "permanent" ? "relative" : "fixed",
            borderRight: "none",
          },
        }}
      >
        {/* Logo superior */}
        <Box
          sx={{
            px: 2,
            pt: 5,
            pb: 2,
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/img/logo.png"
            alt="TeLoRecargo Logo"
            style={{ width: "120px", maxHeight: "60px", objectFit: "contain" }}
          />
        </Box>

        {/* Menú navegable */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", py: 2 }}>
          <Stack spacing={2} px={2}>
            <ListItem
              disableGutters
              onClick={goToStore}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { backgroundColor: "#283142" },
              }}
            >
              <ListItemIcon sx={{ color: "#fff" }}>
                <StorefrontIcon />
              </ListItemIcon>
              <ListItemText primary="Tienda" />
            </ListItem>

            <Divider sx={{ my: 1, borderColor: "#2e3b55" }} />

            {menuItems.map((item) => (
              <ListItemLink
                key={item.text}
                to={item.path}
                icon={item.icon}
                primary={item.text}
                onClick={onClose}
              />
            ))}
          </Stack>
        </Box>

        {/* Footer y logout */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            fontSize: "0.85rem",
            flexShrink: 0,
          }}
        >
          <List>
            <ListItem
              disableGutters
              onClick={handleLogout}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { backgroundColor: "#283142" },
              }}
            >
              <ListItemIcon sx={{ color: "#fff" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItem>
          </List>

          <Typography
            variant="caption"
            color="white"
            display="block"
            mt={2}
            textAlign="center"
          >
            © {new Date().getFullYear()} TeLoRecargo
          </Typography>
        </Box>
      </Drawer>

      <AnimatedModal
        isOpen={showByeModal}
        onRequestClose={() => setShowByeModal(false)}
        message="¡Hasta luego SuperAdmin!"
        tipo="bye"
      />
    </>
  );
};

export default Sidebar;
