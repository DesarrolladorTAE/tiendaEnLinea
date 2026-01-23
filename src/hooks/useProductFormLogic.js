// src/hooks/useProductFormLogic.js
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../config/axiosClient";
import { showSuccess, showError } from "../utils/alerts";

/**
 * ✅ Helper: agrega a FormData usando notación bracket
 *  appendFormData(fd, "variants", [{ stock: 2, attributes: { Color:"Rojo"} }])
 *  => variants[0][stock]=2, variants[0][attributes][Color]=Rojo
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

/**
 * Convierte variantes del FORM (attributes array) a payload BACKEND (attributes object)
 * + Soporta image por variante (File)
 */
export function normalizeVariantsForBackend(rawVariants = []) {
  return (rawVariants || [])
    .map((v) => {
      const attrsArray = Array.isArray(v.attributes) ? v.attributes : [];
      const attributesObj = {};

      attrsArray.forEach((a) => {
        const k = String(a?.name || "").trim();
        const val = String(a?.value || "").trim();
        if (!k || !val) return;
        attributesObj[k] = val;
      });

      const stockNum = Number(v.stock || 0);

      return {
        sku: v.sku ? String(v.sku).trim() : null,
        name: v.name ? String(v.name).trim() : null,
        price:
          v.price === "" || v.price === null || v.price === undefined
            ? null
            : Number(v.price),
        purchase_cost:
          v.purchase_cost === "" ||
          v.purchase_cost === null ||
          v.purchase_cost === undefined
            ? null
            : Number(v.purchase_cost),
        stock: Number.isFinite(stockNum) ? stockNum : 0,
        image: v.image instanceof File ? v.image : null, // ✅ File real
        is_active: String(v.is_active) === "false" ? false : true,
        attributes: Object.keys(attributesObj).length ? attributesObj : null,
      };
    })
    .filter((v) => {
      const hasAny =
        (v.name && String(v.name).trim() !== "") ||
        (v.sku && String(v.sku).trim() !== "") ||
        Number(v.stock || 0) > 0 ||
        (v.attributes && Object.keys(v.attributes).length > 0) ||
        v.image instanceof File;
      return hasAny;
    });
}

/**
 * Si tu API regresa variants con attributes como objeto:
 *   { attributes: { Color:"Rojo" } }
 * lo convertimos a:
 *   { attributes: [{name:"Color", value:"Rojo"}] }
 */
export function mapBackendVariantsToForm(backendVariants = []) {
  return (backendVariants || []).map((v) => {
    const attrsObj =
      v?.attributes && typeof v.attributes === "object" ? v.attributes : null;

    const attrsArray = attrsObj
      ? Object.entries(attrsObj).map(([name, value]) => ({
          name: String(name),
          value: String(value),
        }))
      : [{ name: "", value: "" }];

    return {
      sku: v?.sku || "",
      name: v?.name || "",
      price: v?.price ?? "",
      purchase_cost: v?.purchase_cost ?? "",
      stock: v?.stock ?? 0,
      image: v?.image_url || v?.image || "", // ✅ URL/string (solo preview)
      is_active: v?.is_active === false ? "false" : "true",
      attributes: attrsArray.length ? attrsArray : [{ name: "", value: "" }],
    };
  });
}

/**
 * Hook principal: toda la lógica del ProductForm
 */
