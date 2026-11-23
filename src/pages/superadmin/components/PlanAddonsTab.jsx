import React, { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    bgcolor: "#fff",

    "&:hover fieldset": {
      borderColor: BRAND.orange,
    },

    "&.Mui-focused fieldset": {
      borderColor: BRAND.orange,
    },
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: BRAND.orange,
  },
};

const emptyComplemento = {
  nombre: "",
  description: "",
  precio: "",
  tipo: "mensual",
  nota: "",
  is_active: true,
  show_on_landing: true,
  sort_order: 0,
};

const billingLabels = {
  mensual: "Mensual",
  anual: "Anual",
  único: "Pago único",
  unico: "Pago único",
  unidad: "Por unidad",
};

export default function PlanAddonsTab({
  addons,
  onChange,
  onCreateComplemento,
  creatingComplemento = false,
}) {
  const [openCreate, setOpenCreate] = useState(false);

  const [newComplemento, setNewComplemento] = useState(emptyComplemento);

  const stats = useMemo(() => {
    const included = addons.filter(
      (addon) => getAvailability(addon) === "included",
    ).length;

    const available = addons.filter(
      (addon) => getAvailability(addon) === "available",
    ).length;

    const notAvailable = addons.filter(
      (addon) => getAvailability(addon) === "not_available",
    ).length;

    return {
      total: addons.length,
      included,
      available,
      notAvailable,
    };
  }, [addons]);

  const handleOpenCreate = () => {
    setNewComplemento(emptyComplemento);
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    if (creatingComplemento) {
      return;
    }

    setOpenCreate(false);
    setNewComplemento(emptyComplemento);
  };

  const handleFieldChange = (field, value) => {
    setNewComplemento((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!onCreateComplemento) {
      return;
    }

    const payload = {
      nombre: newComplemento.nombre.trim(),

      description: newComplemento.description.trim() || null,

      precio: newComplemento.precio === "" ? 0 : Number(newComplemento.precio),

      tipo: newComplemento.tipo,

      nota: newComplemento.nota.trim() || null,

      is_active: Boolean(newComplemento.is_active),

      show_on_landing: Boolean(newComplemento.show_on_landing),

      sort_order: Number(newComplemento.sort_order || 0),
    };

    const success = await onCreateComplemento(payload);

    if (success !== false) {
      setOpenCreate(false);
      setNewComplemento(emptyComplemento);
    }
  };

  const canCreate = newComplemento.nombre.trim();

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.5,
              md: 3,
            },

            "&:last-child": {
              pb: {
                xs: 2.5,
                md: 3,
              },
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  bgcolor: alpha(BRAND.orange, 0.09),
                  color: BRAND.orange,
                }}
              >
                <ExtensionRoundedIcon />
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Complementos del plan
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                    fontSize: 14,
                  }}
                >
                  Define qué complementos están incluidos, cuáles pueden
                  contratarse y cuáles no están disponibles.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 999,
                px: 2.75,
                bgcolor: BRAND.orange,
                fontWeight: 900,
                textTransform: "none",

                "&:hover": {
                  bgcolor: "#e94e1b",
                },
              }}
            >
              Nuevo complemento
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },

              gap: 2,
            }}
          >
            <SummaryItem label="Complementos" value={stats.total} />

            <SummaryItem label="Incluidos" value={stats.included} />

            <SummaryItem label="Con costo" value={stats.available} />

            <SummaryItem label="No disponibles" value={stats.notAvailable} />
          </Box>
        </CardContent>
      </Card>

      {addons.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
          }}
        >
          No existen complementos disponibles para este plan.
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            overflowX: "auto",
          }}
        >
          <Table
            sx={{
              minWidth: 1050,
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "#fafafa",
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 900,
                    width: "34%",
                  }}
                >
                  Complemento
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 900,
                  }}
                >
                  Precio base
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 900,
                  }}
                >
                  Cobro
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 900,
                    minWidth: 210,
                  }}
                >
                  Disponibilidad
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 900,
                    minWidth: 190,
                  }}
                >
                  Precio para este plan
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 900,
                  }}
                >
                  Estado
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {addons.map((addon, index) => {
                const availability = getAvailability(addon);

                const priceOverride = getPriceOverride(addon);

                return (
                  <TableRow key={addon.id || `addon-${index}`} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            flexShrink: 0,
                            borderRadius: 2.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: alpha(BRAND.orange, 0.08),
                            color: BRAND.orange,
                          }}
                        >
                          <ExtensionRoundedIcon />
                        </Box>

                        <Box>
                          <Typography fontWeight={900}>
                            {addon.nombre || "Complemento"}
                          </Typography>

                          {addon.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.25,
                              }}
                            >
                              {addon.description}
                            </Typography>
                          )}

                          {addon.nota && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                mt: 0.5,
                              }}
                            >
                              {addon.nota}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={900}>
                        {money(addon.precio)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={billingLabels[addon.tipo] || addon.tipo || "—"}
                        sx={{
                          fontWeight: 800,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={availability}
                        onChange={(event) =>
                          onChange(index, "availability", event.target.value)
                        }
                        fullWidth
                        sx={fieldSx}
                      >
                        <MenuItem value="included">Incluido</MenuItem>

                        <MenuItem value="available">
                          Disponible con costo
                        </MenuItem>

                        <MenuItem value="not_available">No disponible</MenuItem>
                      </TextField>
                    </TableCell>

                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={priceOverride ?? ""}
                        disabled={availability !== "available"}
                        onChange={(event) =>
                          onChange(index, "price_override", event.target.value)
                        }
                        placeholder={
                          addon.precio != null ? String(addon.precio) : "0.00"
                        }
                        inputProps={{
                          min: 0,
                          step: "0.01",
                        }}
                        InputProps={{
                          startAdornment: (
                            <Typography
                              color="text.secondary"
                              sx={{
                                mr: 0.5,
                              }}
                            >
                              $
                            </Typography>
                          ),
                        }}
                        fullWidth
                        sx={fieldSx}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <AvailabilityChip availability={availability} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openCreate}
        onClose={handleCloseCreate}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack direction="row" spacing={1.5}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(BRAND.orange, 0.09),
                  color: BRAND.orange,
                }}
              >
                <ExtensionRoundedIcon />
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Nuevo complemento
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Agrega un complemento al catálogo general.
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={handleCloseCreate}
              disabled={creatingComplemento}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            p: 3,
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Nombre"
              value={newComplemento.nombre}
              onChange={(event) =>
                handleFieldChange("nombre", event.target.value)
              }
              required
              fullWidth
              placeholder="WhatsApp Pro automatizado"
              sx={fieldSx}
            />

            <TextField
              label="Descripción"
              value={newComplemento.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
              multiline
              minRows={3}
              fullWidth
              sx={fieldSx}
            />

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },

                gap: 2,
              }}
            >
              <TextField
                label="Precio base"
                type="number"
                value={newComplemento.precio}
                onChange={(event) =>
                  handleFieldChange("precio", event.target.value)
                }
                inputProps={{
                  min: 0,
                  step: "0.01",
                }}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                select
                label="Tipo de cobro"
                value={newComplemento.tipo}
                onChange={(event) =>
                  handleFieldChange("tipo", event.target.value)
                }
                fullWidth
                sx={fieldSx}
              >
                <MenuItem value="mensual">Mensual</MenuItem>

                <MenuItem value="anual">Anual</MenuItem>

                <MenuItem value="único">Pago único</MenuItem>

                <MenuItem value="unidad">Por unidad</MenuItem>
              </TextField>
            </Box>

            <TextField
              label="Nota"
              value={newComplemento.nota}
              onChange={(event) =>
                handleFieldChange("nota", event.target.value)
              }
              fullWidth
              placeholder="Ej. Gratis en plan Avanzado"
              sx={fieldSx}
            />

            <TextField
              label="Orden"
              type="number"
              value={newComplemento.sort_order}
              onChange={(event) =>
                handleFieldChange("sort_order", event.target.value)
              }
              inputProps={{
                min: 0,
              }}
              fullWidth
              sx={fieldSx}
            />

            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography fontWeight={900}>Complemento activo</Typography>

                    <Typography variant="body2" color="text.secondary">
                      Permite utilizarlo en los planes.
                    </Typography>
                  </Box>

                  <Switch
                    checked={newComplemento.is_active}
                    onChange={(event) =>
                      handleFieldChange("is_active", event.target.checked)
                    }
                  />
                </Stack>

                <Divider />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography fontWeight={900}>Mostrar en landing</Typography>

                    <Typography variant="body2" color="text.secondary">
                      Muestra este complemento públicamente.
                    </Typography>
                  </Box>

                  <Switch
                    checked={newComplemento.show_on_landing}
                    onChange={(event) =>
                      handleFieldChange("show_on_landing", event.target.checked)
                    }
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button onClick={handleCloseCreate} disabled={creatingComplemento}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleCreate}
            disabled={!canCreate || creatingComplemento}
            sx={{
              borderRadius: 999,
              px: 3,
              bgcolor: BRAND.orange,
              fontWeight: 900,
              textTransform: "none",

              "&:hover": {
                bgcolor: "#e94e1b",
              },
            }}
          >
            {creatingComplemento ? "Creando..." : "Crear complemento"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function getAvailability(addon) {
  return (
    addon.availability ??
    addon.status ??
    addon.configuration?.status ??
    (addon.included ? "included" : "available")
  );
}

function getPriceOverride(addon) {
  return addon.price_override ?? addon.configuration?.price_override ?? null;
}

function money(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AvailabilityChip({ availability }) {
  if (availability === "included") {
    return (
      <Chip
        size="small"
        icon={<CheckCircleRoundedIcon />}
        label="Incluido"
        sx={{
          fontWeight: 900,
          bgcolor: alpha(BRAND.orange, 0.1),
          color: BRAND.orange,

          "& .MuiChip-icon": {
            color: BRAND.orange,
          },
        }}
      />
    );
  }

  if (availability === "not_available") {
    return (
      <Chip
        size="small"
        icon={<BlockRoundedIcon />}
        label="No disponible"
        sx={{
          fontWeight: 900,
        }}
      />
    );
  }

  return (
    <Chip
      size="small"
      icon={<ShoppingCartCheckoutRoundedIcon />}
      label="Con costo"
      sx={{
        fontWeight: 900,
        bgcolor: alpha(BRAND.amber, 0.18),
        color: "#8a5500",

        "& .MuiChip-icon": {
          color: "#8a5500",
        },
      }}
    />
  );
}

function SummaryItem({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#fafafa",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography
        fontWeight={900}
        fontSize={20}
        sx={{
          mt: 0.35,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
