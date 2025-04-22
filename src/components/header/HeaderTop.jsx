import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";

const HeaderTop = () => {
  const currency = useSelector((state) => state.currency);
  const user = useSelector((state) => state.user.user);

  const saldo = Number(user?.saldo) || 0;
  const saldoConvertido = (saldo * currency.currencyRate).toFixed(2);
  const isBajoSaldo = saldo < 100;

  if (!user) return null;

  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 1
      }}
    >
      <Typography variant="body2">
        El saldo de tu Cartera es{" "}
        <Box component="span" sx={{ fontWeight: 600, color: isBajoSaldo ? "error.main" : "success.main" }}>
          {currency.currencySymbol + saldoConvertido}
        </Box>
        {isBajoSaldo && (
          <MuiLink
            component={Link}
            to="/recargar-saldo"
            sx={{ ml: 2, color: "primary.main", fontWeight: 500 }}
          >
            Recarga ahora
          </MuiLink>
        )}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Bienvenido, <strong>{user.name} {user.apellidos}</strong>!
      </Typography>
    </Box>
  );
};

HeaderTop.propTypes = {
  borderStyle: PropTypes.string, // ya no es necesario, lo puedes quitar si deseas
};

export default HeaderTop;
