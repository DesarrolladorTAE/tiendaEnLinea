import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const ModalMensaje = ({ visible, mensaje, onClose }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{mensaje}</p>
            <button onClick={onClose}>Cerrar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalMensaje;
