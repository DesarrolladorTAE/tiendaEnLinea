import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";

function orderCategories(categories) {
  const byId = new Map(categories.map((category) => [String(category.id), category]));
  const byParent = new Map();
  for (const category of byId.values()) {
    const parentId = String(category.parent_id);
    const key = byId.has(parentId) ? parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(category);
  }

  const ordered = [];
  const seen = new Set();
  const visit = (category, depth = 0, parentName) => {
    const id = String(category.id);
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push({ ...category, depth, parentName });
    byParent.get(id)?.forEach((child) => visit(child, depth + 1, category.name));
  };
  byParent.get(null)?.forEach((category) => visit(category));
  byId.forEach((category) => visit(category));
  return ordered;
}

export default function CategoriesRail({ categories, selectedCategoryId, onSelect, loading, classic = false }) {
  const filters = [{ id: null, name: "Todas", depth: 0 }, ...orderCategories(categories)];
  return (
    <Paper component="section" aria-label="Categorías" variant="outlined" sx={{
      display: "flex", flexDirection: "column", borderRadius: 3, minWidth: 0, overflow: "hidden",
      bgcolor: "#fff", contain: classic ? { md: "size" } : { lg: "size" },
    }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, px: 1.5, py: 1.25, bgcolor: classic ? "#fff" : "#1d2025", borderTop: classic ? "none" : "3px solid #ffc107" }}>
        {!classic && <CategoryOutlinedIcon fontSize="small" sx={{ color: "#ffc107" }} />}
        <Box>
          <Typography component="h2" sx={{ color: classic ? "#172033 !important" : "#fff !important", fontSize: 14, fontWeight: 800 }}>Categorías</Typography>
          {classic && <Typography variant="caption" color="text.secondary" display="block">Filtra por sucursal</Typography>}
        </Box>
      </Stack>
      {loading ? (
        <Typography role="status" variant="body2" sx={{ px: 1.5, py: 2 }}>Cargando categorías…</Typography>
      ) : (
        <Box sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: classic ? { xs: "row", md: "column" } : { xs: "row", lg: "column" }, gap: 0.75, p: 1.25, overflow: "auto" }}>
          {filters.map(({ id, name, depth, parentName }) => {
            const active = String(id) === String(selectedCategoryId);
            return (
              <Button
                key={id ?? "all"}
                type="button"
                aria-pressed={active}
                aria-label={parentName ? `${name}, subcategoría de ${parentName}` : undefined}
                onClick={() => onSelect(id)}
                startIcon={classic && !depth ? undefined : id === null ? <GridViewRoundedIcon /> : depth ? <SubdirectoryArrowRightRoundedIcon /> : <FolderOutlinedIcon />}
                sx={{
                  flexShrink: 0,
                  justifyContent: "flex-start",
                  minHeight: classic ? 34 : 44,
                  ml: { lg: Math.min(depth, 4) * 2 },
                  px: 1.25,
                  border: "1px solid",
                  borderColor: active ? "#e5ab00" : "#e5e7eb",
                  borderRadius: 2,
                  bgcolor: active ? (classic ? "#273445" : "#ffc107") : depth && !classic ? "#fff9e8" : "#f7f7f8",
                  position: "relative",
                  ...(depth > 0 && {
                    "&::before": {
                      content: '""', display: { xs: "none", lg: "block" }, position: "absolute",
                      left: -13, top: -9, width: 11, height: "calc(50% + 9px)",
                      borderLeft: "2px solid #d4a72c", borderBottom: "2px solid #d4a72c",
                      borderBottomLeftRadius: 4,
                    },
                  }),
                  color: active && classic ? "#fff" : "#1d2025",
                  textTransform: "none",
                  textAlign: "left",
                  lineHeight: 1.2,
                  fontWeight: active ? 800 : 600,
                  whiteSpace: { xs: "nowrap", lg: "normal" },
                  maxWidth: { xs: "min(68vw, 250px)", lg: "100%" },
                  "&:hover": { bgcolor: classic ? (active ? "#34465d" : "#edf2f7") : active ? "#ffe082" : "#fff5d7", borderColor: classic ? "#98a6b5" : "#e5ab00" },
                  "&.Mui-focusVisible": { outline: "2px solid #8f7000", outlineOffset: -3 },
                }}
              >
                <Box component="span" sx={{ display: "block", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", overflowWrap: "anywhere" }} title={name}>
                  {parentName && <Box component="span" aria-hidden="true" sx={{ display: "block", mb: 0.25, fontSize: 10, color: "#66521f", overflow: "hidden", textOverflow: "ellipsis" }}>{parentName}</Box>}
                  {name}
                </Box>
              </Button>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
