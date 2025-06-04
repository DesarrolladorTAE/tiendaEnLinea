import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Stack, Button, Box } from "@mui/material";

const NavMenu = ({ menuWhiteClass, sidebarMenu }) => {
  const { t } = useTranslation();

  const links = [
    { to: "/home-fashion-three", label: t("Inicio") },
    { to: "/shop-grid-right-sidebar", label: t("Recargas") },
    { to: "/shop-grid-paquet", label: t("Paquetes") },
    { to: "/mycontacts", label: t("Contactos") },
    { to: "/historial-recargas", label: t("Ventas") },
  ];

  return (
    <Box className={menuWhiteClass}>
      <Stack
        direction={sidebarMenu ? "column" : "row"}
        spacing={sidebarMenu ? 2 : 4}
        alignItems={sidebarMenu ? "flex-start" : "center"}
        justifyContent="center"
      >
        {links.map((item) => (
          <Button
            key={item.to}
            component={Link}
            to={item.to}
            sx={{
              color: sidebarMenu ? "white" : "black",
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "uppercase",
            }}
            fullWidth={sidebarMenu}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

NavMenu.propTypes = {
  menuWhiteClass: PropTypes.string,
  sidebarMenu: PropTypes.bool,
};

export default NavMenu;
