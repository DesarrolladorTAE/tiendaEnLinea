// src/hooks/useProductFormLogic.js
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../config/axiosClient";
import { showSuccess, showError } from "../utils/alerts";
import { useAdminUi } from "../context/AdminUiContext";

/**
 * ✅ Helper: agrega a FormData usando notación bracket
 * appendFormData(fd, "variants", [{ stock: 2, attributes: [{name:"Color", value:"Rojo"}] }])
 * => variants[0][stock]=2, variants[0][attributes][0][name]=Color ...
 */
export function appendFormData(formData, key, value) {
  if (value === undefined) return;

  if (value === null) {
    formData.append(key, "");
    return;
  }

  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((v, i) => appendFormData(formData, `${key}[${i}]`, v));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => {
      appendFormData(formData, `${key}[${k}]`, v);
    });
    return;
  }

  formData.append(key, String(value));
}

// helpers num seguros
const toNumOrEmpty = (v) => (v === "" || v == null ? "" : Number(v));
const toNumOrNull = (v) => (v === "" || v == null ? null : Number(v));
const toStrTrimOrEmpty = (v) => String(v ?? "").trim();

/**
 * Convierte variantes del FORM a payload BACKEND:
 * - attributes: array [{name,value}]
 * - warehouse_stocks: array [{warehouse_id, stock, min_stock, max_stock, reorder_point, location_bin}]
 * - image: File (si aplica) o image_existing
 */
export function normalizeVariantsForBackend(rawVariants = []) {
  return (rawVariants || [])
    .map((v) => {
      const attrsArray = Array.isArray(v.attributes) ? v.attributes : [];

      const attributesArr = attrsArray
        .map((a) => ({
          name: toStrTrimOrEmpty(a?.name),
          value: toStrTrimOrEmpty(a?.value),
        }))
        .filter((a) => a.name && a.value);

      // ✅ warehouse_variant_stocks (tabla real)
      const rows = Array.isArray(v.warehouse_stocks) ? v.warehouse_stocks : [];
      const cleanWarehouseStocks = rows
        .map((r) => ({
          warehouse_id: toStrTrimOrEmpty(r?.warehouse_id),

          // ✅ tu tabla usa "stock" (no qty)
          stock: toNumOrEmpty(r?.stock),

          // ✅ extras (opcionales)
          min_stock: toNumOrEmpty(r?.min_stock),
          max_stock: toNumOrEmpty(r?.max_stock),
          reorder_point: toNumOrEmpty(r?.reorder_point),
          location_bin: toStrTrimOrEmpty(r?.location_bin),
        }))
        .filter((r) => r.warehouse_id !== "");

      const stockNum = Number(v.stock ?? 0);

      return {
        id: v.id ?? null,
        sku: v.sku ? toStrTrimOrEmpty(v.sku) : null,
        name: v.name ? toStrTrimOrEmpty(v.name) : null,
        price: v.price === "" || v.price == null ? null : Number(v.price),
        purchase_cost:
          v.purchase_cost === "" || v.purchase_cost == null
            ? null
            : Number(v.purchase_cost),
        stock: Number.isFinite(stockNum) ? stockNum : 0,

        image: v.image instanceof File ? v.image : null,
        image_existing: !(v.image instanceof File)
          ? v.image_existing || v.image || null
          : null,

        is_active: String(v.is_active) === "false" ? 0 : 1,

        attributes: attributesArr,
        warehouse_stocks: cleanWarehouseStocks,
      };
    })
    .filter((v) => {
      const hasAny =
        (v.name && v.name.trim() !== "") ||
        (v.sku && v.sku.trim() !== "") ||
        v.price !== null ||
        v.purchase_cost !== null ||
        v.is_active === 0 ||
        v.is_active === 1 ||
        Number(v.stock ?? 0) >= 0 ||
        (Array.isArray(v.attributes) && v.attributes.length > 0) ||
        v.image instanceof File ||
        (typeof v.image_existing === "string" && v.image_existing.trim() !== "") ||
        (Array.isArray(v.warehouse_stocks) && v.warehouse_stocks.length > 0);

      return hasAny;
    });
}

