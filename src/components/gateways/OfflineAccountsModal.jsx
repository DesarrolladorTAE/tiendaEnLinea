import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axiosClient from "../../config/axiosClient";
import mexicoBanks from "../../utils/mexicoBancks";
import { alertFromAxiosError, showConfirm, showSuccess } from "../../utils/alerts";

const TYPES = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "deposito", label: "Depósito bancario" },
  { value: "oxxo", label: "Pago en OXXO" },
];

/**
 * ✅ Formateo:
 * - Si ya trae espacios, respeta (solo normaliza multiples espacios)
 * - Si trae guiones, cambia a espacios
 * - Si viene todo junto, lo deja junto (sin separar)
 */
const formatBankNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (/\s/.test(raw)) return raw.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  if (/-/.test(raw)) return raw.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  return raw.replace(/[^\d]/g, "") || raw;
};

function FieldLabel({ label, help }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 900 }}>
        {label}
      </Typography>
      <Tooltip title={help} placement="top" arrow>
        <IconButton size="small" sx={{ p: 0.25 }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function OfflineAccountsModal({ open, onClose }) {
  const fullScreen = useMediaQuery("(max-width:600px)");
  const dialogBodyRef = useRef(null);

  const [list, setList] = useState([]);
  const [mode, setMode] = useState("list"); // list | create | edit | view
  const [selectedId, setSelectedId] = useState(null);
  const [viewAccount, setViewAccount] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "transferencia",
    bank_name: "",
    beneficiary_name: "",
    account_number: "",
    clabe: "",
    reference_label: "",
    reference_value: "",
    instructions: "",
    is_active: true,
    sort_order: 1,
  });

  const typeLabel = (v) => TYPES.find((x) => x.value === v)?.label || String(v || "—");

  const selectMenuProps = useMemo(
    () => ({
      disablePortal: true,
      container: dialogBodyRef.current,
      PaperProps: {
        sx: { maxHeight: 320, borderRadius: 2 },
      },
    }),
    [dialogBodyRef.current]
  );

  const fetchList = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/admin/payment-accounts");
      setList(data?.data || []);
    } catch (e) {
      setList([]);
      alertFromAxiosError(e, "No se pudieron cargar tus cuentas de pago.");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setMode("list");
    setSelectedId(null);
    setViewAccount(null);
    fetchList();
  }, [open, fetchList]);

  const nextOrder = useMemo(() => {
    const nums = list.map((x) => Number(x.sort_order) || 0).filter((n) => n > 0);
    return nums.length ? Math.max(...nums) + 1 : 1;
  }, [list]);

  const openCreate = () => {
    setSelectedId(null);
    setViewAccount(null);
    setForm({
      type: "transferencia",
      bank_name: "",
      beneficiary_name: "",
      account_number: "",
      clabe: "",
      reference_label: "",
      reference_value: "",
      instructions: "",
      is_active: true,
      sort_order: nextOrder,
    });
    setMode("create");
  };

  const openEdit = (acc) => {
    setSelectedId(acc.id);
    setViewAccount(null);
    setForm({
      type: acc.type ?? "transferencia",
      bank_name: acc.bank_name ?? "",
      beneficiary_name: acc.beneficiary_name ?? "",
      account_number: acc.account_number ?? "",       // ✅ ahora se usa el real
      clabe: acc.clabe ?? "",                          // ✅ ahora se usa el real
      reference_label: acc.reference_label ?? "",      // ✅
      reference_value: acc.reference_value ?? "",      // ✅
      instructions: acc.instructions ?? "",            // ✅
      is_active: acc.is_active ?? true,
      sort_order: Number(acc.sort_order ?? 1) || 1,
    });
    setMode("edit");
  };

  const openView = async (acc) => {
    try {
      const { data } = await axiosClient.get(`/admin/payment-accounts/${acc.id}`);
      setViewAccount(data?.data ?? data ?? acc);
    } catch (e) {
      // fallback al item del listado
      setViewAccount(acc);
      alertFromAxiosError(e, "No se pudo cargar el detalle de la cuenta.");
    }
    setMode("view");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        await axiosClient.post("/admin/payment-accounts", form);
        showSuccess("Cuenta creada correctamente.");
      } else {
        await axiosClient.put(`/admin/payment-accounts/${selectedId}`, form);
        showSuccess("Cuenta actualizada correctamente.");
      }
      setMode("list");
      await fetchList();
    } catch (e) {
      alertFromAxiosError(e, "No se pudo guardar la cuenta.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm(
      "¿Seguro que quieres eliminar esta cuenta? Esto ya no se mostrará al cliente.",
      "Sí, eliminar"
    );
    if (!ok) return;

    try {
      await axiosClient.delete(`/admin/payment-accounts/${id}`);
      showSuccess("Cuenta eliminada correctamente.");
      if (mode === "view") {
        setMode("list");
        setViewAccount(null);
      }
      await fetchList();
    } catch (e) {
      alertFromAxiosError(e, "No se pudo eliminar la cuenta.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Configuración de cuentas de pago
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 10, top: 10 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent ref={dialogBodyRef} sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Si tienes dudas sobre algún campo, presiona el ícono ℹ️ junto al nombre.
        </Typography>

        {/* ===================== LISTADO ===================== */}
        {mode === "list" && (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={{
                  width: "fit-content",
                  borderRadius: 2,
                  px: 2.2,
                  py: 1,
                  fontWeight: 900,
                  textTransform: "none",
                }}
              >
                Nueva cuenta
              </Button>
            </Stack>

            {list.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 900 }}>Aún no tienes cuentas configuradas</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                  Agrega hasta 3 cuentas para mostrarlas a tus clientes.
                </Typography>
              </Paper>
            ) : (
              list.map((acc) => (
                <Paper
                  key={acc.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    transition: "0.2s",
                    "&:hover": { boxShadow: 2 },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1, flexWrap: "wrap" }}
                      >
                        <Chip
                          label={typeLabel(acc.type).toUpperCase()}
                          size="small"
                          color={acc.is_active ? "success" : "default"}
                          variant={acc.is_active ? "filled" : "outlined"}
                        />
                        <Chip label={`Orden: ${Number(acc.sort_order ?? 1) || 1}`} size="small" variant="outlined" />
                      </Stack>

                      <Typography sx={{ mb: 0.3 }}>
                        <strong>Banco:</strong> {acc.bank_name || "—"}
                      </Typography>
                      <Typography sx={{ mb: 0.3 }}>
                        <strong>Beneficiario:</strong> {acc.beneficiary_name || "—"}
                      </Typography>

                      {/* ✅ estos 3 aparecen SIEMPRE */}
                      <Typography sx={{ mb: 0.3 }}>
                        <strong>Cuenta:</strong> {formatBankNumber(acc.account_number)}
                      </Typography>
                      <Typography sx={{ mb: 0.3 }}>
                        <strong>CLABE:</strong> {formatBankNumber(acc.clabe)}
                      </Typography>
                      <Typography sx={{ mb: 0.3 }}>
                        <strong>Referencia:</strong>{" "}
                        {acc.reference_label ? `${acc.reference_label}: ` : ""}
                        {acc.reference_value || "—"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" alignSelf={{ xs: "flex-end", sm: "auto" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => openView(acc)}
                        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                      >
                        Ver
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => openEdit(acc)}
                        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                      >
                        Editar
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleDelete(acc.id)}
                        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {/* ===================== VIEW ===================== */}
        {mode === "view" && viewAccount && (
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontWeight: 900 }}>Detalle de cuenta</Typography>
              <Chip
                label={viewAccount.is_active ? "ACTIVA" : "INACTIVA"}
                color={viewAccount.is_active ? "success" : "default"}
                size="small"
              />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1}>
              <Typography><strong>Tipo:</strong> {typeLabel(viewAccount.type)}</Typography>
              <Typography><strong>Banco:</strong> {viewAccount.bank_name || "—"}</Typography>
              <Typography><strong>Beneficiario:</strong> {viewAccount.beneficiary_name || "—"}</Typography>
              <Typography><strong>Número de cuenta:</strong> {formatBankNumber(viewAccount.account_number)}</Typography>
              <Typography><strong>CLABE:</strong> {formatBankNumber(viewAccount.clabe)}</Typography>
              <Typography>
                <strong>Referencia:</strong>{" "}
                {viewAccount.reference_label ? `${viewAccount.reference_label}: ` : ""}
                {viewAccount.reference_value || "—"}
              </Typography>
              <Typography><strong>Instrucciones:</strong> {viewAccount.instructions || "—"}</Typography>
              <Typography><strong>Orden:</strong> {Number(viewAccount.sort_order ?? 1) || 1}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => openEdit(viewAccount)}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Editar
              </Button>

              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => handleDelete(viewAccount.id)}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                Eliminar
              </Button>

              <Box flex={1} />
              <Button onClick={() => setMode("list")} sx={{ textTransform: "none", fontWeight: 900 }}>
                Volver
              </Button>
            </Stack>
          </Paper>
        )}

        {/* ===================== CREATE / EDIT ===================== */}
        {(mode === "create" || mode === "edit") && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>
              {mode === "create" ? "Nueva cuenta" : "Editar cuenta"}
            </Typography>

            <Stack spacing={2}>
              <Box>
                <FieldLabel
                  label="Tipo de pago"
                  help="Selecciona cómo pagará el cliente (transferencia, depósito u OXXO)."
                />
                <TextField
                  select
                  fullWidth
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  {TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <FieldLabel label="Banco" help="Elige el banco donde el cliente realizará el pago." />
                <TextField
                  select
                  fullWidth
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  {mexicoBanks.map((bank) => (
                    <MenuItem key={bank} value={bank}>
                      {bank}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <FieldLabel label="Beneficiario" help="Nombre del titular (como aparece en el banco)." />
                <TextField
                  fullWidth
                  value={form.beneficiary_name}
                  onChange={(e) => setForm({ ...form, beneficiary_name: e.target.value })}
                  placeholder="Ej. Juan Pérez López"
                />
              </Box>

              <Box>
                <FieldLabel
                  label="Número de cuenta"
                  help="Escríbelo tal cual lo manejas. Si viene junto, se mostrará junto."
                />
                <TextField
                  fullWidth
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="Ej. 0123456789012345"
                />
              </Box>

              <Box>
                <FieldLabel
                  label="CLABE"
                  help="Debe ser de 18 dígitos. Escríbela tal cual (sin letras)."
                />
                <TextField
                  fullWidth
                  value={form.clabe}
                  onChange={(e) => setForm({ ...form, clabe: e.target.value })}
                  placeholder="Ej. 012345678901234567"
                />
              </Box>

              <Box>
                <FieldLabel
                  label="Nombre de referencia"
                  help="Lo que verá el cliente como etiqueta. Ej: 'Concepto', 'Referencia', 'Pedido'."
                />
                <TextField
                  fullWidth
                  value={form.reference_label}
                  onChange={(e) => setForm({ ...form, reference_label: e.target.value })}
                  placeholder="Ej. Referencia"
                />
              </Box>

              <Box>
                <FieldLabel
                  label="Valor de referencia"
                  help="El dato que el cliente debe poner en el pago. Ej: 'PED-1234' o el concepto."
                />
                <TextField
                  fullWidth
                  value={form.reference_value}
                  onChange={(e) => setForm({ ...form, reference_value: e.target.value })}
                  placeholder="Ej. PED-1234"
                />
              </Box>

              <Box>
                <FieldLabel
                  label="Instrucciones"
                  help="Texto extra que se mostrará al cliente. Ej: 'Enviar comprobante por WhatsApp'."
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Ej. Después de pagar, sube tu comprobante para confirmar."
                />
              </Box>

              <Box>
                <FieldLabel label="Orden" help="Orden de visualización: 1 primero, 2 segundo, 3 tercero." />
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value || 1) })}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label="Cuenta activa"
              />
            </Stack>
          </Paper>
        )}
      </DialogContent>

      {(mode === "create" || mode === "edit") && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setMode("list")} sx={{ textTransform: "none", fontWeight: 900 }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, px: 2.2 }}
            >
              Guardar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
