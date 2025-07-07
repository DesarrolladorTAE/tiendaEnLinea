// src/components/RecargaStepIcon.jsx
import React from "react";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Box } from "@mui/material";

const iconMap = {
  1: <LocalPhoneIcon />,
  2: <AutorenewIcon />,
  3: <DoneAllIcon />,
};

const RecargaStepIcon = (props) => {
  const { active, completed, icon } = props;
  const color = completed
    ? "#4caf50"
    : active
    ? "#1976d2"
    : "#bdbdbd";

  return (
    <Box
      sx={{
        backgroundColor: color,
        color: "white",
        width: 32,
        height: 32,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "50%",
        fontSize: 18,
      }}
    >
      {iconMap[icon]}
    </Box>
  );
};

export default RecargaStepIcon;
