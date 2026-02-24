import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";

const Logo = ({ imageUrl, logoClass, height = 64, maxLogoHeight = 46 }) => (
  <Box
    className={logoClass}
    sx={{
      display: "flex",
      alignItems: "center",
      height,                 // ✅ alto controlado del área del logo
      minWidth: 140,          // ✅ evita que el menú lo aplaste
    }}
  >
    <Link to="/home-fashion-three" style={{ display: "inline-flex" }}>
      <Box
        component="img"
        src={imageUrl}
        alt="Logo"
        sx={{
          height: "auto",
          maxHeight: maxLogoHeight,   // ✅ aquí lo haces más grande
          width: "auto",
          maxWidth: { md: 210, lg: 240 },
          objectFit: "contain",
          display: "block",
          transition: "transform .2s ease",
          "&:hover": { transform: "scale(1.03)" },
        }}
      />
    </Link>
  </Box>
);

Logo.propTypes = {
  imageUrl: PropTypes.string,
  logoClass: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxLogoHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Logo;