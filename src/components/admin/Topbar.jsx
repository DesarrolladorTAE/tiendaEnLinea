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
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Stack from "@mui/material/Stack";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useSelector } from "react-redux";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";

const Topbar = ({ onMenuClick }) => {
  const notificaciones = useSelector((state) => state.user.notificaciones);
  const user = useSelector((state) => state.user.user);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationRef = useRef();
  const [saldoTaecel, setSaldoTaecel] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [saldoAnchorEl, setSaldoAnchorEl] = useState(null);

  const handleSaldoClick = (event) => {
    setSaldoAnchorEl(event.currentTarget);
  };

  const handleSaldoClose = () => {
    setSaldoAnchorEl(null);
  };

  const saldoOpen = Boolean(saldoAnchorEl);

  const getNotificationLabel = () => {
    if (!notificaciones || notificaciones.length === 0) return "0";
    if (notificaciones.length > 9) return "9+";
    return String(notificaciones.length);
  };

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
  const fetchSaldo = async () => {
    try {
      const res = await axios.get("/saldo-taecel");
      if (res.data.success) {
        setSaldoTaecel({
          saldo_taecel: parseFloat(res.data.data.saldo_taecel),
          saldo_virtual_asignado: parseFloat(
            res.data.data.saldo_virtual_asignado
          ),
          saldo_disponible: parseFloat(res.data.data.saldo_disponible),
          updated_at: res.data.data.updated_at,
        });
      }
    } catch (err) {
      toast.error("Error al obtener saldo Taecel");
    }
  };
  useEffect(() => {
    fetchSaldo();
  }, []);

  return (
    <Box sx={{ position: "relative" }}>
      <AppBar
        position="fixed"
        sx={{
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1300,
          background: "linear-gradient(to right, #1f2937, #111827)",
          px: 2,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 2 : 0,
            py: isMobile ? 2 : 0,
          }}
        >
          {/* Menú + Título */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuClick}
              sx={{
                mr: 2,
                display: { xs: "inline-flex", md: "none" },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              fontWeight={600}
              color="white"
              sx={{
                display: { xs: "none", md: "block" }, // Oculta en xs/sm, muestra en md en adelante
              }}
            >
              Panel de Administración
            </Typography>
          </Box>

          {/* Tarjetas de saldo */}
          {saldoTaecel &&
            (isMobile ? (
              <Box>
                <IconButton color="inherit" onClick={handleSaldoClick}>
                  <MonetizationOnIcon />
                </IconButton>
                <Popover
                  open={saldoOpen}
                  anchorEl={saldoAnchorEl}
                  onClose={handleSaldoClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      p: 2,
                      bgcolor: "#222b36",
                      color: "#fff",
                      boxShadow: "0px 4px 16px rgba(0,0,0,0.22)",
                      borderRadius: 2,
                    },
                  }}
                >
                  {/* Las tarjetas de saldo AQUÍ, pero en columna */}
                  <Stack spacing={1} direction="column" sx={{ minWidth: 180 }}>
                    <Paper
                      sx={{ p: 1, background: "#2d3748", color: "#fbbf24" }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        💰 Saldo Taecel
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#fbbf24"
                      >
                        ${saldoTaecel.saldo_taecel.toFixed(2)}
                      </Typography>
                    </Paper>
                    <Paper
                      sx={{ p: 1, background: "#2d3748", color: "#63b3ed" }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        📘 Saldo Asignado
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#63b3ed"
                      >
                        ${saldoTaecel.saldo_virtual_asignado.toFixed(2)}
                      </Typography>
                    </Paper>
                    <Paper
                      sx={{ p: 1, background: "#2d3748", color: "#68d391" }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        🟢 Saldo Disponible
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#68d391"
                      >
                        ${saldoTaecel.saldo_disponible.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Stack>
                </Popover>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                }}
              >
                {/* Aquí tus cards Paper como antes */}
                <Paper
                  sx={{ px: 2, py: 1, background: "#2d3748", color: "#fbbf24" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      💰 Saldo Taecel
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="white">
                      ${saldoTaecel.saldo_taecel.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
                <Paper
                  sx={{ px: 2, py: 1, background: "#2d3748", color: "#63b3ed" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      📘 Saldo Asignado
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="white">
                      ${saldoTaecel.saldo_virtual_asignado.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
                <Paper
                  sx={{ px: 2, py: 1, background: "#2d3748", color: "#68d391" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      🟢 Saldo Disponible
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="white">
                      ${saldoTaecel.saldo_disponible.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ))}

          {/* Notificaciones + Usuario */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              justifyContent: isMobile ? "flex-start" : "flex-end",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Box ref={notificationRef} sx={{ position: "relative" }}>
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
                    backgroundColor: "#1a202c",
                    color: "white",
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      color="white"
                    >
                      Notificaciones
                    </Typography>
                  </Box>
                  <List>
                    {notificaciones.length > 0 ? (
                      notificaciones
                        .filter(
                          (n) =>
                            n.visible_para?.includes("admin") ||
                            n.visible_para?.includes("superadmin")
                        )
                        .map((n, i) => (
                          <ListItem
                            key={i}
                            divider
                            sx={{ borderBottom: "1px solid #2d3748" }}
                          >
                            <ListItemText
                              primary={n.mensaje}
                              secondary={new Date(
                                n.created_at
                              ).toLocaleString()}
                            />
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

            {/* Usuario */}
            {user && (
              <Box sx={{ textAlign: isMobile ? "left" : "right" }}>
                <Typography color="#ffffff" fontWeight={700}>
                  Bienvenido, {user.name} {user.apellidos}
                </Typography>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Espacio compensatorio para que no tape el contenido */}
      <Box sx={{ height: isMobile ? 130 : 80 }} />
    </Box>
  );
};

export default Topbar;