/**
 * Backend -> Form:
 * - attributes: soporta objeto {Color:"Rojo"} o array [{name,value}]
 * - warehouse_stocks: array con campos reales: stock/min/max/reorder/bin
 */
export function mapBackendVariantsToForm(backendVariants = []) {
  return (backendVariants || []).map((v) => {
    // ✅ attributes
    // ✅ attributes (acepta attributes o variant_attributes)
    let attrsArray = [{ name: "", value: "" }];

    const attrsSrc = Array.isArray(v?.attributes)
      ? v.attributes
      : Array.isArray(v?.variant_attributes)
        ? v.variant_attributes
        : null;

    if (Array.isArray(attrsSrc)) {
      const arr = attrsSrc
        .map((a) => ({
          name: String(a?.name || ""),
          value: String(a?.value || ""),
        }))
        .filter((a) => a.name.trim() && a.value.trim());
      attrsArray = arr.length ? arr : [{ name: "", value: "" }];
    } else if (v?.attributes && typeof v.attributes === "object") {
      // si algún endpoint aún manda attributes como objeto {Color:"Rojo"}
      const arr = Object.entries(v.attributes)
        .map(([name, value]) => ({
          name: String(name || ""),
          value: String(value || ""),
        }))
        .filter((a) => a.name.trim() && a.value.trim());
      attrsArray = arr.length ? arr : [{ name: "", value: "" }];
    }

    // ✅ warehouse_stocks (tabla real)
    const warehouseStocks = Array.isArray(v?.warehouse_stocks)
      ? v.warehouse_stocks.map((r) => ({
        warehouse_id: String(r?.warehouse_id ?? "").trim(),
        stock: r?.stock ?? "",
        min_stock: r?.min_stock ?? "",
        max_stock: r?.max_stock ?? "",
        reorder_point: r?.reorder_point ?? "",
        location_bin: r?.location_bin ?? "",
      }))
      : [];

    // ✅ conservar imagen existente
    const imageExisting = v?.image_url || v?.image || "";

    return {
      id: v?.id ?? null,
      sku: v?.sku || "",
      name: v?.name || "",
      price: v?.price ?? "",
      purchase_cost: v?.purchase_cost ?? "",
      stock: v?.stock ?? 0,

      image: imageExisting,
      image_existing: imageExisting,

      is_active: v?.is_active === false ? "false" : "true",
      attributes: attrsArray,

      warehouse_stocks: warehouseStocks,
    };
  });
}

/**
 * ✅ Deriva "almacenes activos" a nivel PRODUCTO cuando:
 * - use_warehouse_inventory = true
 * - pero warehouse_inventories viene vacío
 * - y hay variantes con warehouse_stocks
 */
function deriveWarehouseInventoriesFromVariants(product) {
  const useWh = Boolean(product?.use_warehouse_inventory);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const base = Array.isArray(product?.warehouse_inventories)
    ? product.warehouse_inventories
    : [];

  if (!useWh) return base;
  if (base.length > 0) return base;
  if (!variants.length) return base;

  const ids = new Set();
  variants.forEach((v) => {
    const rows = Array.isArray(v?.warehouse_stocks) ? v.warehouse_stocks : [];
    rows.forEach((r) => {
      const id = r?.warehouse_id;
      if (id !== null && id !== undefined && String(id).trim() !== "") {
        ids.add(Number(id));
      }
    });
  });

  return Array.from(ids).map((id) => ({ warehouse_id: id }));
}

