import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import {
  CloseRounded,
  Inventory2Rounded,
  PictureAsPdfRounded,
  PrintRounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
  danger: "#e94e1b",
  softBg: "#F6F7FB",
};

const money = (n) =>
  Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

const dateMX = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return value;
  }
};

const pick = (...values) => values.find((v) => v !== undefined && v !== null && v !== "");

const getEntryId = (entry) =>
  pick(
    entry.restock_invoice_id,
    entry.invoice_id,
    entry.restock_invoice?.id,
    entry.uuid_invoice,
    entry.uuid,
    entry.folio,
    entry.id,
  );

const getEntryName = (entry) =>
  pick(
    entry.invoice_notes,
    entry.entry_name,
    entry.restock_invoice?.notes,
    entry.invoice?.notes,
    entry.restockInvoice?.notes,
    "Entrada de inventario",
  );

const getLineDescription = (entry) =>
  pick(
    entry.line_notes,
    entry.restock_notes,
    entry.description,
    entry.notes,
    "Sin descripción",
  );

const getEntryDate = (entry) =>
  pick(
    entry.invoice_date,
    entry.restock_invoice?.invoice_date,
    entry.invoice?.invoice_date,
    entry.created_at,
  );

const getBranchName = (entry) =>
  pick(
    entry.branch?.name,
    entry.branch_name,
    entry.restock_invoice?.branch?.name,
    entry.restock_invoice?.branch_name,
    "Sucursal no especificada",
  );

const getStoreName = (entry) =>
  pick(
    entry.store?.name,
    entry.store_name,
    entry.restock_invoice?.store?.name,
    entry.restock_invoice?.store_name,
    "Tienda",
  );

const getSupplierName = (entry) =>
  pick(
    entry.supplier?.name,
    entry.supplier_name,
    entry.supplier,
    entry.restock_invoice?.supplier?.name,
    "Sin proveedor",
  );

function DetailRow({ label, value }) {
  return (
    <Stack spacing={0.2}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
        {value || "-"}
      </Typography>
    </Stack>
  );
}

