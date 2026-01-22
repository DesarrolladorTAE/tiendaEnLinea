import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import "bootstrap/dist/css/bootstrap.min.css";
import { Switch } from "@mui/material";

import useLimiteProductos from "../../hooks/useLimiteProductos";
import { showSuccess, showError } from "../../utils/alerts";

import ProductField from "../../components/admin/ProductField";
import TextAreaField from "../../components/admin/TextAreaField";
import CustomSelect from "../../components/admin/CustomSelect";

import SatFields from "../../components/admin/productForm/SatFields";
import VariantsEditor from "../../components/admin/productForm/VariantsEditor";

/**
 * ✅ Helper: agrega a FormData usando notación bracket
 * Ej:
 *  appendFormData(fd, "variants", [{ stock: 2, attributes: { Color:"Rojo"} }])
 * genera:
 *  variants[0][stock]=2
 *  variants[0][attributes][Color]=Rojo
 */
function appendFormData(formData, key, value) {
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
    value.forEach((v, i) => {
      appendFormData(formData, `${key}[${i}]`, v);
    });
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
 */
function normalizeVariantsForBackend(rawVariants = []) {
  return rawVariants
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
        price: v.price === "" || v.price === null || v.price === undefined ? null : Number(v.price),
        purchase_cost:
          v.purchase_cost === "" || v.purchase_cost === null || v.purchase_cost === undefined
            ? null
            : Number(v.purchase_cost),
        stock: Number.isFinite(stockNum) ? stockNum : 0,
        image: v.image instanceof File ? v.image : null, // ✅ aquí
        is_active: String(v.is_active) === "false" ? false : true,
        attributes: Object.keys(attributesObj).length ? attributesObj : null,
      };
    })
    .filter((v) => {
      const hasAny =
        (v.name && v.name.trim() !== "") ||
        (v.sku && String(v.sku).trim() !== "") ||
        Number(v.stock || 0) > 0 ||
        (v.attributes && Object.keys(v.attributes).length > 0);
      return hasAny;
    });
}

/**
 * Si tu API regresa variants con attributes como objeto:
 *   { attributes: { Color:"Rojo", Talla:"CH" } }
 * lo convertimos a:
 *   { attributes: [{name:"Color", value:"Rojo"}, ...] }
 */
