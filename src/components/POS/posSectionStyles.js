export const posSectionHeader = {
  p: { xs: 2, sm: 3 }, mb: 2.5, borderRadius: 3, minWidth: 0,
  bgcolor: "#1d2025", color: "#fff", border: "1px solid #30343b", borderTop: "3px solid #ffc107",
};

export const posSectionTitle = {
  color: "#fff !important", fontSize: { xs: 24, md: 32 }, fontWeight: 800, lineHeight: 1.2,
};

export const posSectionIcon = {
  width: 42, height: 42, flexShrink: 0, display: "grid", placeItems: "center",
  borderRadius: 2, bgcolor: "#ffc107", color: "#17191c",
};

export const posHeaderButton = {
  minHeight: 44, borderRadius: 2, textTransform: "none", fontWeight: 800,
  bgcolor: "#ffc107", color: "#17191c", boxShadow: "none",
  "&:hover": { bgcolor: "#ffe082", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#4a4330", color: "#e4dbc4" },
};

export const posHeaderOutline = {
  minHeight: 44, borderRadius: 2, textTransform: "none", fontWeight: 700,
  color: "#fff", borderColor: "#69737f",
  "&:hover": { borderColor: "#ffc107", bgcolor: "#30343b" },
  "&.Mui-disabled": { color: "#aeb7c2", borderColor: "#555e69" },
};

export const posHeaderInput = {
  "& .MuiOutlinedInput-root": { minHeight: 44, borderRadius: 2, bgcolor: "#fff", color: "#17191c" },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: "#ffc107" },
};

export const posHeaderChip = {
  bgcolor: "#3d3520", color: "#ffd454", fontWeight: 800,
  "& .MuiChip-icon": { color: "inherit" },
};

export const posTableHeader = {
  "& th": { bgcolor: "#eef2f6", color: "#222a35", fontWeight: 800, borderBottom: "2px solid #ffc107" },
};

export const posMobileCard = {
  borderRadius: 3, border: "1px solid #dce3ec", borderTop: "3px solid #ffc107",
  minWidth: 0, overflowWrap: "anywhere",
  "& .MuiIconButton-root": { minWidth: 44, minHeight: 44 },
};
