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

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showByeModal, setShowByeModal] = useState(false);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/admin/users" },
    { text: "Ventas De Saldo", icon: <ShoppingCartIcon />, path: "/admin/purchases" },
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
          zIndex: (theme) => theme.zIndex.appBar + 2,
          top: '64px',
          height: 'calc(100% - 64px)',
          "& .MuiDrawer-paper": {
            top: '64px',
            height: 'calc(100% - 64px)',
            width: drawerWidth,
            background: "linear-gradient(to right, #1f2937, #111827)", // ✅ gradiente igual al topbar
            color: "#fff",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }
        }}

      >

        <Box>
          <List>
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
          </List>
        </Box>

        <Box>
          <Divider sx={{ my: 1, borderColor: "#2e3b55" }} />
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
