import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const Topbar = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#23388B" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Panel de Administración
        </Typography>
        <Box>Bienvenido SuperAdmin</Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
