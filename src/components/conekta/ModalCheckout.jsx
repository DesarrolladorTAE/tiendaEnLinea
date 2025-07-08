import React from "react";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ModalCheckout = ({ open, url, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: 0 }}>
        <iframe
          src={url}
          title="Pago con Conekta"
          width="100%"
          height="600"
          frameBorder="0"
          allowFullScreen
          onLoad={(e) => {
            // puedes monitorear eventos aquí si Conekta lo permitiera
            console.log("iframe loaded");
          }}
        ></iframe>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCheckout;
