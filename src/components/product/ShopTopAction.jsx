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
  IconButton
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
  glow: "0 10px 38px rgba(124,77,255,0.35)",
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

  // Mostrar todas: Collapse (<=50) o Dialog (>50)
  const [showAll, setShowAll] = React.useState(false);
  const [openAllDialog, setOpenAllDialog] = React.useState(false);
  const [allFilter, setAllFilter] = React.useState("");

  const manyCats = !loadingCats && categories.length > 20;

  const sample = React.useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return pickRandom(categories, 5);
  }, [categories]);

  const onSearch = (val) => {
    setSearchTerm(val);
    getFilterSortParams("searchQuery", val);
  };

  const selectCat = (cat) => {
    // Si clic en la misma -> deselecciona
    if (activeCat?.id === cat?.id) {
      setActiveCat(null);
      getFilterSortParams("category", null);
    } else {
      setActiveCat(cat);
      getFilterSortParams("category", cat?.id ?? cat); // por si vienen como string
    }
  };

  const clearCategory = () => {
    setActiveCat(null);
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
    if (manyCats) {
      setOpenAllDialog(true);
    } else {
      setShowAll((s) => !s);
    }
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
            sx={{
              fontWeight: 900,
              letterSpacing: ".3px",
              color: PALETTE.txt
            }}
          >
            Explorar productos
          </Typography>
          <Typography variant="body2" sx={{ color: PALETTE.muted }}>
            Filtra por nombre o categoría para encontrar lo que necesitas.
          </Typography>
        </Box>

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

        {/* Sugerencias + chip Todas */}
        {!loadingCats && sample.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: 800, color: PALETTE.muted }}
            >
              Sugerencias de categorías
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {/* Chip TODAS (limpia filtro) */}
              <Chip
                label="TODAS"
                onClick={clearCategory}
                variant="filled"
                sx={{
                  px: 1.25,
                  height: 34,
                  fontWeight: 900,
                  letterSpacing: ".2px",
                  color: activeCat ? PALETTE.cyan : "#0B0E12",
                  borderRadius: 999,
                  border: `1px solid ${activeCat ? "rgba(255,255,255,.12)" : PALETTE.cyan}`,
                  bgcolor: activeCat ? "rgba(255,255,255,.06)" : "#fff",
                  boxShadow: activeCat ? "none" : "0 14px 34px rgba(118,224,255,0.30)",
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
                    onClick={() => selectCat(cat)}
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

            {/* Botón Ver todas */}
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

            {/* Todas las categorías (modo Collapse) */}
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
                        onClick={() => selectCat(cat)}
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

      {/* ===== Dialog de TODAS las categorías (cuando hay muchas) ===== */}
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

          {/* Contenedor scrollable */}
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
                      selectCat(cat);
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
                      boxShadow: active ? "0 0 28px rgba(255,94,166,.35)" : "none",
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

          {/* Acciones rápidas */}
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
