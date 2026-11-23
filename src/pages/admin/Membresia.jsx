import React, { useState } from "react";
import {
  Typography,
  Button,
  Stack,
  Box,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import CuadroPlan from "../../components/suscripciones/CuadroPlan";
import CuadroComplementos from "../../components/suscripciones/CuadroComplementos";
import ModalPlanes from "../../components/suscripciones/ModalPlanes";
import TablaHistorial from "../../components/suscripciones/TablaHistorial";
import ModalInformacionFacturacion from "../../components/suscripciones/ModalInformacionFacturacion";
import Tooltip from "@mui/material/Tooltip";

export default function Suscripciones() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleVerPlanes = () => setModalOpen(true);
  const handleComoFunciona = () => setModalInfoOpen(true);

  return (
    <Box p={2}>
      <Box
  display="flex"
  flexDirection={isMobile ? "column" : "row"}
  justifyContent="space-between"
  alignItems={isMobile ? "flex-start" : "center"}
  mb={3}
  gap={2}
>
  <Box>
    <Typography variant="h5">📦 Suscripciones</Typography>
    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
      Compra, renueva o cambia tu plan y activa complementos. Presiona Aqui   ➡️
    </Typography>
  </Box>

  <Stack direction={isMobile ? "column" : "row"} spacing={2} sx={{ width: isMobile ? "100%" : "auto" }}>
    <Tooltip
      title="Abre el modal para elegir o renovar tu plan y activar complementos."
      arrow
    >
      <Button
        variant="contained"
        startIcon={<CreditCardOutlinedIcon />}
        onClick={handleVerPlanes}
        color="primary"
        fullWidth={isMobile}
      >
        Comprar o cambiar mi plan / complementos
      </Button>
    </Tooltip>

    <Button
      variant="outlined"
      startIcon={<InfoOutlinedIcon />}
      onClick={handleComoFunciona}
      color="secondary"
      fullWidth={isMobile}
    >
      ¿Cómo funciona?
    </Button>
  </Stack>
</Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CuadroPlan onRenovar={handleVerPlanes} />
        </Grid>
        <Grid item xs={12} md={6}>
          <CuadroComplementos onGestionar={handleVerPlanes} />
        </Grid>
      </Grid>

      <ModalPlanes open={modalOpen} onClose={() => setModalOpen(false)} />
      <ModalInformacionFacturacion
        open={modalInfoOpen}
        onClose={() => setModalInfoOpen(false)}
      />

      <Box mt={4}>
        <TablaHistorial />
      </Box>
    </Box>
  );
}
