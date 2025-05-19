// src/components/admin/NotificacionesForm.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Stack, TextField, MenuItem, Button, IconButton, InputAdornment,
  FormControlLabel, Checkbox, Box, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiPicker from "emoji-picker-react";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";

const mensajesGuardados = [
  "Hola, tu recarga fue procesada ✅",
  "Tu saldo está por agotarse 💸",
  "Gracias por confiar en nosotros 🙌",
  "Recuerda que puedes recargar saldo en cualquier momento."
];

const NotificacionesForm = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState({ user_id: "", mensaje: "", imagen: null });
  const [showEmoji, setShowEmoji] = useState(false);
  const [openPredef, setOpenPredef] = useState(false);
  const [masivo, setMasivo] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    cargarUsuarios();
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarUsuarios = async () => {
    const res = await axios.get("/admin/usuarios");
    setUsuarios(res.data);
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
    if (!validTypes.includes(file.type)) return toast.error("Formato no soportado");
    if (file.size > 1024 * 1024 * 1.5) return toast.error("Máximo 1.5MB");

    const reader = new FileReader();
    reader.onload = () => setNuevo({ ...nuevo, imagen: reader.result });
    reader.readAsDataURL(file);
  };

  const enviar = async () => {
    if (!nuevo.mensaje) return toast.warning("El mensaje es obligatorio");
    if (!masivo && !nuevo.user_id) return toast.warning("Selecciona un usuario");

    const destinatarios = masivo ? usuarios.map(u => u.id) : [nuevo.user_id];

    for (let user_id of destinatarios) {
      try {
        await axios.post("/admin/notificaciones", { ...nuevo, user_id });
      } catch {
        toast.error(`Error al enviar a ID ${user_id}`);
      }
    }

    toast.success("Mensaje enviado");
    setNuevo({ user_id: "", mensaje: "", imagen: null });
  };

  return (
    <Box>
      <Stack spacing={2} direction="row" mb={2} alignItems="center">
        <TextField
          select label="Usuario" value={nuevo.user_id}
          onChange={(e) => setNuevo({ ...nuevo, user_id: e.target.value })}
          sx={{ minWidth: 200 }} disabled={masivo}
        >
          {usuarios.map(u => (
            <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
          ))}
        </TextField>

        <TextField
          multiline rows={2}
          placeholder="Escribe tu mensaje..."
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
                  <input hidden id="imagen-upload" type="file" accept="image/*" onChange={handleImagen} />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ flex: 1 }}
        />

        <Button variant="outlined" onClick={() => setOpenPredef(true)}>
          Mensajes Guardados
        </Button>
        <Button variant="contained" onClick={enviar}>Enviar</Button>
      </Stack>

      <FormControlLabel
        control={<Checkbox checked={masivo} onChange={() => setMasivo(!masivo)} />}
        label="Enviar a todos los usuarios"
        sx={{ mb: 2 }}
      />

      {showEmoji && (
        <Box ref={emojiPickerRef} sx={{ position: 'absolute', zIndex: 999 }}>
          <EmojiPicker onEmojiClick={(e) => setNuevo({ ...nuevo, mensaje: nuevo.mensaje + e.emoji })} />
        </Box>
      )}

      {nuevo.imagen && (
        <Box mb={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <img src={nuevo.imagen} alt="Preview" style={{ maxWidth: 150 }} />
            <IconButton color="error" onClick={() => setNuevo({ ...nuevo, imagen: null })}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        </Box>
      )}

      <Dialog open={openPredef} onClose={() => setOpenPredef(false)}>
        <DialogTitle>Mensajes Predefinidos</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {mensajesGuardados.map((msg, idx) => (
              <Button key={idx} variant="outlined" onClick={() => {
                setNuevo({ ...nuevo, mensaje: msg });
                setOpenPredef(false);
              }}>{msg}</Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPredef(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificacionesForm;
