import React, { useMemo } from "react";
import { createTheme, ThemeProvider, useTheme } from "@mui/material";

// Match the palette and controls of Tickets y comprobantes.
export default function DocumentSettingsTheme({ children }) {
  const parentTheme = useTheme();
  const theme = useMemo(() => createTheme(parentTheme, {
    palette: { primary: { main: "#ffc107", dark: "#e0a800", light: "#ffe082", contrastText: "#17191c" } },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
        root: { borderRadius: 10, fontWeight: 700, textTransform: "none", minHeight: 44 },
        textPrimary: { color: parentTheme.palette.mode === "dark" ? "#ffe082" : "#665000" },
        outlinedPrimary: { color: parentTheme.palette.mode === "dark" ? "#ffe082" : "#30343b", borderColor: parentTheme.palette.mode === "dark" ? "#62552d" : "#d6d7da", "&:hover": { borderColor: "#d5a000", backgroundColor: parentTheme.palette.mode === "dark" ? "#332c16" : "#fff8df" } },
      } },
      MuiInputLabel: { styleOverrides: { root: { "&.Mui-focused": { color: parentTheme.palette.mode === "dark" ? "#ffe082" : "#765900" } } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiCircularProgress: { styleOverrides: { root: { color: "#b58a00" } } },
    },
  }), [parentTheme]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
