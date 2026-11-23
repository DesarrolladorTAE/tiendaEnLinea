import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  IconButton,
  Slide,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axiosSuperadmin from "../../config/axiosSuperadmin";
import planes from "../../utils/planes";
import complementos from "../../utils/complementos";
import dayjs from "dayjs";

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const ModalHistorialSuscripciones = ({ open, onClose, tienda }) => {
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (open && tienda?.id) {
      obtenerHistorial();
    }
  }, [open]);

  const obtenerHistorial = async () => {
    setCargando(true);
    try {
      const res = await axiosSuperadmin.get(
        `/admin/tiendas/${tienda.id}/suscripciones`
      );
      setHistorial(res.data.data || []);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargando(false);
    }
  };

  const formatoFecha = (fecha) => dayjs(fecha).format("YYYY-MM-DD HH:mm:ss");

  const obtenerNombreConcepto = (item) => {
    if (item.plan_id) {
      const plan = planes.find((p) => p.plan_id === item.plan_id);
      return plan ? plan.nombre : "Plan desconocido";
    }

    if (item.store_complemento?.complemento_id) {
      const complemento = complementos.find(
        (c) => c.complemento_id === item.store_complemento.complemento_id
      );
      return complemento ? complemento.nombre : "Complemento desconocido";
    }

    return "—";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Transition}
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: 10 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Historial de suscripciones - {tienda.name}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: "#f5faff" }}>
        {cargando ? (
          <CircularProgress />
        ) : historial.length === 0 ? (
          <Typography>No hay suscripciones registradas.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                <TableCell>Concepto</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Fin</TableCell>
                <TableCell>Monto</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{obtenerNombreConcepto(item)}</TableCell>
                  <TableCell>{formatoFecha(item.starts_at)}</TableCell>
                  <TableCell>
                    {item.ends_at ? formatoFecha(item.ends_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`$${parseFloat(item.monto).toFixed(2)}`}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalHistorialSuscripciones;
