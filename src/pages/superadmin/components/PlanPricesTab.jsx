import React from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const BRAND = {
  orange: "#ff5a1f",
  amber: "#ffb52e",
  dark: "#151515",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "#fff",

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

const billingCycleLabel = {
  monthly: "Mensual",
  semiannual: "Semestral",
  annual: "Anual",
  custom: "Personalizado",
};

const money = (value) => {
  const amount = Number(value || 0);

  return amount.toLocaleString(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
};

export default function PlanPricesTab({
  prices,
  onChange,
  onAdd,
  onDelete,
}) {
  const activePrices =
    prices.filter(
      (price) =>
        price.is_active !== false
    ).length;

  const lowestPrice =
    prices.length > 0
      ? Math.min(
          ...prices.map((price) =>
            Number(price.price || 0)
          )
        )
      : 0;

  return (
    <Stack spacing={3}>
      {/* CABECERA */}

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
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  bgcolor: alpha(
                    BRAND.orange,
                    0.09
                  ),
                  color: BRAND.orange,
                }}
              >
                <PaymentsRoundedIcon />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{
                    letterSpacing:
                      "-.02em",
                  }}
                >
                  Precios del plan
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.25,
                    fontSize: 14,
                  }}
                >
                  Define cuánto cuesta el plan,
                  cada cuánto se cobra y qué
                  promociones recibe el cliente.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={
                <AddRoundedIcon />
              }
              onClick={onAdd}
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
              Agregar modalidad
            </Button>
          </Stack>

          {prices.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, 1fr)",
                  },

                  gap: 2,
                }}
              >
                <SummaryItem
                  label="Modalidades"
                  value={prices.length}
                />

                <SummaryItem
                  label="Activas"
                  value={activePrices}
                />

                <SummaryItem
                  label="Desde"
                  value={money(
                    lowestPrice
                  )}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* SIN PRECIOS */}

      {prices.length === 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px dashed",
            borderColor: alpha(
              BRAND.orange,
              0.35
            ),
            bgcolor: alpha(
              BRAND.orange,
              0.02
            ),
          }}
        >
          <CardContent
            sx={{
              py: 6,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 4,
                mx: "auto",
                display: "grid",
                placeItems: "center",
                bgcolor: alpha(
                  BRAND.orange,
                  0.09
                ),
                color: BRAND.orange,
                mb: 2,
              }}
            >
              <PaymentsRoundedIcon
                sx={{
                  fontSize: 32,
                }}
              />
            </Box>

            <Typography
              variant="h6"
              fontWeight={900}
            >
              Aún no hay precios
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 1,
                maxWidth: 500,
                mx: "auto",
              }}
            >
              Agrega una modalidad mensual,
              semestral, anual o personalizada
              para comenzar a comercializar
              este plan.
            </Typography>

            <Button
              variant="contained"
              startIcon={
                <AddRoundedIcon />
              }
              onClick={onAdd}
              sx={{
                mt: 3,
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
              Crear primer precio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PRECIOS */}

      {prices.map(
        (price, index) => (
          <PriceCard
            key={
              price.id ||
              `price-${index}`
            }
            price={price}
            index={index}
            onChange={onChange}
            onDelete={onDelete}
          />
        )
      )}
    </Stack>
  );
}

