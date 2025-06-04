import React, { useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Box, Typography, Button, Grid, Stack, IconButton, Collapse, Paper } from "@mui/material";
import { Link } from "react-router-dom";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MenuIcon from '@mui/icons-material/Menu';

const HeaderTop = ({ borderStyle, toggleDrawer }) => {
  const currency = useSelector((state) => state.currency);
  const user = useSelector((state) => state.user.user);
  const [showSaldo, setShowSaldo] = useState(false);

  const saldo = Number(user?.saldo) || 0;
  const saldoConvertido = (saldo * currency.currencyRate).toFixed(2);
  const isBajoSaldo = saldo < 100;
  const isAgente = user?.role === "agent";

  if (!user) return null;

  return (
    <Box sx={{
      width: '100%',
      borderBottom: borderStyle === "fluid-border" ? "1px solid #e0e0e0" : "none",
      backgroundColor: { xs: '#00bfff', md: '#fff' },
      py: { xs: 2, md: 2.5 },
      px: { xs: 2, md: 6 },
      position: 'relative',
      zIndex: 10
    }}>
      <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} md={8}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                El saldo de tu Cartera es {" "}
                <Box component="span" sx={{ color: isBajoSaldo ? "error.main" : "success.main", fontWeight: 700 }}>
                  {currency.currencySymbol + saldoConvertido}
                </Box>
              </Typography>

              {isBajoSaldo && !isAgente && (
                <Button
                  component={Link}
                  to="/saldo-recarga"
                  size="small"
                  sx={{
                    px: 3,
                    py: 1,
                    background: "linear-gradient(135deg, #c471ed 0%, #f64f59 100%)",
                    color: "#fff",
                    borderRadius: 3,
                    fontWeight: "bold",
                    textTransform: "none",
                    boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
                    '&:hover': {
                      background: "linear-gradient(135deg, #c471ed 0%, #f64f59 100%)",
                      boxShadow: "0px 4px 8px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  Recarga ahora
                </Button>
              )}
            </Stack>
          </Box>

          {/* Versión móvil */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, position: 'relative', justifyContent: 'flex-start' }}>
            <IconButton
              onClick={toggleDrawer}
              sx={{
                backgroundColor: '#1b2a41',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#163050'
                }
              }}
            >
              <MenuIcon />
            </IconButton>

            <IconButton
              onClick={() => setShowSaldo(!showSaldo)}
              sx={{
                backgroundColor: isBajoSaldo ? 'error.main' : 'success.main',
                color: '#fff',
                '&:hover': {
                  backgroundColor: isBajoSaldo ? 'error.dark' : 'success.dark'
                }
              }}
            >
              <AccountBalanceWalletIcon />
            </IconButton>

            <Collapse in={showSaldo} timeout="auto" unmountOnExit>
              <Paper elevation={6} sx={{
                mt: 0,
                p: 2,
                backgroundColor: '#e8f5e9',
                position: 'fixed',
                top: 'calc(64px + 8px)',
                left: '8px',
                right: '8px',
                zIndex: 1400,
                borderRadius: 2
              }}>
                <Typography variant="body2">
                  El saldo de tu Cartera es {" "}
                  <Box component="span" sx={{ color: isBajoSaldo ? "error.main" : "success.main", fontWeight: 700 }}>
                    {currency.currencySymbol + saldoConvertido}
                  </Box>
                </Typography>

                {isBajoSaldo && !isAgente && (
                  <Button
                    component={Link}
                    to="/saldo-recarga"
                    size="small"
                    sx={{
                      mt: 1,
                      px: 3,
                      py: 1,
                      background: "linear-gradient(135deg, #c471ed 0%, #f64f59 100%)",
                      color: "#fff",
                      borderRadius: 3,
                      fontWeight: "bold",
                      textTransform: "none",
                      boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
                      '&:hover': {
                        background: "linear-gradient(135deg, #c471ed 0%, #f64f59 100%)",
                        boxShadow: "0px 4px 8px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    Recarga ahora
                  </Button>
                )}
              </Paper>
            </Collapse>
          </Box>
        </Grid>

        <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" }, mt: { xs: 2, md: 0 } }}>
          <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" }, fontWeight: 400 }}>
            Bienvenido, <Box component="strong" sx={{ display: { xs: 'inline', md: 'none' } }}>{user.name}</Box><Box component="strong" sx={{ display: { xs: 'none', md: 'inline' } }}>{user.name} {user.apellidos}</Box>!
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

HeaderTop.propTypes = {
  borderStyle: PropTypes.string,
  toggleDrawer: PropTypes.func
};

export default HeaderTop;