export default function useProductFormLogic({ reset, watch, setValue }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

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

  // locations (pos_locations) para multi-almacén
  const [locations, setLocations] = useState([]);

  // ===== watchers IVA/base =====
  const priceStr = watch("price") || "0";
  const ivaRaw = watch("iva");
  const basePriceStr = watch("base_price") || "0";

  const price = parseFloat(priceStr) || 0;
  const iva =
    ivaRaw !== "null" && ivaRaw !== "" ? parseFloat(ivaRaw) || 0 : 0;

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
    return (catsFromApi || []).map((c) => {
      const found = categoriesOptions.find(
        (o) => Number(o.value) === Number(c.id)
      );
      return found ?? { value: c.id, label: c.name };
    });
  };

  // ===== fetchers =====
  const fetchCategories = async () => {
    const catRes = await axiosClient.get("/admin/categories");
    const cats = catRes.data.categories ?? catRes.data ?? [];
    buildCategoryOptionsWithMap(cats);
  };

  const fetchLocations = async () => {
    // Ajusta si tu ruta real es otra
    try {
      const res = await axiosClient.get("/admin/pos");
      const data = res.data?.data || res.data?.locations || res.data || [];
      setLocations(Array.isArray(data) ? data : []);
    } catch (e) {
      setLocations([]);
    }
  };

  const fetchProduct = async (productId) => {
    const response = await axiosClient.get(
      `https://mitiendaenlineamx.com.mx/api/admin/products/${productId}`
    );
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

      costo_compra: product.purchase_cost?.toString() || "",
      unidad_medida_id: product.unidad_medida_id || "",
      clave_producto_servicio: product.clave_producto_sat || "",
      clave_unidad: product.clave_unidad_sat || "",
      base_price: basePriceFromApi,

      variants: loadedVariants,

      // ✅ multi-almacén (nuevo)
      use_location_inventory: Boolean(product.use_location_inventory),
      location_inventories: Array.isArray(product.location_inventories)
        ? product.location_inventories
        : [],

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
    const init = async () => {
      try {
        await fetchCategories();
        await fetchLocations();
        if (id) await fetchProduct(id);
      } catch (err) {
        console.error(err);
        if (id) showError("No se pudo cargar el producto para edición.");
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ===== CÁLCULO base_price =====
  useEffect(() => {
    if (!isEdit) {
      if (!isNaN(price) && !isNaN(iva)) {
        const nuevoBase = (price / (1 + (iva || 0))).toFixed(2);
        if (nuevoBase !== basePriceStr) setValue("base_price", nuevoBase);
      }
    }
  }, [price, iva, isEdit, basePriceStr, setValue]);

  useEffect(() => {
    if (!isEdit) return;
    if (!productoCargado) return;
    if (ivaOriginal === null) return;
    if (iva === ivaOriginal) return;

    const basePriceNum = parseFloat(basePriceStr) || 0;
    if (!isNaN(basePriceNum) && !isNaN(iva)) {
      const nuevoPrecio = (basePriceNum * (1 + iva)).toFixed(2);
      if (nuevoPrecio !== priceStr) setValue("price", nuevoPrecio);
    }
  }, [
    isEdit,
    productoCargado,
    ivaOriginal,
    iva,
    basePriceStr,
    priceStr,
    setValue,
  ]);

  const handleRecalculateBase = () => {
    const currentPrice = parseFloat(watch("price") || "0");
    const ivaValue = watch("iva");
    const ivaNum =
      ivaValue === "null" || ivaValue === "" ? 0 : parseFloat(ivaValue) || 0;

    const newBase = (currentPrice / (1 + (ivaNum || 0))).toFixed(2);
    setValue("base_price", newBase);
  };

  // ===== SUBMIT =====
  const onSubmit = async (data) => {
    try {
      /**
       * ✅ PRE-VALIDACIÓN MULTI-ALMACÉN (SIN VARIANTES)
       */
      const useLoc = Boolean(data.use_location_inventory);

      const variantsPayloadPreview = normalizeVariantsForBackend(data.variants || []);
      const hasVariantsPayload = variantsPayloadPreview.length > 0;

      if (useLoc && !hasVariantsPayload) {
        const stock = Number(data.stock || 0);
        const rows = Array.isArray(data.location_inventories)
          ? data.location_inventories
          : [];

        const ids = rows.map((r) => String(r?.pos_location_id || "").trim());

        if (!rows.length) {
          showError("❌ Multi-almacén activo: agrega al menos una sucursal.");
          return;
        }
        if (ids.some((id) => !id)) {
          showError("❌ Hay filas sin sucursal seleccionada.");
          return;
        }
        const dup = ids.find((id, i) => ids.indexOf(id) !== i);
        if (dup) {
          showError("❌ No puedes repetir la misma sucursal.");
          return;
        }

        const invalidQty = rows.some((r) => {
          if (r?.qty === "" || r?.qty === null || r?.qty === undefined) return false;
          const n = Number(r.qty);
          return !Number.isFinite(n) || n < 0;
        });
        if (invalidQty) {
          showError("❌ Hay cantidades inválidas (deben ser números >= 0).");
          return;
        }

        const sum = rows.reduce((acc, r) => acc + (Number(r?.qty) || 0), 0);
        if (sum !== stock) {
          showError(
            `❌ La suma por sucursal (${sum}) debe ser igual al stock global (${stock}).`
          );
          return;
        }
      }

      // ================================
      // Ya pasamos validaciones, armamos FormData
      // ================================
      const formData = new FormData();

      // base fields
      formData.append("sku", data.sku);
      formData.append("name", data.name);
      formData.append("price", data.price?.toString() || "0");
      formData.append("discount", data.discount?.toString() || "0");
      formData.append("new", data.new ? "1" : "0");
      formData.append("saleCount", data.saleCount?.toString() || "0");
      formData.append("rating", data.rating?.toString() || "0");
      formData.append("shortDescription", data.shortDescription);
      formData.append("fullDescription", data.fullDescription);

      // IVA
      if (data.iva === "null" || data.iva === "") formData.append("iva", "null");
      else formData.append("iva", data.iva);

      // base_price
      const ivaNumber =
        data.iva === "null" || data.iva === "" ? 0 : parseFloat(data.iva) || 0;
      const priceNumber = parseFloat(data.price || "0");

      let basePriceToSend;

      if (!id) {
        basePriceToSend = (priceNumber / (1 + ivaNumber)).toFixed(2);
      } else {
        const initialPriceFixed =
          initialPrice !== null && initialPrice !== undefined
            ? Number(initialPrice).toFixed(2)
            : null;
        const currentPriceFixed = priceNumber.toFixed(2);

        const priceChanged =
          initialPriceFixed === null
            ? true
            : currentPriceFixed !== initialPriceFixed;

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

      // visible
      formData.append("visible", data.visible ? "1" : "0");

      // offerEnd solo si descuento > 0
      if (data.offerEnd && Number(data.discount) > 0) {
        const formattedOfferEnd = new Date(data.offerEnd)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        formData.append("offerEnd", formattedOfferEnd);
      }

      // SAT
      formData.append("purchase_cost", data.costo_compra?.toString() || "0");
      formData.append("unidad_medida_id", data.unidad_medida_id || "");
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

      // variantes (usar el preview ya calculado)
      const variantsPayload = variantsPayloadPreview;
      const hasVariantsPayload2 = variantsPayload.length > 0;

      // stock global si NO hay variantes
      if (!hasVariantsPayload2) formData.append("stock", data.stock?.toString() || "0");
      else formData.append("stock", "0");

      if (hasVariantsPayload2) appendFormData(formData, "variants", variantsPayload);

      /**
       * ✅ MULTI-ALMACÉN (NUEVO)
       * Enviar switch + lista
       */
      formData.append("use_location_inventory", useLoc ? "1" : "0");

      if (useLoc) {
        const rows = Array.isArray(data.location_inventories)
          ? data.location_inventories
          : [];

        // limpiar rows sin sucursal (por seguridad)
        const clean = rows
          .map((r) => ({
            pos_location_id: String(r?.pos_location_id || "").trim(),
            qty: r?.qty === "" || r?.qty === null || r?.qty === undefined ? "" : Number(r.qty),
            price: r?.price === "" || r?.price === null || r?.price === undefined ? "" : Number(r.price),
            purchase_cost:
              r?.purchase_cost === "" || r?.purchase_cost === null || r?.purchase_cost === undefined
                ? ""
                : Number(r.purchase_cost),
          }))
          .filter((r) => r.pos_location_id !== "");

        if (clean.length) {
          appendFormData(formData, "location_inventories", clean);
        }
      }

      // request
      if (id) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/admin/products/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("✅ Producto actualizado con éxito.");
        navigate("/admin/products");
      } else {
        await axiosClient.post("/cargar/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("✅ Producto creado con éxito.");
        navigate("/admin/products");
        reset();
        setImageFiles([]);
      }
    } catch (error) {
      console.error("❌ Error en la API:", error.response?.data || error);
      if (error.response?.data?.errors) {
        showError(
          `❌ Error en la API:\n${JSON.stringify(error.response.data.errors, null, 2)}`
        );
      } else {
        showError("Error de conexión con el servidor.");
      }
    }
  };

  // memo para UI
  const ui = useMemo(
    () => ({
      id,
      isEdit,
      hasVariants,
      basePriceStr,
      categoriesOptions,
      locations,
      imageFiles,
    }),
    [id, isEdit, hasVariants, basePriceStr, categoriesOptions, locations, imageFiles]
  );

  const actions = useMemo(
    () => ({
      setImageFiles,
      handleRecalculateBase,
      onSubmit,
    }),
    [setImageFiles, handleRecalculateBase, onSubmit]
  );

  return { ui, actions };
}
