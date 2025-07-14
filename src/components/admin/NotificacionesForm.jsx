// src/components/admin/NotificacionesForm.jsx
import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EmojiPicker from "emoji-picker-react";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";

const NotificacionesForm = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [mensajesGuardados, setMensajesGuardados] = useState([
    // Mensaje original de cierre de mes
    `📆 ¡Cierre de mes! Última llamada para facturar tus compras

⏰ Estimado usuario,
Recuerda que solo tienes hasta el último día del mes a las 11:00 PM para solicitar la factura de tus compras realizadas este mes 🧾

Después de esa fecha, por normativas fiscales, no será posible generar factura retroactiva.

🔹 Si ya compraste y aún no has facturado, entra a tu panel y solicita tu factura hoy mismo.
🔹 Si tienes dudas, podemos ayudarte a generar tu factura paso a paso.

📲 Ingresa ahora: www.telorecargo.com

No dejes pasar esta oportunidad de mantener tu contabilidad en orden.
¡Estamos para ayudarte!`,

    // // Mensajes cortos previos
    // "💳 Recuerda que puedes recargar saldo desde el menú principal.",
    // "⚠️ Si tienes problemas al recargar, actualiza la app o borra caché.",
    // "✅ Tu recarga fue aplicada con éxito. ¡Gracias por usar TeLoRecargo!",
    // "🤝 Nuestro equipo de soporte está disponible por WhatsApp si necesitas ayuda.",

    // NUEVO 1: Agradecimiento por primera compra
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

    // NUEVO 2: Recordatorio del bono
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

    // NUEVO 3: Mensaje de inactividad
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
  const [visible, setVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");

  const emojiPickerRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    cargarUsuarios();
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarUsuarios = async () => {
    const res = await axios.get("/admin/usuarios");
    const soloUsuarios = res.data.filter((u) => u.role === "usuario");
    setUsuarios(soloUsuarios);
    setVisible(true);
  };

  const handleClickOutside = (e) => {
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
      setShowEmoji(false);
    }
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type))
      return toast.error("⚠️ Formato no soportado");
    if (file.size > 1024 * 1024 * 1.5) return toast.error("⚠️ Máximo 1.5MB");

    const reader = new FileReader();
    reader.onload = () => setNuevo({ ...nuevo, imagen: reader.result });
    reader.readAsDataURL(file);
  };

  const enviar = async () => {
    if (!nuevo.mensaje) return toast.warning("✏️ El mensaje es obligatorio");
    if (!masivo && !nuevo.user_id)
      return toast.warning("👤 Selecciona un usuario");

    const destinatarios = masivo ? usuarios.map((u) => u.id) : [nuevo.user_id];

    for (let user_id of destinatarios) {
      try {
        await axios.post("/admin/notificaciones", { ...nuevo, user_id });
      } catch {
        toast.error(`❌ Error al enviar a ID ${user_id}`);
      }
    }

    toast.success("📤 Mensaje enviado correctamente");
    setNuevo({ user_id: "", mensaje: "", imagen: null });
  };

  const abrirEdicion = (idx, texto) => {
    setEditIndex(idx);
    setEditText(texto);
  };

  const guardarEdicion = () => {
    const actualizados = [...mensajesGuardados];
    actualizados[editIndex] = editText;
    setMensajesGuardados(actualizados);
    setEditIndex(null);
    setEditText("");
  };

  return (
    <Slide in={visible} direction="up" timeout={500}>
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#f7f9fc" }} elevation={3}>
        <Typography variant="h6" mb={2} sx={{ color: "#12344d" }}>
          ✉️ Enviar Notificación a Usuarios
        </Typography>

        <Stack
          spacing={2}
          direction={isMobile ? "column" : "row"}
          alignItems="flex-start"
          mb={2}
        >
          <Autocomplete
            disabled={masivo}
            options={usuarios}
            getOptionLabel={(option) => option.name}
            onChange={(e, value) =>
              setNuevo({ ...nuevo, user_id: value?.id || "" })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar usuario..."
                sx={{ minWidth: 250 }}
              />
            )}
          />
          <TextField
            multiline
            rows={5} // antes estaba en 2
            placeholder="Escribe tu mensaje personalizado..."
            value={nuevo.mensaje}
            onChange={(e) => setNuevo({ ...nuevo, mensaje: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowEmoji(!showEmoji)}>
                    <InsertEmoticonIcon />
                  </IconButton>
                  <IconButton component="label" htmlFor="imagen-upload">
                    <ImageIcon />
                    <input
                      hidden
                      id="imagen-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImagen}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
          />

          <Button variant="outlined" onClick={() => setOpenPredef(true)}>
            📚 Mensajes Guardados
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: "#12344d" }}
            onClick={enviar}
          >
            🚀 Enviar
          </Button>
        </Stack>

        <FormControlLabel
          control={
            <Checkbox checked={masivo} onChange={() => setMasivo(!masivo)} />
          }
          label="📢 Enviar a todos los Usuarios"
          sx={{ mb: 2 }}
        />

        {showEmoji && (
          <Box ref={emojiPickerRef} sx={{ position: "absolute", zIndex: 999 }}>
            <EmojiPicker
              onEmojiClick={(e) =>
                setNuevo({ ...nuevo, mensaje: nuevo.mensaje + e.emoji })
              }
            />
          </Box>
        )}

        {nuevo.imagen && (
          <Box mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <img
                src={nuevo.imagen}
                alt="Preview"
                style={{ maxWidth: 150, borderRadius: 8 }}
              />
              <IconButton
                color="error"
                onClick={() => setNuevo({ ...nuevo, imagen: null })}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Diálogo de mensajes guardados */}
        <Dialog open={openPredef} onClose={() => setOpenPredef(false)}>
          <DialogTitle>💬 Mensajes Predefinidos</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              {mensajesGuardados.map((msg, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Button
                    variant="outlined"
                    sx={{ flexGrow: 1, justifyContent: "flex-start" }}
                    onClick={() => {
                      setNuevo({ ...nuevo, mensaje: msg });
                      setOpenPredef(false);
                    }}
                  >
                    {msg}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => abrirEdicion(idx, msg)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPredef(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para editar un mensaje */}
        <Dialog
          open={editIndex !== null}
          onClose={() => setEditIndex(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>🛠️ Editar Mensaje</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={6} // más alto
              sx={{ mt: 2, minHeight: 200 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditIndex(null)}>Cancelar</Button>
            <Button onClick={guardarEdicion} variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Slide>
  );
};

export default NotificacionesForm;
