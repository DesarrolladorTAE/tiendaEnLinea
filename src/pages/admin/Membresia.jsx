import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const Membresia = () => {
  const plan = {
    plan: "Premium",
    vigenteHasta: "2025-06-30",
    activo: true,
    beneficios: [
      "Comisión base: 5%",
      "Facturación mensual incluida",
      "Atención prioritaria"
    ]
  };

  const historial = [
    {
      fecha: "2025-05-20",
      concepto: "Renovación Plan Premium",
      monto: "600.00",
      metodo: "Transferencia",
      estatus: "Pagado"
    },
    {
      fecha: "2025-04-20",
      concepto: "Renovación Plan Premium",
      monto: "600.00",
      metodo: "Transferencia",
      estatus: "Pagado"
    }
  ];

  return (
    <Grid container spacing={4}>
      {/* Resumen del plan */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Tu Plan Actual</Typography>
            <Typography variant="subtitle1">{plan.plan}</Typography>
            <Typography variant="body2">Vigente hasta: {plan.vigenteHasta}</Typography>
            <Typography variant="body2" color={plan.activo ? "green" : "red"}>
              {plan.activo ? "Activo" : "Inactivo"}
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Cambiar o renovar plan
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Beneficios del plan */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>¿Qué incluye tu plan?</Typography>
            <List>
              {plan.beneficios.map((beneficio, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={beneficio} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Historial de compras */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Historial de Compras</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Estatus</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.fecha}</TableCell>
                  <TableCell>{item.concepto}</TableCell>
                  <TableCell>${item.monto}</TableCell>
                  <TableCell>{item.metodo}</TableCell>
                  <TableCell>{item.estatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default Membresia;
