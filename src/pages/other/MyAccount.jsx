import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Box, Paper, Typography, Fade } from "@mui/material";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import withAuth from "../../components/withAuth";
import AccountInfoPanel from "../../components/MyAccount/AccountInfoPanel";
import FiscalDataPanel from "../../components/MyAccount/FiscalDataPanel";
import PasswordPanel from "../../components/MyAccount/PasswordPanel";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useLocation } from "react-router-dom";

const MyAccount = () => {
  const { pathname } = useLocation();
  const user = useSelector((state) => state.user.user);
  const [expanded, setExpanded] = useState("panel1");

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <SEO titleTemplate="Mi Cuenta" description="Página de cuenta del usuario." />
        <LayoutOne headerTop="visible">
          <Breadcrumb
            pages={[
              { label: "Inicio", path: "/" },
              { label: "Mi Cuenta", path: pathname },
            ]}
          />
          <Box pt={{ xs: 3, md: 6 }} pb={{ xs: 5, md: 10 }}>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 2, md: 5 },
                maxWidth: 950,
                mx: "auto",
                borderRadius: 5,
                boxShadow: "0 4px 24px 0 rgba(40,60,120,.13)",
                background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)",
              }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{
                  mb: 4,
                  letterSpacing: 1,
                  fontSize: { xs: "2rem", md: "2.4rem" },
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                <AccountCircleIcon fontSize="large" sx={{ mb: -1, mr: 1, color: "primary.main" }} />
                Mi Cuenta
              </Typography>

              <AccountInfoPanel expanded={expanded} handleChange={handleChange} user={user} />
              <FiscalDataPanel expanded={expanded} handleChange={handleChange} user={user} />
              <PasswordPanel expanded={expanded} handleChange={handleChange} />

            </Paper>
          </Box>
        </LayoutOne>
      </Box>
    </Fade>
  );
};

export default withAuth(MyAccount);
