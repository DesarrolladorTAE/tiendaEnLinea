import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Box,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Button,
  Grid,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  FavoriteBorder as FavoriteIcon,
  CompareArrows as CompareIcon,
  Wallet as WalletIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings,
  Group,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../../api";
import { clearUser, setNotificaciones } from "../../store/slices/userSlice";
import AnimatedModal from "../AnimatedModal";
import axios from "../../axiosConfig";

const IconGroup = ({ isMobile = false, iconColor = "black" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showByeModal, setShowByeModal] = useState(false);
  const [anchorNotif, setAnchorNotif] = useState(null);
  const [anchorAccount, setAnchorAccount] = useState(null);

  const { user, notificaciones = [] } = useSelector((state) => state.user);
  const { compareItems } = useSelector((state) => state.compare);
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const isAgent = user?.role === "agent";
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin";

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    localStorage.clear();
    dispatch(clearUser());
    setShowByeModal(true);
    setTimeout(() => {
      setShowByeModal(false);
      navigate("/loginmui", { replace: true });
    }, 3000);
  };

  const clearAllNotificaciones = async () => {
    await axios.delete("/mis-notificaciones/vaciar");
    dispatch(setNotificaciones([]));
  };

  const handleDeleteNoti = async (id) => {
    await axios.delete(`/mis-notificaciones/${id}`);
    dispatch(setNotificaciones((prev) => prev.filter((n) => n.id !== id)));
  };

  const iconButtons = (
    <>
      {!isAgent && (
        <>
          <Tooltip title="Comparar">
            <IconButton
              component={Link}
              to="/compare"
              sx={{ color: iconColor }}
            >
              <Badge badgeContent={compareItems.length || 0} color="primary">
                <CompareIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Favoritos">
            <IconButton
              component={Link}
              to="/wishlist"
              sx={{ color: iconColor }}
            >
              <Badge badgeContent={wishlistItems.length || 0} color="secondary">
                <FavoriteIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Notificaciones">
            <IconButton
              sx={{ color: iconColor }}
              onClick={(e) => setAnchorNotif(e.currentTarget)}
            >
              <Badge
                badgeContent={
                  notificaciones.length > 9 ? "9+" : notificaciones.length
                }
                color="error"
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorNotif}
            open={Boolean(anchorNotif)}
            onClose={() => setAnchorNotif(null)}
            PaperProps={{ sx: { width: 320 } }}
          >
            <Box
              px={2}
              py={1}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle2">Mis Notificaciones</Typography>
              <IconButton size="small" onClick={clearAllNotificaciones}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <Divider />
            {notificaciones.length ? (
              notificaciones.slice(0, 5).map((msg) => (
                <MenuItem key={msg.id} sx={{ whiteSpace: "normal" }}>
                  <Box>
                    <Typography variant="body2">{msg.mensaje}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteNoti(msg.id)}
                    sx={{ ml: 2 }}
                  >
                    ❌
                  </IconButton>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>Aún no tienes notificaciones 💤</MenuItem>
            )}
          </Menu>

          <Tooltip title="Recargar Saldo">
            <IconButton
              component={Link}
              to="/saldo-recarga"
              sx={{ color: iconColor }}
            >
              <WalletIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
    {!isAgent && (
      <Tooltip title="Mi Cuenta">
        <IconButton
          onClick={(e) => setAnchorAccount(e.currentTarget)}
          sx={{ color: iconColor }}
        >
          <PersonIcon />
        </IconButton>
      </Tooltip>
      )}

      {!isAgent && (
        <Menu
          anchorEl={anchorAccount}
          open={Boolean(anchorAccount)}
          onClose={() => setAnchorAccount(null)}
        >
          <MenuItem component={Link} to="/my-account">
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mi Cuenta</ListItemText>
          </MenuItem>

          <MenuItem component={Link} to="/agent-mipages">
            <ListItemIcon>
              <Group fontSize="small" />
            </ListItemIcon>
            <ListItemText>Agentes</ListItemText>
          </MenuItem>

          {isSuperAdmin && (
            <MenuItem component={Link} to="/admin/dashboard">
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Administración</ListItemText>
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );

  return (
    <Box>
      {isMobile ? (
        <Grid container spacing={1} justifyContent="center">
          {[...iconButtons.props.children].map((icon, index) => (
            <Grid
              item
              xs={6}
              key={index}
              display="flex"
              justifyContent="center"
            >
              {icon}
            </Grid>
          ))}
          <Grid item xs={12} mt={2} display="flex" justifyContent="center">
            <Button
              onClick={handleLogout}
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
            >
              Cerrar Sesión
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Box display="flex" alignItems="center" gap={1}>
          {iconButtons}
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              backgroundColor: "#f44336", // rojo tipo Material UI
              color: "#fff",
              fontWeight: "bold",
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "uppercase",
              "&:hover": {
                backgroundColor: "#d32f2f",
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      )}

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
  isMobile: PropTypes.bool,
  iconColor: PropTypes.string,
};

export default IconGroup;