function mapBackendVariantsToForm(backendVariants = []) {
  return (backendVariants || []).map((v) => {
    const attrsObj = v?.attributes && typeof v.attributes === "object" ? v.attributes : null;
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
      image: v?.image || "",
      is_active: v?.is_active === false ? "false" : "true", // para el select
      attributes: attrsArray.length ? attrsArray : [{ name: "", value: "" }],
    };
  });
}

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      sku: "",
      name: "",
      price: "",
      stock: "",
      discount: "",
      new: false,
      saleCount: "",
      offerEnd: "",
      rating: "",
      shortDescription: "",
      fullDescription: "",
      category: [],
      tags: [],
      visible: true,

      // SAT
      unidad_medida_id: "",
      costo_compra: "",
      clave_producto_servicio: "",
      clave_unidad: "",

      // IVA/base
      iva: "",
      base_price: "",

      // ✅ NUEVA UI (variantes libres)
      variants: [],

      // FUTURO
      options: [],
      units: [],
    },
  });

  // ====== categorías padre/hijas ======
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState(new Map());

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

  const fetchOptions = async () => {
    try {
      const catRes = await axiosClient.get("/admin/categories");
      const cats = catRes.data.categories ?? catRes.data ?? [];
      buildCategoryOptionsWithMap(cats);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const expandSelectedCategories = (selected) => {
    const ids = (selected || []).map((x) => Number(x.value)).filter(Boolean);
    const final = new Set();

    for (const cid of ids) {
      const kids = childrenByParent.get(cid);
      if (kids && kids.length) {
        kids.forEach((k) => final.add(Number(k.id)));
      } else {
        final.add(cid);
      }
    }
    return Array.from(final);
  };

  // ====== watchers IVA/base ======
  const discount = watch("discount");

  const priceStr = watch("price") || "0";
  const ivaRaw = watch("iva");
  const basePriceStr = watch("base_price") || "0";

  const price = parseFloat(priceStr) || 0;
  const iva = ivaRaw !== "null" && ivaRaw !== "" ? parseFloat(ivaRaw) || 0 : 0;

  // control recálculos edición
  const [productoCargado, setProductoCargado] = useState(false);
  const [ivaOriginal, setIvaOriginal] = useState(null);
  const [initialPrice, setInitialPrice] = useState(null);
  const [initialBasePrice, setInitialBasePrice] = useState(null);

  // imágenes
  const [imageFiles, setImageFiles] = useState([]);

  // ✅ variantes libres (para UI condicional stock)
  const variantsWatch = watch("variants") || [];
  const hasVariants = variantsWatch.length > 0;

  // ====== INIT ======
  useEffect(() => {
    const init = async () => {
      await fetchOptions();
      if (id) await fetchProduct(id);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mapSelectedCats = (catsFromApi) => {
    return (catsFromApi || []).map((c) => {
      const found = categoriesOptions.find((o) => Number(o.value) === Number(c.id));
      return found ?? { value: c.id, label: c.name };
    });
  };

  const fetchProduct = async (productId) => {
    try {
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
        product.price !== null && product.price !== undefined ? Number(product.price).toFixed(2) : "";

      const basePriceFromApi =
        product.base_price !== null && product.base_price !== undefined
          ? Number(product.base_price).toFixed(2)
          : "";

      // ✅ Si tu API ya regresa variants, los cargamos en el editor
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

        // ✅ variantes libres
        variants: loadedVariants,

        options: product.options || [],
        units: product.units || [],
      });

      setProductoCargado(true);
      setIvaOriginal(product.iva !== null ? Number(product.iva) : null);
      setInitialPrice(product.price);
      setInitialBasePrice(product.base_price);
    } catch (err) {
      console.error("Error al cargar producto para editar:", err);
      showError("No se pudo cargar el producto para edición.");
    }
  };

  // ====== CÁLCULO base_price ======

  // CREAR: de precio final + IVA → base_price
  useEffect(() => {
    if (!isEdit) {
      if (!isNaN(price) && !isNaN(iva)) {
        const nuevoBase = (price / (1 + (iva || 0))).toFixed(2);
        if (nuevoBase !== basePriceStr) setValue("base_price", nuevoBase);
      }
    }
  }, [price, iva, isEdit, basePriceStr, setValue]);

  // EDITAR: si cambia el IVA, recalcula precio final usando base_price
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
  }, [isEdit, productoCargado, ivaOriginal, iva, basePriceStr, priceStr, setValue]);

  const handleRecalculateBase = () => {
    const currentPrice = parseFloat(watch("price") || "0");
    const ivaValue = watch("iva");
    const ivaNum = ivaValue === "null" || ivaValue === "" ? 0 : parseFloat(ivaValue) || 0;

    const newBase = (currentPrice / (1 + (ivaNum || 0))).toFixed(2);
    setValue("base_price", newBase);
  };

  // ====== SUBMIT ======
  const onSubmit = async (data) => {
    try {
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
      if (data.iva === "null" || data.iva === "") {
        formData.append("iva", "null");
      } else {
        formData.append("iva", data.iva);
      }

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

      // visible boolean
      formData.append("visible", data.visible ? "1" : "0");

      // offerEnd solo si descuento > 0
      if (data.offerEnd && Number(data.discount) > 0) {
        const formattedOfferEnd = new Date(data.offerEnd).toISOString().slice(0, 19).replace("T", " ");
        formData.append("offerEnd", formattedOfferEnd);
      }

      // SAT fields (nombres exactos backend)
      formData.append("purchase_cost", data.costo_compra?.toString() || "0");
      formData.append("unidad_medida_id", data.unidad_medida_id || "");
      formData.append("clave_producto_sat", data.clave_producto_servicio || "");
      formData.append("clave_unidad_sat", data.clave_unidad || "");

      // categorías (padre -> hijas)
      if (data.category?.length) {
        const expandedIds = expandSelectedCategories(data.category);
        expandedIds.forEach((cid) => formData.append("category[]", String(cid)));
      }

      // tags -> backend espera tag[]
      if (data.tags?.length) {
        data.tags.forEach((tag) => formData.append("tag[]", String(tag.value)));
      }

      // imágenes -> backend valida images.*
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("images[]", file);
        });
      }

      // ===== VARIANTS (NUEVA UI) =====
      const rawVariants = data.variants || [];
      const variantsPayload = normalizeVariantsForBackend(rawVariants);
      const hasVariantsPayload = variantsPayload.length > 0;

      // stock: si hay variantes -> manda 0 (o podrías mandar suma si quieres)
      if (!hasVariantsPayload) {
        formData.append("stock", data.stock?.toString() || "0");
      } else {
        formData.append("stock", "0");
      }

      // ✅ Mandar variants como array real via bracket notation
      if (hasVariantsPayload) {
        appendFormData(formData, "variants", variantsPayload);
      }

      // FUTURO options/units
      if (Array.isArray(data.options) && data.options.length > 0) {
        appendFormData(formData, "options", data.options);
      }
      if (Array.isArray(data.units) && data.units.length > 0) {
        appendFormData(formData, "units", data.units);
      }

      // ===== REQUEST =====
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
        showError(`❌ Error en la API:\n${JSON.stringify(error.response.data.errors, null, 2)}`);
      } else {
        showError("Error de conexión con el servidor.");
      }
    }
  };

  const { puedeCrear, cargando, limitePermitido } = useLimiteProductos();

  if (cargando) return <p className="text-center text-muted">Cargando datos...</p>;

  if (!puedeCrear) {
    return (
      <div className="alert alert-warning text-center mt-5">
        🚫 Has alcanzado el límite de <strong>{limitePermitido}</strong> productos para tu plan. <br />
        Elimina productos o mejora tu plan para seguir agregando más.
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card bg-dark text-light p-4 shadow-lg">
        <h2 className="text-center text-primary">{id ? "✏️ Editar Producto" : "📝 Crear Producto"}</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Información del Producto */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">🛒 Información del Producto</h4>
            </div>
          </div>

          <div className="row">
            <ProductField
              label="Código"
              name="sku"
              register={register}
              errors={errors}
              validation={{ required: "El codigo es obligatorio" }}
            />
            <ProductField
              label="Nombre"
              name="name"
              register={register}
              validation={{ required: "El nombre es obligatorio" }}
              errors={errors}
            />
            <ProductField
              label="Precio Final (incluye IVA)"
              name="price"
              type="text"
              register={register}
              validation={{ required: "El precio es obligatorio" }}
              errors={errors}
            />

            <div className="col-md-4 mb-3">
              <label className="form-label" htmlFor="iva">
                Tasa de IVA <span className="text-danger">*</span>
              </label>
              <select
                id="iva"
                className={`form-control bg-secondary border-secondary ${errors?.iva ? "is-invalid" : ""}`}
                {...register("iva", { required: "La tasa de IVA es obligatoria" })}
              >
                <option value="">Selecciona una tasa</option>
                <option value="0.16">TASA 16%</option>
                <option value="0.08">TASA 8%</option>
                <option value="0">TASA 0%</option>
                <option value="null">EXENTO</option>
              </select>

              {errors.iva && <small className="text-danger">{errors.iva.message}</small>}

              <input type="hidden" {...register("base_price")} />

              <div className="d-flex align-items-center justify-content-between mt-2">
                <p className="text-info mb-0">
                  Precio Base (SIN IVA): <strong>${Number(basePriceStr || 0).toFixed(2)} MXN</strong>
                </p>
                <button type="button" className="btn btn-sm btn-outline-light ms-2" onClick={handleRecalculateBase}>
                  Recalcular base
                </button>
              </div>
            </div>

            <ProductField label="Costo de Compra" name="costo_compra" type="text" register={register} errors={errors} />
          </div>

          {/* Inventario y Descuento */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">📦 Inventario y Descuento</h4>
            </div>
          </div>

          <div className="row">
            {/* stock solo si NO hay variantes */}
            {!hasVariants && (
              <ProductField
                label="Stock"
                name="stock"
                type="number"
                register={register}
                errors={errors}
                validation={{ required: "El stock es obligatorio (si no usas variantes)" }}
              />
            )}

            <SatFields register={register} setValue={setValue} watch={watch} />

            <ProductField label="Descuento (%)" name="discount" type="number" register={register} errors={errors} />

            {Number(discount) > 0 && (
              <ProductField label="Fin de la Oferta" name="offerEnd" type="datetime-local" register={register} errors={errors} />
            )}
          </div>

          {/* ✅ Variantes libres */}
          {/* <VariantsEditor control={control} register={register} watch={watch} setValue={setValue} /> */}

          {/* Sitio Web */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">🌐 Sitio Web</h4>
            </div>
          </div>

          <div className="row">
            <ProductField label="Calificación (0-5)" name="rating" type="number" register={register} errors={errors} />

            <div className="col-md-4 mb-3">
              <label className="form-label" htmlFor="new-switch">
                ¿Es nuevo?
              </label>
              <div>
                <Switch
                  id="new-switch"
                  checked={watch("new")}
                  onChange={() => setValue("new", !watch("new"))}
                  {...register("new")}
                  color="primary"
                  sx={{ transform: "scale(1.5)" }}
                />
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label" htmlFor="visible-switch">
                ¿Visible en tu página?
              </label>
              <div>
                <Switch
                  id="visible-switch"
                  checked={watch("visible")}
                  onChange={() => setValue("visible", !watch("visible"))}
                  color="success"
                  sx={{ transform: "scale(1.5)" }}
                />
              </div>
            </div>
          </div>

          {/* Descripciones */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">📑 Descripciones</h4>
            </div>
          </div>

          <div className="row">
            <TextAreaField
              label="Descripción Corta"
              name="shortDescription"
              register={register}
              validation={{ required: "La descripción corta es obligatoria" }}
              errors={errors}
            />
            <TextAreaField
              label="Descripción Larga"
              name="fullDescription"
              register={register}
              validation={{ required: "La descripción larga es obligatoria" }}
              errors={errors}
            />
          </div>

          {/* Imágenes */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">🖼️ Imagenes del Producto</h4>
            </div>
          </div>

          {!id && (
            <div className="mb-3">
              <label className="form-label text-white">🖼 Imágenes del producto (hasta 6)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);

                  if (files.length > 6) {
                    alert("Solo se permiten hasta 6 imágenes.");
                    return;
                  }

                  const tooBig = files.find((f) => f.size > 2 * 1024 * 1024);
                  if (tooBig) {
                    alert(`La imagen ${tooBig.name} supera los 2MB permitidos.`);
                    return;
                  }

                  setImageFiles(files);
                }}
              />
            </div>
          )}

          {/* Categorías */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">✅ Categorías</h4>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Categoría</label>
              <CustomSelect name="category" control={control} options={categoriesOptions} />
            </div>
          </div>

          {/* Tags */}
          {/* <div className="row mt-3">
            <div className="col-md-6 mb-3">
              <label className="form-label">Etiquetas</label>
              <CustomSelect name="tags" control={control} options={[]} />
            </div>
          </div> */}

          <button type="submit" className="btn btn-success w-100 mt-4">
            {id ? "✏️ Actualizar Producto" : "✅ Guardar Producto"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
