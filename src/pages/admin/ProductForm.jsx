import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import axios from "axios";
import Select from "react-select";
import "bootstrap/dist/css/bootstrap.min.css";
import VariationItem from "./VariationItem";

function ProductForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
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

  const categoriesOptions = [
    { value: "news", label: "News" },
    { value: "food", label: "Food" },
    { value: "story", label: "Story" },
  ];

  const tagsOptions = [
    { value: "tag1", label: "Tag1" },
    { value: "tag2", label: "Tag2" },
    { value: "tag3", label: "Tag3" },
  ];

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

  const onSubmit = async (data) => {
    setMessage("");
    setError("");

    const formattedData = {
      sku: data.sku,
      name: data.name,
      price: data.price,
      stock: data.stock,
      discount: data.discount,
      new: data.new,
      saleCount: data.saleCount,
      rating: data.rating,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      category: data.category?.map((c) => c.value) || [],
      tag: data.tags?.map((t) => t.value) || [], // Cambiamos 'tags' a 'tag'
      variation:
        data.variations?.map((variation) => ({
          color: variation.color,
          image: variation.image,
          size: variation.sizes
            .filter((size) => size.name.trim() !== "") // Eliminamos tamaños vacíos
            .map((size) => ({
              name: size.name,
              stock: Number(size.stock),
            })),
        })) || [],
      offerEnd:
        data.offerEndDate && data.offerEndTime
          ? `${data.offerEndDate}T${data.offerEndTime}:00`
          : null,
    };

    console.log("📝 Datos enviados:", JSON.stringify(formattedData, null, 2));

    // try {
    //   const headers = {
    //     "X-Store-Name": "Tienda1",
    //     Authorization: `Bearer ${localStorage.getItem("token")}`,
    //     "Content-Type": "application/json",
    //   };

    //   await axios.post("https://mitiendaenlineamx.com.mx/api/products", formattedData, { headers });

    //   setMessage("✅ Producto creado con éxito.");
    //   reset();
    // } catch (error) {
    //   console.error("❌ Error al guardar el producto:", error);
    //   setError("No se pudo crear el producto. Verifica la API.");
    // }
  };

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-light p-4 shadow-lg">
        <h2 className="text-center">📝 Crear Producto</h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Primera fila */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Código (SKU)</label>
              <input
                {...register("sku")}
                className="form-control bg-secondary text-light border-secondary"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Nombre</label>
              <input
                {...register("name", { required: "El nombre es obligatorio" })}
                className="form-control bg-secondary text-light border-secondary"
              />
              {errors.name && (
                <small className="text-danger">{errors.name.message}</small>
              )}
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Precio</label>
              <input
                type="number"
                {...register("price", { required: "El precio es obligatorio" })}
                className="form-control bg-secondary text-light border-secondary"
              />
              {errors.price && (
                <small className="text-danger">{errors.price.message}</small>
              )}
            </div>
          </div>

          {/* Segunda fila */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Stock</label>
              <input
                type="number"
                {...register("stock")}
                className="form-control bg-secondary text-light border-secondary"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Descuento (%)</label>
              <input
                type="number"
                {...register("discount")}
                className="form-control bg-secondary text-light border-secondary"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label d-block">Nuevo</label>
              <input
                type="checkbox"
                className="form-check-input"
                {...register("new")}
              />
              <label className="form-check-label">¿Es nuevo?</label>
            </div>
          </div>

          {/* Tercera fila */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Fin de la Oferta (Fecha)</label>
              <input
                type="date"
                {...register("offerEndDate")}
                className="form-control bg-secondary text-light border-secondary"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Fin de la Oferta (Hora)</label>
              <input
                type="time"
                {...register("offerEndTime")}
                className="form-control bg-secondary text-light border-secondary"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Calificación (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                {...register("rating")}
                className="form-control bg-secondary text-light border-secondary"
              />
            </div>
          </div>

          {/* Descripciones */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Descripción Corta</label>
              <textarea
                {...register("shortDescription")}
                className="form-control bg-secondary text-light border-secondary"
              ></textarea>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Descripción Larga</label>
              <textarea
                {...register("fullDescription")}
                className="form-control bg-secondary text-light border-secondary"
              ></textarea>
            </div>
          </div>

          <div className="row">
            {/* Categoría */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Categoría</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={categoriesOptions}
                    isMulti
                    onChange={(selected) => field.onChange(selected)}
                    value={field.value}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                )}
              />
            </div>

            {/* Etiquetas (Múltiple selección) */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Tags</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={tagsOptions}
                    isMulti
                    onChange={(selected) => field.onChange(selected)}
                    value={field.value}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                )}
              />
            </div>
          </div>

          {/* Variaciones */}
          <h4 className="mt-4">Variaciones</h4>
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
            ✅ Guardar Producto
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
