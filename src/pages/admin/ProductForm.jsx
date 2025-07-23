import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import useLimiteProductos from "../../hooks/useLimiteProductos";

// Componentes modulares
import FormularioBasico from "../../components/admin/producto/FormularioBasico";
import FormularioDescripciones from "../../components/admin/producto/FormularioDescripciones";
import FormularioImagenes from "../../components/admin/producto/FormularioImagenes";
import FormularioCategoriaEtiquetas from "../../components/admin/producto/FormularioCategoriaEtiquetas";
import FormularioVariaciones from "../../components/admin/producto/FormularioVariaciones";
import FormularioBotones from "../../components/admin/producto/FormularioBotones";

// Alertas
import { showSuccess, showError } from "../../utils/alerts";

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
      visible: true,
      iva: "", // ✅ inicia vacío
    },
  });

  const {
    fields: variationFields,
    append: appendVariation,
    remove: removeVariation,
  } = useFieldArray({ control, name: "variations" });

  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [activeVariationIndex, setActiveVariationIndex] = useState(null);

  const discount = watch("discount");
  const price = parseFloat(watch("price")) || 0;
  const ivaValor = watch("iva");
  const iva = ivaValor === "null" || ivaValor === "" ? 0 : parseFloat(ivaValor) || 0;
  const basePrice = (price / (1 + iva)).toFixed(2);
  const hasVariations = watch("variations").length > 0;

  const fetchOptions = async () => {
    try {
      const catRes = await axiosClient.get("/admin/categories");
      setCategoriesOptions(
        catRes.data.map((c) => ({ value: c.id, label: c.name }))
      );
    } catch (err) {
      showError("Error al cargar categorías.");
      console.error(err);
    }
  };

  const fetchProduct = async (productId) => {
    try {
      const res = await axiosClient.get(`/admin/products/${productId}`);
      const product = res.data;

      let offerEnd = "";
      if (product.offerEnd) {
        const date = new Date(product.offerEnd);
        offerEnd = date.toISOString().slice(0, 16);
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
        iva: product.iva !== null ? product.iva.toString() : "", // ✅ vacío si es null
        offerEnd,
        category: product.categories.map((c) => ({
          value: c.id,
          label: c.name,
        })),
        tags: product.tags.map((t) => ({
          value: t.id,
          label: t.name,
        })),
        variations:
          product.variation?.map((v) => ({
            ...v,
            sizes: v.size || [],
          })) || [],
        visible: Boolean(product.visible),
      });
    } catch (err) {
      showError("No se pudo cargar el producto para edición.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOptions();
    if (id) fetchProduct(id);
  }, [id]);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("sku", data.sku);
      formData.append("name", data.name);
      formData.append("price", data.price);
      formData.append("base_price", basePrice);
      formData.append("discount", data.discount === "" ? "0" : data.discount);
      formData.append("new", data.new ? "1" : "0");
      formData.append("saleCount", data.saleCount || "0");
      formData.append("rating", data.rating || "0");
      formData.append("shortDescription", data.shortDescription);
      formData.append("fullDescription", data.fullDescription);
      formData.append("iva", data.iva === "null" || data.iva === "" ? "" : data.iva);
      formData.append("visible", data.visible ? "1" : "0");

      if (data.offerEnd && Number(data.discount) > 0) {
        const offerFormatted = new Date(data.offerEnd)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        formData.append("offerEnd", offerFormatted);
      }

      if (data.category?.length) {
        data.category.forEach((cat) =>
          formData.append("category[]", cat.value)
        );
      }

      if (data.tags?.length) {
        data.tags.forEach((tag) => formData.append("tag[]", tag.value));
      }

      if (hasVariations) {
        const variations = data.variations.map(({ color, sizes }) => ({
          color,
          image: "",
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
        imageFiles.forEach((file) => formData.append("images[]", file));
      }

      if (id) {
        formData.append("_method", "PUT");
        await axiosClient.post(`/admin/products/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("✅ Producto actualizado con éxito.");
      } else {
        await axiosClient.post("/cargar/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("✅ Producto creado con éxito.");
        reset();
        setImageFiles([]);
      }
    } catch (err) {
      const errores = err?.response?.data?.errors;
      if (errores) {
        const mensaje = Object.values(errores).flat().join("\n");
        showError(`❌ Error:\n${mensaje}`);
      } else {
        showError("❌ Error al guardar el producto.");
      }
      console.error(err);
    }
  };

  const { puedeCrear, cargando, limitePermitido } = useLimiteProductos();

  if (cargando) return <p>Cargando...</p>;

  if (!puedeCrear) {
    return (
      <div className="alert alert-warning text-center mt-5">
        🚫 Has alcanzado el límite de <strong>{limitePermitido}</strong>{" "}
        productos para tu plan.
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card bg-dark text-light p-4 shadow-lg">
        <h2 className="text-center text-primary">
          {id ? "✏️ Editar Producto" : "📝 Crear Producto"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormularioBasico
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            discount={discount}
            basePrice={basePrice}
            hasVariations={hasVariations}
          />

          <FormularioDescripciones register={register} errors={errors} />

          {!id && <FormularioImagenes setImageFiles={setImageFiles} />}

          <FormularioCategoriaEtiquetas
            control={control}
            options={categoriesOptions}
          />

          <FormularioVariaciones
            control={control}
            register={register}
            variationFields={variationFields}
            appendVariation={appendVariation}
            removeVariation={removeVariation}
            activeVariationIndex={activeVariationIndex}
            setActiveVariationIndex={setActiveVariationIndex}
          />

          <FormularioBotones id={id} />
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
