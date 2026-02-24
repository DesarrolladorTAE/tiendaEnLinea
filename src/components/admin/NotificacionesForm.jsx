// src/components/admin/NotificacionesForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Stack,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Autocomplete,
  Divider,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import EmojiPicker from "emoji-picker-react";
import axios from "../../axiosConfig";

import Swal from "sweetalert2";
import { motion } from "framer-motion";

const MotionPaper = motion(Paper);

const TransitionUp = React.forwardRef(function TransitionUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const blockAutoComplete = {
  autoComplete: "off",
  inputProps: {
    autoComplete: "new-password",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: "false",
  },
};

const NotificacionesForm = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [visible, setVisible] = useState(false);

  const [mensajesGuardados, setMensajesGuardados] = useState([
    `📆 ¡Cierre de mes! Última llamada para facturar tus compras

⏰ Estimado usuario,
Recuerda que solo tienes hasta el último día del mes a las 11:00 PM para solicitar la factura de tus compras realizadas este mes 🧾

Después de esa fecha, por normativas fiscales, no será posible generar factura retroactiva.

🔹 Si ya compraste y aún no has facturado, entra a tu panel y solicita tu factura hoy mismo.
🔹 Si tienes dudas, podemos ayudarte a generar tu factura paso a paso.

📲 Ingresa ahora: www.telorecargo.com

No dejes pasar esta oportunidad de mantener tu contabilidad en orden.
¡Estamos para ayudarte!`,

    `🎉 ¡Gracias por tu primera compra en TeLoRecargo!

👏 Felicidades por activar tu cuenta y aprovechar tu bono del 10% en la primera recarga.
¡Eso solo fue el comienzo! 🎊

💥 A partir de ahora puedes seguir ganando el 10% de comisión en todas tus recargas
✔️ Sin mínimos de compra
✔️ Sin complicaciones
✔️ Con soporte personalizado
✔️ Disponible 24/7

💡 ¿Tienes una tienda, papelería, miscelánea o vendes desde casa?
Con TeLoRecargo puedes hacer crecer tu ingreso desde el primer clic.

📲 Entra ahora y sigue ganando:
👉 www.telorecargo.com

Gracias por confiar en nosotros. ¡Seguimos contigo en este camino de crecimiento!`,

    `🔔 Recordatorio: ¡Tu 10% de comisión aún está disponible!

👋 Hola [Nombre],

Notamos que aún no has realizado tu primera recarga y queremos recordarte que sigue activo tu bono exclusivo del 10% de comisión 💰

🟢 Compra $500 y recibe $550
🟢 Compra $1,000 y recibes $1,100
🟢 Solo se activa en tu primera compra, sin requisitos ni montos mínimos

Esta oportunidad es única y solo se da una vez. Aprovecha para empezar a ganar desde hoy mismo, sin complicaciones.

📲 Ingresa a tu cuenta y haz tu primera recarga:
👉 www.telorecargo.com

¿Necesitas ayuda? Escribe QUIERO MI 10% y con gusto te guiamos paso a paso.`,

    `💤 Mensaje de Inactividad

📢 ¡Te extrañamos en TeLoRecargo!
Notamos que no has ingresado a tu cuenta recientemente y queremos recordarte que tu negocio sigue activo y listo para generar ingresos 💸

👉 Con TeLoRecargo puedes seguir vendiendo recargas de todas las marcas con comisiones desde el 3.5% hasta el 10%, sin montos mínimos y con soporte personalizado.

🎁 Si aún no hiciste tu primera compra, ¡puedes aprovechar el 10% de comisión exclusiva por activación!
Ejemplo: Compra $1000 y recibes $1100 en saldo 🔥

📲 Ingresa ahora desde: www.telorecargo.com

Si necesitas ayuda para continuar, estamos para apoyarte en todo momento. Solo responde: NECESITO AYUDA`,
  ]);

  const [nuevo, setNuevo] = useState({
    user_id: "",
    mensaje: "",
    imagen: null,
  });

  const [showEmoji, setShowEmoji] = useState(false);
  const [openPredef, setOpenPredef] = useState(false);
  const [masivo, setMasivo] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");

  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [sending, setSending] = useState(false);

  const emojiPickerRef = useRef(null);
  const autoInputRef = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const blurActive = () => {
    try {
      const el = document?.activeElement;
      if (el && typeof el.blur === "function") el.blur();
    } catch (e) {}
  };

  const fullName = (u) => {
    const last =
      u?.apellidos ||
      u?.last_name ||
      u?.lastname ||
      u?.surname ||
      [u?.paternal_last_name, u?.maternal_last_name].filter(Boolean).join(" ");

    return [u?.name, last].filter(Boolean).join(" ").trim() || "Sin nombre";
  };

  useEffect(() => {
    cargarUsuarios();
    document.addEventListener("mousedown", handleClickOutside);
    setVisible(true);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClickOutside = (e) => {
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
      setShowEmoji(false);
    }
  };

  const errMsg = (err) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Ocurrió un error inesperado";

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await axios.get("/admin/usuarios");
      const soloUsuarios = (res.data || []).filter((u) => u.role === "usuario");
      setUsuarios(soloUsuarios);
    } catch (err) {
      blurActive();
      Swal.fire({
        icon: "error",
        title: "No se pudieron cargar usuarios",
        text: errMsg(err),
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const usuariosMap = useMemo(() => usuarios, [usuarios]);

  const handleImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      blurActive();
      return Swal.fire({
        icon: "warning",
        title: "Formato no soportado",
        text: "Solo JPG, PNG o WEBP.",
        confirmButtonText: "Ok",
      });
    }
    if (file.size > 1024 * 1024 * 1.5) {
      blurActive();
      return Swal.fire({
        icon: "warning",
        title: "Archivo muy grande",
        text: "Máximo 1.5MB.",
        confirmButtonText: "Ok",
      });
    }

    const reader = new FileReader();
    reader.onload = () =>
      setNuevo((prev) => ({ ...prev, imagen: reader.result }));
    reader.readAsDataURL(file);
  };

  const validar = () => {
    if (!nuevo.mensaje?.trim()) {
      blurActive();
      Swal.fire({
        icon: "warning",
        title: "Falta el mensaje",
        text: "Escribe el mensaje antes de enviar.",
        confirmButtonText: "Ok",
      });
      return false;
    }
    if (!masivo && !nuevo.user_id) {
      blurActive();
      Swal.fire({
        icon: "warning",
        title: "Selecciona un usuario",
        text: "Si no es masivo, debes elegir un destinatario.",
        confirmButtonText: "Ok",
      });
      return false;
    }
    return true;
  };

  const enviar = async () => {
    if (sending) return;
    if (!validar()) return;

    blurActive();

    const destinatarios = masivo ? usuariosMap.map((u) => u.id) : [nuevo.user_id];

    const preview = masivo
      ? `Se enviará a ${destinatarios.length} usuarios.`
      : "Se enviará al usuario seleccionado.";

    const confirm = await Swal.fire({
      icon: "question",
      title: "¿Enviar notificación?",
      html: `
        <div style="text-align:left;">
          <div style="margin-bottom:6px;"><b>Destino:</b> ${preview}</div>
          <div style="margin-bottom:6px;"><b>Imagen:</b> ${
            nuevo.imagen ? "Sí" : "No"
          }</div>
          <div style="margin-top:10px; padding:10px; border-radius:10px; background:rgba(0,0,0,0.04); max-height:140px; overflow:auto;">
            ${String(nuevo.mensaje).replace(/\n/g, "<br/>")}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setSending(true);
    try {
      let ok = 0;
      let fail = 0;

      for (const user_id of destinatarios) {
        try {
          await axios.post("/admin/notificaciones", { ...nuevo, user_id });
          ok += 1;
        } catch (err) {
          fail += 1;
        }
      }

      blurActive();
      if (fail === 0) {
        await Swal.fire({
          icon: "success",
          title: "Enviado ✅",
          text: `Notificación enviada correctamente (${ok}).`,
          confirmButtonText: "Listo",
        });
      } else {
        await Swal.fire({
          icon: "warning",
          title: "Envío parcial",
          text: `Enviados: ${ok} | Fallidos: ${fail}.`,
          confirmButtonText: "Entendido",
        });
      }

      setNuevo({ user_id: "", mensaje: "", imagen: null });

      setTimeout(() => autoInputRef.current?.blur?.(), 0);
    } catch (err) {
      blurActive();
      Swal.fire({
        icon: "error",
        title: "No se pudo enviar",
        text: errMsg(err),
        confirmButtonText: "Ok",
      });
    } finally {
      setSending(false);
    }
  };

  const abrirEdicion = (idx, texto) => {
    blurActive();
    setEditIndex(idx);
    setEditText(texto);
  };

  const guardarEdicion = async () => {
    if (editIndex === null) return;

    blurActive();
    const ok = await Swal.fire({
      icon: "question",
      title: "Guardar cambios",
      text: "¿Deseas actualizar este mensaje predefinido?",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!ok.isConfirmed) return;

    const actualizados = [...mensajesGuardados];
    actualizados[editIndex] = editText;
    setMensajesGuardados(actualizados);
    setEditIndex(null);
    setEditText("");

    blurActive();
    Swal.fire({
      icon: "success",
      title: "Actualizado ✨",
      text: "Mensaje editado correctamente.",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const limpiarImagen = async () => {
    blurActive();
    const c = await Swal.fire({
      icon: "warning",
      title: "Quitar imagen",
      text: "¿Deseas eliminar la imagen adjunta?",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (!c.isConfirmed) return;

    setNuevo((prev) => ({ ...prev, imagen: null }));

    blurActive();
    Swal.fire({
      icon: "success",
      title: "Listo",
      text: "Imagen eliminada.",
      timer: 900,
      showConfirmButton: false,
    });
  };

  return (
    <Slide
      in={visible}
      direction="up"
      timeout={500}
      mountOnEnter
      unmountOnExit={false}
    >
      <MotionPaper
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.92
          )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
          backdropFilter: "blur(10px)",
          boxShadow: `0 16px 50px ${alpha("#000", 0.08)}`,
          position: "relative",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: -2,
            background: `radial-gradient(800px 200px at 20% 0%, ${alpha(
              theme.palette.primary.main,
              0.12
            )} 0%, transparent 60%)`,
            pointerEvents: "none",
          },
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={1.2}
          sx={{ position: "relative" }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.2 }}>
              ✉️ Enviar Notificación a Usuarios
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
              Bloqueo de envío + confirmaciones + sin autocompletado.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip
              label={masivo ? "Modo masivo" : "Modo individual"}
              sx={{
                fontWeight: 800,
                borderRadius: 999,
                bgcolor: alpha(
                  masivo ? theme.palette.warning.main : theme.palette.info.main,
                  0.14
                ),
                color: masivo ? theme.palette.warning.main : theme.palette.info.main,
              }}
            />
            <Tooltip title="Recargar usuarios">
              <span>
                <IconButton
                  onClick={cargarUsuarios}
                  disabled={loadingUsuarios || sending}
                  sx={{
                    borderRadius: 999,
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                  }}
                >
                  {loadingUsuarios ? (
                    <CircularProgress size={18} />
                  ) : (
                    <RefreshRoundedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2, opacity: 0.7 }} />

        {/* FORM */}
        <Box
          component="form"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
          sx={{ position: "relative" }}
        >
          {/* ✅ NUEVO LAYOUT: en escritorio grid 3 cols; en móvil stack */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              alignItems: "start",
              gridTemplateColumns: {
                xs: "1fr",
                md: "320px 1fr 180px",
              },
            }}
          >
            {/* Col 1: usuario */}
            <Box sx={{ minWidth: 0 }}>
              <Autocomplete
                disabled={masivo || sending}
                loading={loadingUsuarios}
                options={usuariosMap}
                disablePortal
                blurOnSelect
                clearOnBlur={false}
                openOnFocus={false}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                getOptionLabel={(option) => fullName(option)}
                onChange={(e, value) =>
                  setNuevo((prev) => ({ ...prev, user_id: value?.id || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar usuario…"
                    inputRef={autoInputRef}
                    autoComplete="off"
                    type="search"
                    name="notifs_user_search__dont_fill"
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: "new-password",
                      autoCorrect: "off",
                      autoCapitalize: "off",
                      spellCheck: "false",
                      name: "notifs_user_search__dont_fill",
                    }}
                  />
                )}
              />

              {/* Tip visual en escritorio */}
              {!isMobile && (
                <Typography
                  sx={{ mt: 1, fontSize: 12.5, color: "text.secondary" }}
                >
                  Selecciona un usuario o activa “Enviar a todos”.
                </Typography>
              )}
            </Box>

            {/* Col 2: mensaje */}
            <Box sx={{ minWidth: 0 }}>
              <TextField
                label="Mensaje"
                multiline
                rows={isMobile ? 6 : 10}
                placeholder="Escribe tu mensaje personalizado…"
                value={nuevo.mensaje}
                disabled={sending}
                onChange={(e) =>
                  setNuevo((prev) => ({ ...prev, mensaje: e.target.value }))
                }
                {...blockAutoComplete}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Emojis">
                        <span>
                          <IconButton
                            onClick={() => setShowEmoji((v) => !v)}
                            disabled={sending}
                          >
                            <InsertEmoticonIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Adjuntar imagen (JPG/PNG/WEBP)">
                        <span>
                          <IconButton
                            component="label"
                            htmlFor="imagen-upload"
                            disabled={sending}
                          >
                            <ImageIcon />
                            <input
                              hidden
                              id="imagen-upload"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImagen}
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.background.paper, 0.55),
                    backdropFilter: "blur(10px)",
                    transition: "transform .15s ease, box-shadow .15s ease",
                    "&:hover": {
                      boxShadow: `0 12px 30px ${alpha("#000", 0.1)}`,
                    },
                    "&:focus-within": {
                      transform: "translateY(-1px)",
                    },
                  },
                }}
              />
            </Box>

            {/* Col 3: acciones */}
            <Stack spacing={1.2} sx={{ minWidth: 0 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  blurActive();
                  setOpenPredef(true);
                }}
                disabled={sending}
                startIcon={<CollectionsRoundedIcon />}
                fullWidth
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  fontWeight: 900,
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.6),
                    background: alpha(theme.palette.primary.main, 0.06),
                  },
                }}
              >
                Mensajes
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={sending || loadingUsuarios}
                startIcon={
                  sending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SendRoundedIcon />
                  )
                }
                fullWidth
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  fontWeight: 900,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 14px 36px ${alpha(theme.palette.primary.main, 0.22)}`,
                  "&:hover": {
                    boxShadow: `0 18px 48px ${alpha(theme.palette.primary.main, 0.28)}`,
                  },
                }}
              >
                {sending ? "Enviando…" : "Enviar"}
              </Button>
            </Stack>
          </Box>

          {/* Checkbox masivo */}
          <FormControlLabel
            control={
              <Checkbox
                checked={masivo}
                disabled={sending}
                onChange={() => {
                  blurActive();
                  setMasivo((v) => !v);
                  setNuevo((prev) => ({ ...prev, user_id: "" }));
                }}
              />
            }
            label="📢 Enviar a todos los Usuarios"
            sx={{
              mt: 1.5,
              mb: 0.5,
              "& .MuiTypography-root": { fontWeight: 700 },
            }}
          />

          {/* Emoji picker */}
          {showEmoji && (
            <Box
              ref={emojiPickerRef}
              sx={{
                position: "absolute",
                zIndex: 999,
                mt: 1,
                right: 0,
                boxShadow: `0 22px 60px ${alpha("#000", 0.25)}`,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <EmojiPicker
                onEmojiClick={(e) =>
                  setNuevo((prev) => ({ ...prev, mensaje: prev.mensaje + e.emoji }))
                }
              />
            </Box>
          )}
        </Box>

        {/* Preview imagen */}
        {nuevo.imagen && (
          <Box
            mt={2}
            sx={{
              p: 1.5,
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
              background: alpha(theme.palette.background.paper, 0.55),
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <img
                src={nuevo.imagen}
                alt="Preview"
                style={{
                  width: 92,
                  height: 92,
                  objectFit: "cover",
                  borderRadius: 14,
                  border: `1px solid ${alpha("#000", 0.08)}`,
                }}
              />
              <Box flex={1}>
                <Typography sx={{ fontWeight: 900 }}>Imagen adjunta</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                  Se enviará junto con el mensaje.
                </Typography>
              </Box>

              <Tooltip title="Quitar imagen">
                <span>
                  <IconButton color="error" onClick={limpiarImagen} disabled={sending}>
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Box>
        )}

        {/* Mensajes guardados */}
        <Dialog
          open={openPredef}
          onClose={() => {
            blurActive();
            setOpenPredef(false);
          }}
          TransitionComponent={TransitionUp}
          fullWidth
          maxWidth="md"
          keepMounted
          disableRestoreFocus
          disableEnforceFocus
        >
          <DialogTitle sx={{ fontWeight: 900 }}>💬 Mensajes Predefinidos</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1.2}>
              {mensajesGuardados.map((msg, idx) => (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{
                    p: 1.4,
                    borderRadius: 3,
                    borderColor: alpha(theme.palette.divider, 0.8),
                    transition: "transform .15s ease, box-shadow .15s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 16px 36px ${alpha("#000", 0.1)}`,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="text"
                      disabled={sending}
                      sx={{
                        flexGrow: 1,
                        justifyContent: "flex-start",
                        textTransform: "none",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      onClick={() => {
                        blurActive();
                        setNuevo((prev) => ({ ...prev, mensaje: msg }));
                        setOpenPredef(false);
                        Swal.fire({
                          icon: "success",
                          title: "Mensaje cargado",
                          timer: 900,
                          showConfirmButton: false,
                        });
                      }}
                    >
                      {msg}
                    </Button>

                    <Tooltip title="Editar">
                      <span>
                        <IconButton size="small" onClick={() => abrirEdicion(idx, msg)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                blurActive();
                setOpenPredef(false);
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Editar mensaje */}
        <Dialog
          open={editIndex !== null}
          onClose={() => {
            blurActive();
            setEditIndex(null);
          }}
          TransitionComponent={TransitionUp}
          maxWidth="md"
          fullWidth
          keepMounted
          disableRestoreFocus
          disableEnforceFocus
        >
          <DialogTitle sx={{ fontWeight: 900 }}>🛠️ Editar Mensaje</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              {...blockAutoComplete}
              sx={{
                mt: 1,
                "& .MuiOutlinedInput-root": { borderRadius: 3 },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                blurActive();
                setEditIndex(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={guardarEdicion} variant="contained" sx={{ fontWeight: 900 }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </MotionPaper>
    </Slide>
  );
};

export default NotificacionesForm;