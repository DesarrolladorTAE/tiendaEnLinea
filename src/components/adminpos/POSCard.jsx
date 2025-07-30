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
  onIniciarSesion,
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
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2,
        boxShadow: 3,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Encabezado */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          {editando[pos.id] ? (
            <TextField
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
              {pos.name || "Sucursal sin nombre"}
            </Typography>
          )}
          <IconButton
            onClick={() => setEditando((e) => ({ ...e, [pos.id]: true }))}
          >
            <Edit />
          </IconButton>
        </Box>

        {/* Usuario */}
        <Typography variant="body2" color="text.secondary">
          <strong>Usuario:</strong>{" "}
          <span style={{ fontFamily: "monospace", fontSize: "0.95rem" }}>
            {pos.code || "—"}
          </span>
        </Typography>

        {/* Contraseña */}
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
                    <Replay fontSize="small" />
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
            mt: 1,
            "& .MuiInputBase-input": { fontFamily: "monospace" },
          }}
        />

        {/* Botones de acción */}
        <Box mt={3}>
          <Stack spacing={1}>
            <Tooltip
              title={copiado ? "¡Copiado!" : "Copiar usuario y contraseña"}
            >
              <Button
                onClick={copiarAccesos}
                startIcon={<ContentCopy />}
                variant="outlined"
                color="primary"
                fullWidth
                sx={{
                  fontWeight: "500",
                  textTransform: "none",
                  borderRadius: 2,
                  height: 42,
                }}
              >
                Copiar accesos
              </Button>
            </Tooltip>

            <Button
              onClick={() => onIniciarSesion(pos)}
              variant="contained"
              color="success"
              fullWidth
              sx={{
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 2,
                height: 45,
                boxShadow: "0px 2px 8px rgba(0, 128, 0, 0.3)",
              }}
            >
              Iniciar sesión
            </Button>
          </Stack>
        </Box>
      </CardContent>

      {/* Pie: guardar/eliminar */}
      <Box mt="auto" px={2} pb={1}>
        <Stack direction="row" spacing={1} justifyContent="space-between">
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
