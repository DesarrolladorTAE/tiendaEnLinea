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
  Alert
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
  stroke: "rgba(255,255,255,0.10)",
  txt: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.62)",
  accent: "#7C4DFF",
  accentSoft: "rgba(124,77,255,0.12)",
  cyan: "#76E0FF",
  cyanSoft: "rgba(118,224,255,0.10)",
  pink: "#FF5EA6",
  pinkSoft: "rgba(255,94,166,0.12)"
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
  // activeCat: {id,name,type:'parent'|'child'|'single'} o null

  // Mostrar todas: Collapse (<=20) o Dialog (>20)
  const [showAll, setShowAll] = React.useState(false);
  const [openAllDialog, setOpenAllDialog] = React.useState(false);
  const [allFilter, setAllFilter] = React.useState("");

  const manyCats = !loadingCats && categories.length > 20;

  /** ===== Armar árbol desde flat: parents + children + singles ===== */
  const { treeParents, singles, allFlat } = React.useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];

    const parents = list.filter((c) => c?.parent_id == null);
    const childrenByParent = new Map();

    list.forEach((c) => {
      if (c?.parent_id != null) {
        const arr = childrenByParent.get(c.parent_id) ?? [];
        arr.push(c);
        childrenByParent.set(c.parent_id, arr);
      }
    });

    const tree = parents
      .map((p) => ({
        ...p,
        children: (childrenByParent.get(p.id) ?? []).sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        )
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const parentsWithKids = tree.filter((p) => (p.children?.length ?? 0) > 0);
    const singlesOnly = tree.filter((p) => (p.children?.length ?? 0) === 0);

    return { treeParents: parentsWithKids, singles: singlesOnly, allFlat: list };
  }, [categories]);

  /** ===== Sugerencias: mezcla de padres/hijas/sueltas ===== */
  const sample = React.useMemo(() => {
    if (!allFlat || allFlat.length === 0) return [];
    return pickRandom(allFlat, 6);
  }, [allFlat]);

  const onSearch = (val) => {
    setSearchTerm(val);
    getFilterSortParams("searchQuery", val);
  };

  const clearCategory = () => {
    setActiveCat(null);
    getFilterSortParams("category", null);
  };

  /** Seleccionar: padre/hija/suelta */
  const selectCategory = (payload) => {
    // payload: {id,name,type}
    if (activeCat?.id === payload?.id && activeCat?.type === payload?.type) {
      clearCategory();
      return;
    }
    setActiveCat(payload);
    // 🔥 aquí mandamos el objeto completo, no solo id
    getFilterSortParams("category", payload);
  };

  /** “Ver todas” */
  const toggleSeeAll = () => {
    if (manyCats) setOpenAllDialog(true);
    else setShowAll((s) => !s);
  };

  /** Filtrado del dialog "todas" */
  const filteredAllCats = React.useMemo(() => {
    const q = allFilter.trim().toLowerCase();
    if (!q) return allFlat;

    return allFlat.filter((c) =>
      String(c?.name ?? c?.id).toLowerCase().includes(q)
    );
  }, [allFilter, allFlat]);

  /** Helper: detectar tipo por parent_id para el dialog */
  const detectType = React.useCallback(
    (c) => {
      if (c?.parent_id != null) return "child";
      // es parent_id null: puede ser padre o suelta. Si está en treeParents => padre.
      const isParent = treeParents.some((p) => p.id === c.id);
      return isParent ? "parent" : "single";
    },
    [treeParents]
  );

  /** ===== Estilos por tipo (sin iconos) ===== */
  const chipStyleByType = (type, active) => {
    // padre: sólido, grande; hija: punteado, compacto; suelta: neutro
    if (type === "parent") {
      return {
        height: 36,
        fontWeight: 900,
        borderRadius: 2,
        border: `1px solid ${active ? PALETTE.cyan : "rgba(255,255,255,0.18)"}`,
        bgcolor: active ? "rgba(118,224,255,0.14)" : "rgba(255,255,255,0.06)",
        color: active ? PALETTE.cyan : PALETTE.txt
      };
    }
    if (type === "child") {
      return {
        height: 30,
        fontWeight: 800,
        borderRadius: 999,
        border: `1px dashed ${
          active ? PALETTE.accent : "rgba(255,255,255,0.18)"
        }`,
        bgcolor: active ? PALETTE.accentSoft : "rgba(255,255,255,0.04)",
        color: active ? "#fff" : PALETTE.txt
      };
    }
    // single
    return {
      height: 32,
      fontWeight: 800,
      borderRadius: 999,
      border: `1px solid ${active ? PALETTE.pink : "rgba(255,255,255,0.14)"}`,
      bgcolor: active ? PALETTE.pinkSoft : "rgba(255,255,255,0.04)",
      color: active ? PALETTE.pink : PALETTE.txt
    };
  };

  const TypePill = ({ label, type }) => {
    const bg =
      type === "parent"
        ? "rgba(118,224,255,0.10)"
        : type === "child"
        ? "rgba(124,77,255,0.10)"
        : "rgba(255,94,166,0.10)";

    const br =
      type === "parent"
        ? `1px solid rgba(118,224,255,0.35)`
        : type === "child"
        ? `1px dashed rgba(124,77,255,0.35)`
        : `1px solid rgba(255,94,166,0.35)`;

    return (
      <Box
        sx={{
          px: 1,
          py: 0.4,
          borderRadius: 999,
          bgcolor: bg,
          border: br,
          fontSize: 12,
          fontWeight: 900,
          color: PALETTE.txt
        }}
      >
        {label}
      </Box>
    );
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
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 900, letterSpacing: ".3px", color: PALETTE.txt }}
          >
            Explorar productos
          </Typography>
          <Typography variant="body2" sx={{ color: PALETTE.muted }}>
            Busca por nombre o filtra por categoría.
          </Typography>
        </Box>

        {/* Leyenda sin iconos */}
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >
          <TypePill type="parent" label="Padre: agrupa hijas" />
          <TypePill type="child" label="Hija: categoría específica" />
          <TypePill type="single" label="Suelta: sin padre" />
        </Stack>

        {/* Buscador */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar producto por nombre…"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: PALETTE.muted }} />
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
            "& .MuiInputBase-input::placeholder": { color: PALETTE.muted }
          }}
        />

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Aviso cuando se elige PADRE */}
        {activeCat?.type === "parent" && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              borderRadius: 2,
              bgcolor: "rgba(118,224,255,0.08)",
              color: PALETTE.txt,
              border: `1px solid ${PALETTE.stroke}`,
              "& .MuiAlert-icon": { color: PALETTE.cyan }
            }}
          >
            Seleccionaste un <b>Padre</b>. Se mostrarán productos de{" "}
            <b>todas sus hijas</b>.
          </Alert>
        )}

        {/* Sugerencias rápidas */}
        {!loadingCats && sample.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 900, color: PALETTE.muted }}
            >
              Sugerencias
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {/* Todas */}
              <Chip
                label="Todas"
                onClick={clearCategory}
                sx={{
                  height: 34,
                  borderRadius: 2,
                  fontWeight: 900,
                  bgcolor: activeCat ? "rgba(255,255,255,.06)" : "#fff",
                  color: activeCat ? PALETTE.txt : "#0B0E12",
                  border: `1px solid ${
                    activeCat ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.60)"
                  }`
                }}
              />

              {sample.map((c) => {
                const type = detectType(c);
                const payload = { id: c.id, name: c.name, type };
                const active =
                  activeCat?.id === payload.id && activeCat?.type === payload.type;

                return (
                  <Chip
                    key={`sample-${c.id}`}
                    label={c.name}
                    onClick={() => selectCategory(payload)}
                    sx={chipStyleByType(type, active)}
                  />
                );
              })}
            </Stack>

            {/* Botón Ver todas */}
            {allFlat.length > sample.length && (
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
                    "&:hover": { bgcolor: "#fff" }
                  }}
                >
                  {manyCats
                    ? "Ver todas (panel)"
                    : showAll
                    ? "Ocultar"
                    : "Ver todas"}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Vista completa (Collapse si no son muchas) */}
        {!loadingCats && !manyCats && (
          <Collapse in={showAll} unmountOnExit>
            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.06)" }} />

            {/* Padres con hijas */}
            {treeParents.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 900, color: PALETTE.muted }}
                >
                  Padres (agrupan hijas)
                </Typography>

                <Stack gap={1}>
                  {treeParents.map((p) => {
                    const payloadP = { id: p.id, name: p.name, type: "parent" };
                    const activeP =
                      activeCat?.id === p.id && activeCat?.type === "parent";

                    return (
                      <Box
                        key={`parent-${p.id}`}
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          border: `1px solid ${PALETTE.stroke}`,
                          bgcolor: "rgba(255,255,255,0.03)"
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Chip
                            label={p.name}
                            onClick={() => selectCategory(payloadP)}
                            sx={chipStyleByType("parent", activeP)}
                          />
                          <Box
                            sx={{
                              px: 1,
                              py: 0.35,
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 900,
                              color: PALETTE.muted,
                              border: `1px solid rgba(255,255,255,0.10)`
                            }}
                          >
                            {p.children.length} hijas
                          </Box>
                        </Stack>

                        {/* Hijas */}
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 1 }}
                        >
                          {p.children.map((c) => {
                            const payloadC = {
                              id: c.id,
                              name: c.name,
                              type: "child",
                              parent_id: p.id
                            };
                            const activeC =
                              activeCat?.id === c.id && activeCat?.type === "child";

                            return (
                              <Chip
                                key={`child-${c.id}`}
                                label={c.name}
                                onClick={() => selectCategory(payloadC)}
                                sx={chipStyleByType("child", activeC)}
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Sueltas */}
            {singles.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 900, color: PALETTE.muted }}
                >
                  Sueltas (sin padre)
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {singles.map((s) => {
                    const payloadS = { id: s.id, name: s.name, type: "single" };
                    const activeS =
                      activeCat?.id === s.id && activeCat?.type === "single";

                    return (
                      <Chip
                        key={`single-${s.id}`}
                        label={s.name}
                        onClick={() => selectCategory(payloadS)}
                        sx={chipStyleByType("single", activeS)}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Collapse>
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
          <Typography variant="body2" sx={{ color: PALETTE.muted }}>
            Mostrando{" "}
            <Typography component="span" sx={{ color: PALETTE.cyan, fontWeight: 900 }}>
              {sortedProductCount}
            </Typography>{" "}
            de{" "}
            <Typography component="span" sx={{ color: PALETTE.txt, fontWeight: 800 }}>
              {productCount}
            </Typography>{" "}
            productos
          </Typography>
        </Box>
      </Card>

      {/* ===== Dialog "todas" cuando hay muchas ===== */}
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
        <DialogTitle sx={{ pr: 6, fontWeight: 900, color: PALETTE.txt }}>
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
                  <SearchIcon sx={{ color: PALETTE.muted }} />
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

          {/* Scroll */}
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
              {/* Botón "Todas" */}
              <Chip
                label="Todas"
                onClick={() => {
                  clearCategory();
                  setOpenAllDialog(false);
                }}
                sx={{
                  height: 34,
                  borderRadius: 2,
                  fontWeight: 900,
                  bgcolor: "#fff",
                  color: "#0B0E12",
                  border: "1px solid rgba(255,255,255,.60)"
                }}
              />

              {filteredAllCats.map((c) => {
                const type = detectType(c);
                const payload = { id: c.id, name: c.name, type };
                const active =
                  activeCat?.id === payload.id && activeCat?.type === payload.type;

                return (
                  <Chip
                    key={`dlg-${c.id}`}
                    label={c.name}
                    onClick={() => {
                      selectCategory(payload);
                      setOpenAllDialog(false);
                    }}
                    sx={chipStyleByType(type, active)}
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
