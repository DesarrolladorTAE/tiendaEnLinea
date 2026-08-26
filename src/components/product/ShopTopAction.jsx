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
  ListSubheader,
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

const DEFAULT_PALETTE = {
  bgCard:
    "linear-gradient(180deg, rgba(10,12,16,0.92) 0%, rgba(12,14,20,0.92) 100%)",
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
  menuHeaderBg: "rgba(12,14,20,0.98)",
};

const ShopTopAction = ({
  getFilterSortParams,
  productCount,
  sortedProductCount,
  categories = [],
  loadingCats = false,
  isStore464 = false,
  variantSearch = "",
  showSortSelector = false,
  currentSort = "newest",
  storefrontColors = {}, storefrontTheme = {},
}) => {
  const PALETTE = React.useMemo(() => {
    const background = storefrontColors.background || "#ffffff";
    const text = storefrontColors.text || "#111827";
    const secondary = storefrontColors.secondary || "#475569";
    const accent = storefrontColors.accent || "#2563eb";
    const primary = storefrontColors.primary || "#111827";
    return { ...DEFAULT_PALETTE, bgCard: background, bgMenu: background, menuHeaderBg: background, stroke: secondary, txt: text, accent, accentSoft: `color-mix(in srgb, ${accent} 14%, transparent)`, glow: storefrontTheme.shadowValue || `0 10px 38px color-mix(in srgb, ${accent} 28%, transparent)`, cyan: accent, cyanSoft: `color-mix(in srgb, ${accent} 12%, transparent)`, pink: primary, pinkSoft: `color-mix(in srgb, ${primary} 12%, transparent)` };
  }, [storefrontColors, storefrontTheme.shadowValue]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeCat, setActiveCat] = React.useState(null);

  // Mostrar todas: Collapse (<=20) o Dialog (>20)
  const [showAll, setShowAll] = React.useState(false);
  const [openAllDialog, setOpenAllDialog] = React.useState(false);
  const [allFilter, setAllFilter] = React.useState("");

  const manyCats = !loadingCats && categories.length > 20;

  // ✅ Control del open del Select (para cerrar al seleccionar)
  const [selectOpen, setSelectOpen] = React.useState(false);

  // ===== Detectar si vienen agrupables (children o parent_id) =====
  const hasChildrenShape = React.useMemo(
    () =>
      Array.isArray(categories) &&
      categories.some(
        (c) => Array.isArray(c?.children) && c.children.length > 0,
      ),
    [categories],
  );

  const hasParentIdShape = React.useMemo(
    () =>
      Array.isArray(categories) && categories.some((c) => c?.parent_id != null),
    [categories],
  );

  const useGroupedSelect = hasChildrenShape || hasParentIdShape;

  // ===== Construir grupos =====
  const { groups, singles } = React.useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];

    if (hasChildrenShape) {
      const grouped = list
        .filter((c) => (c?.children?.length ?? 0) > 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

      const singlesOnly = list
        .filter((c) => (c?.children?.length ?? 0) === 0)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));

      return { groups: grouped, singles: singlesOnly };
    }

    const parents = list.filter((c) => c?.parent_id == null);
    const childrenByParent = new Map();

    list.forEach((c) => {
      if (c?.parent_id != null) {
        const key = String(c.parent_id);
        const arr = childrenByParent.get(key) ?? [];
        arr.push(c);
        childrenByParent.set(key, arr);
      }
    });

    const grouped = parents
      .map((p) => ({
        ...p,
        children: (childrenByParent.get(String(p.id)) ?? []).sort((a, b) =>
          String(a.name).localeCompare(String(b.name)),
        ),
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
    console.log("🔎 searchQuery:", val);
    getFilterSortParams("searchQuery", val);
  };

  // ===== Select: estado + búsqueda dentro =====
  const [selectValue, setSelectValue] = React.useState("");
  const [selectQuery, setSelectQuery] = React.useState("");

  const selectOptions = React.useMemo(() => {
    const q = selectQuery.trim().toLowerCase();
    if (!q) return { groups, singles: singlesDedup };

    const filteredGroups = groups
      .map((g) => {
        const parentMatches = String(g?.name ?? "")
          .toLowerCase()
          .includes(q);
        const kids = (g.children ?? []).filter((c) =>
          String(c?.name ?? "")
            .toLowerCase()
            .includes(q),
        );
        return parentMatches
          ? { ...g, children: g.children ?? [] }
          : { ...g, children: kids };
      })
      .filter((g) => (g.children?.length ?? 0) > 0);

    const filteredSingles = singlesDedup.filter((s) =>
      String(s?.name ?? "")
        .toLowerCase()
        .includes(q),
    );

    return { groups: filteredGroups, singles: filteredSingles };
  }, [selectQuery, groups, singlesDedup]);

  const clearCategory = () => {
    console.group("🧹 CLEAR CATEGORY");
    console.log("Before:", { selectValue, activeCat, selectOpen });
    console.groupEnd();

    setActiveCat(null);
    setSelectValue("");
    setSelectQuery("");
    setSelectOpen(false);
    getFilterSortParams("category", null);
  };

  const filteredAllCats = React.useMemo(() => {
    const q = allFilter.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      String(c?.name ?? c?.label ?? c?.slug ?? c?.id)
        .toLowerCase()
        .includes(q),
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
    color: PALETTE.txt,
  };

  const parseSelect = (val) => {
    if (!val) return { kind: "all" };
    const [kind, rawId] = String(val).split(":");
    return { kind, id: rawId };
  };

  // ✅ “Force pick”: selecciona y CIERRA el menú
  const handlePickCategory = (payload, value) => {
    console.group("🟣 CATEGORY PICK");
    console.log("payload:", payload);
    console.log("value:", value);
    console.groupEnd();

    setSelectValue(value);
    setActiveCat(payload);

    console.warn("➡️ getFilterSortParams(category)", payload);
    getFilterSortParams("category", payload);

    // ✅ CIERRA el menú al seleccionar
    setSelectOpen(false);
  };

  // ✅ onChange normal (por si MUI decide sí funcionar)
  const onSelectChange = (e) => {
    const value = e.target.value;

    console.group("🟠 SELECT onChange");
    console.log("raw value:", value);
    console.log("prev selectValue:", selectValue);
    console.groupEnd();

    setSelectValue(value);
    setSelectOpen(false); // ✅ cerrar SIEMPRE al seleccionar

    if (!value) {
      setActiveCat(null);
      getFilterSortParams("category", null);
      return;
    }

    const { kind, id } = parseSelect(value);

    if (kind === "p") {
      const g = groups.find((x) => String(x.id) === String(id));
      const payload = {
        id: g?.id ?? id,
        name: g?.name ?? String(id),
        type: "parent",
      };
      setActiveCat(payload);
      getFilterSortParams("category", payload);
      return;
    }

    if (kind === "c") {
      for (const g of groups) {
        const c = (g.children ?? []).find((x) => String(x.id) === String(id));
        if (c) {
          const payload = {
            id: c.id,
            name: c.name,
            type: "child",
            parent_id: g.id,
          };
          setActiveCat(payload);
          getFilterSortParams("category", payload);
          return;
        }
      }
      const payload = { id, name: String(id), type: "child" };
      setActiveCat(payload);
      getFilterSortParams("category", payload);
      return;
    }

    if (kind === "s") {
      const s = singlesDedup.find((x) => String(x.id) === String(id));
      const payload = {
        id: s?.id ?? id,
        name: s?.name ?? String(id),
        type: "single",
      };
      setActiveCat(payload);
      getFilterSortParams("category", payload);
      return;
    }

    const payload = { id, name: String(id), type: "single" };
    setActiveCat(payload);
    getFilterSortParams("category", payload);
  };

  // 🔥 Logs de forma/agrupación
  React.useEffect(() => {
    console.group("🧾 CATEGORIES SHAPE");
    console.log("loadingCats:", loadingCats);
    console.log("categories length:", categories?.length);
    console.log("hasChildrenShape:", hasChildrenShape);
    console.log("hasParentIdShape:", hasParentIdShape);
    console.log("useGroupedSelect:", useGroupedSelect);
    console.log("groups:", groups);
    console.log("singlesDedup:", singlesDedup);
    console.groupEnd();
  }, [
    loadingCats,
    categories,
    hasChildrenShape,
    hasParentIdShape,
    useGroupedSelect,
    groups,
    singlesDedup,
  ]);

  return (
    <>
      <Card className="sf-shop-search"
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
          backdropFilter: "blur(10px)",
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
            ),
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              color: PALETTE.txt,
              borderRadius: 2,
              bgcolor: PALETTE.cyanSoft,
              "& fieldset": { borderColor: PALETTE.stroke },
              "&:hover fieldset": { borderColor: PALETTE.cyan },
              "&.Mui-focused fieldset": { borderColor: PALETTE.accent },
            },
            "& .MuiInputBase-input::placeholder": { color: PALETTE.txt },
          }}
        />
        {showSortSelector && (
          <TextField
            select
            fullWidth
            label="Ordenar productos"
            value={currentSort}
            onChange={(event) => getFilterSortParams("sortBy", event.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": { color: PALETTE.txt, bgcolor: PALETTE.cyanSoft, borderRadius: 2 },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: PALETTE.stroke },
              "& .MuiInputLabel-root, & .MuiSelect-icon": { color: PALETTE.txt },
            }}
          >
            <MenuItem value="newest">Más recientes primero</MenuItem>
            <MenuItem value="oldest">Más antiguos primero</MenuItem>
            <MenuItem value="name_asc">Nombre A–Z</MenuItem>
            <MenuItem value="name_desc">Nombre Z–A</MenuItem>
            <MenuItem value="price_asc">Precio menor a mayor</MenuItem>
            <MenuItem value="price_desc">Precio mayor a menor</MenuItem>
            <MenuItem value="stock_desc">Mayor existencia primero</MenuItem>
          </TextField>
        )}
        {isStore464 && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: PALETTE.cyanSoft,
              border: `1px solid ${PALETTE.cyan}`,
            }}
          >
            <Typography
              sx={{
                mb: 0.75,
                color: PALETTE.cyan,
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              Buscar existencias por talla
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ejemplo: CH-9, M-3, XL-3"
              value={variantSearch}
              onChange={(event) =>
                getFilterSortParams("variantSearch", event.target.value)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: PALETTE.cyan }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: PALETTE.txt,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)",
                  "& fieldset": {
                    borderColor: PALETTE.stroke,
                  },
                  "&:hover fieldset": {
                    borderColor: PALETTE.cyan,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: PALETTE.cyan,
                  },
                },
              }}
            />

            <Typography
              sx={{
                display: "block",
                mt: 0.75,
                color: PALETTE.txt,
                fontSize: 11,
                opacity: 0.75,
              }}
            >
              También puedes escribirlo sin guiones: CH9,M3,XL3
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

        {/* ===== Si hay grupos => Select con búsqueda dentro ===== */}
        {!loadingCats && useGroupedSelect ? (
          <Box>
            <FormControl fullWidth>
              <InputLabel
                shrink
                sx={{
                  color: PALETTE.txt,
                  "&.Mui-focused": { color: PALETTE.cyan },
                }}
              >
                Categoría
              </InputLabel>

              <Select
                value={selectValue}
                label="Categoría"
                onChange={onSelectChange}
                displayEmpty
                open={selectOpen}
                onOpen={() => {
                  console.log("🟦 SELECT OPEN");
                  setSelectOpen(true);
                }}
                onClose={() => {
                  console.log("🟥 SELECT CLOSE");
                  setSelectOpen(false);
                  // opcional: limpiar filtro al cerrar
                  // setSelectQuery("");
                }}
                renderValue={(val) => {
                  if (!val)
                    return <span style={{ color: PALETTE.txt }}>TODAS</span>;
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
                        transition: "all .15s ease",
                      },
                      "& .MuiMenuItem-root:hover": {
                        bgcolor: "rgba(118,224,255,0.10)",
                      },
                      "& .MuiMenuItem-root.Mui-selected": {
                        bgcolor: `${PALETTE.accentSoft} !important`,
                        color: `${PALETTE.accent} !important`,
                      },
                      "& .MuiMenuItem-root.Mui-selected:hover": {
                        bgcolor: `${PALETTE.accentSoft} !important`,
                      },

                      "& .MuiListSubheader-root": {
                        bgcolor: PALETTE.menuHeaderBg,
                        backgroundImage: "none",
                      },
                      "& .MuiListSubheader-root.MuiListSubheader-sticky": {
                        bgcolor: PALETTE.menuHeaderBg,
                        backgroundImage: "none",
                      },

                      scrollbarWidth: "thin",
                      scrollbarColor: `${PALETTE.accent} ${PALETTE.bgMenu}`,
                      "&::-webkit-scrollbar": { width: 10 },
                      "&::-webkit-scrollbar-track": { bgcolor: PALETTE.bgMenu, borderRadius: 999 },
                      "&::-webkit-scrollbar-thumb": {
                        background: PALETTE.accent,
                        borderRadius: 999,
                        border: `3px solid ${PALETTE.bgMenu}`,
                      },
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: PALETTE.stroke,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: PALETTE.cyan,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: PALETTE.accent,
                  },
                  color: PALETTE.txt,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)",
                }}
              >
                {/* Buscador dentro del menú */}
                <ListSubheader
                  disableSticky={false}
                  sx={{
                    bgcolor: PALETTE.menuHeaderBg,
                    backgroundImage: "none",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    px: 1,
                    py: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar categoría…"
                    value={selectQuery}
                    onChange={(e) => setSelectQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: PALETTE.txt }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: PALETTE.txt,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.08)",
                        "& fieldset": { borderColor: PALETTE.stroke },
                        "&:hover fieldset": { borderColor: PALETTE.cyan },
                        "&.Mui-focused fieldset": {
                          borderColor: PALETTE.accent,
                        },
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: PALETTE.txt,
                      },
                    }}
                  />
                </ListSubheader>

                {/* TODAS */}
                <MenuItem
                  value=""
                  onClick={() => {
                    console.log("✅ Click TODAS");
                    clearCategory();
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: PALETTE.txt }}>
                    TODAS
                  </Typography>
                </MenuItem>

                {/* Grupos: Padre seleccionable + Hijas */}
                {selectOptions.groups.map((g) => {
                  const parentValue = `p:${g.id}`;
                  const parentPayload = {
                    id: g.id,
                    name: g.name,
                    type: "parent",
                  };

                  return (
                    <React.Fragment key={`grp-${g.id}`}>
                      {/* PADRE */}
                      <MenuItem
                        value={parentValue}
                        onClick={() => {
                          console.log("✅ Click PARENT:", parentValue);
                          handlePickCategory(parentPayload, parentValue);
                        }}
                        sx={{
                          fontWeight: 950,
                          color: PALETTE.txt,
                          bgcolor: "rgba(255,255,255,0.04)",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <Typography sx={{ fontWeight: 950, color: PALETTE.txt }}>
                          {g.name}
                        </Typography>
                      </MenuItem>

                      {/* HIJAS */}
                      {(g.children ?? []).map((c) => {
                        const childValue = `c:${c.id}`;
                        const childPayload = {
                          id: c.id,
                          name: c.name,
                          type: "child",
                          parent_id: g.id,
                        };

                        return (
                          <MenuItem
                            key={`cat-${c.id}`}
                            value={childValue}
                            onClick={() => {
                              console.log("✅ Click CHILD:", childValue);
                              handlePickCategory(childPayload, childValue);
                            }}
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
                                background: "rgba(118,224,255,0.22)",
                              },
                              "&:hover": { bgcolor: "rgba(118,224,255,0.08)" },
                            }}
                          >
                            <Typography
                              sx={{ color: PALETTE.txt, fontWeight: 800 }}
                            >
                              {c.name}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {/* Sueltas */}
                {selectOptions.singles.length > 0 && (
                  <ListSubheader
                    sx={{
                      bgcolor: PALETTE.bgMenu,
                      backgroundImage: "none",
                      color: PALETTE.txt,
                      fontWeight: 950,
                      letterSpacing: ".25px",
                      lineHeight: "34px",
                      opacity: 0.96,
                      mt: 0.5,
                      "&.MuiListSubheader-sticky": {
                        color: PALETTE.txt,
                        bgcolor: PALETTE.bgMenu,
                        backgroundImage: "none",
                      },
                    }}
                  >
                    Otras
                  </ListSubheader>
                )}

                {selectOptions.singles.map((s) => {
                  const singleValue = `s:${s.id}`;
                  const singlePayload = {
                    id: s.id,
                    name: s.name,
                    type: "single",
                  };

                  return (
                    <MenuItem
                      key={`single-${s.id}`}
                      value={singleValue}
                      onClick={() => {
                        console.log("✅ Click SINGLE:", singleValue);
                        handlePickCategory(singlePayload, singleValue);
                      }}
                    >
                      <Typography sx={{ color: PALETTE.txt, fontWeight: 800 }}>
                        {s.name}
                      </Typography>
                    </MenuItem>
                  );
                })}
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
                    bgcolor: PALETTE.cyanSoft,
                  },
                }}
              >
                Limpiar filtro
              </Button>
            </Stack>
          </Box>
        ) : (
          // ===== Si NO hay grupos => UI de chips =====
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
                    color: activeCat ? PALETTE.cyan : PALETTE.txt,
                    borderRadius: 999,
                    border: `1px solid ${
                      activeCat ? "rgba(255,255,255,.12)" : PALETTE.cyan
                    }`,
                    boxShadow: activeCat
                      ? "none"
                      : "0 14px 34px rgba(118,224,255,0.30)",
                    cursor: "pointer",
                    transition: "all .18s ease",
                  }}
                />

                {sample.map((cat) => {
                  const active = activeCat?.id === cat.id;
                  return (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => {
                        const payload = {
                          id: cat.id,
                          name: cat.name,
                          type: "single",
                        };
                        setActiveCat(payload);
                        getFilterSortParams("category", payload);
                      }}
                      variant="filled"
                      sx={{
                        px: 1.25,
                        height: 34,
                        fontWeight: 800,
                        letterSpacing: ".2px",
                        color: active ? PALETTE.txt : PALETTE.cyan,
                        borderRadius: 999,
                        border: `1px solid ${
                          active ? PALETTE.accent : "rgba(255,255,255,.12)"
                        }`,
                        bgcolor: active
                          ? PALETTE.accentSoft
                          : "rgba(255,255,255,.06)",
                        boxShadow: active ? PALETTE.glow : "none",
                        cursor: "pointer",
                        transition: "all .18s ease",
                      }}
                    />
                  );
                })}
              </Stack>

              {categories.length > sample.length && (
                <Box
                  sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    onClick={toggleSeeAll}
                    variant="contained"
                    sx={{
                      px: 2,
                      py: 1,
                      fontWeight: 900,
                      borderRadius: 2,
                      color: "#0B0E12",
                      bgcolor: PALETTE.bgCard,
                      boxShadow: "0 14px 34px rgba(118,224,255,0.30)",
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
                            const payload = {
                              id: cat.id,
                              name: cat.name,
                              type: "single",
                            };
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
                            bgcolor: active
                              ? PALETTE.pinkSoft
                              : "rgba(255,255,255,.06)",
                            cursor: "pointer",
                            transition: "all .18s ease",
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
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          <Typography variant="body2" sx={{ color: PALETTE.txt }}>
            Mostrando{" "}
            <Typography
              component="span"
              sx={{ color: PALETTE.cyan, fontWeight: 800 }}
            >
              {sortedProductCount}
            </Typography>{" "}
            de{" "}
            <Typography
              component="span"
              sx={{ color: PALETTE.txt, fontWeight: 700 }}
            >
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
              color: PALETTE.txt,
            },
          }}
        >
          <DialogTitle sx={{ pr: 6, fontWeight: 900, color: PALETTE.txt }}>
            Todas las categorías
            <IconButton
              onClick={() => setOpenAllDialog(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: PALETTE.txt,
              }}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
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
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  color: PALETTE.txt,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)",
                  "& fieldset": { borderColor: PALETTE.stroke },
                  "&:hover fieldset": { borderColor: PALETTE.cyan },
                  "&.Mui-focused fieldset": { borderColor: PALETTE.accent },
                },
              }}
            />

            <Box
              sx={{
                maxHeight: { xs: 360, sm: 420 },
                overflowY: "auto",
                pr: 0.5,
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
                        const payload = {
                          id: cat.id,
                          name: cat.name,
                          type: "single",
                        };
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
                        bgcolor: active
                          ? PALETTE.pinkSoft
                          : "rgba(255,255,255,.06)",
                        cursor: "pointer",
                        transition: "all .18s ease",
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
                  "&:hover": {
                    borderColor: PALETTE.cyan,
                    bgcolor: PALETTE.cyanSoft,
                  },
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
  loadingCats: PropTypes.bool,
  isStore464: PropTypes.bool,
  variantSearch: PropTypes.string,
  showSortSelector: PropTypes.bool,
  currentSort: PropTypes.string,
  storefrontColors: PropTypes.object,
  storefrontTheme: PropTypes.object,
};

export default ShopTopAction;
