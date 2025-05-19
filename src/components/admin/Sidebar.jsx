import React, { useState, forwardRef } from "react";
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
import AnimatedModal from "../AnimatedModal";

const drawerWidth = 240;

const ListItemLink = forwardRef(function ListItemLink({ icon, primary, to, onClick }, ref) {
  return (
    <Box component={NavLink} to={to} onClick={onClick} ref={ref} sx={{ textDecoration: "none" }}>
      <ListItem disableGutters sx={{ px: 3, button: "true" }}>
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        <ListItemText primary={primary} />
      </ListItem>
    </Box>
  );
});

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
        variant="temporary"
        ModalProps={{
          keepMounted: true,
          BackdropProps: { invisible: true },
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
        <Box>
          <List>
            <ListItem disableGutters onClick={goToStore} sx={{ px: 3, cursor: 'pointer' }}>
              <ListItemIcon><StorefrontIcon /></ListItemIcon>
              <ListItemText primary="Tienda" />
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {menuItems.map((item) => (
              <ListItemLink
                key={item.text}
                to={item.path}
                icon={item.icon}
                primary={item.text}
                onClick={onClose}
              />
            ))}
          </List>
        </Box>

        <Box>
          <Divider sx={{ my: 1 }} />
          <List>
            <ListItem disableGutters onClick={handleLogout} sx={{ px: 3, cursor: 'pointer' }}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItem>
          </List>
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