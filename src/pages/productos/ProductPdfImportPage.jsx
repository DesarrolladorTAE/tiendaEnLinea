import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import axiosClient from "../../config/axiosClient";

export default function ProductPdfImportPage() {
  const [branchId, setBranchId] = useState("");
  const [archivo, setArchivo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Temporal
  |--------------------------------------------------------------------------
  |
  | Luego puedes sustituir esto por tus sucursales reales provenientes
  | del backend.
  |
  */

  const branches = [
    {
      id: 1,
      name: "Sucursal principal",
    },
    {
      id: 2,
      name: "Sucursal 2",
    },
  ];

  const handleArchivo = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Solamente se permiten archivos PDF.");
      setArchivo(null);
      return;
    }

    setError("");
    setResultado(null);
    setArchivo(file);
  };

  const analizarPdf = async () => {
    if (!branchId) {
      setError("Selecciona una sucursal.");
      return;
    }

    if (!archivo) {
      setError("Selecciona un archivo PDF.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResultado(null);

      const formData = new FormData();

      formData.append("branch_id", branchId);
      formData.append("archivo", archivo);

      const response = await axiosClient.post(
        "/productos/importar-pdf/analizar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResultado(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "No fue posible analizar el PDF."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        px: {
          xs: 2,
          md: 3,
        },
        py: 3,
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        sx={{
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "error.main",
            color: "error.contrastText",
          }}
        >
          <PictureAsPdfRoundedIcon />
        </Box>

        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
          >
            Importar productos desde PDF
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sube un catálogo PDF para detectar productos,
            códigos, descripciones e imágenes.
          </Typography>
        </Box>
      </Stack>

      {/* =====================================================
          FORMULARIO
      ====================================================== */}

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Stack spacing={3}>
            {/* SUCURSAL */}

            <FormControl fullWidth>
              <InputLabel>
                Sucursal
              </InputLabel>

              <Select
                label="Sucursal"
                value={branchId}
                onChange={(e) =>
                  setBranchId(e.target.value)
                }
              >
                {branches.map((branch) => (
                  <MenuItem
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ARCHIVO */}

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={
                  <UploadFileRoundedIcon />
                }
                sx={{
                  minHeight: 46,
                }}
              >
                Seleccionar PDF

                <input
                  hidden
                  type="file"
                  accept="application/pdf"
                  onChange={handleArchivo}
                />
              </Button>

              {archivo && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                  >
                    {archivo.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {(archivo.size / 1024 / 1024).toFixed(
                      2
                    )}{" "}
                    MB
                  </Typography>
                </Box>
              )}
            </Box>

            {/* ERROR */}

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* BOTÓN */}

            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <SearchRoundedIcon />
                  )
                }
                disabled={loading}
                onClick={analizarPdf}
              >
                {loading
                  ? "Analizando PDF..."
                  : "Analizar PDF"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* =====================================================
          RESULTADO
      ====================================================== */}

      {resultado && (
        <Card
          variant="outlined"
          sx={{
            mt: 3,
            borderRadius: 3,
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                md: 3,
              },
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
            >
              Resultado del análisis
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              {resultado.message}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={3}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Archivo
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {resultado?.archivo?.name || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Páginas detectadas
                </Typography>

                <Typography
                  fontWeight={700}
                >
                  {resultado?.resultado
                    ?.total_pages ?? 0}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle2"
              fontWeight={800}
              sx={{
                mb: 1,
              }}
            >
              Texto de la primera página
            </Typography>

            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                maxHeight: 400,
                overflow: "auto",
                bgcolor: "grey.100",
                borderRadius: 2,
                fontSize: 13,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {resultado?.resultado?.pages?.[0]
                ?.text ||
                "No se detectó texto."}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}