import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "../../../config/axiosClient";
import { alertFromAxiosError, showConfirm, showError, showSuccess } from "../../../utils/alerts";
import { imageUrlMaybe, normalizeListResponse, toLocalInput } from "./helpers";

const EMPTY_PROMO = {
  name: "",
  slug: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  special_price: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
  priority: 100,
  stackable: false,
  max_discount_amount: "",
  min_subtotal: "",
  min_qty: "",
};

export function usePromotionsAdmin({ apiBase }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  // form modal
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PROMO });

  // image upload
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState("");
  const [imgUploading, setImgUploading] = useState(false);

  // rules modal
  const [openRulesModal, setOpenRulesModal] = useState(false);
  const [rulesOwner, setRulesOwner] = useState(null);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!apiBase) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`${apiBase}/promotions`, {
        params: { q: q || undefined, status: status === "all" ? undefined : status, per_page: 200 },
      });
      setRows(normalizeListResponse(res));
    } catch (e) {
      console.error(e);
      alertFromAxiosError(e, "Error al cargar promociones.");
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
    setForm({ ...EMPTY_PROMO });
    setEditing(null);
    setImgFile(null);
    setImgPreview("");
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
        name: row?.name || "",
        slug: row?.slug || "",
        description: row?.description || "",
        discount_type: row?.discount_type || "percentage",
        discount_value: row?.discount_value ?? "",
        special_price: row?.special_price ?? "",
        starts_at: toLocalInput(row?.starts_at),
        ends_at: toLocalInput(row?.ends_at),
        is_active: !!row?.is_active,
        priority: row?.priority ?? 100,
        stackable: !!row?.stackable,
        max_discount_amount: row?.max_discount_amount ?? "",
        min_subtotal: row?.min_subtotal ?? "",
        min_qty: row?.min_qty ?? "",
      });
      setImgPreview(imageUrlMaybe(row?.image));
      setOpenForm(true);
    },
    [resetForm]
  );

  const closeForm = useCallback(() => setOpenForm(false), []);

  const onPickImage = useCallback((file) => {
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  }, []);

  const uploadImage = useCallback(
    async (promoId) => {
      if (!apiBase || !promoId || !imgFile) return null;
      setImgUploading(true);
      try {
        const fd = new FormData();
        fd.append("image", imgFile);

        const res = await axiosClient.post(`${apiBase}/promotions/${promoId}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        showSuccess("Imagen subida.");
        return res.data?.data || res.data;
      } catch (e) {
        console.error(e);
        alertFromAxiosError(e, "Error al subir imagen.");
        return null;
      } finally {
        setImgUploading(false);
      }
    },
    [apiBase, imgFile]
  );

  const save = useCallback(async () => {
    if (!apiBase) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || null,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value === "" ? null : Number(form.discount_value),
        special_price: form.special_price === "" ? null : Number(form.special_price),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: !!form.is_active,
        priority: Number(form.priority || 100),
        stackable: !!form.stackable,
        max_discount_amount: form.max_discount_amount === "" ? null : Number(form.max_discount_amount),
        min_subtotal: form.min_subtotal === "" ? null : Number(form.min_subtotal),
        min_qty: form.min_qty === "" ? null : Number(form.min_qty),
      };

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

      let promo;
      if (editing?.id) {
        const res = await axiosClient.put(`${apiBase}/promotions/${editing.id}`, payload);
        promo = res.data?.data || res.data;
        showSuccess("Promoción actualizada.");
      } else {
        const res = await axiosClient.post(`${apiBase}/promotions`, payload);
        promo = res.data?.data || res.data;
        showSuccess("Promoción creada.");
      }

      if (imgFile && promo?.id) await uploadImage(promo.id);

      setOpenForm(false);
      resetForm();
      await fetchList();
    } catch (e) {
      console.error(e);
      alertFromAxiosError(e, "Error al guardar promoción.");
    } finally {
      setSaving(false);
    }
  }, [apiBase, editing?.id, fetchList, form, imgFile, resetForm, uploadImage]);

  const deleteRow = useCallback(
    async (row) => {
      if (!apiBase) return;
      const ok = await showConfirm(`¿Eliminar promoción "${row?.name}"?`, "Sí, eliminar");
      if (!ok) return;

      try {
        await axiosClient.delete(`${apiBase}/promotions/${row.id}`);
        showSuccess("Promoción eliminada.");
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
        const res = await axiosClient.get(`${apiBase}/promotions/${row.id}`);
        const promo = res.data?.data || res.data;
        setRules(Array.isArray(promo?.rules) ? promo.rules : []);
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
        const res = await axiosClient.post(`${apiBase}/promotions/${rulesOwner.id}/rules`, rule);
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
        await axiosClient.delete(`${apiBase}/promotions/${rulesOwner.id}/rules/${ruleId}`);
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
    // filters
    q, setQ,
    status, setStatus,

    // list
    loading,
    rows,
    fetchList,

    // form
    openForm,
    editing,
    form,
    setForm,
    saving,
    openCreate,
    openEdit,
    closeForm,
    save,

    // image
    imgPreview,
    imgUploading,
    onPickImage,

    // delete
    deleteRow,

    // rules
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