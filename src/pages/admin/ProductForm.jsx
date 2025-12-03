import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import "bootstrap/dist/css/bootstrap.min.css";
// import VariationItem from "../../components/admin/VariationItem";
import CustomSelect from "../../components/admin/CustomSelect";
import ProductField from "../../components/admin/ProductField";
import TextAreaField from "../../components/admin/TextAreaField";
import { Switch } from "@mui/material";
import useLimiteProductos from "../../hooks/useLimiteProductos";
import {
  buscarClavesProducto,
  buscarClavesUnidad,
  buscarUnidadesMedida,
} from "../../services/taecontaApi";
import { showSuccess, showError } from "../../utils/alerts";

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
      variations: [],
      visible: true,
      unidad_medida: "",
      costo_compra: "",
      clave_producto_servicio: "",
      clave_unidad: "",
      base_price: "",
    },
  });

  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const discount = watch("discount");
  const variations = watch("variations") || [];
  const hasVariations = variations.length > 0;

  // valores "crudos" del formulario
  const priceStr = watch("price") || "0";
  const ivaRaw = watch("iva");
  const basePriceStr = watch("base_price") || "0";

  // numéricos
  const price = parseFloat(priceStr) || 0;
  const iva =
    ivaRaw !== "null" && ivaRaw !== "" ? parseFloat(ivaRaw) || 0 : 0;
  const basePriceNum = parseFloat(basePriceStr) || 0;

  const {
    fields: variationFields,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({
    control,
    name: "variations",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [opcionesClaveProducto, setOpcionesClaveProducto] = useState([]);
  const [opcionesClaveUnidad, setOpcionesClaveUnidad] = useState([]);
  const [claveProdInput, setClaveProdInput] = useState("");
  const [claveUnidadInput, setClaveUnidadInput] = useState("");
  const [unidadMedidaInput, setUnidadMedidaInput] = useState("");
  const [opcionesUnidadMedida, setOpcionesUnidadMedida] = useState([]);

  // para controlar recálculos en edición
  const [productoCargado, setProductoCargado] = useState(false);
  const [ivaOriginal, setIvaOriginal] = useState(null);
  const [initialPrice, setInitialPrice] = useState(null);
  const [initialBasePrice, setInitialBasePrice] = useState(null);

  // ---------- INIT ----------

  useEffect(() => {
    const initializeForm = async () => {
      await fetchOptions();
      if (id) await fetchProduct(id);
    };

    initializeForm();
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [catRes] = await Promise.all([
        axiosClient.get("/admin/categories"),
      ]);

      setCategoriesOptions(
        catRes.data.map((c) => ({ value: c.id, label: c.name }))
      );
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
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
        product.price !== null && product.price !== undefined
          ? Number(product.price).toFixed(2)
          : "";

      const basePriceFromApi =
        product.base_price !== null && product.base_price !== undefined
          ? Number(product.base_price).toFixed(2)
          : "";

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
        category: product.categories.map((c) => ({
          value: c.id,
          label: c.name,
        })),
        tags: product.tags.map((t) => ({ value: t.id, label: t.name })),
        variations:
          product.variation?.map((v) => ({
            ...v,
            sizes: v.size || [],
          })) || [],
        visible: Boolean(product.visible),

        costo_compra: product.purchase_cost?.toString() || "",
        unidad_medida_id: product.unidad_medida_id || "",
        clave_producto_servicio: product.clave_producto_sat || "",
        clave_unidad: product.clave_unidad_sat || "",
        base_price: basePriceFromApi,
      });

      setProductoCargado(true);
      setIvaOriginal(product.iva !== null ? Number(product.iva) : null);
      setInitialPrice(product.price);
      setInitialBasePrice(product.base_price);

      setUnidadMedidaInput(product.unidad_medida_texto || "");
      setClaveProdInput(product.clave_producto_sat || "");
      setClaveUnidadInput(product.clave_unidad_sat || "");
    } catch (err) {
      console.error("Error al cargar producto para editar:", err);
      showError("No se pudo cargar el producto para edición.");
    }
  };

  // ---------- LÓGICA DE CÁLCULO ----------

  // CREAR: de precio final + IVA → base_price (solo cuando no es edición)
  useEffect(() => {
    if (!isEdit) {
      if (!isNaN(price) && !isNaN(iva)) {
        const nuevoBase = (price / (1 + (iva || 0))).toFixed(2);
        if (nuevoBase !== basePriceStr) {
          setValue("base_price", nuevoBase);
        }
      }
    }
  }, [price, iva, isEdit, basePriceStr, setValue]);

  // EDITAR: si el usuario CAMBIA el IVA, recalculamos el precio final usando base_price
  useEffect(() => {
    if (!isEdit) return;
    if (!productoCargado) return;
    if (ivaOriginal === null) return;

    // si el IVA sigue igual, no tocamos el precio
    if (iva === ivaOriginal) return;

    if (!isNaN(basePriceNum) && !isNaN(iva)) {
      const nuevoPrecio = (basePriceNum * (1 + iva)).toFixed(2);
      if (nuevoPrecio !== priceStr) {
        setValue("price", nuevoPrecio);
      }
    }
  }, [
    isEdit,
    productoCargado,
    ivaOriginal,
    iva,
    basePriceNum,
    priceStr,
    setValue,
  ]);

  // Botón manual para recalcular base_price a partir de price+IVA
  const handleRecalculateBase = () => {
    const currentPrice = parseFloat(watch("price") || "0");
    const ivaValue = watch("iva");
    const ivaNum =
      ivaValue === "null" || ivaValue === ""
        ? 0
        : parseFloat(ivaValue) || 0;

    const newBase = (currentPrice / (1 + (ivaNum || 0))).toFixed(2);
    setValue("base_price", newBase);
  };

  // ---------- SUBMIT ----------

  const onSubmit = async (data) => {
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("sku", data.sku);
      formData.append("name", data.name);
      formData.append("price", data.price?.toString() || "0");
      formData.append("discount", data.discount?.toString() || "0");
      formData.append("new", data.new ? "1" : "0");
      formData.append("saleCount", data.saleCount?.toString() || "0");
      formData.append("rating", data.rating?.toString() || "0");
      formData.append("shortDescription", data.shortDescription);
      formData.append("fullDescription", data.fullDescription);

      const ivaNumber =
        data.iva === "null" || data.iva === "" ? 0 : parseFloat(data.iva) || 0;
      const priceNumber = parseFloat(data.price || "0");

      let basePriceToSend;

      if (!id) {
        // CREAR: siempre calculamos base a partir del precio actual
        basePriceToSend = (priceNumber / (1 + ivaNumber)).toFixed(2);
      } else {
        // EDITAR: solo recalculamos si CAMBIÓ el price
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
          // si no cambió el precio, mandamos el base que venía de DB
          basePriceToSend =
            initialBasePrice !== null && initialBasePrice !== undefined
              ? Number(initialBasePrice).toFixed(2)
              : data.base_price || "0";
        }
      }

      formData.append("base_price", basePriceToSend);

      formData.append("unidad_medida_id", data.unidad_medida_id || "");
      formData.append(
        "clave_producto_sat",
        data.clave_producto_servicio || ""
      );
      formData.append("clave_unidad_sat", data.clave_unidad || "");
      formData.append("purchase_cost", data.costo_compra?.toString() || "0");

      if (data.iva === "null" || data.iva === "") {
        formData.append("iva", "");
      } else {
        formData.append("iva", data.iva);
      }

      formData.append("visible", data.visible ? "1" : "0");

      if (data.offerEnd && Number(data.discount) > 0) {
        const formattedOfferEnd = new Date(data.offerEnd)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        formData.append("offerEnd", formattedOfferEnd);
      }

      if (data.category?.length) {
        data.category.forEach((cat) => {
          formData.append("category[]", cat.value);
        });
      }

      if (data.tags?.length) {
        data.tags.forEach((tag) => formData.append("tag[]", tag.value));
      }

      if (hasVariations) {
        const variationsPayload = data.variations.map(({ color, sizes }) => ({
          color,
          image: "",
          size: sizes
            .filter((s) => s.name.trim() !== "")
            .map(({ name, stock }) => ({
              name,
              stock: Number(stock),
            })),
        }));
        formData.append("variation", JSON.stringify(variationsPayload));
      } else {
        formData.append("stock", data.stock?.toString() || "0");
      }

      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("images[]", file);
        });
      }

      if (id) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/admin/products/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        showSuccess("✅ Producto actualizado con éxito.");
        navigate("/admin/products");
      } else {
        await axiosClient.post("/cargar/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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
          `❌ Error en la API:\n${JSON.stringify(
            error.response.data.errors,
            null,
            2
          )}`
        );
      } else {
        showError("Error de conexión con el servidor.");
      }
    }
  };

  const { puedeCrear, cargando, limitePermitido } = useLimiteProductos();

  if (cargando)
    return <p className="text-center text-muted">Cargando datos...</p>;

  if (!puedeCrear) {
    return (
      <div className="alert alert-warning text-center mt-5">
        🚫 Has alcanzado el límite de <strong>{limitePermitido}</strong>{" "}
        productos para tu plan. <br />
        Elimina productos o mejora tu plan para seguir agregando más.
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card bg-dark text-light p-4 shadow-lg">
        <h2 className="text-center text-primary">
          {id ? "✏️ Editar Producto" : "📝 Crear Producto"}
        </h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Información del Producto */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                🛒 Información del Producto
              </h4>
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
                className={`form-control bg-secondary border-secondary ${
                  errors?.iva ? "is-invalid" : ""
                }`}
                {...register("iva", {
                  required: "La tasa de IVA es obligatoria",
                })}
              >
                <option value="">Selecciona una tasa</option>
                <option value="0.16">TASA 16%</option>
                <option value="0.08">TASA 8%</option>
                <option value="0">TASA 0%</option>
                <option value="null">EXENTO</option>
              </select>
              {errors.iva && (
                <small className="text-danger">{errors.iva.message}</small>
              )}

              {/* Campo oculto para enviar base_price */}
              <input type="hidden" {...register("base_price")} />

              <div className="d-flex align-items-center justify-content-between mt-2">
                <p className="text-info mb-0">
                  Precio Base (SIN IVA):{" "}
                  <strong>
                    ${Number(basePriceStr || 0).toFixed(2)} MXN
                  </strong>
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light ms-2"
                  onClick={handleRecalculateBase}
                >
                  Recalcular base
                </button>
              </div>
            </div>
            <ProductField
              label="Costo de Compra"
              name="costo_compra"
              type="text"
              register={register}
              errors={errors}
            />
          </div>

          {/* Inventario y Descuento */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                📦 Inventario y Descuento
              </h4>
            </div>
          </div>
          <div className="row">
            {!hasVariations && (
              <ProductField
                label="Stock"
                name="stock"
                type="number"
                register={register}
                errors={errors}
              />
            )}

            <div className="position-relative col-md-6 mb-3">
              <label className="form-label text-white">Unidad de Medida</label>

              <input
                type="text"
                className="form-control"
                placeholder="Buscar unidad (ej. cajas, piezas, kg...)"
                value={unidadMedidaInput}
                onChange={async (e) => {
                  const value = e.target.value;
                  setUnidadMedidaInput(value);
                  if (value.length >= 2) {
                    const resultados = await buscarUnidadesMedida(value);
                    setOpcionesUnidadMedida(resultados);
                  } else {
                    setOpcionesUnidadMedida([]);
                  }
                }}
              />

              <input type="hidden" {...register("unidad_medida_id")} />

              {opcionesUnidadMedida.length > 0 && (
                <div
                  className="position-absolute bg-white border rounded shadow"
                  style={{
                    zIndex: 10,
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {opcionesUnidadMedida.map((item) => (
                    <div
                      key={item.id}
                      className="px-2 py-1 text-dark hover-bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const valor = `${item.simbolo} - ${item.texto}`;
                        setUnidadMedidaInput(valor);
                        setValue("unidad_medida_id", item.id);
                        setOpcionesUnidadMedida([]);
                      }}
                    >
                      {item.simbolo} - {item.texto}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ProductField
              label="Descuento (%)"
              name="discount"
              type="number"
              register={register}
              errors={errors}
            />

            {Number(discount) > 0 && (
              <ProductField
                label="Fin de la Oferta"
                name="offerEnd"
                type="datetime-local"
                register={register}
                errors={errors}
              />
            )}
          </div>

          {/* Facturación */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                📄 Facturación
              </h4>
            </div>
          </div>
          <div className="row">
            <div className="position-relative col-md-6 mb-3">
              <label className="form-label text-white">
                Clave Producto/Servicio
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar clave SAT (ej. 10101502, perros...)"
                value={claveProdInput}
                onChange={async (e) => {
                  const value = e.target.value;
                  setClaveProdInput(value);
                  setValue("clave_producto_servicio", value);
                  if (value.length >= 2) {
                    const resultados = await buscarClavesProducto(value);
                    setOpcionesClaveProducto(resultados);
                  } else {
                    setOpcionesClaveProducto([]);
                  }
                }}
              />
              {opcionesClaveProducto.length > 0 && (
                <div
                  className="position-absolute bg-white border rounded shadow"
                  style={{
                    zIndex: 10,
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {opcionesClaveProducto.map((item) => (
                    <div
                      key={item.clave}
                      className="px-2 py-1 text-dark hover-bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const valor = `${item.clave} - ${item.descripcion}`;
                        setClaveProdInput(valor);
                        setValue("clave_producto_servicio", item.clave);
                        setOpcionesClaveProducto([]);
                      }}
                    >
                      {item.clave} - {item.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="position-relative col-md-6 mb-3">
              <label className="form-label text-white">Clave Unidad</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar unidad (ej. kilogramo, A41...)"
                value={claveUnidadInput}
                onChange={async (e) => {
                  const value = e.target.value;
                  setClaveUnidadInput(value);
                  setValue("clave_unidad", value);
                  if (value.length >= 2) {
                    const resultados = await buscarClavesUnidad(value);
                    setOpcionesClaveUnidad(resultados);
                  } else {
                    setOpcionesClaveUnidad([]);
                  }
                }}
              />
              {opcionesClaveUnidad.length > 0 && (
                <div
                  className="position-absolute bg-white border rounded shadow"
                  style={{
                    zIndex: 10,
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {opcionesClaveUnidad.map((item) => (
                    <div
                      key={item.clave}
                      className="px-2 py-1 text-dark hover-bg-light"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const valor = `${item.clave} - ${item.descripcion}`;
                        setClaveUnidadInput(valor);
                        setValue("clave_unidad", item.clave);
                        setOpcionesClaveUnidad([]);
                      }}
                    >
                      {item.clave} - {item.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sitio Web */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                🌐 Sitio Web
              </h4>
            </div>
          </div>

          <div className="row">
            <ProductField
              label="Calificación (0-5)"
              name="rating"
              type="number"
              register={register}
              errors={errors}
            />

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
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                📑 Descripciones
              </h4>
            </div>
          </div>
          <div className="row">
            <TextAreaField
              label="Descripción Corta"
              name="shortDescription"
              register={register}
              validation={{ required: "Las descripción corta es obligatoria" }}
              errors={errors}
            />
            <TextAreaField
              label="Descripción Larga"
              name="fullDescription"
              register={register}
              validation={{ required: "Las descripción larga es obligatoria" }}
              errors={errors}
            />
          </div>

          {/* Imágenes */}
          <div className="row mt-4">
            <div className="col-12">
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                🖼️ Imagenes del Producto
              </h4>
            </div>
          </div>

          {!id && (
            <div className="mb-3">
              <label className="form-label text-white">
                🖼 Imágenes del producto (hasta 6)
              </label>
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

                  const tooBig = files.find(
                    (f) => f.size > 2 * 1024 * 1024
                  );
                  if (tooBig) {
                    alert(
                      `La imagen ${tooBig.name} supera los 2MB permitidos.`
                    );
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
              <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
                ✅ Categorias
              </h4>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Categoría</label>
              <CustomSelect
                name="category"
                control={control}
                options={categoriesOptions}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100 mt-4">
            {id ? "✏️ Actualizar Producto" : "✅ Guardar Producto"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
