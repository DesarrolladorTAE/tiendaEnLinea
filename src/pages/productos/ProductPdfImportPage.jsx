import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";

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

  const products = resultado?.resultado?.products || [];
  const images = resultado?.resultado?.images || [];

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
          <Typography
            variant="h5"
            fontWeight={800}
          >
            Analizar catálogo PDF
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
                    Productos detectados
                  </Typography>

                  <Typography fontWeight={700}>
                    {products.length}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Imágenes extraídas
                  </Typography>

                  <Typography fontWeight={700}>
                    {images.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {products.length === 0 && (
            <Alert
              severity="warning"
              sx={{
                mt: 3,
              }}
            >
              El PDF fue leído, pero no se pudieron separar productos.
            </Alert>
          )}

          {products.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  mb: 2,
                }}
              >
                <Inventory2RoundedIcon color="primary" />

                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Productos detectados
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {products.map((product, index) => (
                  <Card
                    key={
                      product?.der?.sku ||
                      product?.izq?.sku ||
                      product?.index ||
                      index
                    }
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "250px 1fr",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          minHeight: {
                            xs: 220,
                            md: 260,
                          },
                          bgcolor: "grey.50",
                          display: "grid",
                          placeItems: "center",
                          p: 2,
                          borderRight: {
                            xs: "none",
                            md: "1px solid",
                          },
                          borderBottom: {
                            xs: "1px solid",
                            md: "none",
                          },
                          borderColor: "divider",
                        }}
                      >
                        {product?.image?.url ? (
                          <Box
                            component="img"
                            src={product.image.url}
                            alt={
                              product.name ||
                              `Producto ${index + 1}`
                            }
                            loading="lazy"
                            sx={{
                              width: "100%",
                              height: 220,
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        ) : (
                          <Stack
                            alignItems="center"
                            spacing={1}
                            color="text.secondary"
                          >
                            <Inventory2RoundedIcon
                              sx={{
                                fontSize: 48,
                              }}
                            />

                            <Typography variant="body2">
                              Sin imagen
                            </Typography>
                          </Stack>
                        )}
                      </Box>

                      <Box
                        sx={{
                          p: {
                            xs: 2,
                            md: 3,
                          },
                        }}
                      >
                        <Stack
                          direction={{
                            xs: "column",
                            sm: "row",
                          }}
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              useFlexGap
                              sx={{
                                mb: 1,
                              }}
                            >
                              <DirectionsCarFilledRoundedIcon
                                fontSize="small"
                                color="primary"
                              />

                              <Typography
                                variant="h6"
                                fontWeight={800}
                              >
                                {product.vehicle || "Vehículo no detectado"}
                              </Typography>
                            </Stack>

                            <Typography
                              variant="body1"
                              fontWeight={600}
                            >
                              {product.name || "Sin descripción"}
                            </Typography>
                          </Box>

                          <Chip
                            label={`Producto ${index + 1}`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Marca
                            </Typography>

                            <Typography fontWeight={700}>
                              {product.brand_code || "-"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Modelo
                            </Typography>

                            <Typography fontWeight={700}>
                              {product.model || "-"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Aplicación
                            </Typography>

                            <Typography fontWeight={700}>
                              {product.application || "-"}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              lg: "repeat(2, minmax(0, 1fr))",
                            },
                            gap: 2,
                          }}
                        >
                          <Card
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              bgcolor: "action.hover",
                            }}
                          >
                            <CardContent>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 2 }}
                              >
                                <Typography
                                  fontWeight={800}
                                >
                                  Derecho
                                </Typography>

                                <Chip
                                  label="DER"
                                  size="small"
                                  color="primary"
                                />
                              </Stack>

                              <Stack spacing={1.5}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    SKU
                                  </Typography>

                                  <Typography
                                    fontWeight={800}
                                  >
                                    {product?.der?.sku || "-"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Original
                                  </Typography>

                                  <Typography fontWeight={600}>
                                    {product?.der?.original || "-"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Equivalente
                                  </Typography>

                                  <Typography fontWeight={600}>
                                    {product?.der?.equivalent || "-"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>

                          <Card
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              bgcolor: "action.hover",
                            }}
                          >
                            <CardContent>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 2 }}
                              >
                                <Typography
                                  fontWeight={800}
                                >
                                  Izquierdo
                                </Typography>

                                <Chip
                                  label="IZQ"
                                  size="small"
                                  color="secondary"
                                />
                              </Stack>

                              <Stack spacing={1.5}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    SKU
                                  </Typography>

                                  <Typography
                                    fontWeight={800}
                                  >
                                    {product?.izq?.sku || "-"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Original
                                  </Typography>

                                  <Typography fontWeight={600}>
                                    {product?.izq?.original || "-"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Equivalente
                                  </Typography>

                                  <Typography fontWeight={600}>
                                    {product?.izq?.equivalent || "-"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Box>

                        {product?.image?.name && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 2,
                            }}
                          >
                            Imagen relacionada: {product.image.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}