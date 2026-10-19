import React, { useRef, useState } from "react";
import { Box } from "@mui/material";

export function transferredFiles(transfer) {
  const files = Array.from(transfer?.files || []);
  if (files.length) return files;
  return Array.from(transfer?.items || []).filter((item) => item.kind === "file").map((item) => item.getAsFile()).filter(Boolean);
}

export default function ImportFileDropZone({ children, onFiles, disabled = false, label = "Área para arrastrar o pegar archivos", color = "#6d28d9" }) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");
  const receive = (event, transfer) => {
    const files = transferredFiles(transfer);
    if (!files.length) return; // Preserve ordinary text paste and text drag behavior.
    event.preventDefault(); event.stopPropagation();
    depth.current = 0; setDragging(false);
    if (!disabled) onFiles(files);
  };
  const behavior = { role: "region", "aria-label": label, "aria-disabled": disabled, tabIndex: disabled ? -1 : 0,
    title: "Arrastra archivos aquí o pega con Ctrl+V (⌘V en Mac). También puedes usar el selector.",
    onPaste: (event) => receive(event, event.clipboardData),
    onDragEnter: (event) => { if (hasFiles(event)) { event.preventDefault(); depth.current++; if (!disabled) setDragging(true); } },
    onDragOver: (event) => { if (hasFiles(event)) { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? "none" : "copy"; } },
    onDragLeave: (event) => { if (hasFiles(event)) { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); } },
    onDrop: (event) => receive(event, event.dataTransfer),
  };
  const feedbackSx = { outlineOffset: 3, "&:focus-visible": { outline: `2px solid ${color}` }, ...(dragging && !disabled ? { outline: `2px solid ${color}` } : {}) };
  // Attach behavior to the existing upload box without replacing its appearance.
  if (React.Children.count(children) === 1 && React.isValidElement(children) && children.type === Box) {
    return React.cloneElement(children, { ...behavior, sx: [children.props.sx, feedbackSx] });
  }
  return <Box {...behavior} sx={{ display: "flex", flexDirection: "column", gap: 2, ...feedbackSx }}>{children}</Box>;
}
