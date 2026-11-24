import React from "react";
import { Box, ButtonBase, Typography } from "@mui/material";

export const adminSectionPanel = {
  p: { xs: 2, sm: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3, minWidth: 0,
};

export const adminSectionHeader = {
  ...adminSectionPanel, mb: 2.5, bgcolor: "#1d2025", color: "#fff", borderColor: "#30343b", borderTop: "3px solid #ffc107",
};

export const adminSectionTitle = {
  color: "#fff !important", fontSize: { xs: 25, md: 32 }, fontWeight: 800,
  lineHeight: 1.2, letterSpacing: "-.035em", overflowWrap: "anywhere",
};

export const adminSectionScope = {
  maxWidth: "100%", alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "#303238", color: "#fff",
  "& .MuiChip-icon": { color: "#ffc107" },
  "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
};

export const adminSectionPrimaryAction = {
  bgcolor: "#ffc107", color: "#17191c", boxShadow: "none",
  "&:hover": { bgcolor: "#e0a800", boxShadow: "none" },
};

export const adminSectionDialog = {
  "& .MuiDialog-paper": { borderRadius: 3, m: { xs: 1.5, sm: 4 } },
  "& .MuiDialogTitle-root": {
    bgcolor: "#1d2025", color: "#fff", borderBottom: "2px solid #ffc107",
    px: { xs: 2, sm: 3 }, fontWeight: 800,
  },
  "& .MuiDialogContent-root": { px: { xs: 2, sm: 3 }, py: 2 },
  "& .MuiDialogActions-root": { px: { xs: 2, sm: 3 }, py: 1.5, gap: 1, flexWrap: "wrap" },
  "& .MuiButton-root": { borderRadius: 2.5, minHeight: 44, textTransform: "none", fontWeight: 700 },
  "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
};

export default function AdminSectionOption({ icon: Icon, label, description, active, disabled, onClick, opensDialog }) {
  return (
    <ButtonBase disabled={disabled} aria-pressed={active} aria-haspopup={opensDialog ? "dialog" : undefined} onClick={onClick} sx={{
      textAlign: "left", justifyContent: "flex-start", gap: 1.5, p: 2, minWidth: 0,
      border: "1px solid", borderColor: active ? "#ffc107" : "divider", borderRadius: 2.5,
      boxShadow: active ? "inset 0 0 0 1px #ffc107" : "none",
      bgcolor: theme => active ? (theme.palette.mode === "dark" ? "#2b281d" : "#fffbee") : "background.paper",
      "&.Mui-focusVisible": { outline: "3px solid #ffc107", outlineOffset: 2 },
    }}>
      <Box sx={{
        width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 2, flexShrink: 0,
        bgcolor: active ? "#ffc107" : "action.hover", color: active ? "#17191c" : "text.secondary",
      }}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={800}>{label}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
    </ButtonBase>
  );
}
