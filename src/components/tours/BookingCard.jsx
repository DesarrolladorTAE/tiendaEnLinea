import React from "react";
import { Button, Card, CardContent, Stack } from "@mui/material";
import BookingSummary from "./BookingSummary";
export default function BookingCard({ booking, onView }) {
  return <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}><CardContent><Stack spacing={2}><BookingSummary booking={booking} /><Button size="large" variant="outlined" onClick={() => onView(booking)}>Ver detalle</Button></Stack></CardContent></Card>;
}
