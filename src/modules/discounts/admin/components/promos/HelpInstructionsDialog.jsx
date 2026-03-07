import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";

const COLORS = {
  accent: "#f9b233",
  black: "#0B0B0B",
  paper: "#ffffff",
  softBg: "#F6F7FB",
};

function Section({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        bgcolor: "#fff",
        border: `1px solid ${alpha("#000", 0.08)}`,
        p: 2,
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>
        {title}
      </Typography>

      <Stack spacing={0.8}>{children}</Stack>
    </Paper>
  );
}

export default function HelpInstructionsDialog({
  open = false,
  onClose = () => {},
  title = "Ayuda",
  subtitle = "Aquí encontrarás una explicación sencilla.",
  sections = [],
}) {
  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        zIndex: 1500,
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: COLORS.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: COLORS.paper,
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              border: `1px solid ${alpha(COLORS.accent, 0.35)}`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <InfoRoundedIcon sx={{ color: COLORS.black }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: COLORS.softBg,
          p: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={1.5}>
          {sections.map((section, index) => (
            <Section key={index} title={section.title}>
              {section.items?.map((item, itemIndex) => (
                <Stack
                  key={itemIndex}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                >
                  <TipsAndUpdatesRoundedIcon
                    sx={{
                      mt: "2px",
                      fontSize: 18,
                      color: alpha(COLORS.black, 0.75),
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Section>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: COLORS.paper,
          borderTop: `1px solid ${alpha("#000", 0.08)}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 950,
            bgcolor: COLORS.black,
            px: 2.2,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.88) },
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}