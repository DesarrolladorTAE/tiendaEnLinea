import React from "react";
import PropTypes from "prop-types";
import { Box, Card, TextField, Chip, Button, Collapse, Stack, Typography } from "@mui/material";

/** Barajar y tomar N */
function pickRandom(items, n = 5) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const ShopTopAction = ({
  getFilterSortParams,
  productCount,
  sortedProductCount,
  categories = [],
  loadingCats = false
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeCat, setActiveCat] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);

  const sample = React.useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return pickRandom(categories, 5);
  }, [categories]);

  const onSearch = (val) => {
    setSearchTerm(val);
    getFilterSortParams("searchQuery", val);
  };

  const clickCat = (cat) => {
    if (activeCat?.id === cat.id) {
      setActiveCat(null);
      getFilterSortParams("category", null);
    } else {
      setActiveCat(cat);
      getFilterSortParams("category", cat.id);
    }
  };

  return (
    <Box className="shop-top-bar" sx={{ mb: 3.5 }}>
      {/* Buscador por nombre */}
      <Card
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 2,
          bgcolor: "transparent",
          backdropFilter: "blur(12px) saturate(110%)",
          boxShadow: "0 14px 40px var(--void-shadow), inset 0 0 0 1px var(--void-stroke)"
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar producto por nombre…"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          InputProps={{
            sx: {
              borderRadius: 2,
              color: "var(--void-text)",
              bgcolor: "rgba(255,255,255,0.06)",
              "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
              "&.Mui-focused fieldset": { borderColor: "var(--void-accent)" }
            }
          }}
          inputProps={{ style: { color: "var(--void-text)" } }}
        />
      </Card>

      {/* 5 categorías aleatorias + Ver todas (si hay) */}
      {!loadingCats && sample.length > 0 && (
        <Card
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: "transparent",
            backdropFilter: "blur(12px) saturate(110%)",
            boxShadow: "0 14px 40px var(--void-shadow), inset 0 0 0 1px var(--void-stroke)"
          }}
        >
          {/* Chips aleatorios */}
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {sample.map((cat) => {
              const active = activeCat?.id === cat.id;
              return (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  onClick={() => clickCat(cat)}
                  sx={{
                    px: 1.25,
                    height: 34,
                    fontWeight: 800,
                    letterSpacing: ".2px",
                    color: active ? "var(--void-pop)" : "var(--void-accent)",
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--void-pop)" : "rgba(255,255,255,.12)"}`,
                    bgcolor: active ? "rgba(138,107,255,.12)" : "rgba(255,255,255,.06)",
                    boxShadow: active
                      ? "0 0 16px rgba(138,107,255,.45)"
                      : "0 0 10px rgba(118,224,255,.25)",
                    cursor: "pointer",
                    transition: "all .18s ease",
                    "&:hover": {
                      boxShadow: active
                        ? "0 0 18px rgba(138,107,255,.55)"
                        : "0 0 14px rgba(118,224,255,.35)"
                    }
                  }}
                  variant="filled"
                />
              );
            })}
          </Stack>

          {/* Ver todas / Ocultar */}
          {categories.length > sample.length && (
            <Box sx={{ mt: 1.25, display: "flex", justifyContent: "flex-end" }}>
              <Button
                onClick={() => setShowAll((s) => !s)}
                variant="contained"
                sx={{
                  fontWeight: 900,
                  borderRadius: 2,
                  color: "#0B0E12",
                  bgcolor: "#fff",
                  boxShadow: "0 12px 26px rgba(118,224,255,0.30)",
                  "&:hover": {
                    bgcolor: "#fff",
                    boxShadow: "0 18px 44px rgba(118,224,255,0.38)"
                  }
                }}
              >
                {showAll ? "Ocultar categorías" : "Ver todas las categorías"}
              </Button>
            </Box>
          )}

          {/* Collapsible: todas las categorías */}
          <Collapse in={showAll} unmountOnExit>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
              {categories.map((cat) => {
                const active = activeCat?.id === cat.id;
                return (
                  <Chip
                    key={`all-${cat.id}`}
                    label={cat.name}
                    onClick={() => clickCat(cat)}
                    sx={{
                      px: 1.15,
                      height: 32,
                      fontWeight: 800,
                      letterSpacing: ".2px",
                      color: active ? "var(--void-warn)" : "var(--void-text)",
                      borderRadius: 999,
                      border: `1px solid ${active ? "var(--void-warn)" : "rgba(255,255,255,.12)"}`,
                      bgcolor: active ? "rgba(255,94,166,.12)" : "rgba(255,255,255,.06)",
                      boxShadow: active
                        ? "0 0 16px rgba(255,94,166,.45)"
                        : "0 0 8px rgba(118,224,255,.25)",
                      cursor: "pointer",
                      transition: "all .18s ease",
                      "&:hover": {
                        boxShadow: active
                          ? "0 0 18px rgba(255,94,166,.55)"
                          : "0 0 12px rgba(118,224,255,.35)"
                      }
                    }}
                    variant="filled"
                  />
                );
              })}
            </Stack>
          </Collapse>
        </Card>
      )}

      {/* Contador (opcional) */}
      <Typography variant="body2" sx={{ mt: 1.5, color: "var(--void-muted)" }}>
        Mostrando {sortedProductCount} de {productCount} productos
      </Typography>
    </Box>
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
