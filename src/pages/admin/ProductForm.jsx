// src/pages/admin/ProductForm.jsx
import React from "react";
import { useForm } from "react-hook-form";
import "bootstrap/dist/css/bootstrap.min.css";

import useLimiteProductos from "../../hooks/useLimiteProductos";
import useProductFormLogic from "../../hooks/useProductFormLogic";

import AccordionSection from "../../components/admin/productForm/AccordionSection";

// sections
import ProductInfoSection from "../../components/admin/productForm/sections/ProductInfoSection";
import InventoryDiscountSection from "../../components/admin/productForm/sections/InventoryDiscountSection";
import WebSection from "../../components/admin/productForm/sections/WebSection";
import DescriptionsSection from "../../components/admin/productForm/sections/DescriptionsSection";
import ImagesSection from "../../components/admin/productForm/sections/ImagesSection";
import CategoriesSection from "../../components/admin/productForm/sections/CategoriesSection";
import VariantsSection from "../../components/admin/productForm/sections/VariantsSection";
import LocationsProductSection from "../../components/admin/productForm/sections/LocationsProductSection";

import { useAuth } from "../../context/AuthContext";

export default function ProductForm() {
  const { permissions } = useAuth();

  const canEditPurchaseCost = Boolean(permissions?.can_edit_purchase_cost);

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
      unidad_medida: null,
      unidad_medida_id: "",
      unidad_medida_texto: "",
      costo_compra: "",
      clave_producto_servicio: "",
      clave_unidad: "",

      // IVA/base
      iva: "",
      base_price: "",

      // Variantes libres
      variants: [],

      // ✅ Multi-almacén (WAREHOUSES)
      use_warehouse_inventory: false,
      warehouse_inventories: [],

      // FUTURO
      options: [],
      units: [],
    },
  });

  const { puedeCrear, cargando, limitePermitido } = useLimiteProductos();

  const { ui, actions } = useProductFormLogic({
    reset,
    watch,
    setValue,
  });

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
          {ui.id ? "✏️ Editar Producto" : "📝 Crear Producto"}
        </h2>

        <div className="accordion mt-4" id="productFormAccordion">
          <form onSubmit={handleSubmit(actions.onSubmit)}>
            {/* 1) Información del producto */}
            <AccordionSection title="🛒 Información del Producto" defaultOpen>
              <ProductInfoSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                basePriceStr={ui.basePriceStr}
                onRecalculateBase={actions.handleRecalculateBase}
                isEdit={!!ui.id}
                canEditPurchaseCost={canEditPurchaseCost}
              />
            </AccordionSection>

            {/* 2) Inventario y Descuento */}
            <AccordionSection title="📦 Inventario y Descuento">
              <InventoryDiscountSection
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                hasVariants={ui.hasVariants}
                isEdit={!!ui.id}
              />
            </AccordionSection>

            {/* 3) Variantes */}
            <AccordionSection title="🧩 Variantes">
              <VariantsSection
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                warehouses={ui.warehouses} // ✅ ahora warehouses
              />
            </AccordionSection>

            {/* 4) Multi-almacenes (WAREHOUSES) */}
            <AccordionSection title="🏬 Multi-almacenes (Almacenes)">
              <LocationsProductSection
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                warehouses={ui.warehouses} // ✅ ahora warehouses
              />
            </AccordionSection>

            {/* 5) Sitio web */}
            <AccordionSection title="🌐 Sitio Web">
              <WebSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            </AccordionSection>

            {/* 6) Descripciones */}
            <AccordionSection title="📑 Descripciones">
              <DescriptionsSection register={register} errors={errors} />
            </AccordionSection>

            {/* 7) Imágenes */}
            <AccordionSection title="🖼️ Imágenes del Producto">
              <ImagesSection
                id={ui.id}
                imageFiles={ui.imageFiles}
                setImageFiles={actions.setImageFiles}
              />
            </AccordionSection>

            {/* 8) Categorías */}
            <AccordionSection title="✅ Categorías">
              <CategoriesSection
                control={control}
                categoriesOptions={ui.categoriesOptions}
              />
            </AccordionSection>

            <button type="submit" className="btn btn-success w-100 mt-3">
              {ui.id ? "✏️ Actualizar Producto" : "✅ Guardar Producto"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
