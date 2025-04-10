import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
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
import AnimatedModal from "../AnimatedModal"; // ✅ asegúrate de que la ruta sea correcta

const drawerWidth = 240;

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showByeModal, setShowByeModal] = useState(false);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/admin/users" },
    { text: "Compras", icon: <ShoppingCartIcon />, path: "/admin/purchases" },
    { text: "Notificaciones", icon: <NotificationsIcon />, path: "/admin/notifications" },
  ];

  const handleLogout = () => {
    dispatch(clearUser());
    setShowByeModal(true);
    setTimeout(() => {
      setShowByeModal(false);
      navigate("/login");
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
        variant="temporary"
        ModalProps={{
          keepMounted: true,
          BackdropProps: { invisible: true }, // ✅ Quita opacidad
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#f7f7f7",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }
        }}
      >
        {/* 🔵 Parte superior: botón tienda + navegación */}
        <Box>
          <List>
            <ListItem button onClick={goToStore} sx={{ px: 3 }}>
              <ListItemIcon><StorefrontIcon /></ListItemIcon>
              <ListItemText primary="Tienda" />
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                component={NavLink}
                to={item.path}
                onClick={onClose}
                sx={{
                  "&.active": { backgroundColor: "#e0e0e0" },
                  px: 3,
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 🔴 Parte inferior: cerrar sesión */}
        <Box>
          <Divider sx={{ my: 1 }} />
          <List>
            <ListItem button onClick={handleLogout} sx={{ px: 3 }}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* 🎉 Modal animado de despedida */}
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
