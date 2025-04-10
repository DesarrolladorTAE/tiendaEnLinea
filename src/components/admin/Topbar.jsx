import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const Topbar = ({ onMenuClick }) => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#4F46E5" }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Panel de Administración
        </Typography>
        <Box>Bienvenido SuperAdmin</Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
