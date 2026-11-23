import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Autocomplete,
  TextField,
  Paper,
} from "@mui/material";

const PALETTE = {
  bgCard:
    "linear-gradient(180deg, rgba(10,12,16,0.92) 0%, rgba(12,14,20,0.92) 100%)",
  bgMenu:
    "linear-gradient(180deg, rgba(10,12,16,0.98) 0%, rgba(12,14,20,0.98) 100%)",
  stroke: "rgba(255,255,255,0.10)",
  txt: "rgba(255,255,255,0.92)",
  accent: "#7C4DFF",
  cyan: "#76E0FF",
  cyanSoft: "rgba(118,224,255,0.10)",
  menuHeaderBg: "rgba(12,14,20,0.98)",
};

function byName(a, b) {
  return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
}

export default function CategoryModal({
  open,
  onClose,
  product,
  categoriesFlat = [],
  categoriesTree = [],
  loading = false,
  saving = false,
  onSave, // (productId, categoryIds:number[])
}) {
  // ===== maps =====
  const catMap = useMemo(() => {
    const m = new Map();
    (categoriesFlat || []).forEach((c) => m.set(Number(c.id), c));
    return m;
  }, [categoriesFlat]);

  // ===== selected initial =====
  const initialSelected = useMemo(() => {
    if (!product) return [];

    const cats = Array.isArray(product.categories) ? product.categories : [];
    if (cats.length) {
      return cats
        .map((c) => catMap.get(Number(c.id)) || c)
        .filter(Boolean);
    }

    const ids = Array.isArray(product.category_ids) ? product.category_ids : [];
    return ids.map((id) => catMap.get(Number(id))).filter(Boolean);
  }, [product, catMap]);

  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected, open]);

  const selectedIds = useMemo(
    () => selected.map((c) => Number(c.id)).filter(Boolean),
    [selected]
  );

  const handleSave = async () => {
    if (!product?.id) return;
    await onSave?.(product.id, selectedIds);
    onClose?.();
  };

  // ===== construir “conjuntos” tipo screenshot =====
  // Si tienes categoriesTree ya armado (parents con children), úsalo.
  // Si no, lo construimos desde flat.
  const tree = useMemo(() => {
    if (Array.isArray(categoriesTree) && categoriesTree.length) return categoriesTree;

    const flat = categoriesFlat || [];
    const parents = flat.filter((c) => c.parent_id == null).sort(byName);
    const childrenByParent = new Map();

    flat.forEach((c) => {
      if (c.parent_id != null) {
        const arr = childrenByParent.get(Number(c.parent_id)) ?? [];
        arr.push(c);
        childrenByParent.set(Number(c.parent_id), arr);
      }
    });

    return parents.map((p) => ({
      ...p,
      children: (childrenByParent.get(Number(p.id)) ?? []).sort(byName),
    }));
  }, [categoriesTree, categoriesFlat]);

  // “Otras” = categorías sin parent (y también padres sin hijas si quieres)
  const singles = useMemo(() => {
    const flat = categoriesFlat || [];
    const parentIdsWithKids = new Set(
      (tree || []).filter((p) => (p.children?.length ?? 0) > 0).map((p) => Number(p.id))
    );

    // sueltas (parent_id null) que NO tienen hijas
    return flat
      .filter((c) => c.parent_id == null && !parentIdsWithKids.has(Number(c.id)))
      .sort(byName);
  }, [categoriesFlat, tree]);

  // opciones “planas” para Autocomplete con headers
  const options = useMemo(() => {
    const out = [];

    // grupos con hijas
    (tree || [])
      .filter((p) => (p.children?.length ?? 0) > 0)
      .sort(byName)
      .forEach((p) => {
        out.push({ kind: "header", id: `h-${p.id}`, label: p.name });

        (p.children || []).forEach((ch) => {
          out.push({
            kind: "opt",
            ...ch,
            _label: ch.name,
            _parentLabel: p.name,
          });
        });
      });

    // Otras
    out.push({ kind: "header", id: "h-otras", label: "Otras" });
    (singles || []).forEach((s) => {
      out.push({ kind: "opt", ...s, _label: s.name, _parentLabel: "Otras" });
    });

    return out;
  }, [tree, singles]);

  const menuPaperSx = {
    borderRadius: 3,
    mt: 1,
    backgroundImage: PALETTE.bgMenu,
    backgroundColor: PALETTE.menuHeaderBg,
    border: `1px solid ${PALETTE.stroke}`,
    boxShadow:
      "0 40px 120px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03)",
    color: PALETTE.txt,
    overflow: "hidden",
  };

  const title = product?.name ? `Categorías de: ${product.name}` : "Categorías";

  // Para que Autocomplete no truene con headers, le decimos que solo compare opts reales
  const isOpt = (x) => x && x.kind === "opt";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: PALETTE.bgCard,
          border: `1px solid ${PALETTE.stroke}`,
          boxShadow:
            "0 40px 120px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03)",
          color: PALETTE.txt,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 900, color: PALETTE.txt }}>
        {title}
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Typography variant="body2" sx={{ color: PALETTE.txt }}>
          Puedes asignar múltiples categorías. Los humanos y sus taxonomías infinitas.
        </Typography>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack gap={2}>
            <Box>
              <Typography variant="caption" sx={{ color: PALETTE.txt, opacity: 0.85 }}>
                Categorías actuales
              </Typography>

              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {selected.length ? (
                  selected.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      onDelete={
                        saving
                          ? undefined
                          : () =>
                              setSelected((prev) =>
                                prev.filter((x) => Number(x.id) !== Number(c.id))
                              )
                      }
                      sx={{
                        fontWeight: 800,
                        color: PALETTE.txt,
                        border: `1px solid ${PALETTE.stroke}`,
                        bgcolor: "rgba(255,255,255,0.06)",
                        "& .MuiChip-deleteIcon": { color: PALETTE.cyan },
                      }}
                    />
                  ))
                ) : (
                  <Chip
                    label="Sin categorías"
                    variant="outlined"
                    sx={{ color: PALETTE.txt, borderColor: PALETTE.stroke }}
                  />
                )}
              </Stack>
            </Box>

            {/* ✅ Autocomplete con “headers + barrita” */}
            <Autocomplete
              multiple
              options={options}
              value={selected}
              onChange={(_, newValue) => setSelected(newValue.filter(Boolean))}
              disableCloseOnSelect
              PaperComponent={(props) => <Paper {...props} sx={menuPaperSx} />}
              getOptionLabel={(o) => (isOpt(o) ? o._label || o.name || "" : o.label || "")}
              // headers no seleccionables
              getOptionDisabled={(o) => o.kind === "header"}
              // comparación sólo para opts reales
              isOptionEqualToValue={(opt, val) =>
                isOpt(opt) && val ? Number(opt.id) === Number(val.id) : false
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    sx={{
                      borderRadius: 999,
                      bgcolor: PALETTE.cyanSoft,
                      border: `1px solid ${PALETTE.stroke}`,
                      color: PALETTE.txt,
                      fontWeight: 800,
                    }}
                  />
                ))
              }
              renderOption={(props, option, { selected: isSelected }) => {
                // HEADER (Caballero / Dama / Otras)
                if (option.kind === "header") {
                  return (
                    <li {...props} key={option.id} aria-disabled>
                      <Box
                        sx={{
                          width: "100%",
                          py: 1.1,
                          px: 1.5,
                          fontWeight: 950,
                          fontSize: 18,
                          color: "#fff",
                          bgcolor: "rgba(255,255,255,0.04)",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {option.label}
                      </Box>
                    </li>
                  );
                }

                // HIJA / ITEM normal con barrita
                return (
                  <li {...props} key={option.id}>
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        py: 0.9,
                        px: 1.5,
                        pl: 3.2, // indent
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 14,
                          top: 10,
                          bottom: 10,
                          width: 2,
                          borderRadius: 999,
                          background: "rgba(118,224,255,0.22)", // barrita
                        },
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ color: PALETTE.txt, fontWeight: 800 }}
                        noWrap
                      >
                        {option.name}
                      </Typography>

                      {isSelected ? (
                        <Chip
                          size="small"
                          label="✓"
                          sx={{
                            height: 22,
                            fontWeight: 900,
                            color: "#0B0E12",
                            bgcolor: PALETTE.cyan,
                          }}
                        />
                      ) : null}
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Agregar o quitar categorías"
                  placeholder="Busca por nombre..."
                  InputLabelProps={{
                    sx: {
                      color: PALETTE.txt,
                      "&.Mui-focused": { color: PALETTE.cyan },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: PALETTE.txt,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.06)",
                      "& fieldset": { borderColor: PALETTE.stroke },
                      "&:hover fieldset": { borderColor: PALETTE.cyan },
                      "&.Mui-focused fieldset": { borderColor: PALETTE.accent },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255,255,255,0.65)",
                    },
                  }}
                />
              )}
            />

            <Typography variant="caption" sx={{ color: PALETTE.txt, opacity: 0.75 }}>
              Los grupos se muestran como encabezados. Las hijas van indentadas con la barrita.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: PALETTE.txt }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || !product?.id}
          sx={{
            fontWeight: 900,
            borderRadius: 2,
            bgcolor: PALETTE.cyan,
            color: "#0B0E12",
            boxShadow: "0 14px 34px rgba(118,224,255,0.30)",
            "&:hover": { bgcolor: PALETTE.cyan },
          }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
