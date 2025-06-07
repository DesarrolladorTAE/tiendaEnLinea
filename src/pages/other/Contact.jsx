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
      <div className="contact-area pt-100 pb-100">
        <div className="container">
          <div className="contact-map mb-10">
            <GoogleMap lat={47.444} lng={-122.176} />
          </div>
          <div className="custom-row-2">
            <div className="col-12 col-lg-4 col-md-5">
              <div className="contact-info-wrap">
                <div className="single-contact-info">
                  <div className="contact-icon">
                    <i className="fa fa-phone" />
                  </div>
                  <div className="contact-info-dec">
                    <p>+012 345 678 102</p>
                    <p>+012 345 678 102</p>
                  </div>
                </div>
                <div className="single-contact-info">
                  <div className="contact-icon">
                    <i className="fa fa-globe" />
                  </div>
                  <div className="contact-info-dec">
                    <p>
                      <a href="mailto:yourname@email.com">yourname@email.com</a>
                    </p>
                    <p>
                      <a href="https://yourwebsitename.com">
                        yourwebsitename.com
                      </a>
                    </p>
                  </div>
                </div>
                <div className="single-contact-info">
                  <div className="contact-icon">
                    <i className="fa fa-map-marker" />
                  </div>
                  <div className="contact-info-dec">
                    <p>Address goes here, </p>
                    <p>street, Crossroad 123.</p>
                  </div>
                </div>
                <div className="contact-social text-center">
                  <h3>Follow Us</h3>
                  <ul>
                    <li>
                      <a href="//facebook.com">
                        <i className="fa fa-facebook" />
                      </a>
                    </li>
                    <li>
                      <a href="//pinterest.com">
                        <i className="fa fa-pinterest-p" />
                      </a>
                    </li>
                    <li>
                      <a href="//thumblr.com">
                        <i className="fa fa-tumblr" />
                      </a>
                    </li>
                    <li>
                      <a href="//vimeo.com">
                        <i className="fa fa-vimeo" />
                      </a>
                    </li>
                    <li>
                      <a href="//twitter.com">
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
                  <h2>Get In Touch</h2>
                </div>
                <form className="contact-form-style">
                  <div className="row">
                    <div className="col-lg-6">
                      <input name="name" placeholder="Name*" type="text" />
                    </div>
                    <div className="col-lg-6">
                      <input name="email" placeholder="Email*" type="email" />
                    </div>
                    <div className="col-lg-12">
                      <input
                        name="subject"
                        placeholder="Subject*"
                        type="text"
                      />
                    </div>
                    <div className="col-lg-12">
                      <textarea
                        name="message"
                        placeholder="Your Message*"
                        defaultValue={""}
                      />
                      <button className="submit" type="submit">
                        SEND
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
