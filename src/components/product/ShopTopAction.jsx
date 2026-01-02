import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  TextField,
  Chip,
  Button,
  Collapse,
  Stack,
  Typography,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

/** Barajar y tomar N */
function pickRandom(items, n = 5) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const PALETTE = {
  bgCard:
    "linear-gradient(180deg, rgba(10,12,16,0.92) 0%, rgba(12,14,20,0.92) 100%)",
  // más opaco para evitar transparencias en el menú
  bgMenu:
    "linear-gradient(180deg, rgba(10,12,16,0.98) 0%, rgba(12,14,20,0.98) 100%)",
  stroke: "rgba(255,255,255,0.10)",
  txt: "rgba(255,255,255,0.92)",
  accent: "#7C4DFF",
  accentSoft: "rgba(124,77,255,0.12)",
  glow: "0 10px 38px rgba(124,77,255,0.35)",
  cyan: "#76E0FF",
  cyanSoft: "rgba(118,224,255,0.10)",
  pink: "#FF5EA6",
  pinkSoft: "rgba(255,94,166,0.12)",
  // fondo sólido para el header sticky del buscador (NO transparente)
  menuHeaderBg: "rgba(12,14,20,0.98)"
};

const ShopTopAction = ({
  getFilterSortParams,
  productCount,
  sortedProductCount,
  categories = [],
  loadingCats = false
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeCat, setActiveCat] = React.useState(null);

  // Mostrar todas: Collapse (<=20) o Dialog (>20)
  const [showAll, setShowAll] = React.useState(false);
  const [openAllDialog, setOpenAllDialog] = React.useState(false);
  const [allFilter, setAllFilter] = React.useState("");

  const manyCats = !loadingCats && categories.length > 20;

  // ===== Detectar si vienen agrupables (children o parent_id) =====
  const hasChildrenShape = React.useMemo(
    () =>
      Array.isArray(categories) &&
      categories.some((c) => Array.isArray(c?.children) && c.children.length > 0),
    [categories]
  );

  const hasParentIdShape = React.useMemo(
    () => Array.isArray(categories) && categories.some((c) => c?.parent_id != null),
    [categories]
  );

  const useGroupedSelect = hasChildrenShape || hasParentIdShape;

  // ===== Construir grupos =====
  const { groups, singles } = React.useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];

    // Caso 1: ya vienen con children
    if (hasChildrenShape) {
      const grouped = list
        .filter((c) => (c?.children?.length ?? 0) > 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

      const singlesOnly = list
        .filter((c) => (c?.children?.length ?? 0) === 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

      return { groups: grouped, singles: singlesOnly };
    }

    // Caso 2: flat con parent_id
    const parents = list.filter((c) => c?.parent_id == null);
    const childrenByParent = new Map();

    list.forEach((c) => {
      if (c?.parent_id != null) {
        const arr = childrenByParent.get(c.parent_id) ?? [];
        arr.push(c);
        childrenByParent.set(c.parent_id, arr);
      }
    });

    const grouped = parents
      .map((p) => ({
        ...p,
        children: (childrenByParent.get(p.id) ?? []).sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        )
      }))
      .filter((p) => (p.children?.length ?? 0) > 0)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const singlesOnly = parents
      .filter((p) => (p.children?.length ?? 0) === 0)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return { groups: grouped, singles: singlesOnly };
  }, [categories, hasChildrenShape]);

  // ===== Dedup de singles: evita repetir encabezados en "Otras" =====
  const singlesDedup = React.useMemo(() => {
    const groupIds = new Set(groups.map((g) => String(g.id)));
    return (singles ?? []).filter((s) => !groupIds.has(String(s.id)));
  }, [groups, singles]);

  // ===== Sample chips (solo cuando NO hay grupos) =====
  const sample = React.useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return pickRandom(categories, 5);
  }, [categories]);

  const onSearch = (val) => {
    setSearchTerm(val);
    getFilterSortParams("searchQuery", val);
  };

  // ===== Select: estado + búsqueda dentro =====
  // value: "" | "p:ID" | "c:ID" | "s:ID"
  const [selectValue, setSelectValue] = React.useState("");
  const [selectQuery, setSelectQuery] = React.useState("");

  const MENU_SEARCH_STICKY_TOP = 0;

  const selectOptions = React.useMemo(() => {
    const q = selectQuery.trim().toLowerCase();

    if (!q) return { groups, singles: singlesDedup };

    // filtra hijos por búsqueda
    const filteredGroups = groups
      .map((g) => ({
        ...g,
        children: (g.children ?? []).filter((c) =>
          String(c?.name ?? "").toLowerCase().includes(q)
        )
      }))
      // si coincide el nombre del padre, mantenlo con todos sus hijos
      .map((g) => {
        const parentMatches = String(g?.name ?? "").toLowerCase().includes(q);
        if (parentMatches) return { ...g, children: g.children ?? [] };
        return g;
      })
      .filter((g) => (g.children?.length ?? 0) > 0);

    const filteredSingles = singlesDedup.filter((s) =>
      String(s?.name ?? "").toLowerCase().includes(q)
    );

    return { groups: filteredGroups, singles: filteredSingles };
  }, [selectQuery, groups, singlesDedup]);

  const clearCategory = () => {
    setActiveCat(null);
    setSelectValue("");
    setSelectQuery("");
    getFilterSortParams("category", null);
  };

  const filteredAllCats = React.useMemo(() => {
    const q = allFilter.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      String(c?.name ?? c?.label ?? c?.slug ?? c?.id)
        .toLowerCase()
        .includes(q)
    );
  }, [allFilter, categories]);

  const toggleSeeAll = () => {
    if (manyCats) setOpenAllDialog(true);
    else setShowAll((s) => !s);
  };

  const menuPaperSx = {
    borderRadius: 3,
    mt: 1,
    backgroundImage: PALETTE.bgMenu,
    backgroundColor: PALETTE.menuHeaderBg,
    border: `1px solid ${PALETTE.stroke}`,
    boxShadow:
      "0 40px 120px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03)",
    color: PALETTE.txt
  };

  const parseSelect = (val) => {
    if (!val) return { kind: "all" };
    const [kind, rawId] = String(val).split(":");
    return { kind, id: rawId };
  };

  const onSelectChange = (e) => {
    const value = e.target.value;
    setSelectValue(value);

    if (!value) {
      setActiveCat(null);
      getFilterSortParams("category", null);
      return;
    }

    const { kind, id } = parseSelect(value);

    // Padre
    if (kind === "p") {
      const g = groups.find((x) => String(x.id) === String(id));
      const payload = {
        id: g?.id ?? id,
        name: g?.name ?? String(id),
        type: "parent"
      };
      setActiveCat(payload);
      getFilterSortParams("category", payload);
      return;
    }

    // Hijo
    if (kind === "c") {
      for (const g of groups) {
        const c = (g.children ?? []).find((x) => String(x.id) === String(id));
        if (c) {
          const payload = {
            id: c.id,
            name: c.name,
            type: "child",
            parent_id: g.id
          };
          setActiveCat(payload);
          getFilterSortParams("category", payload);
          return;
        }
      }
      // fallback hijo sin grupo (raro)
      const payload = { id, name: String(id), type: "child" };
      setActiveCat(payload);
      getFilterSortParams("category", payload);
      return;
    }

    // Suelta
    if (kind === "s") {
      const s = singlesDedup.find((x) => String(x.id) === String(id));
      const payload = {
        id: s?.id ?? id,
        name: s?.name ?? String(id),
        type: "single"
      };
      setActiveCat(payload);
      getFilterSortParams("category", payload);
      return;
    }

    // fallback
    const payload = { id, name: String(id), type: "single" };
    setActiveCat(payload);
    getFilterSortParams("category", payload);
  };
  const handlePickCategory = (payload, value) => {
  console.group("🟣 CATEGORY PICK");
  console.log("Payload:", payload);
  console.log("Select value:", value);
  console.groupEnd();

  setSelectValue(value);
  setActiveCat(payload);

  console.warn("➡️ getFilterSortParams(category)", payload);
  getFilterSortParams("category", payload);
};


  return (
    <>
      <Card
        elevation={0}
        sx={{
          mb: 3.5,
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: 3,
          bgcolor: "transparent",
          backgroundImage: PALETTE.bgCard,
          border: `1px solid ${PALETTE.stroke}`,
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)"
        }}
      >
        {/* Encabezado */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, letterSpacing: ".3px", color: PALETTE.txt }}
          >
            Explorar productos
          </Typography>
          <Typography variant="body2" sx={{ color: PALETTE.txt }}>
            Filtra por nombre o categoría para encontrar lo que necesitas.
          </Typography>
        </Box>

        {/* Buscador productos */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar producto por nombre…"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: PALETTE.txt }} />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              color: PALETTE.txt,
              borderRadius: 2,
              bgcolor: PALETTE.cyanSoft,
              "& fieldset": { borderColor: PALETTE.stroke },
              "&:hover fieldset": { borderColor: PALETTE.cyan },
              "&.Mui-focused fieldset": { borderColor: PALETTE.accent }
            },
            "& .MuiInputBase-input::placeholder": { color: PALETTE.txt }
          }}
        />

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

        {/* ===== Si hay grupos => Select con búsqueda dentro ===== */}
        {!loadingCats && useGroupedSelect ? (
          <Box>
            <FormControl fullWidth>
              <InputLabel
                shrink
                sx={{
                  color: PALETTE.txt,
                  "&.Mui-focused": { color: PALETTE.cyan }
                }}
              >
                Categoría
              </InputLabel>

              <Select
                value={selectValue}
                label="Categoría"
                onChange={onSelectChange}
                displayEmpty
                renderValue={(val) => {
                  if (!val) return <span style={{ color: PALETTE.txt }}>TODAS</span>;
                  return (
                    <span style={{ color: PALETTE.txt, fontWeight: 900 }}>
                      {activeCat?.name ?? "Categoría"}
                    </span>
                  );
                }}
                MenuProps={{
                  PaperProps: { sx: menuPaperSx },
                  MenuListProps: {
                    sx: {
                      maxHeight: 440,
                      py: 0,
                      bgcolor: PALETTE.menuHeaderBg,
                      backgroundImage: PALETTE.bgMenu,

                      "& .MuiMenuItem-root": {
                        color: PALETTE.txt,
                        bgcolor: "transparent",
                        transition: "all .15s ease"
                      },
                      "& .MuiMenuItem-root:hover": {
                        bgcolor: "rgba(118,224,255,0.10)"
                      },
                      "& .MuiMenuItem-root.Mui-focusVisible": {
                        bgcolor: "rgba(118,224,255,0.14)"
                      },
                      "& .MuiMenuItem-root.Mui-selected": {
                        bgcolor: "rgba(124,77,255,0.16) !important"
                      },
                      "& .MuiMenuItem-root.Mui-selected:hover": {
                        bgcolor: "rgba(124,77,255,0.22) !important"
                      },

                      "& .MuiListSubheader-root": {
                        bgcolor: PALETTE.menuHeaderBg,
                        backgroundImage: "none"
                      },
                      "& .MuiListSubheader-root.MuiListSubheader-sticky": {
                        bgcolor: PALETTE.menuHeaderBg,
                        backgroundImage: "none"
                      },

                      "&::-webkit-scrollbar": { width: 8 },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(255,255,255,0.18)",
                        borderRadius: 999
                      }
                    }
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: PALETTE.stroke
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: PALETTE.cyan
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: PALETTE.accent
                  },
                  color: PALETTE.txt,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)"
                }}
              >
                {/* ===== Buscador dentro del menú (FIJO + NO transparente) ===== */}
                <ListSubheader
                  disableSticky={false}
                  sx={{
                    bgcolor: PALETTE.menuHeaderBg,
                    backgroundImage: "none",
                    position: "sticky",
                    top: MENU_SEARCH_STICKY_TOP,
                    zIndex: 10,
                    px: 1,
                    py: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar categoría…"
                    value={selectQuery}
                    onChange={(e) => setSelectQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: PALETTE.txt }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: PALETTE.txt,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.08)",
                        "& fieldset": { borderColor: PALETTE.stroke },
                        "&:hover fieldset": { borderColor: PALETTE.cyan },
                        "&.Mui-focused fieldset": { borderColor: PALETTE.accent }
                      },
                      "& .MuiInputBase-input::placeholder": { color: PALETTE.txt }
                    }}
                  />
                </ListSubheader>

                {/* TODAS */}
                <MenuItem value="">
                  <Typography sx={{ fontWeight: 900, color: PALETTE.txt }}>
                    TODAS
                  </Typography>
                </MenuItem>

                {/* Grupos + Padre seleccionable + Hijas */}
            {selectOptions.groups.map((g) => (
  <React.Fragment key={`grp-${g.id}`}>
    {/* ✅ PADRE seleccionable */}
    <MenuItem
      value={`p:${g.id}`}
      sx={{
        fontWeight: 950,
        color: "#fff",
        bgcolor: "rgba(255,255,255,0.04)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}
    >
      <Typography sx={{ fontWeight: 950, color: "#fff" }}>
        {g.name}
      </Typography>
    </MenuItem>

    {/* ✅ HIJAS */}
    {(g.children ?? []).map((c) => (
      <MenuItem
        key={`cat-${c.id}`}
        value={`c:${c.id}`}
        sx={{
          pl: 4.5,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            left: 18,
            top: 8,
            bottom: 8,
            width: 2,
            borderRadius: 999,
            background: "rgba(118,224,255,0.22)"
          },
          "&:hover": { bgcolor: "rgba(118,224,255,0.08)" }
        }}
      >
        <Typography sx={{ color: PALETTE.txt, fontWeight: 800 }}>
          {c.name}
        </Typography>
      </MenuItem>
    ))}
  </React.Fragment>
))}


                {/* Sueltas */}
                {selectOptions.singles.length > 0 && (
                  <ListSubheader
                    sx={{
                      bgcolor: PALETTE.bgMenu,
                      backgroundImage: "none",
                      color: "#fff",
                      fontWeight: 950,
                      letterSpacing: ".25px",
                      lineHeight: "34px",
                      opacity: 0.96,
                      mt: 0.5,
                      "&.MuiListSubheader-sticky": {
                        color: "#fff",
                        bgcolor: PALETTE.bgMenu,
                        backgroundImage: "none"
                      }
                    }}
                  >
                    Otras
                  </ListSubheader>
                )}

                {selectOptions.singles.map((s) => (
                  <MenuItem key={`single-${s.id}`} value={`s:${s.id}`}>
                    <Typography sx={{ color: PALETTE.txt, fontWeight: 800 }}>
                      {s.name}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                onClick={clearCategory}
                variant="outlined"
                sx={{
                  borderColor: PALETTE.cyan,
                  color: PALETTE.cyan,
                  "&:hover": {
                    borderColor: PALETTE.cyan,
                    bgcolor: PALETTE.cyanSoft
                  }
                }}
              >
                Limpiar filtro
              </Button>
            </Stack>
          </Box>
        ) : (
          /* ===== Si NO hay grupos => tu UI de chips intacta ===== */
          !loadingCats &&
          sample.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: 800, color: PALETTE.txt }}
              >
                Sugerencias de categorías
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label="TODAS"
                  onClick={clearCategory}
                  variant="filled"
                  sx={{
                    px: 1.25,
                    height: 34,
                    fontWeight: 900,
                    letterSpacing: ".2px",
                    color: activeCat ? PALETTE.cyan : "#fff",
                    borderRadius: 999,
                    border: `1px solid ${
                      activeCat ? "rgba(255,255,255,.12)" : PALETTE.cyan
                    }`,
                    boxShadow: activeCat
                      ? "none"
                      : "0 14px 34px rgba(118,224,255,0.30)",
                    cursor: "pointer",
                    transition: "all .18s ease",
                    "&:hover": {
                      boxShadow: activeCat
                        ? "0 0 18px rgba(118,224,255,.28)"
                        : "0 20px 48px rgba(118,224,255,0.40)"
                    }
                  }}
                />

                {sample.map((cat) => {
                  const active = activeCat?.id === cat.id;
                  return (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => {
                        // chips aquí mandan "single"
                        const payload = { id: cat.id, name: cat.name, type: "single" };
                        setActiveCat(payload);
                        getFilterSortParams("category", payload);
                      }}
                      variant="filled"
                      sx={{
                        px: 1.25,
                        height: 34,
                        fontWeight: 800,
                        letterSpacing: ".2px",
                        color: active ? "#fff" : PALETTE.cyan,
                        borderRadius: 999,
                        border: `1px solid ${
                          active ? PALETTE.accent : "rgba(255,255,255,.12)"
                        }`,
                        bgcolor: active ? PALETTE.accentSoft : "rgba(255,255,255,.06)",
                        boxShadow: active ? PALETTE.glow : "none",
                        cursor: "pointer",
                        transition: "all .18s ease",
                        "&:hover": {
                          boxShadow: active
                            ? "0 0 42px rgba(124,77,255,0.5)"
                            : "0 0 18px rgba(118,224,255,0.28)"
                        }
                      }}
                    />
                  );
                })}
              </Stack>

              {categories.length > sample.length && (
                <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    onClick={toggleSeeAll}
                    variant="contained"
                    sx={{
                      px: 2,
                      py: 1,
                      fontWeight: 900,
                      borderRadius: 2,
                      color: "#0B0E12",
                      bgcolor: "#fff",
                      boxShadow: "0 14px 34px rgba(118,224,255,0.30)",
                      "&:hover": {
                        bgcolor: "#fff",
                        boxShadow: "0 20px 48px rgba(118,224,255,0.40)"
                      }
                    }}
                  >
                    {manyCats
                      ? "Ver todas (panel)"
                      : showAll
                      ? "Ocultar categorías"
                      : "Ver todas las categorías"}
                  </Button>
                </Box>
              )}

              {!manyCats && (
                <Collapse in={showAll} unmountOnExit>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 1.75 }}
                  >
                    {categories.map((cat) => {
                      const active = activeCat?.id === cat.id;
                      return (
                        <Chip
                          key={`all-${cat.id}`}
                          label={cat.name}
                          onClick={() => {
                            const payload = { id: cat.id, name: cat.name, type: "single" };
                            setActiveCat(payload);
                            getFilterSortParams("category", payload);
                          }}
                          variant="filled"
                          sx={{
                            px: 1.15,
                            height: 32,
                            fontWeight: 800,
                            letterSpacing: ".2px",
                            color: active ? PALETTE.pink : PALETTE.txt,
                            borderRadius: 999,
                            border: `1px solid ${
                              active ? PALETTE.pink : "rgba(255,255,255,.12)"
                            }`,
                            bgcolor: active ? PALETTE.pinkSoft : "rgba(255,255,255,.06)",
                            boxShadow: active
                              ? "0 0 28px rgba(255,94,166,.35)"
                              : "none",
                            cursor: "pointer",
                            transition: "all .18s ease",
                            "&:hover": {
                              boxShadow: active
                                ? "0 0 34px rgba(255,94,166,.45)"
                                : "0 0 16px rgba(118,224,255,.25)"
                            }
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Collapse>
              )}
            </Box>
          )
        )}

        {/* Pie: contador */}
        <Box
          sx={{
            mt: 2.25,
            px: 1.5,
            py: 1.25,
            borderRadius: 2,
            border: `1px dashed ${PALETTE.stroke}`,
            bgcolor: "rgba(255,255,255,0.03)"
          }}
        >
          <Typography variant="body2" sx={{ color: PALETTE.txt }}>
            Mostrando{" "}
            <Typography component="span" sx={{ color: PALETTE.cyan, fontWeight: 800 }}>
              {sortedProductCount}
            </Typography>{" "}
            de{" "}
            <Typography component="span" sx={{ color: PALETTE.txt, fontWeight: 700 }}>
              {productCount}
            </Typography>{" "}
            productos
          </Typography>
        </Box>
      </Card>

      {/* Dialog de TODAS (solo para modo chips) */}
      {!useGroupedSelect && (
        <Dialog
          open={openAllDialog}
          onClose={() => setOpenAllDialog(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundImage: PALETTE.bgCard,
              border: `1px solid ${PALETTE.stroke}`,
              boxShadow:
                "0 40px 120px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.03)",
              color: PALETTE.txt
            }
          }}
        >
          <DialogTitle
            sx={{ pr: 6, fontWeight: 900, letterSpacing: ".2px", color: PALETTE.txt }}
          >
            Todas las categorías
            <IconButton
              onClick={() => setOpenAllDialog(false)}
              sx={{ position: "absolute", right: 8, top: 8, color: PALETTE.txt }}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <TextField
              fullWidth
              placeholder="Buscar categoría…"
              value={allFilter}
              onChange={(e) => setAllFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: PALETTE.txt }} />
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  color: PALETTE.txt,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)",
                  "& fieldset": { borderColor: PALETTE.stroke },
                  "&:hover fieldset": { borderColor: PALETTE.cyan },
                  "&.Mui-focused fieldset": { borderColor: PALETTE.accent }
                }
              }}
            />

            <Box
              sx={{
                maxHeight: { xs: 360, sm: 420 },
                overflowY: "auto",
                pr: 0.5,
                "&::-webkit-scrollbar": { width: 8 },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 999
                }
              }}
            >
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {filteredAllCats.map((cat) => {
                  const active = activeCat?.id === cat.id;
                  return (
                    <Chip
                      key={`dlg-${cat.id}`}
                      label={cat.name}
                      onClick={() => {
                        const payload = { id: cat.id, name: cat.name, type: "single" };
                        setActiveCat(payload);
                        getFilterSortParams("category", payload);
                        setOpenAllDialog(false);
                      }}
                      variant="filled"
                      sx={{
                        px: 1.15,
                        height: 32,
                        fontWeight: 800,
                        letterSpacing: ".2px",
                        color: active ? PALETTE.pink : PALETTE.txt,
                        borderRadius: 999,
                        border: `1px solid ${
                          active ? PALETTE.pink : "rgba(255,255,255,.12)"
                        }`,
                        bgcolor: active ? PALETTE.pinkSoft : "rgba(255,255,255,.06)",
                        boxShadow: active
                          ? "0 0 28px rgba(255,94,166,.35)"
                          : "none",
                        cursor: "pointer",
                        transition: "all .18s ease",
                        "&:hover": {
                          boxShadow: active
                            ? "0 0 34px rgba(255,94,166,.45)"
                            : "0 0 16px rgba(118,224,255,.25)"
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                onClick={clearCategory}
                variant="outlined"
                sx={{
                  borderColor: PALETTE.cyan,
                  color: PALETTE.cyan,
                  "&:hover": { borderColor: PALETTE.cyan, bgcolor: PALETTE.cyanSoft }
                }}
              >
                Limpiar filtro
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

ShopTopAction.propTypes = {
  getFilterSortParams: PropTypes.func.isRequired,
  productCount: PropTypes.number.isRequired,
  sortedProductCount: PropTypes.number.isRequired,
  categories: PropTypes.array,
  loadingCats: PropTypes.bool
};

export default ShopTopAction;
