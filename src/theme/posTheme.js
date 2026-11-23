// src/theme/posTheme.js
import { createTheme, alpha } from "@mui/material/styles";

/**
 * Paleta más profesional y discreta:
 * - Gris/negro elegante
 * - Oro y rojo SOLO como acento
 */
export const POS_COLORS = {
  gold: "#f9b233",
  red: "#e6332a",
  black: "#000000",

  // base
  bg: "#0f1115",          // negro/gris suave
  surface: "#141824",     // paneles
  surface2: "#171c2a",    // cards
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.62)",

  // bordes MUY sutiles
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.12)",

  // sombras suaves
  shadow: "0 14px 40px rgba(0,0,0,0.35)",
};

export const posTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: POS_COLORS.gold },
    secondary: { main: POS_COLORS.red },
    error: { main: POS_COLORS.red },
    background: {
      default: POS_COLORS.bg,
      paper: POS_COLORS.surface,
    },
    text: {
      primary: POS_COLORS.text,
      secondary: POS_COLORS.muted,
    },
    divider: POS_COLORS.hairline,
  },

  shape: { borderRadius: 16 },

  typography: {
    fontFamily: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    h5: { fontWeight: 900, letterSpacing: -0.4 },
    h6: { fontWeight: 900, letterSpacing: -0.25 },
    button: { textTransform: "none", fontWeight: 850, letterSpacing: 0.2 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: POS_COLORS.bg,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: alpha("#ffffff", 0.04), // más discreto
          border: `1px solid ${POS_COLORS.hairline}`, // hairline
          backdropFilter: "blur(10px)",
          boxShadow: "none", // dejamos sombras solo cuando aplique
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          paddingInline: 16,
          paddingBlock: 10,
        },

        outlined: {
          borderColor: POS_COLORS.hairline2,
          "&:hover": {
            borderColor: alpha(POS_COLORS.gold, 0.30),
            backgroundColor: alpha(POS_COLORS.gold, 0.05),
          },
        },

        containedPrimary: {
          color: POS_COLORS.black,
          backgroundColor: POS_COLORS.gold,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#ffbf4a",
            boxShadow: "none",
          },
        },

        containedSecondary: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: alpha("#ffffff", 0.04),
          transition: "box-shadow .15s ease, border-color .15s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(POS_COLORS.gold, 0.22),
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${alpha(POS_COLORS.gold, 0.12)}`, // ring sutil
          },
        },
        notchedOutline: {
          borderColor: POS_COLORS.hairline2,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "&:hover": { backgroundColor: alpha("#ffffff", 0.06) },
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 900,
        },
      },
    },
  },
});
