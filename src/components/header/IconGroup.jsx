import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import {
  Search,
  Compare,
  Favorite,
  ShoppingBag,
  People,
  AccountBalanceWallet,
  Person,
  ExitToApp,
  AdminPanelSettings
} from "@mui/icons-material";
import { logoutUser } from "../../api";
import { clearUser } from "../../store/slices/userSlice";
import AnimatedModal from "../AnimatedModal";

const IconGroup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showByeModal, setShowByeModal] = useState(false);

  const { compareItems } = useSelector((state) => state.compare);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.user);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(clearUser());
      navigate("/login");
      return;
    }

    try {
      await logoutUser();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(clearUser());
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/login");
      }, 3000);
    } catch (error) {
      dispatch(clearUser());
      setShowByeModal(true);
      setTimeout(() => {
        setShowByeModal(false);
        navigate("/login");
      }, 3000);
    }
  };

  return (
    <Box>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/compare">
            <ListItemIcon><Compare /></ListItemIcon>
            <ListItemText primary={`Comparar (${compareItems?.length || 0})`} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/wishlist">
            <ListItemIcon><Favorite /></ListItemIcon>
            <ListItemText primary={`Favoritos (${wishlistItems?.length || 0})`} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/cart">
            <ListItemIcon><ShoppingBag /></ListItemIcon>
            <ListItemText primary={`Carrito (${cartItems?.length || 0})`} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/mycontacts">
            <ListItemIcon><People /></ListItemIcon>
            <ListItemText primary="Mis Contactos" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/recargar-saldo">
            <ListItemIcon><AccountBalanceWallet /></ListItemIcon>
            <ListItemText primary="Recargar Saldo" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Opciones de cuenta */}
      <Typography variant="subtitle1" sx={{ pl: 2, mb: 1 }}>
        Cuenta
      </Typography>

      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/my-account">
            <ListItemIcon><Person /></ListItemIcon>
            <ListItemText primary="Mi Cuenta" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/wallet">
            <ListItemIcon><AccountBalanceWallet /></ListItemIcon>
            <ListItemText primary="Tarjetas" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/historial-recargas">
            <ListItemIcon><ShoppingBag /></ListItemIcon>
            <ListItemText primary="Mis Compras" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="*">
            <ListItemIcon><Search /></ListItemIcon>
            <ListItemText primary="Librerías" />
          </ListItemButton>
        </ListItem>

        {user?.role === "superadmin" && (
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin/dashboard">
              <ListItemIcon><AdminPanelSettings /></ListItemIcon>
              <ListItemText primary="Administración" />
            </ListItemButton>
          </ListItem>
        )}

        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><ExitToApp /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Modal de despedida */}
      <AnimatedModal
        isOpen={showByeModal}
        onRequestClose={() => setShowByeModal(false)}
        message="¡Hasta luego! Esperamos verte pronto 😊"
        tipo="bye"
      />
    </Box>
  );
};

IconGroup.propTypes = {
  iconWhiteClass: PropTypes.string,
};

export default IconGroup;
