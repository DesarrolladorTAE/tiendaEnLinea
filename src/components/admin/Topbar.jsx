import React, { useState, useRef, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Public";
import { useSelector } from "react-redux";

const Topbar = ({ onMenuClick }) => {
  const user = useSelector((state) => state.user.user);
  const notificaciones = useSelector((state) => state.user.notificaciones);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationRef = useRef();

  const getNotificationLabel = () => {
    if (!notificaciones || notificaciones.length === 0) return "0";
    if (notificaciones.length > 9) return "9+";
    return String(notificaciones.length);
  };

  // 🔽 Cierra si hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setOpenNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Box sx={{ position: "relative" }}>
      <AppBar position="static" sx={{ backgroundColor: "#4F46E5" }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Panel de Administración
          </Typography>

          <Box ref={notificationRef} sx={{ position: "relative", mr: 2 }}>
            <IconButton
              color="inherit"
              onClick={() => setOpenNotifications(!openNotifications)}
            >
              <Badge
                badgeContent={getNotificationLabel()}
                color="error"
                overlap="circular"
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {openNotifications && (
              <Paper
                elevation={3}
                sx={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  mt: 1,
                  width: 280,
                  maxHeight: 300,
                  overflowY: "auto",
                  zIndex: 1300,
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Notificaciones
                  </Typography>
                </Box>
                <List>
                  {(notificaciones && notificaciones.length > 0) ? (
                    notificaciones.map((n, index) => (
                      <ListItem key={index} divider>
                        <ListItemText primary={n} />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Aún no tienes notificaciones 💤" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Box>

          {user && (
            <Box sx={{ fontWeight: 500 }}>
              Bienvenido, {user.name} {user.apellidos}
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Topbar;