function PriceCard({
  price,
  index,
  onChange,
  onDelete,
}) {
  const active =
    price.is_active !== false;

  const monthsPaid = Number(
    price.months_paid || 1
  );

  const monthsReceived = Number(
    price.months_received || 1
  );

  const bonusMonths =
    Math.max(
      monthsReceived - monthsPaid,
      0
    );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",

        borderColor: active
          ? alpha(
              BRAND.orange,
              0.24
            )
          : "divider",

        overflow: "hidden",

        transition:
          "border-color .2s ease, box-shadow .2s ease",

        "&:hover": {
          boxShadow:
            "0 12px 35px rgba(15,23,42,.06)",
        },
      }}
    >
      {/* HEADER DEL PRECIO */}

      <Box
        sx={{
          px: {
            xs: 2.5,
            md: 3,
          },

          py: 2.25,

          background: active
            ? `linear-gradient(90deg, ${alpha(
                BRAND.orange,
                0.065
              )}, #fff)`
            : "#fafafa",

          borderBottom:
            "1px solid",

          borderColor:
            "divider",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            sm: "center",
          }}
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                bgcolor: active
                  ? alpha(
                      BRAND.orange,
                      0.1
                    )
                  : "#eee",
                color: active
                  ? BRAND.orange
                  : "text.secondary",
              }}
            >
              <CalendarMonthRoundedIcon />
            </Box>

            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Typography
                  fontWeight={900}
                  fontSize={17}
                >
                  {price.label ||
                    billingCycleLabel[
                      price.billing_cycle
                    ] ||
                    `Modalidad ${index + 1}`}
                </Typography>

                <Chip
                  size="small"
                  label={
                    active
                      ? "Activo"
                      : "Inactivo"
                  }
                  icon={
                    active ? (
                      <CheckCircleRoundedIcon />
                    ) : undefined
                  }
                  sx={{
                    height: 24,
                    fontWeight: 800,

                    bgcolor: active
                      ? alpha(
                          BRAND.orange,
                          0.1
                        )
                      : "#eee",

                    color: active
                      ? BRAND.orange
                      : "text.secondary",

                    "& .MuiChip-icon":
                      {
                        color:
                          BRAND.orange,
                      },
                  }}
                />
              </Stack>

              <Typography
                sx={{
                  mt: 0.35,
                  fontWeight: 900,
                  fontSize: 21,
                }}
              >
                {money(price.price)}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            justifyContent={{
              xs: "space-between",
              sm: "flex-end",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                Activo
              </Typography>

              <Switch
                checked={active}
                onChange={(event) =>
                  onChange(
                    index,
                    "is_active",
                    event.target.checked
                  )
                }
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked":
                    {
                      color:
                        BRAND.orange,
                    },

                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                    {
                      bgcolor:
                        BRAND.orange,
                    },
                }}
              />
            </Stack>

            <Tooltip title="Eliminar modalidad">
              <IconButton
                color="error"
                onClick={() =>
                  onDelete(index)
                }
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

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
        {/* CONTRATACIÓN */}

        <SectionTitle
          icon={
            <PaymentsRoundedIcon />
          }
          title="Contratación"
          description="Define el periodo y el precio de esta modalidad."
        />

        <Box
          sx={{
            mt: 2.5,

            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          <TextField
            select
            label="Periodo de contratación"
            value={
              price.billing_cycle ||
              "monthly"
            }
            onChange={(event) =>
              onChange(
                index,
                "billing_cycle",
                event.target.value
              )
            }
            fullWidth
            sx={fieldSx}
          >
            <MenuItem value="monthly">
              Mensual
            </MenuItem>

            <MenuItem value="semiannual">
              Semestral
            </MenuItem>

            <MenuItem value="annual">
              Anual
            </MenuItem>

            <MenuItem value="custom">
              Personalizado
            </MenuItem>
          </TextField>

          <TextField
            label="Precio"
            type="number"
            value={
              price.price ?? ""
            }
            onChange={(event) =>
              onChange(
                index,
                "price",
                event.target.value
              )
            }
            fullWidth
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
            sx={fieldSx}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* PROMOCIÓN */}

        <SectionTitle
          icon={
            <LocalOfferRoundedIcon />
          }
          title="Promoción por periodo"
          description="Configura cuántos meses paga el cliente y cuántos meses recibe."
        />

        <Box
          sx={{
            mt: 2.5,

            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },

            gap: 2,
          }}
        >
          <TextField
            label="Meses que paga"
            type="number"
            value={monthsPaid}
            onChange={(event) =>
              onChange(
                index,
                "months_paid",
                event.target.value
              )
            }
            inputProps={{
              min: 1,
            }}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            label="Meses que recibe"
            type="number"
            value={monthsReceived}
            onChange={(event) =>
              onChange(
                index,
                "months_received",
                event.target.value
              )
            }
            inputProps={{
              min: 1,
            }}
            fullWidth
            sx={fieldSx}
          />
        </Box>

        <PromotionPreview
          paid={monthsPaid}
          received={monthsReceived}
          bonus={bonusMonths}
        />

        <Divider sx={{ my: 3 }} />

        {/* PRESENTACIÓN */}

        <SectionTitle
          icon={
            <DragIndicatorRoundedIcon />
          }
          title="Presentación"
          description="Define cómo se mostrará y en qué posición aparecerá."
        />

        <Box
          sx={{
            mt: 2.5,

            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr",
            },

            gap: 2,
          }}
        >
          <TextField
            label="Etiqueta visible"
            value={
              price.label || ""
            }
            onChange={(event) =>
              onChange(
                index,
                "label",
                event.target.value
              )
            }
            fullWidth
            placeholder="Ej. Mensual, Mejor opción..."
            helperText="Nombre que verá el cliente."
            sx={fieldSx}
          />

          <TextField
            label="Orden"
            type="number"
            value={
              price.sort_order ??
              index
            }
            onChange={(event) =>
              onChange(
                index,
                "sort_order",
                event.target.value
              )
            }
            fullWidth
            inputProps={{
              min: 0,
            }}
            helperText="Menor número aparece primero."
            sx={fieldSx}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="flex-start"
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: alpha(
            BRAND.orange,
            0.08
          ),
          color: BRAND.orange,

          "& svg": {
            fontSize: 19,
          },
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          fontWeight={900}
          fontSize={14}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.2,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function PromotionPreview({
  paid,
  received,
  bonus,
}) {
  return (
    <Box
      sx={{
        mt: 2,

        p: 2,

        borderRadius: 3,

        border: "1px solid",

        borderColor:
          bonus > 0
            ? alpha(
                BRAND.amber,
                0.5
              )
            : "divider",

        bgcolor:
          bonus > 0
            ? alpha(
                BRAND.amber,
                0.07
              )
            : "#fafafa",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        justifyContent="space-between"
        spacing={1}
      >
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Vista previa de la promoción
          </Typography>

          <Typography
            fontWeight={900}
            sx={{
              mt: 0.35,
            }}
          >
            Paga {paid}{" "}
            {paid === 1
              ? "mes"
              : "meses"}{" "}
            y recibe {received}{" "}
            {received === 1
              ? "mes"
              : "meses"}
          </Typography>
        </Box>

        {bonus > 0 ? (
          <Chip
            icon={
              <LocalOfferRoundedIcon />
            }
            label={`+${bonus} ${
              bonus === 1
                ? "mes gratis"
                : "meses gratis"
            }`}
            sx={{
              fontWeight: 900,
              bgcolor: alpha(
                BRAND.amber,
                0.22
              ),
              color: "#8a5500",

              "& .MuiChip-icon":
                {
                  color:
                    "#8a5500",
                },
            }}
          />
        ) : (
          <Chip
            label="Sin promoción"
            size="small"
            sx={{
              fontWeight: 800,
            }}
          />
        )}
      </Stack>
    </Box>
  );
}

function SummaryItem({
  label,
  value,
}) {
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
      <Typography
        variant="body2"
        color="text.secondary"
      >
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