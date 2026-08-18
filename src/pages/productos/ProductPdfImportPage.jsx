import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";

import axiosClient from "../../config/axiosClient";

export default function ProductPdfImportPage() {
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const MAX_PDF_SIZE = 500 * 1024 * 1024;

  const handleArchivo = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Solamente se permiten archivos PDF.");
      setArchivo(null);
      setResultado(null);
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setError(
        `El PDF pesa ${(file.size / 1024 / 1024).toFixed(
          2
        )} MB. El máximo permitido es de 500 MB.`
      );

      setArchivo(null);
      setResultado(null);
      return;
    }

    setError("");
    setResultado(null);
    setArchivo(file);
  };

  const analizarPdf = async () => {
    if (!archivo) {
      setError("Selecciona un archivo PDF.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResultado(null);

      const formData = new FormData();

      formData.append("archivo", archivo);

      const response = await axiosClient.post(
        "/productos/importar-pdf/analizar",
        formData
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

  const images = resultado?.resultado?.images || [];
  const pages = resultado?.resultado?.pages || [];

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: {
          xs: 2,
          md: 3,
        },
        py: 3,
      }}
    >
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
          <Typography variant="h5" fontWeight={800}>
            Analizar catálogo PDF
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sube un catálogo PDF para detectar texto e imágenes.
          </Typography>
        </Box>
      </Stack>

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
            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
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
                    {(archivo.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Box>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

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
                disabled={loading || !archivo}
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

      {resultado && (
        <>
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
                spacing={4}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Archivo
                  </Typography>

                  <Typography fontWeight={700}>
                    {resultado?.archivo?.name || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Tamaño
                  </Typography>

                  <Typography fontWeight={700}>
                    {resultado?.archivo?.size
                      ? `${(
                          resultado.archivo.size /
                          1024 /
                          1024
                        ).toFixed(2)} MB`
                      : "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Páginas detectadas
                  </Typography>

                  <Typography fontWeight={700}>
                    {resultado?.resultado?.total_pages ?? 0}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Imágenes detectadas
                  </Typography>

                  <Typography fontWeight={700}>
                    {images.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {images.length > 0 && (
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
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <ImageRoundedIcon color="primary" />

                  <Typography
                    variant="h6"
                    fontWeight={800}
                  >
                    Imágenes detectadas
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(3, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {images.map((image, index) => (
                    <Card
                      key={image.path || image.url || index}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: "grey.50",
                          p: 1,
                        }}
                      >
                        <Box
                          component="img"
                          src={image.url}
                          alt={image.name || `Imagen ${index + 1}`}
                          loading="lazy"
                          sx={{
                            width: "100%",
                            height: 180,
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </Box>

                      <Box sx={{ p: 1.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                        >
                          {image.name || `Imagen ${index + 1}`}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {image.size
                            ? `${(image.size / 1024).toFixed(2)} KB`
                            : "Tamaño no disponible"}
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {images.length === 0 && (
            <Alert
              severity="warning"
              sx={{
                mt: 3,
              }}
            >
              El PDF fue leído, pero no se encontraron imágenes extraíbles.
            </Alert>
          )}

          {pages.map((page) => (
            <Card
              key={page.page}
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
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{
                    mb: 1,
                  }}
                >
                  Texto detectado - Página {page.page}
                </Typography>

                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    maxHeight: 500,
                    overflow: "auto",
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {page.text || "No se detectó texto."}
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
}