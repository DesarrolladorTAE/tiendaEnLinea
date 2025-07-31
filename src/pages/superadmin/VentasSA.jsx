import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TablePagination,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
} from "@mui/material";
import axios from "../../config/axiosSuperadmin";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function ComprasSuscripciones() {
  const [compras, setCompras] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [rowsPerPage] = useState(10);
  const [filtroStore, setFiltroStore] = useState("");
  //   const [filtroMes, setFiltroMes] = useState("");
  const [cargando, setCargando] = useState(false);
  const [filtroMes, setFiltroMes] = useState(dayjs().format("YYYY-MM"));

  const calcularTotalMes = () => {
    const comprasFiltradas = filtrarCompras();
    return comprasFiltradas.reduce(
      (acc, item) => acc + Number(item.monto || 0),
      0
    );
  };

  const fetchCompras = async () => {
    setCargando(true);
    try {
      const res = await axios.get("admin/compras-suscripciones/todas");
      setCompras(res.data);
    } catch (err) {
      console.error("Error al cargar compras", err);
    }
    setCargando(false);
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const filtrarCompras = () => {
    return compras
      .filter((item) => {
        const coincideStore = filtroStore
          ? item.tienda.toLowerCase().includes(filtroStore.toLowerCase())
          : true;
        const coincideMes = filtroMes ? item.fecha.startsWith(filtroMes) : true;
        return coincideStore && coincideMes;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha)); // más reciente primero
  };

  const isFilled = (v) =>
    v !== null &&
    v !== undefined &&
    typeof v === "string" &&
    v.trim() !== "" &&
    v !== "{}";

  const getEstadoFactura = (item) => {
    const tieneTodo =
      isFilled(item.folio_factura) &&
      isFilled(item.timbrado_json) &&
      isFilled(item.pdf_url) &&
      isFilled(item.xml_url);

    const tieneAlgo =
      isFilled(item.folio_factura) ||
      isFilled(item.timbrado_json) ||
      isFilled(item.pdf_url) ||
      isFilled(item.xml_url);

    const fechaCompra = dayjs(item.fecha);
    const limiteFactura = fechaCompra.endOf("month").endOf("day");
    const ahora = dayjs();

    if (tieneTodo) return <Chip label="Facturado ✅" color="success" />;
    if (ahora.isAfter(limiteFactura))
      return <Chip label="Venció ❌" color="error" />;
    if (tieneAlgo) return <Chip label="Error técnico ⚠️" color="warning" />;
    return <Chip label="Sin facturar 🚫" color="default" />;
  };
  const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

  const getMesFormateado = () => {
    return capitalizar(dayjs(filtroMes + "-01").format("MMMM [de] YYYY"));
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Compras de Suscripciones
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Buscar tienda"
          value={filtroStore}
          onChange={(e) => setFiltroStore(e.target.value)}
        />
        <TextField
          label="Filtrar por Mes"
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Box mb={3} mt={2} p={2} bgcolor="#f5f5f5" borderRadius={2}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color="secondary"
          align="center"
        >
          📆 Mes actual: {getMesFormateado()}
        </Typography>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="success.main"
          align="center"
        >
          💰 Total vendido: ${calcularTotalMes().toFixed(2)} MXN
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          🧾 Solo se pueden facturar compras dentro de este mes.
        </Typography>
      </Box>

      {cargando ? (
        <CircularProgress />
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Tienda</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Estado Factura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrarCompras()
                .slice(pagina * rowsPerPage, pagina * rowsPerPage + rowsPerPage)
                .map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>{pagina * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>{item.tienda}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>
                      {dayjs(item.fecha).format("DD [de] MMMM YYYY")}
                    </TableCell>
                    <TableCell>
                      {Number(item.monto) > 0
                        ? `$${Number(item.monto).toFixed(2)}`
                        : "$0.00"}
                    </TableCell>

                    <TableCell>{getEstadoFactura(item)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtrarCompras().length}
            page={pagina}
            onPageChange={(e, newPage) => setPagina(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
          />
        </Paper>
      )}
    </Box>
  );
}
