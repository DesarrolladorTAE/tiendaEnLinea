import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import AppleIcon from "@mui/icons-material/Apple";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import UsbRoundedIcon from "@mui/icons-material/UsbRounded";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import axiosClientPOS from "../../config/axiosClientPOS";

const platformMeta = {
  android: {
    label: "Android",
    icon: <AndroidRoundedIcon />,
    color: "#15803d",
    bg: "rgba(34,197,94,.12)",
    border: "rgba(34,197,94,.22)",
  },
  ios: {
    label: "iOS",
    icon: <AppleIcon />,
    color: "#111827",
    bg: "rgba(100,116,139,.12)",
    border: "rgba(100,116,139,.22)",
  },
  windows: {
    label: "Windows",
    icon: <DesktopWindowsRoundedIcon />,
    color: "#1d4ed8",
    bg: "rgba(37,99,235,.12)",
    border: "rgba(37,99,235,.22)",
  },
  macos: {
    label: "macOS",
    icon: <LaptopMacRoundedIcon />,
    color: "#7c3aed",
    bg: "rgba(124,58,237,.12)",
    border: "rgba(124,58,237,.22)",
  },
};

function printerIcon(name = "") {
  const text = name.toLowerCase();

  if (text.includes("usb")) return <UsbRoundedIcon fontSize="small" />;
  if (text.includes("tcp") || text.includes("ip") || text.includes("red")) {
    return <LanRoundedIcon fontSize="small" />;
  }
  if (text.includes("bluetooth") || text.includes("ble")) {
    return <BluetoothRoundedIcon fontSize="small" />;
  }

  return <PrintRoundedIcon fontSize="small" />;
}

function formatSize(bytes) {
  if (!bytes) return "Sin tamaño";
  return `${(Number(bytes) / 1024 / 1024).toFixed(2)} MB`;
}

