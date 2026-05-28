import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import {
  Inventory2Rounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
};

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

export default function RestockHistoryTable({
  rows = [],
  loading = false,
  onOpenDetail,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const perPage = 16;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((entry) => {
      const product = entry.product?.name || "";
      const supplier = entry.supplier || "";
      const folio = entry.uuid_invoice || entry.folio || "";
      const warehouse = entry.warehouse?.name || "";

      const matchesSearch =
        !q ||
        product.toLowerCase().includes(q) ||
        supplier.toLowerCase().includes(q) ||
        folio.toLowerCase().includes(q) ||
        warehouse.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filter === "with_invoice") {
        return Boolean(entry.uuid_invoice || entry.folio);
      }

      if (filter === "without_invoice") {
        return !entry.uuid_invoice && !entry.folio;
      }

      return true;
    });
  }, [rows, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, page]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <TextField
          size="small"
          fullWidth
          label="Buscar movimiento"
          placeholder="Buscar por producto, proveedor, folio o almacén..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Filtro"
          value={filter}
          onChange={(e) => handleFilter(e.target.value)}
          sx={{ minWidth: { xs: "100%", md: 220 } }}
        >
          <MenuItem value="all">Mostrar todo</MenuItem>
          <MenuItem value="with_invoice">Con folio/factura</MenuItem>
          <MenuItem value="without_invoice">Sin folio/factura</MenuItem>
        </TextField>
      </Stack>

      <Box
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha("#000", 0.08)}`,
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1.4fr 1fr 0.7fr 0.8fr 0.8fr 0.8fr",
            },
            gap: 1,
            px: 1.5,
            py: 1.2,
            bgcolor: alpha(COLORS.accent, 0.14),
            borderBottom: `1px solid ${alpha("#000", 0.08)}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Producto
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Proveedor
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Cantidad
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Costo
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Subtotal
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Acción
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Cargando historial...
            </Typography>
          </Box>
        ) : filteredRows.length === 0 ? (
          <Box
            sx={{
              minHeight: 240,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              px: 2,
              py: 4,
            }}
          >
            <Stack spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: alpha(COLORS.accent, 0.18),
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Inventory2Rounded sx={{ color: COLORS.black, fontSize: 34 }} />
              </Box>

              <Typography sx={{ fontWeight: 950 }}>
                Aún no hay registros
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 390 }}
              >
                Cuando registres un abastecimiento, aparecerá aquí con su
                producto, proveedor, cantidad, costo, subtotal y botón de
                detalle.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: 680,
              overflowY: "auto",
              pr: 0.5,
            }}
          >
            <Stack spacing={0}>
              {paginatedRows.map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.4fr 1fr 0.7fr 0.8fr 0.8fr 0.8fr",
                    },
                    gap: 1,
                    alignItems: "center",
                    px: 1.5,
                    py: 1.25,
                    borderBottom: `1px solid ${alpha("#000", 0.06)}`,
                    "&:hover": {
                      bgcolor: alpha(COLORS.accent, 0.06),
                    },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      {entry.product?.name || "Producto"}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {entry.created_at || "-"} •{" "}
                      {entry.uuid_invoice || entry.folio || "Sin factura"}
                    </Typography>
                  </Box>

                  <Typography variant="body2">
                    {entry.supplier || "No asignado"}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {entry.quantity ?? 0}
                  </Typography>

                  <Typography variant="body2">
                    {money(entry.unit_price)}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {money(entry.subtotal)}
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityRounded />}
                    onClick={() => onOpenDetail(entry)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    Detalle
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Divider />

        {filteredRows.length > 0 && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ px: 1.5, py: 1.2 }}
          >
            <Chip
              size="small"
              label={`${filteredRows.length} resultado(s)`}
              sx={{ fontWeight: 800 }}
            />

            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                "& .MuiPaginationItem-root": {
                  borderRadius: 2,
                  fontWeight: 900,
                },
                "& .Mui-selected": {
                  bgcolor: `${COLORS.black} !important`,
                  color: "#fff",
                },
              }}
            />
          </Stack>
        )}
      </Box>
    </Box>
  );
}