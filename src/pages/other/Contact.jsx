import React, { Fragment } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";
import GoogleMap from "../../components/google-map";
import LandingFooterSection from "../../components/landing/LandingFooterSection";

const Contact = () => {
  const { pathname } = useLocation();

  return (
    <Fragment>
      {/* Navbar fijo */}
      <AppBar position="fixed" sx={{ bgcolor: "#0077B6" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#fff" }}>
            TeLoRecargo
          </Typography>
          <Box>
            <Button
              component={RouterLink}
              to="/"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                textTransform: "none",
                mr: 2,
              }}
            >
              Inicio
            </Button>
            <Button
              component={RouterLink}
              to="/loginmui"
              variant="contained"
              sx={{
                bgcolor: "#00B4D8",
                color: "#fff",
                borderRadius: 9999,
                textTransform: "none",
                "&:hover": { bgcolor: "#009ec1" },
              }}
            >
              Iniciar sesión / Registrarme
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Espaciador para el navbar fijo */}
      <Toolbar />
      <Box sx={{ p: 4, overflowY: "auto", flexGrow: 1 }}>
       
        <Box sx={{ mt: 5, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "primary.main",
              fontSize: { xs: "1.8rem", md: "2.4rem" },
            }}
          >
            📞 ¿Necesitas ayuda?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mt: 2,
              color: "text.secondary",
              fontWeight: 500,
              fontSize: { xs: "1.4rem", md: "1.6rem" },
            }}
          >
            ✉️ Contacta con el equipo de soporte de{" "}
            <strong style={{ color: "#6C63FF" }}>TeLoRecargo.com</strong> 💬
          </Typography>
        </Box>
      </Box>

      <div className="contact-area pt-100 pb-100">
        <div className="container">
          <div className="contact-map mb-10">
            <GoogleMap lat={16.84769437234485} lng={-99.81158903334735} />
          </div>
          <div className="custom-row-2">
            <div className="col-12 col-lg-4 col-md-5">
              <div className="contact-info-wrap">
                <div className="single-contact-info">
                  <div className="contact-icon">
                    <i className="fa fa-phone" />
                  </div>
                  <div className="contact-info-dec">
                    <p>+52 1 744 218 8925</p>
                    <p>+52 1 744 164 1922</p>
                  </div>
                </div>
                <div className="single-contact-info">
                  <div className="contact-icon">
                    <i className="fa fa-globe" />
                  </div>
                  <div className="contact-info-dec">
                    <p>
                      <a href="mailto:contacto@telorecargo.com">contacto@telorecargo.com</a>
                    </p>
                    <p>
                      <a href="https://telorecargo.com">
                        telorecargo.com
                      </a>
                    </p>
                  </div>
                </div>
                <div className="single-contact-info">
                  <div className="contact-icon">
                    <i className="fa fa-map-marker" />
                  </div>
                  <div className="contact-info-dec">
                    <p>Carr. Cayaco - Puerto Marqués,</p>
                    <p>Piedra Roja, El Coloso,</p>
                    <p>39810 Acapulco de Juárez, Gro. </p>
                  </div>
                </div>
                <div className="contact-social text-center">
                  <h3>Siguenos</h3>
                  <ul>
                    <li>
                      <a href="https://facebook.com/TAELADTI">
                        <i className="fa fa-facebook" />
                      </a>
                    </li>
                    <li>
                      <a href="https://www.pinterest.com.mx/TAELADMX/_created/">
                        <i className="fa fa-pinterest-p" />
                      </a>
                    </li>

                    <li>
                      <a href="https://twitter.com/TAELAD2?s=09">
                        <i className="fa fa-twitter" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-8 col-md-7">
              <div className="contact-form">
                <div className="contact-title mb-30">
                  <h2>Ponte en Contacto</h2>
                </div>
                <form className="contact-form-style">
                  <div className="row">
                    <div className="col-lg-6">
                      <input name="name" placeholder="Nombre*" type="text" />
                    </div>
                    <div className="col-lg-6">
                      <input name="email" placeholder="Correo*" type="email" />
                    </div>
                    <div className="col-lg-12">
                      <input
                        name="subject"
                        placeholder="Asunto*"
                        type="text"
                      />
                    </div>
                    <div className="col-lg-12">
                      <textarea
                        name="message"
                        placeholder="Tu Mensaje*"
                        defaultValue={""}
                      />
                      <button className="submit" type="submit">
                        Enviar
                      </button>
                    </div>
                  </div>
                </form>
                <p className="form-message" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer sin enlaces */}
      <LandingFooterSection showLinks={false} />
    </Fragment>
  );
};

export default Contact;