function RestockDetailModal({ open, onClose, entry, rows = [] }) {
  const entryId = entry ? getEntryId(entry) : null;

  const invoiceRows = useMemo(() => {
    if (!entry) return [];

    const sameEntry = rows.filter((row) => getEntryId(row) === entryId);

    return sameEntry.length > 0 ? sameEntry : [entry];
  }, [entry, rows, entryId]);

  const totals = useMemo(() => {
    const subtotal = invoiceRows.reduce(
      (acc, row) => acc + Number(row.subtotal || Number(row.unit_price || 0) * Number(row.quantity || 0)),
      0,
    );

    const tax = Number(pick(entry?.tax, entry?.restock_invoice?.tax, 0) || 0);
    const total = Number(pick(entry?.total, entry?.restock_invoice?.total, subtotal + tax) || 0);

    return { subtotal, tax, total };
  }, [invoiceRows, entry]);

  if (!entry) return null;

  const pdfUrl = pick(
    entry.pdf_url,
    entry.invoice_pdf_url,
    entry.restock_invoice?.pdf_url,
    entry.restock_invoice?.pdf_path_url,
  );

  const xmlUrl = pick(
    entry.xml_url,
    entry.invoice_xml_url,
    entry.restock_invoice?.xml_url,
    entry.restock_invoice?.xml_path_url,
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha("#000", 0.08)}`,
          bgcolor: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(COLORS.accent, 0.2),
              display: "grid",
              placeItems: "center",
            }}
          >
            <PictureAsPdfRounded />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
              Vista de entrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detalle tipo factura del reabastecimiento.
            </Typography>
          </Box>

          <IconButton onClick={onClose}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: COLORS.softBg, p: 2 }}>
        <Paper
          id="restock-print-area"
          elevation={0}
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            border: `1px solid ${alpha("#000", 0.08)}`,
            p: { xs: 2, md: 3 },
          }}
        >
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>
                  {getEntryName(entry)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Entrada de inventario / reabastecimiento
                </Typography>
              </Box>

              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography sx={{ fontWeight: 1000 }}>
                  {getStoreName(entry)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {getBranchName(entry)}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              <DetailRow label="Fecha" value={dateMX(getEntryDate(entry))} />
              <DetailRow label="Proveedor" value={getSupplierName(entry)} />
              <DetailRow
                label="Folio / UUID"
                value={pick(entry.uuid_invoice, entry.uuid, entry.folio, "Sin factura")}
              />
              <DetailRow
                label="No. entrada"
                value={pick(entry.restock_invoice_id, entry.invoice_id, entry.id)}
              />
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontWeight: 1000, mb: 1 }}>
                Partidas
              </Typography>

              <Box
                sx={{
                  border: `1px solid ${alpha("#000", 0.08)}`,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.4fr 1fr 0.7fr 0.8fr 0.8fr",
                    },
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    bgcolor: alpha(COLORS.accent, 0.16),
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                    Producto
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                    Descripción
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
                </Box>

                {invoiceRows.map((row, index) => {
                  const subtotal =
                    Number(row.subtotal || 0) ||
                    Number(row.unit_price || 0) * Number(row.quantity || 0);

                  const variantName = pick(
                    row.product_variant?.name,
                    row.variant?.name,
                    row.product_variant_name,
                  );

                  const warehouseName = pick(
                    row.warehouse?.name,
                    row.warehouse_name,
                    "Sin almacén",
                  );

                  return (
                    <Box
                      key={`${row.id}-${index}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "1.4fr 1fr 0.7fr 0.8fr 0.8fr",
                        },
                        gap: 1,
                        px: 1.5,
                        py: 1.2,
                        borderTop: `1px solid ${alpha("#000", 0.06)}`,
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                          {row.product?.name || row.product_name || "Producto"}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {variantName ? `${variantName} • ` : ""}
                          {warehouseName}
                        </Typography>
                      </Box>

                      <Typography variant="body2">
                        {getLineDescription(row)}
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {row.quantity ?? 0}
                      </Typography>

                      <Typography variant="body2">
                        {money(row.unit_price)}
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 1000 }}>
                        {money(subtotal)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Stack alignItems="flex-end">
              <Box sx={{ width: { xs: "100%", sm: 320 } }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography sx={{ fontWeight: 900 }}>
                      {money(totals.subtotal)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Impuesto</Typography>
                    <Typography sx={{ fontWeight: 900 }}>
                      {money(totals.tax)}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 1000 }}>Total</Typography>
                    <Typography sx={{ fontWeight: 1000, fontSize: 18 }}>
                      {money(totals.total)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha("#000", 0.08)}` }}>
        {pdfUrl && (
          <Button
            href={pdfUrl}
            target="_blank"
            variant="outlined"
            startIcon={<PictureAsPdfRounded />}
            sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
          >
            Ver PDF factura
          </Button>
        )}

        {xmlUrl && (
          <Button
            href={xmlUrl}
            target="_blank"
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
          >
            Ver XML
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintRounded />}
          sx={{
            borderRadius: 2,
            fontWeight: 900,
            textTransform: "none",
            bgcolor: COLORS.black,
            "&:hover": { bgcolor: alpha(COLORS.black, 0.85) },
          }}
        >
          Imprimir / Guardar PDF
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RestockHistoryTable({
  rows = [],
  loading = false,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const perPage = 16;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((entry) => {
      const product = entry.product?.name || entry.product_name || "";
      const supplier = getSupplierName(entry);
      const folio = pick(entry.uuid_invoice, entry.uuid, entry.folio, "");
      const warehouse = pick(entry.warehouse?.name, entry.warehouse_name, "");
      const entryName = getEntryName(entry);
      const description = getLineDescription(entry);
      const branch = getBranchName(entry);

      const matchesSearch =
        !q ||
        product.toLowerCase().includes(q) ||
        supplier.toLowerCase().includes(q) ||
        folio.toLowerCase().includes(q) ||
        warehouse.toLowerCase().includes(q) ||
        entryName.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        branch.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filter === "with_invoice") {
        return Boolean(entry.uuid_invoice || entry.uuid || entry.folio);
      }

      if (filter === "without_invoice") {
        return !entry.uuid_invoice && !entry.uuid && !entry.folio;
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
          placeholder="Buscar por entrada, producto, proveedor, folio, sucursal, descripción o almacén..."
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
              md: "1.4fr 1fr 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr",
            },
            gap: 1,
            px: 1.5,
            py: 1.2,
            bgcolor: alpha(COLORS.accent, 0.14),
            borderBottom: `1px solid ${alpha("#000", 0.08)}`,
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Entrada / Producto
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Descripción
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            Fecha
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
            <Typography color="text.secondary">Cargando historial...</Typography>
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

              <Typography sx={{ fontWeight: 950 }}>Aún no hay registros</Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 390 }}
              >
                Cuando registres un abastecimiento, aparecerá aquí con su
                entrada, producto, descripción, fecha, cantidad, costo y detalle.
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 680, overflowY: "auto", pr: 0.5 }}>
            <Stack spacing={0}>
              {paginatedRows.map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.4fr 1fr 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr",
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
                    <Typography sx={{ fontWeight: 950, fontSize: 14 }}>
                      {getEntryName(entry)}
                    </Typography>

                    <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                      {entry.product?.name || entry.product_name || "Producto"}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {getSupplierName(entry)} •{" "}
                      {pick(entry.uuid_invoice, entry.uuid, entry.folio, "Sin factura")}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {getLineDescription(entry)}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {dateMX(getEntryDate(entry))}
                  </Typography>

                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {entry.quantity ?? 0}
                  </Typography>

                  <Typography variant="body2">{money(entry.unit_price)}</Typography>

                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {money(
                      Number(entry.subtotal || 0) ||
                        Number(entry.unit_price || 0) * Number(entry.quantity || 0),
                    )}
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityRounded />}
                    onClick={() => setSelectedEntry(entry)}
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

      <RestockDetailModal
        open={Boolean(selectedEntry)}
        entry={selectedEntry}
        rows={rows}
        onClose={() => setSelectedEntry(null)}
      />
    </Box>
  );
}