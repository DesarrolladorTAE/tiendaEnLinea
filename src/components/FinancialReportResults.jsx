import React from "react";
import { Alert, Box, Button, Card, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { moneyMXN } from "../services/admin/financialReports";

const labels = {
  quantity_sold: "Unidades vendidas", quantity_returned: "Unidades devueltas", quantity_cancelled: "Unidades canceladas",
  quantity_net: "Unidades netas", sales_gross: "Importe vendido", sales_net_without_tax: "Ingreso neto sin IVA",
  collections: "Cobros registrados", known_cost_total: "Costo histórico conocido", gross_profit: "Utilidad bruta",
  discounts: "Descuentos", tax_amount: "IVA", returns_amount: "Devoluciones", cancellations_amount: "Cancelaciones",
  unit_cost_at_sale: "Costo histórico unitario", unit_price: "Precio unitario",
};
const amount = (key, value) => key.startsWith("quantity_") ? value ?? "No disponible" :
  key === "unit_cost_at_sale" && value == null ? "Costo histórico no registrado" : moneyMXN(value);
const metricKeys = ["sales_gross", "collections", "sales_net_without_tax", "known_cost_total", "gross_profit"];
const adjustments = ["quantity_sold", "quantity_returned", "quantity_cancelled", "quantity_net", "discounts", "tax_amount", "returns_amount", "cancellations_amount"];
const weeklyColumns = ["quantity_sold", "quantity_returned", "quantity_cancelled", "sales_gross", "discounts", "tax_amount", "unit_cost_at_sale", "known_cost_total", "gross_profit", "sales_net_without_tax", "returns_amount", "cancellations_amount"];
const monthlyColumns = [...metricKeys, "returns_amount", "cancellations_amount"];
const currency = (row, key) => amount(key, key === "collections" && typeof row.collections === "object" ? row.collections?.recorded_total : row[key]);
const grid = { display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))" };

export function ProfitAllocation({ distribution, weeklySum }) {
  return <Card variant="outlined" sx={{ p: 2 }}>
    <Typography variant="h6">Distribución administrativa</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      Asignación informativa. Los gastos asignados son independientes de los gastos realizados.
    </Typography>
    <Typography>Gastos corrientes asignados · {moneyMXN(distribution?.current_expenses_assigned)}</Typography>
    <Typography>Ahorro asignado · {moneyMXN(distribution?.savings_assigned)}</Typography>
    {weeklySum && <Typography variant="body2" sx={{ mt: 1 }}>Suma de asignaciones semanales · Gastos {moneyMXN(weeklySum.current_expenses_assigned)} · Ahorro {moneyMXN(weeklySum.savings_assigned)}</Typography>}
  </Card>;
}

function Metrics({ columns, record }) {
  return <Box sx={grid}>
    {columns.map((key) => <Card key={key} variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="body2" color="text.secondary">{labels[key]}</Typography>
      <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>{currency(record, key)}</Typography>
    </Card>)}
  </Box>;
}

function Coverage({ summary, settings }) {
  return <Alert severity={summary.cost_coverage === "incomplete" || summary.gross_profit == null ? "warning" : "info"}>
    {summary.cost_coverage === "incomplete"
      ? `Costo histórico parcial · ${summary.missing_cost_lines} partidas y ${summary.missing_cost_quantity} unidades sin costo.`
      : "Cobertura de costo histórico completa."}
    {summary.profit_status === "tax_basis_unconfirmed" && " La base fiscal del costo requiere confirmación."}
    {summary.gross_profit == null && " Utilidad bruta no disponible."}
    {settings.cost_tax_basis === "gross" && " La base fiscal está registrada como bruta."}
  </Alert>;
}

