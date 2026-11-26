// src/components/admin/productForm/AccordionSection.jsx
import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  hasError = false,
  children,
}) {
  const [expanded, setExpanded] = React.useState(defaultOpen);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((v) => !v)}
      sx={{
        backgroundColor: "#1f2937",
        color: "#fff",
        mb: 2,
        borderRadius: 2,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          color: "#fff", // 👈 fuerza texto blanco
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {icon && <Box sx={{ color: "#fff" }}>{icon}</Box>}

          <Typography
            sx={{
              color: "#fff", // 👈 texto blanco
              fontWeight: 700,
            }}
          >
            {title}
          </Typography>
          {hasError && !expanded && (
            <ErrorOutlineIcon
              fontSize="small"
              sx={{ color: "#ff9b9b" }}
              titleAccess="Contiene campos con error"
            />
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ color: "#fff" }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