export default function useProductFormLogic({ reset, watch, setValue }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // ✅ branch desde contexto
  const { selectedBranch } = useAdminUi();
  const branchId = selectedBranch?.id ? Number(selectedBranch.id) : null;

  // categorías padre/hijas
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState(new Map());

  // control recálculos edición
  const [productoCargado, setProductoCargado] = useState(false);
  const [ivaOriginal, setIvaOriginal] = useState(null);
  const [initialPrice, setInitialPrice] = useState(null);
  const [initialBasePrice, setInitialBasePrice] = useState(null);

  // imágenes principales
  const [imageFiles, setImageFiles] = useState([]);

  // ✅ warehouses
  const [warehouses, setWarehouses] = useState([]);

  // ===== watchers IVA/base =====
  const priceStr = watch("price") || "0";
  const ivaRaw = watch("iva");
  const basePriceStr = watch("base_price") || "0";

  const price = parseFloat(priceStr) || 0;
  const iva = ivaRaw !== "null" && ivaRaw !== "" ? parseFloat(ivaRaw) || 0 : 0;

  // variantes (para UI)
  const variantsWatch = watch("variants") || [];
  const hasVariants = variantsWatch.length > 0;

  // ===== helpers categorías =====
  const buildCategoryOptionsWithMap = (flat) => {
    const parents = flat.filter((c) => c.parent_id == null);
    const byParent = new Map();

    flat.forEach((c) => {
      if (c.parent_id != null) {
        const arr = byParent.get(c.parent_id) ?? [];
        arr.push(c);
        byParent.set(c.parent_id, arr);
      }
    });

    setChildrenByParent(byParent);

    const options = [];

    parents
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .forEach((p) => {
        const kids = (byParent.get(p.id) ?? []).sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        );

        if (kids.length) {
          options.push({
            value: p.id,
            label: `🗂️ ${p.name} (guardar todas sus hijas)`,
            meta: { type: "parent" },
          });

          kids.forEach((k) => {
            options.push({
              value: k.id,
              label: `   ↳ 👶 ${k.name}`,
              meta: { type: "child", parent_id: p.id },
            });
          });
        } else {
          options.push({
            value: p.id,
            label: `📄 ${p.name}`,
            meta: { type: "single" },
          });
        }
      });

    setCategoriesOptions(options);
  };

  const expandSelectedCategories = (selected) => {
    const ids = (selected || []).map((x) => Number(x.value)).filter(Boolean);
    const final = new Set();

    for (const cid of ids) {
      const kids = childrenByParent.get(cid);
      if (kids && kids.length) kids.forEach((k) => final.add(Number(k.id)));
      else final.add(cid);
    }
    return Array.from(final);
  };

  const mapSelectedCats = (catsFromApi) => {
    const base = (catsFromApi || []).map((c) => ({ value: c.id, label: c.name }));
    if (!categoriesOptions?.length) return base;

    return (catsFromApi || []).map((c) => {
      const found = categoriesOptions.find((o) => Number(o.value) === Number(c.id));
      return found ?? { value: c.id, label: c.name };
    });
  };

  // ===== fetchers =====
  const fetchCategories = async () => {
    const catRes = await axiosClient.get("/admin/categories", {
      params: branchId ? { branch_id: branchId } : undefined,
    });
    const cats = catRes.data.categories ?? catRes.data ?? [];
    buildCategoryOptionsWithMap(cats);
  };

  const fetchWarehouses = async () => {
    try {
      if (!branchId) {
        setWarehouses([]);
        return;
      }

      const res = await axiosClient.get(`/branches/${branchId}/warehouses`, {
        params: { only_active: 1 }, // opcional
      });

      const data = res.data?.data || res.data?.warehouses || res.data || [];
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchWarehouses error:", e?.response?.data || e);
      setWarehouses([]);
    }
  };


  const fetchProduct = async (productId) => {
    const response = await axiosClient.get(`/admin/productos/${productId}`);
    const product = response.data;

    let offerEnd = "";
    if (product.offerEnd) {
      const date = new Date(product.offerEnd);
      offerEnd = date.toISOString().slice(0, 16);
    }

    const priceFromApi =
      product.price !== null && product.price !== undefined
        ? Number(product.price).toFixed(2)
        : "";

    const basePriceFromApi =
      product.base_price !== null && product.base_price !== undefined
        ? Number(product.base_price).toFixed(2)
        : "";

    const loadedVariants = Array.isArray(product.variants)
      ? mapBackendVariantsToForm(product.variants)
      : [];

    const warehouseInventories = deriveWarehouseInventoriesFromVariants({
      ...product,
      variants: product.variants || [],
    });

    reset({
      sku: product.sku || "",
      name: product.name || "",
      price: priceFromApi,
      stock: product.stock?.toString() || "",
      discount: product.discount?.toString() || "",
      new: Boolean(product.new),
      saleCount: product.saleCount?.toString() || "",
      rating: product.rating?.toString() || "",
      shortDescription: product.shortDescription || "",
      fullDescription: product.fullDescription || "",
      iva: product.iva !== null ? product.iva.toString() : "null",
      offerEnd,
      category: mapSelectedCats(product.categories),
      tags: (product.tags || []).map((t) => ({ value: t.id, label: t.name })),
      visible: Boolean(product.visible),

      // SAT
      costo_compra: product.purchase_cost?.toString() || "",
      unidad_medida: product.unidad_medida_id
        ? { value: Number(product.unidad_medida_id), label: product.unidad_medida_texto || "" }
        : null,
      unidad_medida_id: product.unidad_medida_id || "",
      unidad_medida_texto: product.unidad_medida_texto || "",

      clave_producto_servicio: product.clave_producto_sat || "",
      clave_unidad: product.clave_unidad_sat || "",
      base_price: basePriceFromApi,

      variants: loadedVariants,

      use_warehouse_inventory: Boolean(product.use_warehouse_inventory),
      // OJO: si el backend manda qty/price/purchase_cost en warehouse_inventories,
      // aquí se respetan; si no manda, igual funciona con solo warehouse_id.
      warehouse_inventories: Array.isArray(warehouseInventories) ? warehouseInventories : [],
      branch_id: product.branch_id ?? branchId ?? "",

      options: product.options || [],
      units: product.units || [],
    });

    setProductoCargado(true);
    setIvaOriginal(product.iva !== null ? Number(product.iva) : null);
    setInitialPrice(product.price);
    setInitialBasePrice(product.base_price);
  };

  // ===== INIT =====
  useEffect(() => {
    fetchCategories().catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    fetchWarehouses().catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    if (!id) return;
    fetchProduct(id).catch((err) => {
      console.error(err);
      showError("No se pudo cargar el producto para edición.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ===== CÁLCULO base_price =====
  useEffect(() => {
    if (!isEdit) {
      const nuevoBase = (price / (1 + (iva || 0))).toFixed(2);
      if (nuevoBase !== basePriceStr) setValue("base_price", nuevoBase);
    }
  }, [price, iva, isEdit, basePriceStr, setValue]);

  useEffect(() => {
    if (!isEdit) return;
    if (!productoCargado) return;
    if (ivaOriginal === null) return;
    if (iva === ivaOriginal) return;

    const basePriceNum = parseFloat(basePriceStr) || 0;
    const nuevoPrecio = (basePriceNum * (1 + iva)).toFixed(2);
    if (nuevoPrecio !== priceStr) setValue("price", nuevoPrecio);
  }, [isEdit, productoCargado, ivaOriginal, iva, basePriceStr, priceStr, setValue]);

  const handleRecalculateBase = () => {
    const currentPrice = parseFloat(watch("price") || "0");
    const ivaValue = watch("iva");
    const ivaNum = ivaValue === "null" || ivaValue === "" ? 0 : parseFloat(ivaValue) || 0;
    const newBase = (currentPrice / (1 + (ivaNum || 0))).toFixed(2);
    setValue("base_price", newBase);
  };

  // ===== SUBMIT =====
  const onSubmit = async (data) => {
    try {
      const useWh = Boolean(data.use_warehouse_inventory);

      const variantsPayloadPreview = normalizeVariantsForBackend(data.variants || []);
      const hasVariantsPayload = variantsPayloadPreview.length > 0;

      // ✅ SIN variantes: valida warehouse_product_stocks (qty)
      if (useWh && !hasVariantsPayload) {
        const stock = Number(data.stock || 0);
        const rows = Array.isArray(data.warehouse_inventories) ? data.warehouse_inventories : [];

        const ids = rows.map((r) => String(r?.warehouse_id || "").trim());

        if (!rows.length) {
          showError("❌ Inventario por almacenes activo: agrega al menos un almacén.");
          return;
        }
        if (ids.some((x) => !x)) {
          showError("❌ Hay filas sin almacén seleccionado.");
          return;
        }
        const dup = ids.find((x, i) => ids.indexOf(x) !== i);
        if (dup) {
          showError("❌ No puedes repetir el mismo almacén.");
          return;
        }

        const invalidQty = rows.some((r) => {
          const v = r?.qty;
          if (v === "" || v === null || v === undefined) return false;
          const n = Number(v);
          return !Number.isFinite(n) || n < 0;
        });
        if (invalidQty) {
          showError("❌ Hay cantidades inválidas (deben ser números >= 0).");
          return;
        }

        const sum = rows.reduce((acc, r) => acc + (Number(r?.qty) || 0), 0);
        if (sum !== stock) {
          showError(`❌ La suma por almacén (${sum}) debe ser igual al stock global (${stock}).`);
          return;
        }
      }

      // ✅ CON variantes: valida warehouse_variant_stocks (stock) por variante
      if (useWh && hasVariantsPayload) {
        for (let i = 0; i < variantsPayloadPreview.length; i++) {
          const v = variantsPayloadPreview[i];
          const rows = Array.isArray(v.warehouse_stocks) ? v.warehouse_stocks : [];

          if (!rows.length) {
            showError(`❌ La variante #${i + 1} no tiene inventario por almacén.`);
            return;
          }

          const ids = rows.map((r) => String(r?.warehouse_id || "").trim());
          if (ids.some((x) => !x)) {
            showError(`❌ Variante #${i + 1}: hay filas sin almacén.`);
            return;
          }
          const dup = ids.find((x, idx) => ids.indexOf(x) !== idx);
          if (dup) {
            showError(`❌ Variante #${i + 1}: almacén repetido (${dup}).`);
            return;
          }

          const invalidStock = rows.some((r) => {
            const vv = r?.stock;
            if (vv === "" || vv === null || vv === undefined) return true; // aquí sí es obligatorio
            const n = Number(vv);
            return !Number.isFinite(n) || n < 0;
          });
          if (invalidStock) {
            showError(`❌ Variante #${i + 1}: stocks inválidos (>= 0).`);
            return;
          }

          const sum = rows.reduce((acc, r) => acc + (Number(r?.stock) || 0), 0);
          const vStock = Number(v.stock || 0);

          if (sum !== vStock) {
            showError(
              `❌ Variante #${i + 1}: la suma por almacén (${sum}) debe ser igual al stock de la variante (${vStock}).`
            );
            return;
          }
        }
      }

      // ================================
      // FormData
      // ================================
      const formData = new FormData();

      if (branchId) formData.append("branch_id", String(branchId));

      formData.append("sku", data.sku);
      formData.append("name", data.name);
      formData.append("price", data.price?.toString() || "0");
      formData.append("discount", data.discount?.toString() || "0");
      formData.append("new", data.new ? "1" : "0");
      formData.append("saleCount", data.saleCount?.toString() || "0");
      formData.append("rating", data.rating?.toString() || "0");
      formData.append("shortDescription", data.shortDescription);
      formData.append("fullDescription", data.fullDescription);

      if (data.iva === "null" || data.iva === "") formData.append("iva", "null");
      else formData.append("iva", data.iva);

      // base_price
      const ivaNumber = data.iva === "null" || data.iva === "" ? 0 : parseFloat(data.iva) || 0;
      const priceNumber = parseFloat(data.price || "0");

      let basePriceToSend;

      if (!id) {
        basePriceToSend = (priceNumber / (1 + ivaNumber)).toFixed(2);
      } else {
        const initialPriceFixed =
          initialPrice !== null && initialPrice !== undefined ? Number(initialPrice).toFixed(2) : null;
        const currentPriceFixed = priceNumber.toFixed(2);

        const priceChanged = initialPriceFixed === null ? true : currentPriceFixed !== initialPriceFixed;

        if (priceChanged) {
          basePriceToSend = (priceNumber / (1 + ivaNumber)).toFixed(2);
        } else {
          basePriceToSend =
            initialBasePrice !== null && initialBasePrice !== undefined
              ? Number(initialBasePrice).toFixed(2)
              : data.base_price || "0";
        }
      }

      formData.append("base_price", basePriceToSend);
      formData.append("visible", data.visible ? "1" : "0");

      if (data.offerEnd && Number(data.discount) > 0) {
        const formattedOfferEnd = new Date(data.offerEnd).toISOString().slice(0, 19).replace("T", " ");
        formData.append("offerEnd", formattedOfferEnd);
      }

      // SAT
      formData.append("purchase_cost", data.costo_compra?.toString() || "0");
      formData.append(
        "unidad_medida_id",
        data.unidad_medida?.value ? String(data.unidad_medida.value) : data.unidad_medida_id || ""
      );
      formData.append("clave_producto_sat", data.clave_producto_servicio || "");
      formData.append("clave_unidad_sat", data.clave_unidad || "");

      // categorías
      if (data.category?.length) {
        const expandedIds = expandSelectedCategories(data.category);
        expandedIds.forEach((cid) => formData.append("category[]", String(cid)));
      }

      // tags
      if (data.tags?.length) {
        data.tags.forEach((tag) => formData.append("tag[]", String(tag.value)));
      }

      // imágenes principales
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => formData.append("images[]", file));
      }

      // variantes
      const variantsPayload = variantsPayloadPreview;
      const hasVariantsPayload2 = variantsPayload.length > 0;

      if (!hasVariantsPayload2) formData.append("stock", data.stock?.toString() || "0");
      else formData.append("stock", "0");

      if (hasVariantsPayload2) appendFormData(formData, "variants", variantsPayload);

      // multi-warehouse
      formData.append("use_warehouse_inventory", useWh ? "1" : "0");

      if (useWh) {
        const rows = Array.isArray(data.warehouse_inventories) ? data.warehouse_inventories : [];

        // ✅ SIN variantes → warehouse_product_stocks (qty/price/purchase_cost + opcionales min/max si los agregas)
        // ✅ CON variantes → aquí solo mandamos warehouses activos (warehouse_id)
        const clean = rows
          .map((r) => {
            const base = { warehouse_id: toStrTrimOrEmpty(r?.warehouse_id) };
            if (!base.warehouse_id) return null;

            if (hasVariantsPayload2) return base;

            // si NO hay variantes, esto sí existe:
            return {
              ...base,
              qty: toNumOrEmpty(r?.qty),
              price: toNumOrEmpty(r?.price),
              purchase_cost: toNumOrEmpty(r?.purchase_cost),

              // ✅ opcionales (solo funcionarán si los agregas a warehouse_product_stocks)
              min_stock: toNumOrEmpty(r?.min_stock),
              max_stock: toNumOrEmpty(r?.max_stock),
              reorder_point: toNumOrEmpty(r?.reorder_point),
              location_bin: toStrTrimOrEmpty(r?.location_bin),
            };
          })
          .filter(Boolean);

        if (clean.length) appendFormData(formData, "warehouse_inventories", clean);
      }

      // request
      if (id) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/admin/productos/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("✅ Producto actualizado con éxito.");
        navigate("/admin/products");
      } else {
        await axiosClient.post("/cargar/productos", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          params: branchId ? { branch_id: branchId } : undefined,
        });
        showSuccess("✅ Producto creado con éxito.");
        navigate("/admin/products");
        reset();
        setImageFiles([]);
      }
    } catch (error) {
      console.error("❌ Error en la API:", error.response?.data || error);
      if (error.response?.data?.errors) {
        showError(`❌ Error en la API:\n${JSON.stringify(error.response.data.errors, null, 2)}`);
      } else {
        showError("Error de conexión con el servidor.");
      }
    }
  };

  const ui = useMemo(
    () => ({
      id,
      isEdit,
      hasVariants,
      basePriceStr,
      categoriesOptions,
      warehouses,
      imageFiles,
      branchId,
    }),
    [id, isEdit, hasVariants, basePriceStr, categoriesOptions, warehouses, imageFiles, branchId]
  );

  const actions = useMemo(
    () => ({
      setImageFiles,
      handleRecalculateBase,
      onSubmit,
    }),
    [handleRecalculateBase]
  );

  return { ui, actions };
}
