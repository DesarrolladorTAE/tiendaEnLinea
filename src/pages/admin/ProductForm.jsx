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
        axios.get("https://mitiendaenlineamx.com.mx/api/categorias"),
        axios.get("https://mitiendaenlineamx.com.mx/api/etiquetas"),
      ]);

      setCategoriesOptions(catRes.data.map((c) => ({ value: c.id, label: c.name })));
      setTagsOptions(tagRes.data.map((t) => ({ value: t.id, label: t.name })));
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
        price: product.price?.toString() || "",
        stock: product.stock?.toString() || "",
        discount: product.discount?.toString() || "",
        new: Boolean(product.new),
        saleCount: product.saleCount?.toString() || "",
        rating: product.rating?.toString() || "",
        shortDescription: product.shortDescription || "",
        fullDescription: product.fullDescription || "",
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

    const formattedData = {
      sku: data.sku,
      name: data.name,
      price: Number(data.price), // Convertir a número
      discount: data.discount ? Number(data.discount) : 0, // Si está vacío, poner 0
      new: Boolean(data.new),
      saleCount: data.saleCount ? Number(data.saleCount) : 0,
      rating: data.rating ? Number(data.rating) : 0,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      image: "/assets/img/product/fashion/8.jpg",

      // Convertir las categorías y etiquetas a números
      category: data.category?.map((c) => Number(c.value)) || [],
      tag: data.tags?.map((t) => Number(t.value)) || [],

      offerEnd: Number(data.discount) > 0 && data.offerEnd ? data.offerEnd : null,
    };

    if (hasVariations) {
      formattedData.variation = data.variations.map(({ color, sizes }) => ({
        color,
        image: "/assets/img/product/fashion/8.jpg",
        size: sizes
          .filter((size) => size.name.trim() !== "")
          .map(({ name, stock }) => ({ name, stock: Number(stock) })),
      }));
    } else {
      formattedData.stock = Number(data.stock);
    }

    console.log("📝 Datos enviados:", JSON.stringify(formattedData, null, 2));

    try {
      let response;

      if (id) {
        // Modo edición
        response = await axiosClient.put(
          `https://mitiendaenlineamx.com.mx/api/admin/products/${id}`,
          formattedData
        );
        setMessage("✏️ Producto actualizado con éxito.");
      } else {
        // Modo creación
        response = await axiosClient.post(
          "https://mitiendaenlineamx.com.mx/api/cargar/products",
          formattedData
        );
        setMessage("✅ Producto creado con éxito.");
        reset(); // Solo limpiamos si es nuevo
      }
    } catch (error) {
      console.error("❌ Error en la API:", error.response?.data || error);

      if (error.response?.data?.errors) {
        setError(`❌ Error en la API:\n${JSON.stringify(error.response.data.errors, null, 2)}`);
      } else {
        setError("Error de conexión con el servidor.");
      }
    }
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
              label="Precio (IVA incluido)"
              name="price"
              type="number"
              register={register}
              validation={{ required: "El precio es obligatorio" }}
              errors={errors}
            />
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

          {/* Categoría y Etiquetas */}
          {/* <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Categoría</label>
              <CustomSelect name="category" control={control} options={categoriesOptions} />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Tags</label>
              <CustomSelect name="tags" control={control} options={tagsOptions} />
            </div>
          </div> */}

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
