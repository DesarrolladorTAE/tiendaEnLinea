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
  Chip,
  alpha,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "../../store/slices/userSlice";
import AnimatedModal from "../AnimatedModal";

const drawerWidth = 270;

/* ===========================================
   LINK PERSONALIZADO
=========================================== */
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
        color: "#fff", // 🔥 TEXTO SIEMPRE BLANCO
        display: "block",
        "&.active .navItem": {
          background:
            "linear-gradient(135deg, rgba(96,165,250,.25), rgba(167,139,250,.18))",
          borderColor: "rgba(147,197,253,.35)",
          boxShadow: "0 10px 25px rgba(0,0,0,.35)",
        },
      }}
    >
      <ListItem
        className="navItem"
        disableGutters
        sx={{
          px: 2,
          py: 1.4,
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,.08)",
          backgroundColor: "rgba(255,255,255,.03)",
          transition: "all .2s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-2px)",
            backgroundColor: "rgba(255,255,255,.06)",
            borderColor: "rgba(255,255,255,.15)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 42,
            color: "#fff", // 🔥 ICONOS BLANCOS
          }}
        >
          {icon}
        </ListItemIcon>

        <ListItemText
          primary={
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 14,
                color: "#fff", // 🔥 TEXTO BLANCO
              }}
            >
              {primary}
            </Typography>
          }
        />

        <ArrowForwardRoundedIcon
          sx={{ fontSize: 18, color: "rgba(255,255,255,.4)" }}
        />
      </ListItem>
    </Box>
  );
});

/* ===========================================
   SIDEBAR
=========================================== */
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

  const goToStore = () => navigate("/home-fashion-three");

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant={variant}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10, // ✅ encima de TODO
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 11, // ✅ encima de TODO
            width: drawerWidth,
            height: "100vh",
            borderRight: "1px solid rgba(255,255,255,.08)",
            background:
              "linear-gradient(180deg, #0b1220 0%, #0f172a 100%)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        {/* ================= LOGO ================= */}
        <Box
          sx={{
            px: 2,
            pt: 3,
            pb: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,.12)",
              backgroundColor: "rgba(255,255,255,.04)",
              boxShadow: "0 18px 45px rgba(0,0,0,.45)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* 🔥 LOGO MÁS GRANDE */}
            <img
              src="/assets/img/logo3.png"
              alt="TeLoRecargo Logo"
              style={{
                width: "90px",     // 🔥 MÁS GRANDE
                maxHeight: "90px",  // 🔥 MÁS GRANDE
                objectFit: "contain",
              }}
            />
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Chip
              size="small"
              label="SuperAdmin Panel"
              sx={{
                fontWeight: 800,
                bgcolor: "rgba(34,197,94,.12)",
                color: "#bbf7d0",
                border: "1px solid rgba(34,197,94,.25)",
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,.08)" }} />

        {/* ================= MENÚ ================= */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            py: 2,
            px: 2,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255,255,255,.2)",
              borderRadius: 20,
            },
          }}
        >
          <Stack spacing={1.3}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "1px",
                color: "rgba(255,255,255,.5)",
              }}
            >
              ACCESOS
            </Typography>

            <ListItem
              disableGutters
              onClick={goToStore}
              sx={{
                px: 2,
                py: 1.4,
                borderRadius: 2,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,.08)",
                backgroundColor: "rgba(255,255,255,.03)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  backgroundColor: "rgba(255,255,255,.06)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: "#fff" }}>
                <StorefrontIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>
                    Ir a Tienda
                  </Typography>
                }
              />
              <ArrowForwardRoundedIcon
                sx={{ fontSize: 18, color: "rgba(255,255,255,.4)" }}
              />
            </ListItem>

            <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,.08)" }} />

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

        {/* ================= FOOTER ================= */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255,255,255,.08)",
            backgroundColor: "rgba(0,0,0,.2)",
          }}
        >
          <List disablePadding>
            <ListItem
              disableGutters
              onClick={handleLogout}
              sx={{
                px: 2,
                py: 1.4,
                borderRadius: 2,
                cursor: "pointer",
                border: "1px solid rgba(239,68,68,.2)",
                background:
                  "linear-gradient(135deg, rgba(239,68,68,.15), rgba(251,113,133,.08))",
                "&:hover": {
                  transform: "translateY(-2px)",
                  borderColor: "rgba(239,68,68,.4)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: "#fecaca" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: 900, fontSize: 14, color: "#fff" }}>
                    Cerrar sesión
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 2,
              textAlign: "center",
              color: "rgba(255,255,255,.5)",
              fontWeight: 700,
            }}
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