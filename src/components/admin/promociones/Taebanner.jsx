import React, { useState } from "react";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Modal,
  useTheme,
  useMediaQuery,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SectionTitle from "./SectionTitle.jsx";

const BlogFeatured = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));

  const [openImage, setOpenImage] = useState(null);

  const images = [
    { src: "/assets/img/post/1.png", title: "Sistema Contable" },
    { src: "/assets/img/post/2.png", title: "Factura en Línea" },
    { src: "/assets/img/post/3.png", title: "Cotiza y Factura" },
    { src: "/assets/img/post/4.png", title: "Cotiza desde tu móvil" },
    { src: "/assets/img/post/5.png", title: "Tienda en Línea" },
    { src: "/assets/img/post/6.png", title: "Punto de Venta" },
    { src: "/assets/img/post/7.png", title: "Diseño Web" },
    { src: "/assets/img/post/8.png", title: "Sistema Tienda Física" },
  ];

  const getSlidesToShow = () => {
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 3;
    return 4;
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 5000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    slidesToShow: getSlidesToShow(),
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: false,
  };

  return (
    <Box sx={{ py: 10, px: 2, backgroundColor: "transparent" }}>
      <SectionTitle
        titleText="Otros Servicios"
        positionClass="text-center"
        spaceClass="mb-55"
      />

      <Slider {...settings}>
        {images.map((item, index) => (
          <Box key={index} px={1}>
            <Box
              onClick={() => setOpenImage(item)}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                boxShadow: 2,
                textAlign: "center",
                height: 280,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 4,
                },
              }}
            >
              <Box
                component="img"
                src={item.src}
                alt={item.title}
                sx={{
                  width: "100%",
                  height: 220,
                  objectFit: "contain",
                  p: 1,
                }}
              />
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                px={2}
                pb={1}
                color="white"
              >
                {item.title}
              </Typography>
            </Box>
          </Box>
        ))}
      </Slider>

      {/* Modal de imagen ampliada */}
      <Modal
        open={Boolean(openImage)}
        onClose={() => setOpenImage(null)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(3px)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            bgcolor: "#fff",
            borderRadius: 2,
            maxWidth: "90vw",
            maxHeight: "90vh",
            p: 2,
            outline: "none",
          }}
        >
          <IconButton
            onClick={() => setOpenImage(null)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={openImage?.src}
            alt={openImage?.title}
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
          />
          <Typography
            variant="h6"
            fontWeight="bold"
            textAlign="center"
            mt={2}
          >
            {openImage?.title}
          </Typography>
        </Box>
      </Modal>

      {/* CTA para contactar a TAE */}
      <Box
        mt={8}
        textAlign="center"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          color="black"
          textAlign="center"
        >
          ¿Te interesa algun servicio? Comunícate con TAE
        </Typography>

        <Box
          component="img"
          src="/assets/img/logotaecolor.png"
          alt="TAE Logo"
          sx={{ width: 140, height: "auto" }}
        />

        <Button
          variant="contained"
          color="success"
          href="https://wa.me/527442188925"
          target="_blank"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: "999px",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: 16,
            backgroundColor: "#25D366",
            "&:hover": {
              backgroundColor: "#1ebe5d",
            },
          }}
        >
          Enviar mensaje por WhatsApp
        </Button>
      </Box>
    </Box>
  );
};

export default BlogFeatured;
