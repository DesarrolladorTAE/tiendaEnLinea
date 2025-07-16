import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Replay,
  Visibility,
  VisibilityOff,
  Edit,
  Delete,
  Save,
  ContentCopy,
} from "@mui/icons-material";
import { useTienda } from "../../context/TiendaContext";

const POSCard = ({
  pos,
  editando,
  visibles,
  handleChangeNombre,
  toggleVisibilidad,
  handleGenerate,
  guardarCambios,
  eliminarPunto,
  setEditando,
}) => {
  const { tienda } = useTienda();
  const [copiado, setCopiado] = React.useState(false);

  const copiarAccesos = async () => {
    const texto = `🛒 ¡Tu nuevo Punto de Venta está listo para vender!

🏪 Sucursal: ${pos.name || "Sin nombre"}
👤 Usuario: ${pos.code || "—"}
🔐 Contraseña: ${pos.access_code || "—"}

📍 Plataforma: MiTiendaEnLineaMX.com.mx
🔗 Accede desde: https://mitiendaenlineamx.com.mx/prueba/pos

⚡️ Ingresa con estos datos y comienza a registrar ventas en segundos.
#MiTiendaEnLineaMX 🚀`;

    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <Card
      variant="outlined"
      sx={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {editando[pos.id] ? (
            <TextField
              required
              value={pos.name}
              onChange={(e) => handleChangeNombre(pos.id, e.target.value)}
              fullWidth
              variant="standard"
              InputProps={{
                style: { fontSize: "1.25rem", fontWeight: 500 },
              }}
            />
          ) : (
            <Typography variant="h6" fontWeight="bold">
              {pos.name || "Sin nombre"}
            </Typography>
          )}
          <IconButton
            onClick={() => setEditando((e) => ({ ...e, [pos.id]: true }))}
          >
            <Edit />
          </IconButton>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{ mt: 2, fontSize: "0.95rem", color: "text.secondary" }}
        >
          <b>Usuario:</b>{" "}
          <span style={{ fontFamily: "monospace" }}>{pos.code || "—"}</span>
        </Typography>

        <TextField
          label="Contraseña"
          variant="standard"
          fullWidth
          type={visibles[pos.id] ? "text" : "password"}
          value={pos.access_code}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Regenerar contraseña">
                  <IconButton
                    onClick={() => handleGenerate(pos.id)}
                    sx={{ visibility: visibles[pos.id] ? "visible" : "hidden" }}
                  >
                    <Replay />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Ver/Ocultar">
                  <IconButton onClick={() => toggleVisibilidad(pos.id)}>
                    {visibles[pos.id] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{
            mt: 0.5,
            "& .MuiInputBase-root": { minHeight: 40 },
            "& .MuiInputBase-input": { fontFamily: "monospace" },
          }}
        />

        <Box display="flex" justifyContent="end" mt={2}>
          <Tooltip
            title={copiado ? "¡Copiado!" : "Copiar usuario y contraseña"}
          >
            <Button
              size="small"
              startIcon={<ContentCopy />}
              onClick={copiarAccesos}
              color="primary"
              variant="outlined"
            >
              Copiar accesos
            </Button>
          </Tooltip>
        </Box>
      </CardContent>

      <Box px={2} pb={2}>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<Save />}
            onClick={() => guardarCambios(pos.id)}
            disabled={!pos.name?.trim()}
            sx={{ visibility: editando[pos.id] ? "visible" : "hidden" }}
          >
            Guardar
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => eliminarPunto(pos.id)}
          >
            Eliminar
          </Button>
        </Stack>
      </Box>
    </Card>
  );
};

export default POSCard;
