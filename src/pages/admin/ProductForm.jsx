import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import "bootstrap/dist/css/bootstrap.min.css";
import VariationItem from "../../components/admin/VariationItem";
import CustomSelect from "../../components/admin/CustomSelect";
import ProductField from "../../components/admin/ProductField";
import TextAreaField from "../../components/admin/TextAreaField";

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
      offerEndDate: "",
      offerEndTime: "",
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

  // Verifica si hay variaciones agregadas
  const hasVariations = watch("variations").length > 0;

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

      setCategoriesOptions(
        catRes.data.map((c) => ({ value: c.id, label: c.name }))
      );
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

      let offerEndDate = "";
      let offerEndTime = "";

      if (product.offerEnd) {
        const [datePart, timePart] = product.offerEnd.split(" ");
        offerEndDate = datePart;
        offerEndTime = timePart?.slice(0, 5); // HH:MM
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
        offerEndDate,
        offerEndTime,
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

      offerEnd:
        data.offerEndDate && data.offerEndTime
          ? `${data.offerEndDate}T${data.offerEndTime}:00`
          : null,
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
      formattedData.stock = data.stock;
    }

    console.log("📝 Datos enviados:", JSON.stringify(formattedData, null, 2));

    try {
      const response = await axiosClient.post(
        "https://mitiendaenlineamx.com.mx/api/cargar/products",
        formattedData
      );

      setMessage("✅ Producto creado con éxito.");
      reset();
    } catch (error) {
      console.error("❌ Error en la API:", error.response?.data || error);

      if (error.response?.data?.errors) {
        setError(
          `❌ Error en la API:\n${JSON.stringify(
            error.response.data.errors,
            null,
            2
          )}`
        );
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
              label="Código (SKU)"
              name="sku"
              register={register}
              errors={errors}
            />
            <ProductField
              label="Nombre"
              name="name"
              register={register}
              validation={{ required: "El nombre es obligatorio" }}
              errors={errors}
            />
            <ProductField
              label="Precio"
              name="price"
              type="number"
              register={register}
              validation={{ required: "El precio es obligatorio" }}
              errors={errors}
            />
          </div>

          {/* Segunda fila */}
          {!hasVariations && (
            <div className="row">
              {/* Stock */}
              <ProductField
                label="Stock"
                name="stock"
                type="number"
                register={register}
                errors={errors}
              />

              {/* Descuento */}
              <ProductField
                label="Descuento (%)"
                name="discount"
                type="number"
                register={register}
                errors={errors}
              />

              <div className="col-md-4 mb-3 d-flex align-items-center">
                {/* Etiqueta "Nuevo" alineada correctamente */}
                <label
                  className="form-label me-3 mb-0"
                  style={{ minWidth: "80px", textAlign: "right" }}
                >
                  Nuevo
                </label>

                {/* Contenedor del switch con flexbox para alineación */}
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "10px" }}
                >
                  {/* Switch personalizado */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "60px",
                      height: "30px",
                      backgroundColor: watch("new") ? "#28a745" : "#6c757d",
                      border: "2px solid white",
                      borderRadius: "50px",
                      transition: "all 0.3s ease-in-out",
                      position: "relative",
                      cursor: "pointer",
                      padding: "3px",
                    }}
                    onClick={() => setValue("new", !watch("new"))} // ✅ Cambia el estado al hacer clic
                  >
                    {/* Botón deslizante */}
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        position: "absolute",
                        left: watch("new") ? "32px" : "2px",
                        transition: "all 0.3s ease-in-out",
                      }}
                    ></span>
                  </label>

                  {/* Checkbox oculto para manejar el estado */}
                  <input
                    type="checkbox"
                    {...register("new")}
                    style={{ display: "none" }}
                  />

                  {/* ✅ Texto alineado perfectamente con el switch */}
                  <label
                    className="form-check-label mb-0"
                    style={{
                      fontSize: "16px",
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ¿Es nuevo?
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tercera fila */}
          <div className="row">
            <ProductField
              label="Fin de la Oferta (Fecha)"
              name="offerEndDate"
              type="date"
              register={register}
              errors={errors}
            />
            <ProductField
              label="Fin de la Oferta (Hora)"
              name="offerEndTime"
              type="time"
              register={register}
              errors={errors}
            />
            <ProductField
              label="Calificación (0-5)"
              name="rating"
              type="number"
              register={register}
              errors={errors}
            />
          </div>

          {/* Descripciones */}
          <div className="row">
            <TextAreaField
              label="Descripción Corta"
              name="shortDescription"
              register={register}
              errors={errors}
            />
            <TextAreaField
              label="Descripción Larga"
              name="fullDescription"
              register={register}
              errors={errors}
            />
          </div>

          <div className="row">
            {/* Categoría */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Categoría</label>
              <CustomSelect
                name="category"
                control={control}
                options={categoriesOptions}
              />
            </div>

            {/* Etiquetas */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Tags</label>
              <CustomSelect
                name="tags"
                control={control}
                options={tagsOptions}
              />
            </div>
          </div>

          {/* Variaciones */}
          <h4 className="mt-4 text-white">Variaciones</h4>
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
