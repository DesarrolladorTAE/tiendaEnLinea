import React from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Stack, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";

export const cashPanel = {
  p: { xs: 2, sm: 3 },
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  minWidth: 0,
};

export default function CashDialog({ titleId, posName, busy, onClose, children }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth="md"
      scroll="paper"
      aria-labelledby={titleId}
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: 3 } } } }}
      sx={{
        "& .MuiButton-root": { minHeight: 44, borderRadius: 2.5, textTransform: "none", fontWeight: 700 },
        "& .MuiButton-containedPrimary": {
          bgcolor: "#ffc107", color: "#17191c", boxShadow: "none",
          "&:hover": { bgcolor: "#e0a800", boxShadow: "none" },
          "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled" },
        },
        "& .MuiButton-outlinedPrimary": {
          color: "text.primary", borderColor: "divider",
          "&:hover": { borderColor: "#d5a000" },
        },
        "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{ bgcolor: "#1d2025", color: "#fff", borderTop: "3px solid #ffc107", p: { xs: 2, sm: 3 } }}
      >
        <Stack component="span" direction="row" spacing={1.5} alignItems="center">
          <Box component="span" sx={{ width: 42, height: 42, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "#ffc107", color: "#17191c" }}>
            <PointOfSaleOutlinedIcon />
          </Box>
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" display="block" variant="h6" sx={{ color: "#fff !important", fontWeight: 800 }}>Caja</Typography>
            {posName && <Typography component="span" display="block" variant="body2" sx={{ color: "#c7cbd1 !important", overflowWrap: "anywhere" }}>{posName}</Typography>}
          </Box>
          <IconButton aria-label="Cerrar caja" disabled={busy} onClick={onClose} sx={{ color: "#fff", "&.Mui-disabled": { color: "#777" } }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>{children}</DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
        <Button variant="outlined" disabled={busy} onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
