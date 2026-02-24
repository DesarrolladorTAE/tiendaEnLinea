import React from "react";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Box } from "@mui/material";

const iconMap = {
  1: <LocalPhoneIcon sx={{ fontSize: 18 }} />,
  2: <AutorenewIcon sx={{ fontSize: 18 }} />,
  3: <DoneAllIcon sx={{ fontSize: 18 }} />,
};

const RecargaStepIcon = (props) => {
  const { active, completed, icon } = props;

  const bg = completed ? "#22c55e" : active ? "#0b5ed7" : "#cbd5e1";
  const ring = completed
    ? "rgba(34,197,94,0.25)"
    : active
    ? "rgba(11,94,215,0.25)"
    : "rgba(148,163,184,0.22)";

  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        background: bg,
        boxShadow: `0 14px 30px ${ring}`,
        border: `1px solid ${ring}`,
        transition: "transform .18s ease",
        transform: active ? "translateY(-1px)" : "none",
      }}
    >
      {iconMap[icon]}
    </Box>
  );
};

export default RecargaStepIcon;