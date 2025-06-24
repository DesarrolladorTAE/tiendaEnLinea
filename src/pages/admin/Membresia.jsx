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
        <Typography variant="h5">📦 Suscripciones</Typography>

        <Stack direction={isMobile ? "column" : "row"} spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CreditCardOutlinedIcon />}
            onClick={handleVerPlanes}
            color="primary"
            fullWidth={isMobile}
          >
            Ver planes
          </Button>
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
