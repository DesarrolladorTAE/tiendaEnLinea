import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";

const Logo = ({ imageUrl, logoClass }) => (
  <Box
    className={logoClass}
    sx={{
      display: "flex",
      alignItems: "center",  // Centrado vertical
      justifyContent: "center", // Centrado horizontal (si es necesario)
      height: "100%",
    }}
  >
    <Link to="/home-fashion-three">
      <Box
        component="img"
        src={imageUrl}
        alt="Logo"
        sx={{
          height: "100%",
          maxHeight: 50,
          objectFit: "contain",
        }}
      />
    </Link>
  </Box>
);

Logo.propTypes = {
  imageUrl: PropTypes.string,
  logoClass: PropTypes.string,
};

export default Logo;
