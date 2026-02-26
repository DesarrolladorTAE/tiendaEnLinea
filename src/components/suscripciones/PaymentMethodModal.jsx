import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Box,
  Stack,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";

const paypalImg = "/assets/images/paypal.jpg";
const conektaImg = "/assets/images/conekta.jpg";

function money(n) {
  const v = Number(n || 0);
  return `$${v.toLocaleString()} MXN`;
}

const PaymentMethodModal = ({
  open,
  onClose,
  isXs,
  pendingPayment,
  paypalLoaded,
  conektaLoaded,
  onPick,
}) => {
  const title = pendingPayment?.title || "Resumen del pago";
  const isPlan = pendingPayment?.kind === "plan";
  const isComp = pendingPayment?.kind === "complemento";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isXs}
      PaperProps={{ sx: { borderRadius: isXs ? 0 : 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 1.25, md: 1.75 },
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PaymentsRoundedIcon color="primary" />
          <Typography fontWeight={900}>Elige tu método de pago</Typography>
        </Stack>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Grid container spacing={2}>
          {/* PayPal */}
          <Grid item xs={12} sm={6}>
            <Card
              onClick={() => paypalLoaded && onPick("paypal")}
              sx={{
                cursor: paypalLoaded ? "pointer" : "not-allowed",
                opacity: paypalLoaded ? 1 : 0.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                transition: "0.2s",
                "&:hover": paypalLoaded
                  ? { transform: "translateY(-2px)", boxShadow: 6 }
                  : {},
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 2 }}>
                <Box
                  component="img"
                  src={paypalImg}
                  alt="PayPal"
                  sx={{ width: 140, height: 48, objectFit: "contain", mb: 1 }}
                />
                <Typography fontWeight={900}>PayPal</Typography>
                <Typography variant="caption" color="text.secondary">
                  {paypalLoaded ? "Paga con cuenta o tarjeta" : "Cargando PayPal…"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Conekta */}
          <Grid item xs={12} sm={6}>
            <Card
              onClick={() => conektaLoaded && onPick("conekta")}
              sx={{
                cursor: conektaLoaded ? "pointer" : "not-allowed",
                opacity: conektaLoaded ? 1 : 0.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                transition: "0.2s",
                "&:hover": conektaLoaded
                  ? { transform: "translateY(-2px)", boxShadow: 6 }
                  : {},
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 2 }}>
                <Box
                  component="img"
                  src={conektaImg}
                  alt="Conekta"
                  sx={{ width: 140, height: 48, objectFit: "contain", mb: 1 }}
                />
                <Typography fontWeight={900}>Conekta</Typography>
                <Typography variant="caption" color="text.secondary">
                  {conektaLoaded ? "Tarjeta o transferencia" : "Cargando Conekta…"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {pendingPayment && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              Resumen
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.75 }}>
              {isPlan && (
                <>
                  <Chip size="small" label="PLAN" color="primary" variant="outlined" />
                  <Chip
                    size="small"
                    label={`Pagas: ${pendingPayment.mesesPagados ?? "-"} mes(es)`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`Recibes: ${pendingPayment.mesesObtenidos ?? "-"} mes(es)`}
                    color="success"
                    variant="outlined"
                  />
                </>
              )}

              {isComp && (
                <Chip size="small" label="COMPLEMENTO" color="secondary" variant="outlined" />
              )}
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Producto: <b>{title}</b>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Monto: <b>{money(pendingPayment.monto)}</b>
            </Typography>

            {/* Si quieres debug, lo dejas comentado */}
            {/* <Typography variant="caption" sx={{ opacity: 0.6 }}>
              concepto: {pendingPayment.concepto}
            </Typography> */}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;