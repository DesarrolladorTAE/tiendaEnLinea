export const warehouseStyles = {
  color: "#17191c", minWidth: 0,
  "& .MuiTypography-root": { overflowWrap: "anywhere" },
  "& .MuiButton-root": { borderRadius: 2.5, textTransform: "none", fontWeight: 700, minHeight: 42 },
  "& .MuiButton-containedPrimary": { bgcolor: "#1d2025", color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#30343b" } },
  "& .MuiButton-outlinedPrimary, & .MuiButton-textPrimary": { color: "#30343b", borderColor: "#d6d7da" },
  "& .MuiButton-root[aria-pressed='true']:not(.Mui-disabled)": {
    bgcolor: "#ffe082", color: "#17191c", boxShadow: "inset 0 0 0 1px #d5a000",
    "&:hover": { bgcolor: "#ffd454" },
  },
  "& .MuiButton-root.Mui-disabled": { bgcolor: "#f4f4f5", color: "#a1a1aa" },
  "& .MuiOutlinedInput-root": { bgcolor: "#fff", color: "#17191c", borderRadius: 2.5, "&.Mui-focused fieldset": { borderColor: "#30343b" } },
  "& .MuiInputLabel-root.Mui-focused": { color: "#30343b" },
  "& .MuiCircularProgress-root": { color: "#30343b" },
  "& .MuiChip-root": { maxWidth: "100%", height: "auto", minHeight: 24, "& .MuiChip-label": { whiteSpace: "normal", py: .5 } },
};
export const warehouseDialogStyles = {
  ...warehouseStyles,
  "& .MuiDialog-paper": { bgcolor: "#fff", color: "#17191c", borderRadius: 3 },
  "& .MuiDialog-paperFullScreen": { borderRadius: 0 },
  "& .MuiDialogTitle-root": { bgcolor: "#1d2025", color: "#fff", borderBottom: "2px solid #ffc107", fontWeight: 800 },
  "& .MuiDialogContent-root": { pt: "24px !important" },
  "& .MuiDialogActions-root": { p: 2, borderTop: "1px solid #e3e4e7", gap: 1, flexWrap: "wrap" },
};
export const warehouseGrid = { display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" }, gap: 2 };
export const warehousePanel = { p: 2, border: "1px solid #e3e4e7", borderRadius: 3, bgcolor: "#fff", minWidth: 0, overflowWrap: "anywhere" };
