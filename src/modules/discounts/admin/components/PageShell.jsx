import React from "react";
import { Box, Stack } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

export function PageShell({ children }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        minHeight: "100vh",
        background: alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}