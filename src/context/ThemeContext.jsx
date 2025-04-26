import React, { createContext, useState, useMemo, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "../theme";

export const ColorModeContext = createContext();

export const ColorModeProvider = ({ children }) => {
  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem("modoOscuro") === "true";
  });

  const toggleColorMode = () => {
    setModoOscuro((prev) => {
      localStorage.setItem("modoOscuro", !prev);
      return !prev;
    });
  };

  const theme = useMemo(() => (modoOscuro ? darkTheme : lightTheme), [modoOscuro]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, modoOscuro }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