export default function PosAvailableApps() {
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);

      const { data } = await axiosClientPOS.get("/pos/apps/available", {
        params: {
          app_slug: "mtelmx-pos",
        },
      });

      setVersions(data.data || []);
    } catch (error) {
      console.error(error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const openInfo = (item) => {
    setSelectedInfo(item);
    setInfoOpen(true);
  };

  const closeInfo = () => {
    setInfoOpen(false);
    setSelectedInfo(null);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: { xs: 1.5, sm: 2, md: 3 },
          borderRadius: { xs: 3, md: 4 },
          border: "1px solid #dbeafe",
          bgcolor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <Stack spacing={2.2}>
          <Box>
            <Typography
              fontWeight={950}
              sx={{
                fontSize: { xs: "1.15rem", sm: "1.25rem", md: "1.35rem" },
                lineHeight: 1.15,
              }}
            >
              Aplicaciones disponibles
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.5,
                fontSize: { xs: "0.86rem", sm: "0.95rem" },
                lineHeight: 1.35,
              }}
            >
              Descarga la versión compatible con tu dispositivo e impresora.
            </Typography>
          </Box>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Cargando versiones...
              </Typography>
            </Stack>
          ) : versions.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay versiones disponibles para descargar.
            </Alert>
          ) : (
            <Stack spacing={1.6}>
              {versions.map((item) => {
                const meta = platformMeta[item.platform] || platformMeta.android;

                return (
                  <Paper
                    key={item.id}
                    elevation={0}
                    sx={{
                      p: { xs: 1.6, sm: 2, md: 2.2 },
                      borderRadius: 3,
                      border: "1px solid #e5e7eb",
                      bgcolor:
                        "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                      transition: ".18s ease",
                      "&:hover": {
                        borderColor: meta.border,
                        boxShadow: "0 16px 38px rgba(15,23,42,.08)",
                        transform: { xs: "none", md: "translateY(-1px)" },
                      },
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={{ xs: 1.8, md: 2 }}
                      alignItems={{ xs: "stretch", md: "center" }}
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        spacing={{ xs: 1.2, sm: 1.6 }}
                        alignItems="flex-start"
                        sx={{ minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: { xs: 42, sm: 48 },
                            height: { xs: 42, sm: 48 },
                            minWidth: { xs: 42, sm: 48 },
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            color: meta.color,
                            bgcolor: meta.bg,
                            border: `1px solid ${meta.border}`,
                            "& svg": {
                              fontSize: { xs: 25, sm: 29 },
                            },
                          }}
                        >
                          {meta.icon}
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            flexWrap="wrap"
                            useFlexGap
                            alignItems="center"
                          >
                            <Chip
                              label={meta.label}
                              size="small"
                              sx={{
                                height: 24,
                                fontWeight: 900,
                                color: meta.color,
                                bgcolor: meta.bg,
                                border: `1px solid ${meta.border}`,
                              }}
                            />

                            <Chip
                              label={`v${item.version}`}
                              size="small"
                              sx={{
                                height: 24,
                                fontWeight: 900,
                                bgcolor: "#eef2ff",
                                color: "#1e3a8a",
                              }}
                            />

                            {item.release_date && (
                              <Chip
                                label={item.release_date}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 24,
                                  fontWeight: 800,
                                  bgcolor: "#fff",
                                }}
                              />
                            )}
                          </Stack>

                          <Typography
                            fontWeight={950}
                            sx={{
                              mt: 0.9,
                              fontSize: { xs: "1rem", md: "1.08rem" },
                              lineHeight: 1.2,
                              wordBreak: "break-word",
                            }}
                          >
                            {item.app || "MTELMX POS"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.8}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            {item.printer_types?.length > 0 ? (
                              item.printer_types.map((printer) => (
                                <Chip
                                  key={printer.id}
                                  icon={printerIcon(printer.name)}
                                  label={printer.name}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 26,
                                    borderRadius: 2,
                                    bgcolor: "#fff",
                                    fontWeight: 850,
                                    maxWidth: "100%",
                                    "& .MuiChip-label": {
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    },
                                  }}
                                />
                              ))
                            ) : (
                              <Chip
                                icon={<PrintRoundedIcon fontSize="small" />}
                                label="Sin método de impresión"
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 26,
                                  borderRadius: 2,
                                  bgcolor: "#fff",
                                  fontWeight: 850,
                                }}
                              />
                            )}
                          </Stack>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              display: "block",
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                            }}
                          >
                            {item.file_name || "Instalador"} —{" "}
                            {formatSize(item.file_size)}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction={{ xs: "row", sm: "row", md: "column" }}
                        spacing={1}
                        alignItems={{ xs: "center", md: "stretch" }}
                        justifyContent={{ xs: "space-between", md: "center" }}
                        sx={{
                          width: { xs: "100%", md: "auto" },
                          minWidth: { md: 150 },
                        }}
                      >
                        <Tooltip title="Ver información de la app">
                          <Button
                            variant="outlined"
                            startIcon={<InfoOutlinedIcon />}
                            onClick={() => openInfo(item)}
                            sx={{
                              flex: { xs: 1, md: "unset" },
                              borderRadius: 999,
                              px: 2,
                              fontWeight: 900,
                              textTransform: "none",
                              borderColor: "#cbd5e1",
                              color: "#334155",
                              bgcolor: "#fff",
                              "&:hover": {
                                borderColor: "#94a3b8",
                                bgcolor: "#f8fafc",
                              },
                            }}
                          >
                            Info
                          </Button>
                        </Tooltip>

                        <Button
                          variant="contained"
                          startIcon={<DownloadRoundedIcon />}
                          href={item.download_url}
                          target="_blank"
                          sx={{
                            flex: { xs: 1, md: "unset" },
                            borderRadius: 999,
                            px: 2.4,
                            fontWeight: 950,
                            textTransform: "none",
                            bgcolor: "#1d4ed8",
                            boxShadow: "0 12px 28px rgba(37,99,235,.25)",
                            "&:hover": {
                              bgcolor: "#1e40af",
                            },
                          }}
                        >
                          Descargar
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={infoOpen}
        onClose={closeInfo}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: 6,
            fontWeight: 950,
          }}
        >
          Información de la app
          <IconButton
            onClick={closeInfo}
            sx={{
              position: "absolute",
              right: 12,
              top: 10,
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedInfo && (
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={950}>
                  {selectedInfo.app || "MTELMX POS"} v{selectedInfo.version}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plataforma:{" "}
                  {platformMeta[selectedInfo.platform]?.label ||
                    selectedInfo.platform}
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight={900} sx={{ mb: 0.5 }}>
                  Notas de versión
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line", lineHeight: 1.55 }}
                >
                  {selectedInfo.notes || "Sin notas de versión."}
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight={900} sx={{ mb: 0.5 }}>
                  Archivo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedInfo.file_name || "Instalador"} —{" "}
                  {formatSize(selectedInfo.file_size)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<DownloadRoundedIcon />}
                href={selectedInfo.download_url}
                target="_blank"
                sx={{
                  borderRadius: 999,
                  fontWeight: 950,
                  bgcolor: "#1d4ed8",
                  textTransform: "none",
                }}
              >
                Descargar aplicación
              </Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}