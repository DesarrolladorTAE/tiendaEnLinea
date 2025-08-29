// src/components/micuenta/EditarDatosTaeconta.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Divider,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axiosClient from "../../config/axiosClient";
import {
  showError,
  alertFromApiResult,
  alertFromAxiosError,
} from "../../utils/alerts";

// --- Estilo claro para inputs (blanco incluso en disabled) ---
const lightTextFieldSx = {
  "& .MuiInputBase-input": {
    color: "#fff",
    "::placeholder": { color: "rgba(255,255,255,0.85)", opacity: 1 },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.9)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#fff",
  },
  "& .MuiInputLabel-root.Mui-disabled": {
    color: "rgba(255,255,255,0.7)",
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "rgba(255,255,255,0.45)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.75)" },
    "&.Mui-focused fieldset": { borderColor: "#fff" },
    "&.Mui-disabled fieldset": { borderColor: "rgba(255,255,255,0.3)" },
  },
  "& .MuiInputBase-root.Mui-disabled .MuiInputBase-input": {
    WebkitTextFillColor: "rgba(255,255,255,0.95)",
  },
};

const resumenCampos = [
  ["nombre", "Nombre / Razón social"],
  ["rfc", "RFC"],
  ["telefono", "Teléfono"],
  ["codigo_postal_id", "C.P. fiscal"],
  ["estado", "Estado de cuenta"],
];

const timbradoCampos = [
//   ["timbres", "Timbres actuales"],
  ["timbresAsignados", "Timbres"],
  ["facturasTimbradas", "Facturas timbradas"],
  ["facturasCanceladas", "Facturas canceladas"],
//   ["virtual_balance", "Saldo virtual"],
];

const Label = ({ children }) => (
  <Typography variant="caption" sx={{ color: "#e5e7eb" }}>
    {children}
  </Typography>
);
const Valor = ({ children }) => (
  <Typography sx={{ color: "#fff", fontWeight: 600 }}>{children ?? "—"}</Typography>
);

