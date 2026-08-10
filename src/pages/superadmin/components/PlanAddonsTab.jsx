import React from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";

const BRAND = {
  orange: "#ff5a1f",
};

export default function PlanAddonsTab({
  addons,
  onChange,
}) {
  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight={900}
      >
        Complementos
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 0.5,
        }}
      >
        Controla qué complementos incluye el plan y cuáles
        pueden contratarse adicionalmente.
      </Typography>

      <Divider
        sx={{
          my: 3,
        }}
      />

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
        <Stack spacing={2}>
          {addons.map((addon, index) => {
            const availability =
              addon.availability ||
              (addon.included
                ? "included"
                : "available");

            return (
              <Card
                key={
                  addon.addon_id ||
                  addon.id ||
                  `addon-${index}`
                }
                variant="outlined"
                sx={{
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(280px, 1fr) 220px 200px",
                      },

                      alignItems: "center",
                      gap: 2.5,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2.5,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          bgcolor:
                            "rgba(255,90,31,.08)",
                          color: BRAND.orange,
                        }}
                      >
                        <ExtensionRoundedIcon />
                      </Box>

                      <Box>
                        <Typography
                          fontWeight={900}
                        >
                          {addon.display_name ||
                            addon.name}
                        </Typography>

                        {addon.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.25,
                            }}
                          >
                            {
                              addon.description
                            }
                          </Typography>
                        )}

                        {addon.price !==
                          undefined &&
                          addon.price !==
                            null && (
                            <Chip
                              size="small"
                              label={`Precio base: $${Number(
                                addon.price
                              ).toLocaleString(
                                "es-MX",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}`}
                              sx={{
                                mt: 1.25,
                                fontWeight: 800,
                              }}
                            />
                          )}
                      </Box>
                    </Stack>

                    <TextField
                      select
                      label="Disponibilidad"
                      size="small"
                      value={availability}
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        onChange(
                          index,
                          "availability",
                          value
                        );

                        onChange(
                          index,
                          "included",
                          value === "included"
                        );
                      }}
                      fullWidth
                    >
                      <MenuItem value="included">
                        Incluido
                      </MenuItem>

                      <MenuItem value="available">
                        Disponible con costo
                      </MenuItem>

                      <MenuItem value="unavailable">
                        No disponible
                      </MenuItem>
                    </TextField>

                    <TextField
                      label="Precio especial"
                      size="small"
                      type="number"
                      value={
                        addon.price_override ??
                        ""
                      }
                      disabled={
                        availability !==
                        "available"
                      }
                      onChange={(event) =>
                        onChange(
                          index,
                          "price_override",
                          event.target.value
                        )
                      }
                      inputProps={{
                        min: 0,
                        step: "0.01",
                      }}
                      fullWidth
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}