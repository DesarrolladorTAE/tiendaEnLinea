import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  ButtonBase,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Popover,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

export default function ItemWorkerAssign({
  workers = [],
  value = null,
  onChange,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const selectedWorker = useMemo(
    () => workers.find((w) => Number(w.id) === Number(value)) || null,
    [workers, value]
  );

  if (!workers.length) return null;

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          mt: 1,
          px: 1,
          py: 0.7,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          width: "fit-content",
          maxWidth: "100%",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          {selectedWorker ? (
            <>
              <Avatar
                src={selectedWorker.avatar || ""}
                sx={{ width: 28, height: 28 }}
              >
                <PersonRoundedIcon fontSize="small" />
              </Avatar>

              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  maxWidth: 150,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedWorker.name}
              </Typography>
            </>
          ) : (
            <>
              <Avatar sx={{ width: 28, height: 28 }}>
                <PersonRoundedIcon fontSize="small" />
              </Avatar>

              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Asignar trabajador
              </Typography>
            </>
          )}

          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
        </Stack>
      </ButtonBase>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 320,
            maxHeight: 320,
            overflowY: "auto",
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <Box sx={{ px: 1, py: 0.5 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
            Asignar trabajador
          </Typography>
        </Box>

        <List dense sx={{ pt: 1 }}>
          <ListItemButton
            onClick={() => {
              onChange?.(null, null);
              setAnchorEl(null);
            }}
            sx={{ borderRadius: 2 }}
          >
            <ListItemText primary="Sin asignar" />
          </ListItemButton>

          {workers.map((worker) => (
            <ListItemButton
              key={worker.id}
              onClick={() => {
                onChange?.(worker.id, worker);
                setAnchorEl(null);
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemAvatar>
                <Avatar src={worker.avatar || ""}>
                  <PersonRoundedIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={worker.name}
                secondary={
                  Number(value) === Number(worker.id) ? (
                    <Chip size="small" label="Seleccionado" />
                  ) : null
                }
              />s
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
}