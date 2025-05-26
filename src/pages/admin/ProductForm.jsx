import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import "bootstrap/dist/css/bootstrap.min.css";
import VariationItem from "../../components/admin/VariationItem";
import CustomSelect from "../../components/admin/CustomSelect";
import ProductField from "../../components/admin/ProductField";
import TextAreaField from "../../components/admin/TextAreaField";
import { FormControlLabel, Switch } from "@mui/material";

function ProductForm() {
  const { id } = useParams();

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
    },
  });

  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const discount = watch("discount");
  const hasVariations = watch("variations").length > 0;

  const price = parseFloat(watch("price")) || 0;
  const iva = watch("iva") !== "null" ? parseFloat(watch("iva")) || 0 : 0;
  const basePrice = (price / (1 + iva)).toFixed(2);

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
  const [activeVariationIndex, setActiveVariationIndex] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    const initializeForm = async () => {
      await fetchOptions(); // ⏳ Primero cargamos las opciones

      if (id) {
        await fetchProduct(id); // 🧠 Luego cargamos los datos si estamos en modo edición
      }
    };

    initializeForm();
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        axiosClient.get("/admin/categories"), // 🔐 solo categorías del usuario
        // axios.get("https://mitiendaenlineamx.com.mx/api/etiquetas"),
      ]);

      setCategoriesOptions(catRes.data.map((c) => ({ value: c.id, label: c.name })));
      // setTagsOptions(tagRes.data.map((t) => ({ value: t.id, label: t.name })));
    } catch (error) {
      console.error("Error cargando categorías o etiquetas:", error);
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
        offerEnd = date.toISOString().slice(0, 16); // formato: "YYYY-MM-DDTHH:MM"
      }

      reset({
        sku: product.sku || "",
        name: product.name || "",
        price:
          product.base_price && product.iva !== null
            ? (product.base_price * (1 + product.iva)).toFixed(2)
            : product.base_price?.toFixed(2) || "",
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
            sizes: v.size || [], // Renombramos correctamente para react-hook-form
          })) || [],
      });
    } catch (err) {
      console.error("Error al cargar producto para editar:", err);
      setError("No se pudo cargar el producto para edición.");
    }
  };

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
      formData.append("base_price", basePrice);

      formData.append("iva", data.iva === "null" ? "null" : data.iva);

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
        const variations = data.variations.map(({ color, sizes }) => ({
          color,
          image: "", // o podrías asignar una futura imagen
          size: sizes
            .filter((s) => s.name.trim() !== "")
            .map(({ name, stock }) => ({
              name,
              stock: Number(stock),
            })),
        }));
        formData.append("variation", JSON.stringify(variations));
      } else {
        formData.append("stock", data.stock?.toString() || "0");
      }

      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append("images[]", file);
        });
      }

      if (id) {
        formData.append("_method", "PUT"); // Laravel lo verá como PUT
        await axiosClient.post(`/admin/products/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setMessage("✅ Producto actualizado con éxito.");
      } else {
        await axiosClient.post("/cargar/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setMessage("✅ Producto creado con éxito.");
        reset();
        setImageFiles([]);
      }
    } catch (error) {
      console.error("❌ Error en la API:", error.response?.data || error);
      if (error.response?.data?.errors) {
        setError(`❌ Error en la API:\n${JSON.stringify(error.response.data.errors, null, 2)}`);
      } else {
        setError("Error de conexión con el servidor.");
      }
    }
    console.log("IVA ENVIADO:", data.iva);
  };

  return (
    <div className="container">
      <div className="card bg-dark text-light p-4 shadow-lg">
        <h2 className="text-center text-primary">
          {id ? "✏️ Editar Producto" : "📝 Crear Producto"}
        </h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Primera fila */}
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
              type="number"
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
                {...register("iva", { required: "La tasa de IVA es obligatoria" })}
              >
                <option value="">Selecciona una tasa</option>
                <option value="0.16">TASA 16%</option>
                <option value="0.08">TASA 8%</option>
                <option value="0">TASA 0%</option>
                <option value="null">EXENTO</option>
              </select>
              {errors.iva && <small className="text-danger">{errors.iva.message}</small>}
              <p className="text-info mt-2">
                Precio Base Calculado (SIN IVA): <strong>${basePrice} MXN</strong>
              </p>
            </div>
          </div>

          {/* Segunda fila */}
          <div className="row">
            {/* Mostrar stock solo si no hay variaciones */}
            {!hasVariations && (
              <ProductField
                label="Stock"
                name="stock"
                type="number"
                register={register}
                errors={errors}
              />
            )}

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

          {/* Tercera fila */}
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
                  color="success"
                  sx={{ transform: "scale(1.5)" }}
                />
              </div>
            </div>
          </div>

          {/* Descripciones */}
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

          {/* Categoría y Etiquetas */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Categoría</label>
              <CustomSelect name="category" control={control} options={categoriesOptions} />
            </div>

            {/* <div className="col-md-6 mb-3">
              <label className="form-label">Tags</label>
              <CustomSelect name="tags" control={control} options={tagsOptions} />
            </div> */}
          </div>

          {/* Variaciones */}
          <h4 className="mt-4 text-white">Variaciones (opcional)</h4>
          {variationFields.map((variation, vIndex) => (
            <VariationItem
              key={variation.id}
              control={control}
              register={register}
              variation={variation}
              vIndex={vIndex}
              removeVariation={removeVariation}
              isActive={activeVariationIndex === vIndex}
              setActiveVariationIndex={setActiveVariationIndex}
            />
          ))}

          <button
            type="button"
            className="btn btn-primary w-100 mt-3"
            onClick={() =>
              appendVariation({
                color: "",
                image: null,
                sizes: [{ name: "", stock: "" }],
              })
            }
          >
            ➕ Agregar Variación
          </button>

          <button type="submit" className="btn btn-success w-100 mt-4">
            {id ? "✏️ Actualizar Producto" : "✅ Guardar Producto"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
