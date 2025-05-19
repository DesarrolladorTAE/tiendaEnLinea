import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const LINE1 = ["Recarga", "tu", "saldo"];
const LINE2 = ["fácil", "y", "rápido"];

const LandingHeroSectionResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        background: "linear-gradient(to bottom right, #0077B6)",
        color: "#fff",
        px: 3,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Grid
        container
        spacing={4}
        alignItems="center"
        justifyContent="center"
        direction={isMobile ? "column-reverse" : "row"}
      >
        <Grid item md={6} sx={{ pl: { xs: 2, md: 20 } }}>
          <Typography
            variant={isMobile ? "h4" : "h2"}
            fontWeight="bold"
            gutterBottom
            sx={{ textAlign: isMobile ? "center" : "left", lineHeight: 1.2 }}
          >
            {LINE1.map((word, i) => (
              <Box
                key={`line1-${i}`}
                component="span"
                sx={{
                  display: "inline-block",
                  animation: "fadeIn 0.6s ease-out forwards",
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0,
                  mr: 1,
                }}
              >
                {word}
              </Box>
            ))}
            <br />
            {LINE2.map((word, i) => (
              <Box
                key={`line2-${i}`}
                component="span"
                sx={{
                  display: "inline-block",
                  animation: "fadeIn 0.6s ease-out forwards",
                  animationDelay: `${(i + LINE1.length) * 0.3}s`,
                  opacity: 0,
                  color: "#90E0EF",
                  fontWeight: "bold",
                  mr: 1,
                }}
              >
                {word}
              </Box>
            ))}
          </Typography>

          <Typography
            variant="body1"
            color="#f0f0f0"
            sx={{
              maxWidth: 500,
              mx: isMobile ? "auto" : 0,
              textAlign: isMobile ? "center" : "left",
              mt: 3,
            }}
            gutterBottom
          >
            Con Telorecargo puedes enviar saldo a distintos operadores de forma
            inmediata y desde un solo lugar.
          </Typography>

          <Box
            mt={4}
            display="flex"
            gap={2}
            justifyContent={isMobile ? "center" : "flex-start"}
          >
            <Button
              variant="contained"
              onClick={() => navigate("/loginmui")}
              sx={{
                backgroundColor: "#00B4D8",
                px: 4,
                fontWeight: "bold",
                borderRadius: "50px",
                animation: "riseIn 0.6s ease-out forwards",
                transform: "translateY(20px)",
                opacity: 0,
                "&:hover": { backgroundColor: "#be4bdb" },
              }}
            >
              Empezar ahora
            </Button>
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Box

            component="img"
            src="/assets/img/imagenherosection1.gif"
            alt="App"
            sx={{
              width: isMobile ? "90%" : "700px", // Reducido
              maxWidth: "100%",                  // Evita desbordes
              borderRadius: 3,
            }}
          />

        </Grid>
      </Grid>

      {/* Animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes riseIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default LandingHeroSectionResponsive;
