import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../../config/axiosClient";
import { alertFromAxiosError, showConfirm, showError, showSuccess } from "../../../utils/alerts";
import { normalizeListResponse, toLocalInput } from "./helpers";

const EMPTY_COUPON = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  special_price: "",
  starts_at: "",
  ends_at: "",
  is_active: true,

  max_uses: "",
  uses_per_customer: "",
  min_subtotal: "",
  min_qty: "",
  stackable: false,
};

export function useCouponsAdmin({ apiBase }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  // form modal
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_COUPON });

  // rules modal
  const [openRulesModal, setOpenRulesModal] = useState(false);
  const [rulesOwner, setRulesOwner] = useState(null);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!apiBase) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`${apiBase}/coupons`, {
        params: { q: q || undefined, status: status === "all" ? undefined : status, per_page: 200 },
      });
      setRows(normalizeListResponse(res));
    } catch (e) {
      console.error(e);
      alertFromAxiosError(e, "Error al cargar cupones.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, q, status]);

  useEffect(() => {
    if (!apiBase) return;
    fetchList();
  }, [apiBase, fetchList]);

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_COUPON });
    setEditing(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setOpenForm(true);
  }, [resetForm]);

  const openEdit = useCallback(
    (row) => {
      resetForm();
      setEditing(row);
      setForm({
        code: row?.code || "",
        description: row?.description || "",
        discount_type: row?.discount_type || "percentage",
        discount_value: row?.discount_value ?? "",
        special_price: row?.special_price ?? "",
        starts_at: toLocalInput(row?.starts_at),
        ends_at: toLocalInput(row?.ends_at),
        is_active: !!row?.is_active,

        max_uses: row?.max_uses ?? "",
        uses_per_customer: row?.uses_per_customer ?? "",
        min_subtotal: row?.min_subtotal ?? "",
        min_qty: row?.min_qty ?? "",
        stackable: !!row?.stackable,
      });
      setOpenForm(true);
    },
    [resetForm]
  );

  const closeForm = useCallback(() => setOpenForm(false), []);

  const save = useCallback(async () => {
    if (!apiBase) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code?.trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value === "" ? null : Number(form.discount_value),
        special_price: form.special_price === "" ? null : Number(form.special_price),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: !!form.is_active,

        max_uses: form.max_uses === "" ? null : Number(form.max_uses),
        uses_per_customer: form.uses_per_customer === "" ? null : Number(form.uses_per_customer),
        min_subtotal: form.min_subtotal === "" ? null : Number(form.min_subtotal),
        min_qty: form.min_qty === "" ? null : Number(form.min_qty),
        stackable: !!form.stackable,
      };

      if (!payload.code) {
        showError("El código del cupón es obligatorio.");
        return;
      }

      // coherencia
      if (payload.discount_type === "special_price") {
        payload.discount_value = null;
        if (payload.special_price === null) {
          showError("Para 'Precio Especial' debes indicar special_price.");
          return;
        }
      } else {
        payload.special_price = null;
        if ((payload.discount_type === "percentage" || payload.discount_type === "fixed") && payload.discount_value === null) {
          showError("Debes indicar discount_value.");
          return;
        }
      }

      if (editing?.id) {
        await axiosClient.put(`${apiBase}/coupons/${editing.id}`, payload);
        showSuccess("Cupón actualizado.");
      } else {
        await axiosClient.post(`${apiBase}/coupons`, payload);
        showSuccess("Cupón creado.");
      }

      setOpenForm(false);
      resetForm();
      await fetchList();
    } catch (e) {
      console.error(e);
      alertFromAxiosError(e, "Error al guardar cupón.");
    } finally {
      setSaving(false);
    }
  }, [apiBase, editing?.id, fetchList, form, resetForm]);

  const deleteRow = useCallback(
    async (row) => {
      if (!apiBase) return;
      const ok = await showConfirm(`¿Eliminar cupón "${row?.code}"?`, "Sí, eliminar");
      if (!ok) return;

      try {
        await axiosClient.delete(`${apiBase}/coupons/${row.id}`);
        showSuccess("Cupón eliminado.");
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } catch (e) {
        console.error(e);
        alertFromAxiosError(e, "Error al eliminar.");
      }
    },
    [apiBase]
  );

  // -------- Rules ----------
  const openRules = useCallback(
    async (row) => {
      if (!apiBase) return;
      setOpenRulesModal(true);
      setRulesOwner(row);
      setRules([]);
      setRulesLoading(true);
      try {
        const res = await axiosClient.get(`${apiBase}/coupons/${row.id}`);
        const coupon = res.data?.data || res.data;
        setRules(Array.isArray(coupon?.rules) ? coupon.rules : []);
      } catch (e) {
        console.error(e);
        alertFromAxiosError(e, "Error al cargar reglas.");
      } finally {
        setRulesLoading(false);
      }
    },
    [apiBase]
  );

  const closeRules = useCallback(() => setOpenRulesModal(false), []);

  const addRule = useCallback(
    async (rule) => {
      if (!apiBase || !rulesOwner?.id) return;
      try {
        const res = await axiosClient.post(`${apiBase}/coupons/${rulesOwner.id}/rules`, rule);
        const created = res.data?.data || res.data;
        showSuccess("Regla agregada.");
        setRules((prev) => [created, ...prev]);
      } catch (e) {
        console.error(e);
        alertFromAxiosError(e, "Error al agregar regla.");
      }
    },
    [apiBase, rulesOwner?.id]
  );

  const deleteRule = useCallback(
    async (ruleId) => {
      if (!apiBase || !rulesOwner?.id) return;
      const ok = await showConfirm("¿Eliminar esta regla?", "Sí, eliminar");
      if (!ok) return;

      try {
        await axiosClient.delete(`${apiBase}/coupons/${rulesOwner.id}/rules/${ruleId}`);
        showSuccess("Regla eliminada.");
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      } catch (e) {
        console.error(e);
        alertFromAxiosError(e, "Error al eliminar regla.");
      }
    },
    [apiBase, rulesOwner?.id]
  );

  return {
    q, setQ,
    status, setStatus,
    loading,
    rows,
    fetchList,

    openForm,
    editing,
    form,
    setForm,
    saving,
    openCreate,
    openEdit,
    closeForm,
    save,

    deleteRow,

    openRulesModal,
    rulesOwner,
    rules,
    rulesLoading,
    openRules,
    closeRules,
    addRule,
    deleteRule,
  };
}