import React from "react";
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Usuarios", icon: <PeopleIcon />, path: "/admin/users" },
    { text: "Compras", icon: <ShoppingCartIcon />, path: "/admin/purchases" },
    { text: "Notificaciones", icon: <NotificationsIcon />, path: "/admin/notifications" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box", backgroundColor: "#f7f7f7" },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem
          key={item.text}
          component={NavLink}
          to={item.path}
          button="true" // ❌ esta línea es la incorrecta — NO la uses así
            sx={{
              "&.active": {
                backgroundColor: "#e0e0e0",
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
