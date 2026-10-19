// Match the existing service wizard, including dialogs rendered through portals.
export const tourFormControlsSx = {
  color: "#171b20",
  "& .MuiTypography-root, & .MuiFormControlLabel-label": { color: "#171b20" },
  "& .MuiInputLabel-root, & .MuiInputLabel-root.Mui-focused": { color: "#171b20" },
  "& .MuiInputBase-root": { bgcolor: "#fff", color: "#171b20", borderRadius: 2 },
  "& .MuiSelect-icon": { color: "#171b20" },
  "& .MuiInputBase-input::placeholder": { color: "#71717a", opacity: 1 },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,.18)" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#171b20" },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f9b233" },
  "& .MuiFormHelperText-root": { color: "#52525b" },
  "& .MuiFormHelperText-root.Mui-error, & .MuiInputLabel-root.Mui-error": { color: "#b91c1c" },
  "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "#b91c1c" },
  "& .MuiButton-root": { minHeight: 42, borderRadius: 2, textTransform: "none", fontWeight: 800, px: 2 },
  "& .MuiButton-contained": { bgcolor: "#171b20", color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#30343b", boxShadow: "none" } },
  "& .MuiButton-outlined": { bgcolor: "#fff", color: "#171b20", borderColor: "rgba(0,0,0,.18)", "&:hover": { bgcolor: "#fff9eb", borderColor: "#b97400" } },
  "& .MuiButton-text": { color: "#171b20", "&:hover": { bgcolor: "#fff3d6" } },
  "& .MuiButton-colorError": { color: "#b91c1c", borderColor: "#fecaca", "&:hover": { bgcolor: "#fef2f2", borderColor: "#b91c1c" } },
  "& .MuiButton-root.Mui-disabled": { color: "#a1a1aa", bgcolor: "#f4f4f5", borderColor: "#e4e4e7" },
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#b97400", "& + .MuiSwitch-track": { bgcolor: "#f9b233" } },
  "& .MuiCircularProgress-root": { color: "#b97400" },
  "& .MuiAlert-root": { borderRadius: 2, border: "1px solid rgba(249,178,51,.3)", bgcolor: "#fff9eb", color: "#171b20" },
  "& .MuiAlert-icon": { color: "#b97400" },
  "& .MuiAlert-standardError": { bgcolor: "#fef2f2", borderColor: "#fecaca", "& .MuiAlert-icon": { color: "#b91c1c" } },
  "& .MuiAlert-standardSuccess": { bgcolor: "#f0fdf4", borderColor: "#bbf7d0", "& .MuiAlert-icon": { color: "#15803d" } },
};

export const tourDialogSx = {
  ...tourFormControlsSx,
  "& .MuiDialog-paper": { bgcolor: "#fff", color: "#171b20", borderRadius: 3, border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 12px 32px rgba(0,0,0,.16)", m: { xs: 1, sm: 4 }, width: { xs: "calc(100% - 16px)", sm: "100%" }, maxHeight: "calc(100dvh - 32px)" },
  "& .MuiDialog-paperFullScreen": { m: 0, width: "100%", maxHeight: "100dvh", borderRadius: 0 },
  "& .MuiDialogTitle-root": { bgcolor: "#fff9eb", borderLeft: "6px solid #f9b233", borderBottom: "1px solid rgba(0,0,0,.08)", color: "#171b20", fontWeight: 900, fontSize: { xs: 21, sm: 24 }, px: { xs: 2, sm: 3 }, py: 2.5 },
  "& .MuiDialogContent-root": { px: { xs: 2, sm: 3 }, py: 3 },
  "& .MuiDialogActions-root": { bgcolor: "#f7f7f5", borderTop: "1px solid rgba(0,0,0,.08)", p: 2, gap: 1, flexWrap: "wrap", "& .MuiButton-root": { ml: 0 } },
};

export const tourMenuProps = {
  PaperProps: { sx: { bgcolor: "#fff", color: "#171b20", borderRadius: 2, border: "1px solid #e4e4e7", "& .MuiMenuItem-root.Mui-selected": { bgcolor: "#fff3d6", "&:hover": { bgcolor: "#ffedbf" } }, "& .MuiMenuItem-root:hover": { bgcolor: "#fff9eb" } } },
};
