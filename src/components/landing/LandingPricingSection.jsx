import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery
} from "@mui/material";
import axios from "../../axiosConfig";

const LandingCarrierSection = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));

  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCarriers = async () => {
    try {
      const response = await axios.get("/carriers");
      setCarriers(response.data);
    } catch (error) {
      console.error("Error al obtener los carriers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const tiempoAireCarriers = carriers.filter(
    (c) => c.Categoria?.toLowerCase() === "tiempo aire"
  );
  const paqueteCarriers = carriers.filter(
    (c) => c.Categoria?.toLowerCase() === "paquetes"
  );

  const getSlidesToShow = () => {
    if (isXs) return 2;
    if (isSm) return 3;
    if (isMd) return 4;
    return 5;
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 3000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    slidesToShow: getSlidesToShow(),
    slidesToScroll: 1,
    pauseOnHover: false,
    arrows: false
  };

  const renderCarousel = (data) => (
    <Slider {...sliderSettings}>
      {data.map((carrier, index) => (
        <Box key={index} px={1}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              textAlign: "center",
              backgroundColor: "transparent", // totalmente transparente
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: { xs: 160, sm: 180, md: 200 }
            }}
          >
            <img
              src={carrier.Logotipo}
              alt={carrier.Nombre}
              style={{
                width: "100%",
                maxWidth: 90,
                height: 90,
                objectFit: "contain",
                marginBottom: 10
              }}
            />
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem", md: "1rem" } }}
            >
              {carrier.Nombre}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Slider>
  );

  return (
    <Box sx={{ py: 10, backgroundColor: "#f0f8ff", px: 2 }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        Recargas y Paquetes Disponibles
      </Typography>
      <Typography variant="body1" textAlign="center" maxWidth="md" mx="auto" mb={6}>
        TeLoRecargo es una plataforma moderna para realizar{" "}
        <strong>recargas de tiempo aire</strong> y adquirir{" "}
        <strong>paquetes especiales</strong> de diferentes carriers en México. 
        Compra en tiempo real, usa múltiples métodos de pago, y accede desde cualquier dispositivo de forma segura.
      </Typography>

      {loading ? (
        <Box textAlign="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h5" textAlign="center" fontWeight="bold" mt={5} mb={2}>
            Tiempo Aire
          </Typography>
          <Box sx={{ maxWidth: 1200, mx: "auto", mb: 6 }}>
            {renderCarousel(tiempoAireCarriers)}
          </Box>

          <Divider variant="middle" sx={{ my: 6 }} />

          <Typography variant="h5" textAlign="center" fontWeight="bold" mt={5} mb={2}>
            Paquetes Promocionales
          </Typography>
          <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            {renderCarousel(paqueteCarriers)}
          </Box>
        </>
      )}
    </Box>
  );
};

export default LandingCarrierSection;