export default function EditarDatosTaeconta() {
  const [form, setForm] = useState({ correo_tae: "", contra_tae: "" });
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const correoRef = useRef(null);

  // Para restaurar en "Cancelar"
  const [initialCreds, setInitialCreds] = useState({ correo_tae: "", has_password: false });

  // Cargar credenciales + empresa (el backend ya consulta TAEconta)
useEffect(() => {
  (async () => {
    try {
      const { data } = await axiosClient.get("/perfil/tae");
      setEmpresa(data?.empresa ?? null);

      const correo = data?.credenciales?.correo_tae ?? "";
      const hasPass = !!data?.credenciales?.has_password;

      setForm({ correo_tae: correo, contra_tae: hasPass ? "********" : "" });
      setInitialCreds({ correo_tae: correo, has_password: hasPass });

      setEditMode(!(correo && hasPass));
      if (!(correo && hasPass)) setTimeout(() => correoRef.current?.focus(), 0);

      // 🔕 SIN alerta de éxito; solo alerta si la API vino en error
      if (data?.status !== true) {
        await alertFromApiResult(data, undefined, "No se pudo consultar TAEconta");
      }
    } catch (err) {
      alertFromAxiosError(err, "No se pudo cargar TAEconta");
    }
  })();
}, []);


  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Guardar credenciales (el backend guarda y consulta TAEconta; devuelve empresa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editMode) return;

    // Pedimos contraseña real, no asteriscos
    if (!form.contra_tae || form.contra_tae === "********") {
      showError(
        "Por seguridad, cuando edites credenciales debes escribir la contraseña completa."
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosClient.post("/perfil/tae", {
        correo_tae: form.correo_tae,
        contra_tae: form.contra_tae,
      });

      await alertFromApiResult(data, "Credenciales actualizadas", "No se pudo actualizar");

      if (data?.status === true) {
        setEmpresa(data?.empresa ?? null);
        setEditMode(false);
        setInitialCreds({ correo_tae: form.correo_tae, has_password: true });
        setForm((p) => ({ ...p, contra_tae: "********" })); // enmascara de nuevo
      }
    } catch (err) {
      alertFromAxiosError(err, "No se pudieron guardar las credenciales");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setForm((p) => ({ ...p, contra_tae: "" })); // fuerza captura real
    setTimeout(() => correoRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      correo_tae: initialCreds.correo_tae || "",
      contra_tae: initialCreds.has_password ? "********" : "",
    });
  };

  const indicadorChips = useMemo(() => {
    const val = empresa?.indicador;
    if (!val) return [];
    return String(val)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [empresa]);

  const saveDisabled =
    loading ||
    !editMode ||
    !form.correo_tae ||
    !form.contra_tae ||
    form.contra_tae === "********";

  return (
    <>
      <Card sx={{ mb: 4, backgroundColor: "#1f2937", color: "#fff" }}>
        <CardContent>
          <Typography variant="h6" color="#fff" gutterBottom>
            🔐 Conectar con TAEconta
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ La administración de estas credenciales es responsabilidad del usuario.
            Si cambias la contraseña en TAEconta, debes actualizarla también aquí para que el sistema siga funcionando.
          </Alert>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              sx={lightTextFieldSx}
              label="Correo TAEconta"
              name="correo_tae"
              value={form.correo_tae}
              onChange={handleChange}
              inputRef={correoRef}
              type="email"
              placeholder="correo@ejemplo.com"
              disabled={!editMode}
            />

            <TextField
              sx={lightTextFieldSx}
              label="Contraseña TAEconta"
              name="contra_tae"
              value={form.contra_tae}
              onChange={handleChange}
              type={showPass ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPass((s) => !s)}
                      edge="end"
                      sx={{ color: "#fff" }} // icono blanco
                    >
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={!editMode}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {editMode ? (
                <>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={saveDisabled}
                  >
                    {loading ? "Guardando..." : "Guardar credenciales"}
                  </Button>
                  <Button type="button" variant="text" color="inherit" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={handleEdit}
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.7)",
                    "&:hover": {
                      borderColor: "#fff",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  EDITAR CREDENCIALES
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: "#111827", color: "#fff" }}>
        <CardContent>
          <Typography variant="h6" color="#fff" gutterBottom>
            🧾 Cuenta en TAEconta
          </Typography>

          {!empresa ? (
            <Typography sx={{ color: "#e5e7eb" }}>
              Aún no hay datos. Guarda credenciales para consultar tus datos de TAEconta.
            </Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              {/* Encabezado rápido */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Label>Creada</Label>
                  <Valor>{empresa.created_at?.slice(0, 10)}</Valor>
                </Box>
                <Box>
                  <Label>Actualizada</Label>
                  <Valor>{empresa.updated_at?.slice(0, 10)}</Valor>
                </Box>
              </Stack>

              <Divider sx={{ borderColor: "#374151" }} />

              {/* Resumen */}
              <Typography sx={{ color: "#e5e7eb", mt: 1 }}>Resumen</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {resumenCampos.map(([key, label]) => (
                  <Box key={key}>
                    <Label>{label}</Label>
                    <Valor>{empresa[key]}</Valor>
                  </Box>
                ))}
              </Box>

              {/* Timbrado */}
              <Divider sx={{ borderColor: "#374151" }} />
              <Typography sx={{ color: "#e5e7eb", mt: 1 }}>Timbrado</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {timbradoCampos.map(([key, label]) => (
                  <Box key={key}>
                    <Label>{label}</Label>
                    <Valor>{empresa[key]}</Valor>
                  </Box>
                ))}
              </Box>

              {/* Regímenes por nombre (si tu backend los incluye como regimenes_nombres) */}
              {Array.isArray(empresa?.regimenes_nombres) && empresa.regimenes_nombres.length > 0 && (
                <>
                  <Divider sx={{ borderColor: "#374151" }} />
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Label>Régimen(es):</Label>
                    {empresa.regimenes_nombres.map((v, i) => (
                      <Chip
                        key={i}
                        size="small"
                        label={v}
                        sx={{ bgcolor: "#374151", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                      />
                    ))}
                  </Stack>
                </>
              )}

              {/* Indicadores */}
              <Divider sx={{ borderColor: "#374151" }} />
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Label>Indicadores:</Label>
                {String(empresa?.indicador || "")
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean).length ? (
                  String(empresa.indicador)
                    .split(",")
                    .map((v, i) => (
                      <Chip
                        key={i}
                        size="small"
                        label={v.trim()}
                        sx={{ bgcolor: "#374151", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                      />
                    ))
                ) : (
                  <Valor>—</Valor>
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
