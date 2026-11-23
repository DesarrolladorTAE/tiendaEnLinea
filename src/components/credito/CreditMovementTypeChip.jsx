import React from "react";
import { Chip } from "@mui/material";
import { isCancelledSale, isReversalType } from "./creditHistoryUtils";

export default function CreditMovementTypeChip({ movement }) {
    const type = String(movement?.type || "").toLowerCase();
    const cancelled = isCancelledSale(movement?.sale?.status);

    if (type === "cargo") {
        return (
            <Chip
                size="small"
                label={cancelled ? "Venta fiada cancelada" : "Venta fiada"}
                color={cancelled ? "error" : "warning"}
                sx={{ fontWeight: 900 }}
            />
        );
    }

    if (isReversalType(type)) {
        return (
            <Chip
                size="small"
                label="Cancelación"
                color="error"
                sx={{ fontWeight: 900 }}
            />
        );
    }

    if (type === "abono") {
        return (
            <Chip
                size="small"
                label={movement?.sale?.id ? "Liquidación de ticket" : "Abono"}
                color="success"
                sx={{ fontWeight: 900 }}
            />
        );
    }
}