function DetailRows({ rows, columns, monthly, openWeek }) {
  const title = (row) => monthly ? `${row.from} al ${row.to}` : row.description;
  const detail = (row) => monthly ? row.summary : row;
  const key = (row) => monthly ? row.from : row.sale_item_id;
  const action = (row) => monthly && <Button size="small" onClick={() => openWeek(row)}>Ver detalle semanal</Button>;
  if (!rows.length) return <Alert severity="info">Sin partidas para el periodo y los filtros seleccionados.</Alert>;
  return <>
    <TableContainer component={Card} variant="outlined" sx={{ display: { xs: "none", md: "block" } }}>
      <Table size="small" aria-label={monthly ? "Desglose mensual por semana" : "Partidas semanales"}>
        <TableHead><TableRow>
          <TableCell>{monthly ? "Semana" : "Producto y SKU"}</TableCell>
          {columns.map((column) => <TableCell key={column} align="right">{labels[column]}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>{rows.map((row) => <TableRow key={key(row)}>
          <TableCell><Typography variant="body2" fontWeight={700}>{title(row)}</Typography>
            {!monthly && <Typography variant="caption">SKU {row.sku} · {row.commercial_status}</Typography>}
            {action(row)}</TableCell>
          {columns.map((column) => <TableCell key={column} align="right">{currency(detail(row), column)}</TableCell>)}
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer>
    <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
      {rows.map((row) => <Card key={key(row)} variant="outlined" sx={{ p: 2 }}>
        <Typography fontWeight={700}>{title(row)}</Typography>
        {!monthly && <Typography variant="caption">SKU {row.sku} · {row.commercial_status}</Typography>}
        <Box component="dl" sx={{ m: 0, mt: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 0.75 }}>
          {columns.map((column) => <React.Fragment key={column}>
            <Typography component="dt" variant="body2">{labels[column]}</Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, textAlign: "right" }}>{currency(detail(row), column)}</Typography>
          </React.Fragment>)}
        </Box>
        {action(row)}
      </Card>)}
    </Stack>
  </>;
}

export default function FinancialReportResults({ payload, settings, openWeek }) {
  const monthly = payload.kind === "month";
  const report = payload.report;
  const totals = monthly ? report.totals : report.summary;
  const warnings = [...new Set(monthly ? report.weeks.flatMap((week) => week.summary.warnings ?? []) : report.warnings ?? [])];
  const distribution = monthly ? totals.distribution_on_month_profit : totals.distribution;
  const series = monthly ? report.weeks.map((week) => ({
    period: week.from.slice(5), amount: Number(week.summary.sales_net_without_tax), raw: week.summary.sales_net_without_tax,
  })) : [];
  const columns = monthly ? metricKeys.filter((key) => key !== "sales_gross") : metricKeys;
  return <Stack spacing={2}>
    <Typography variant="body2">{report.from} al {report.to} · {payload.branch?.name ?? "Toda la tienda"} · {settings.timezone}</Typography>
    <Metrics columns={columns} record={totals} />
    {!monthly && <Metrics columns={adjustments} record={totals} />}
    {!monthly && <Coverage summary={totals} settings={settings} />}
    {monthly && totals.gross_profit == null && <Alert severity="warning">Utilidad mensual no disponible. Consulta la cobertura y base fiscal en el detalle semanal.</Alert>}
    {!monthly && <Typography variant="body2">
      Cobros de ventas anteriores identificados · {moneyMXN(totals.collections?.from_prior_sales_identified)}. Crédito originado · {moneyMXN(totals.commercial?.credit_originated)}.
      Los cobros reflejan únicamente eventos registrados.
    </Typography>}
    {monthly && series.length > 0 && series.every(({ raw, amount: value }) => raw != null && Number.isFinite(value)) && <Card variant="outlined" sx={{ p: 2 }}>
      <Typography fontWeight={700}>Ingreso neto sin IVA por semana</Typography>
      <Box sx={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="period" /><YAxis width={75} />
            <Tooltip formatter={(_, __, entry) => [moneyMXN(entry.payload.raw), "Ingreso neto sin IVA"]} />
            <Bar dataKey="amount" fill="#1976d2" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>}
    <Typography variant="h6">{monthly ? "Desglose por semanas" : "Partidas por producto"}</Typography>
    <DetailRows rows={monthly ? report.weeks : report.details} columns={monthly ? monthlyColumns : weeklyColumns}
      monthly={monthly} openWeek={openWeek} />
    <ProfitAllocation distribution={distribution} weeklySum={monthly ? {
      current_expenses_assigned: totals.current_expenses_assigned_weekly_sum, savings_assigned: totals.savings_assigned_weekly_sum,
    } : null} />
    <Alert severity="info">Caja fija, inversión y gastos reales · No disponibles.</Alert>
    {warnings.map((warning) => <Typography key={warning} variant="body2" color="text.secondary">{warning}</Typography>)}
  </Stack>;
}

