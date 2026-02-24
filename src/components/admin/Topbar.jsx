import React, { useState, useEffect } from "react";
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
  Divider,
  Chip,
  alpha,
  Stack,
  Tooltip,
  Popover,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { useSelector } from "react-redux";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";

const MOBILE_H = 104; // ✅ 2 filas
const DESKTOP_H = 74;

const Topbar = ({ onMenuClick, drawerWidth = 270 }) => {
  const notificaciones = useSelector((state) => state.user.notificaciones);
  const user = useSelector((state) => state.user.user);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [saldoTaecel, setSaldoTaecel] = useState(null);

  // Saldo
  const [saldoAnchorEl, setSaldoAnchorEl] = useState(null);
  const saldoOpen = Boolean(saldoAnchorEl);
  const handleSaldoClick = (event) => setSaldoAnchorEl(event.currentTarget);
  const handleSaldoClose = () => setSaldoAnchorEl(null);

  // Notifs
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const notifOpen = Boolean(notifAnchorEl);
  const handleNotifClick = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const getNotificationLabel = () => {
    if (!notificaciones || notificaciones.length === 0) return "0";
    if (notificaciones.length > 9) return "9+";
    return String(notificaciones.length);
  };

  const filteredNotifs =
    notificaciones?.filter(
      (n) =>
        n.visible_para?.includes("admin") ||
        n.visible_para?.includes("superadmin")
    ) || [];

  const fetchSaldo = async () => {
    try {
      const res = await axios.get("/saldo-taecel");
      if (res.data.success) {
        setSaldoTaecel({
          saldo_taecel: parseFloat(res.data.data.saldo_taecel),
          saldo_virtual_asignado: parseFloat(res.data.data.saldo_virtual_asignado),
          saldo_disponible: parseFloat(res.data.data.saldo_disponible),
          updated_at: res.data.data.updated_at,
        });
      }
    } catch {
      toast.error("Error al obtener saldo Taecel");
    }
  };

  useEffect(() => {
    fetchSaldo();
  }, []);

  const fullName = user ? `${user.name || ""} ${user.apellidos || ""}`.trim() : "";

  return (
    <Box sx={{ position: "relative" }}>
      <AppBar
        position="fixed"
        sx={{
          top: 0,

          // ✅ SOLO DESKTOP: que el topbar empiece donde termina el sidebar
          left: isDesktop ? `${drawerWidth}px` : 0,
          width: isDesktop ? `calc(100% - ${drawerWidth}px)` : "100%",

          // (ya no necesitas “empujar” con padding el contenido, porque el AppBar ya está corrido)
          zIndex: (t) => t.zIndex.drawer - 1, // o +1 si lo quisieras encima del drawer

          background: `linear-gradient(135deg, ${alpha("#0b1220", 0.92)}, ${alpha(
            "#111827",
            0.88
          )})`,
          borderBottom: `1px solid ${alpha("#fff", 0.08)}`,
          backdropFilter: "blur(10px)",
          boxShadow: `0 14px 40px ${alpha("#000", 0.25)}`,
        }}
      >
        <Toolbar
          sx={{
            // ✅ Desktop: ya NO metas drawerWidth aquí
            pl: isDesktop ? 2 : 1.2,
            pr: { xs: 1.2, sm: 2 },
            py: isMobile ? 1.1 : 0.8,
            minHeight: isMobile ? MOBILE_H : DESKTOP_H,
            alignItems: "stretch",
          }}
        >
          {isMobile ? (
            // ==========================
            // ✅ MÓVIL: 2 FILAS BONITAS
            // ==========================
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
              {/* Fila 1 */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={onMenuClick}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: alpha("#fff", 0.06),
                    border: `1px solid ${alpha("#fff", 0.08)}`,
                    "&:hover": { backgroundColor: alpha("#fff", 0.09) },
                  }}
                >
                  <MenuIcon />
                </IconButton>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 950,
                      color: "white",
                      fontSize: 15,
                      lineHeight: 1.1,
                    }}
                  >
                    Panel de Administración
                  </Typography>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 12,
                      color: alpha("#fff", 0.6),
                      fontWeight: 700,
                    }}
                  >
                    TeLoRecargo • Control & Monitoreo
                  </Typography>
                </Box>
              </Box>

              {/* Fila 2 */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 1.2,
                  pt: 1,
                  borderTop: `1px solid ${alpha("#fff", 0.08)}`,
                }}
              >
                {/* Nombre completo */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      color: "white",
                      fontSize: 13,
                      lineHeight: 1.1,
                    }}
                  >
                    {fullName || "—"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: alpha("#fff", 0.6),
                      fontWeight: 700,
                    }}
                  >
                    Sesión activa
                  </Typography>
                </Box>

                {/* Acciones */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {saldoTaecel && (
                    <>
                      <Tooltip title="Saldos">
                        <IconButton
                          color="inherit"
                          onClick={handleSaldoClick}
                          sx={{
                            borderRadius: 2,
                            backgroundColor: alpha("#fff", 0.06),
                            border: `1px solid ${alpha("#fff", 0.08)}`,
                            "&:hover": { backgroundColor: alpha("#fff", 0.09) },
                          }}
                        >
                          <MonetizationOnIcon />
                        </IconButton>
                      </Tooltip>

                      <Popover
                        open={saldoOpen}
                        anchorEl={saldoAnchorEl}
                        onClose={handleSaldoClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        PaperProps={{
                          sx: {
                            mt: 1,
                            p: 1.5,
                            width: 320,
                            maxWidth: "92vw",
                            borderRadius: 3,
                            color: "white",
                            border: `1px solid ${alpha("#fff", 0.10)}`,
                            background: `linear-gradient(180deg, ${alpha(
                              "#0b1220",
                              0.95
                            )}, ${alpha("#111827", 0.92)})`,
                            boxShadow: `0 18px 55px ${alpha("#000", 0.35)}`,
                            backdropFilter: "blur(10px)",
                          },
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, mb: 1, color: "white"}}>
                          Saldos Taecel
                        </Typography>

                        <Stack spacing={1}>
                          <Paper
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              bgcolor: alpha("#f59e0b", 0.10),
                              border: `1px solid ${alpha("#f59e0b", 0.22)}`,
                            }}
                          >
                            <Typography variant="caption" fontWeight={900} color="#fde68a">
                              💰 Saldo Taecel
                            </Typography>
                            <Typography variant="body1" fontWeight={900} color="white">
                              ${saldoTaecel.saldo_taecel.toFixed(2)}
                            </Typography>
                          </Paper>

                          <Paper
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              bgcolor: alpha("#60a5fa", 0.10),
                              border: `1px solid ${alpha("#60a5fa", 0.22)}`,
                            }}
                          >
                            <Typography variant="caption" fontWeight={900} color="#bfdbfe">
                              📘 Saldo Asignado
                            </Typography>
                            <Typography variant="body1" fontWeight={900} color="white">
                              ${saldoTaecel.saldo_virtual_asignado.toFixed(2)}
                            </Typography>
                          </Paper>

                          <Paper
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              bgcolor: alpha("#22c55e", 0.10),
                              border: `1px solid ${alpha("#22c55e", 0.22)}`,
                            }}
                          >
                            <Typography variant="caption" fontWeight={900} color="#bbf7d0">
                              🟢 Saldo Disponible
                            </Typography>
                            <Typography variant="body1" fontWeight={900} color="white">
                              ${saldoTaecel.saldo_disponible.toFixed(2)}
                            </Typography>
                          </Paper>
                        </Stack>
                      </Popover>
                    </>
                  )}

                  <Tooltip title="Notificaciones">
                    <IconButton
                      color="inherit"
                      onClick={handleNotifClick}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: alpha("#fff", 0.06),
                        border: `1px solid ${alpha("#fff", 0.08)}`,
                        "&:hover": { backgroundColor: alpha("#fff", 0.09) },
                      }}
                    >
                      <Badge badgeContent={getNotificationLabel()} color="error" overlap="circular">
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>

                  <Popover
                    open={notifOpen}
                    anchorEl={notifAnchorEl}
                    onClose={handleNotifClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        width: 340,
                        maxWidth: "92vw",
                        maxHeight: 340,
                        overflowY: "auto",
                        borderRadius: 3,
                        border: `1px solid ${alpha("#fff", 0.10)}`,
                        background: `linear-gradient(180deg, ${alpha(
                          "#0b1220",
                          0.95
                        )}, ${alpha("#111827", 0.92)})`,
                        boxShadow: `0 22px 70px ${alpha("#000", 0.45)}`,
                        backdropFilter: "blur(10px)",
                      },
                    }}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" fontWeight={900} color="white">
                          Notificaciones
                        </Typography>
                        <Chip
                          size="small"
                          label={`${filteredNotifs.length}`}
                          sx={{
                            height: 22,
                            fontWeight: 900,
                            bgcolor: alpha("#60a5fa", 0.12),
                            color: "#bfdbfe",
                            border: `1px solid ${alpha("#60a5fa", 0.22)}`,
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: 12, color: alpha("#fff", 0.6), fontWeight: 700, mt: 0.5 }}>
                        Solo admin/superadmin
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: alpha("#fff", 0.10) }} />

                    <List sx={{ py: 0 }}>
                      {filteredNotifs.length > 0 ? (
                        filteredNotifs.map((n, i) => (
                          <ListItem
                            key={i}
                            divider
                            sx={{
                              borderBottom: `1px solid ${alpha("#fff", 0.08)}`,
                              "&:hover": { bgcolor: alpha("#fff", 0.05) },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography sx={{ color: "white", fontWeight: 800, fontSize: 13 }}>
                                  {n.mensaje}
                                </Typography>
                              }
                              secondary={
                                <Typography sx={{ color: alpha("#fff", 0.55), fontSize: 11, fontWeight: 700 }}>
                                  {new Date(n.created_at).toLocaleString()}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography sx={{ color: alpha("#fff", 0.8), fontWeight: 800 }}>
                                Aún no tienes notificaciones 💤
                              </Typography>
                            }
                          />
                        </ListItem>
                      )}
                    </List>
                  </Popover>
                </Box>
              </Box>
            </Box>
          ) : (
            // ==========================
            // ✅ DESKTOP: TU LAYOUT NORMAL
            // ==========================
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" fontWeight={950} color="white" sx={{ lineHeight: 1.1 }}>
                  Panel de Administración
                </Typography>
                <Typography sx={{ fontSize: 12, color: alpha("#fff", 0.6), fontWeight: 700 }}>
                  TeLoRecargo • Control & Monitoreo
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {saldoTaecel && (
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`💰 Taecel: $${saldoTaecel.saldo_taecel.toFixed(2)}`}
                      sx={{
                        fontWeight: 900,
                        bgcolor: alpha("#f59e0b", 0.12),
                        color: "#fde68a",
                        border: `1px solid ${alpha("#f59e0b", 0.22)}`,
                      }}
                    />
                    <Chip
                      label={`📘 Asignado: $${saldoTaecel.saldo_virtual_asignado.toFixed(2)}`}
                      sx={{
                        fontWeight: 900,
                        bgcolor: alpha("#60a5fa", 0.12),
                        color: "#bfdbfe",
                        border: `1px solid ${alpha("#60a5fa", 0.22)}`,
                      }}
                    />
                    <Chip
                      label={`🟢 Disponible: $${saldoTaecel.saldo_disponible.toFixed(2)}`}
                      sx={{
                        fontWeight: 900,
                        bgcolor: alpha("#22c55e", 0.12),
                        color: "#bbf7d0",
                        border: `1px solid ${alpha("#22c55e", 0.22)}`,
                      }}
                    />
                  </Stack>
                )}

                <Tooltip title="Notificaciones">
                  <IconButton color="inherit" onClick={handleNotifClick}>
                    <Badge badgeContent={getNotificationLabel()} color="error" overlap="circular">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {user && (
                  <Box sx={{ textAlign: "right", ml: 0.5 }}>
                    <Typography color="white" fontWeight={900} sx={{ fontSize: 13 }}>
                      {fullName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: alpha("#fff", 0.6), fontWeight: 700 }}>
                      Sesión activa
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Desktop Notifs popover */}
              <Popover
                open={notifOpen}
                anchorEl={notifAnchorEl}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    width: 340,
                    maxWidth: "92vw",
                    maxHeight: 340,
                    overflowY: "auto",
                    borderRadius: 3,
                    border: `1px solid ${alpha("#fff", 0.10)}`,
                    background: `linear-gradient(180deg, ${alpha("#0b1220", 0.95)}, ${alpha(
                      "#111827",
                      0.92
                    )})`,
                    boxShadow: `0 22px 70px ${alpha("#000", 0.45)}`,
                    backdropFilter: "blur(10px)",
                  },
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="subtitle1" fontWeight={900} color="white">
                      Notificaciones
                    </Typography>
                    <Chip
                      size="small"
                      label={`${filteredNotifs.length}`}
                      sx={{
                        height: 22,
                        fontWeight: 900,
                        bgcolor: alpha("#60a5fa", 0.12),
                        color: "#bfdbfe",
                        border: `1px solid ${alpha("#60a5fa", 0.22)}`,
                      }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ borderColor: alpha("#fff", 0.10) }} />

                <List sx={{ py: 0 }}>
                  {filteredNotifs.length > 0 ? (
                    filteredNotifs.map((n, i) => (
                      <ListItem
                        key={i}
                        divider
                        sx={{
                          borderBottom: `1px solid ${alpha("#fff", 0.08)}`,
                          "&:hover": { bgcolor: alpha("#fff", 0.05) },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography sx={{ color: "white", fontWeight: 800, fontSize: 13 }}>
                              {n.mensaje}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: alpha("#fff", 0.55), fontSize: 11, fontWeight: 700 }}>
                              {new Date(n.created_at).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: alpha("#fff", 0.8), fontWeight: 800 }}>
                            Aún no tienes notificaciones 💤
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Popover>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Spacer */}
      <Box sx={{ height: isMobile ? MOBILE_H : DESKTOP_H }} />
    </Box>
  );
};

export default Topbar;