import React, { useMemo, useState } from "react";
import {
  Table, TableHead, TableRow, TableCell, TableBody, Checkbox, TablePagination,
  Link, TableContainer, Paper, Chip, Stack, Tooltip
} from "@mui/material";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import ExtensionOutlinedIcon from "@mui/icons-material/ExtensionOutlined";
import dayjs from "dayjs";
import DocumentoModal from "./DocumentoModal";

const TypeChip = ({ tipo }) => {
  const isPlan = tipo === "plan";
  return (
    <Chip
      size="small"
      label={isPlan ? "Plan" : "Complemento"}
      icon={isPlan ? <LocalMallOutlinedIcon fontSize="small" /> : <ExtensionOutlinedIcon fontSize="small" />}
      sx={{
        px: 1,
        fontWeight: 600,
        bgcolor: isPlan ? "primary.light" : "secondary.light",
        color: isPlan ? "primary.dark" : "secondary.dark",
        "& .MuiChip-icon": { color: "inherit" },
      }}
      variant="filled"
    />
  );
};

const StatusChip = ({ facturado, facturado_pg }) => {
  if (facturado_pg) {
    return (
      <Chip
        size="small"
        label="Facturado (PG)"
        sx={{ bgcolor: "purple.100", color: "purple.800", fontWeight: 600 }}
      />
    );
  }
  if (facturado) {
    return <Chip size="small" label="Facturado" color="success" variant="filled" />;
  }
  return <Chip size="small" label="Sin facturar" variant="outlined" />;
};

export default function SuscripcionesTable({ rows, seleccion, setSeleccion }) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Modal visor
  const [docOpen, setDocOpen] = useState(false);
  const [docType, setDocType] = useState(null); // "pdf" | "xml"
  const [docUrl, setDocUrl] = useState("");
  const [docTitle, setDocTitle] = useState("");

  const fmt = useMemo(
    () => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }),
    []
  );

  const openDoc = (type, url, item) => {
    setDocType(type);
    setDocUrl(url);
    setDocTitle(`${type.toUpperCase()} • ${item.tienda} • ${dayjs(item.fecha).format("DD/MM/YYYY")}`);
    setDocOpen(true);
  };
  const closeDoc = () => setDocOpen(false);

  const pageRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page]
  );

  const allVisibleIds = useMemo(() => pageRows.map((r) => r.id), [pageRows]);
  const allVisibleChecked = useMemo(
    () => allVisibleIds.every((id) => seleccion.includes(id)) && allVisibleIds.length > 0,
    [allVisibleIds, seleccion]
  );
  const someVisibleChecked = useMemo(
    () => allVisibleIds.some((id) => seleccion.includes(id)) && !allVisibleChecked,
    [allVisibleIds, seleccion]
  );

  const toggleAllVisible = () => {
    if (allVisibleChecked) {
      setSeleccion((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
    } else {
      setSeleccion((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
    }
  };
  const toggleOne = (id) => {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Elige archivos propios y si no, los de PG
  const getPDFUrl = (item) => item.pdf_url || item.pg_pdf_url || "";
  const getXMLUrl = (item) => item.xml_url || item.pg_xml_url || "";

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          overflow: "hidden",
          "& table": {
            borderCollapse: "separate",
            borderSpacing: 0,
          },
          "& thead th": {
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "grey.50",
            fontWeight: 700,
            letterSpacing: 0.2,
          },
          "& tbody tr:hover": {
            backgroundColor: "grey.50",
          },
          "& tbody tr:nth-of-type(odd)": {
            backgroundColor: "grey.25",
          },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" width={48}>
                <Checkbox
                  indeterminate={someVisibleChecked}
                  checked={allVisibleChecked}
                  onChange={toggleAllVisible}
                />
              </TableCell>
              <TableCell width={64}>No.</TableCell>
              <TableCell>Tienda</TableCell>
              <TableCell width={160}>Tipo</TableCell>
              <TableCell width={200}>Fecha</TableCell>
              <TableCell width={140} align="right">Monto</TableCell>
              <TableCell width={180}>Estado</TableCell>
              <TableCell width={160} align="center">Archivos</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pageRows.map((item, idx) => {
              const pdfUrl = getPDFUrl(item);
              const xmlUrl = getXMLUrl(item);

              return (
                <TableRow key={item.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={seleccion.includes(item.id)} onChange={() => toggleOne(item.id)} />
                  </TableCell>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0}>
                      <span style={{ fontWeight: 600 }}>{item.tienda}</span>
                      <span style={{ fontSize: 12, color: "#7a7a7a" }}>#{item.id}</span>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TypeChip tipo={item.tipo} />
                  </TableCell>
                  <TableCell>{dayjs(item.fecha).format("DD [de] MMMM YYYY")}</TableCell>
                  <TableCell align="right">{fmt.format(Number(item.monto) || 0)}</TableCell>
                  <TableCell>
                    <StatusChip facturado={item.facturado} facturado_pg={item.facturado_pg} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {pdfUrl ? (
                        <Tooltip title="Ver PDF">
                          <Link component="button" onClick={() => openDoc("pdf", pdfUrl, item)}>
                            PDF
                          </Link>
                        </Tooltip>
                      ) : (
                        <span style={{ color: "#bbb" }}>—</span>
                      )}
                      <span style={{ color: "#bbb" }}>|</span>
                      {xmlUrl ? (
                        <Tooltip title="Ver XML">
                          <Link component="button" onClick={() => openDoc("xml", xmlUrl, item)}>
                            XML
                          </Link>
                        </Tooltip>
                      ) : (
                        <span style={{ color: "#bbb" }}>—</span>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            "& .MuiTablePagination-toolbar": { px: 2 },
          }}
        />
      </TableContainer>

      <DocumentoModal
        open={docOpen}
        onClose={closeDoc}
        type={docType}
        url={docUrl}
        title={docTitle}
      />
    </>
  );
}
