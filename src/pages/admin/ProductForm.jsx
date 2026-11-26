// src/pages/admin/ProductForm.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import "bootstrap/dist/css/bootstrap.min.css";

import VehicleCompatibilitySection from "../../components/vehicles/VehicleCompatibilitySection";
import useLimiteProductos from "../../hooks/useLimiteProductos";
import useProductFormLogic from "../../hooks/useProductFormLogic";
import { showError } from "../../utils/alerts";

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

const fieldGroup = (name) => name.split(/[.\[]/, 1)[0];

export default function ProductForm() {
  const [nativeErrorFields, setNativeErrorFields] = useState([]);
  const [saveErrorFields, setSaveErrorFields] = useState([]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      sku: "",
      oe_enabled: false,
      oe_number: "",
      name: "",
      price: "",
      price_mode: "manual",
      profit_factor: "",
      factor_preview_enabled: false,
      stock: "",
      batch_tracking_enabled: false,
      expiration_required: false,
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
      vehicle_compatibilities: [],

      // ✅ Multi-almacén (WAREHOUSES)
      use_warehouse_inventory: false,
      warehouse_inventories: [],

      // FUTURO
      options: [],
      units: [],
    },
  });

  const { puedeCrear, cargando, limitePermitido, errorLimite, actualizarLimite } = useLimiteProductos();

  const { ui, actions } = useProductFormLogic({
    reset,
    watch,
    setValue,
    dirtyFields,
    onFieldErrors: setSaveErrorFields,
  });

  const invalidFields = new Set([
    ...Object.keys(errors),
    ...nativeErrorFields.map(fieldGroup),
    ...saveErrorFields.map(fieldGroup),
  ]);
  const hasError = (...fields) => fields.some((field) => invalidFields.has(field));

  function showNativeValidationError(event) {
    event.preventDefault();
    const invalid = Array.from(event.currentTarget.elements).filter(
      (field) => field.willValidate && !field.validity.valid,
    );
    if (event.target === invalid[0]) {
      setNativeErrorFields(invalid.map((field) => field.name).filter(Boolean));
      const label = event.target.labels?.[0]?.textContent?.trim();
      const message = event.target.validationMessage;
      showError(label ? `${label}. ${message}` : message);
    }
  }

  function clearCorrectedIndicators(event) {
    const { name, validity } = event.target;
    if (!name) return;
    if (validity?.valid && nativeErrorFields.includes(name)) {
      setNativeErrorFields((fields) => fields.filter((field) => field !== name));
    }
    const group = fieldGroup(name);
    if (saveErrorFields.includes(name) || saveErrorFields.includes(group)) {
      setSaveErrorFields((fields) => fields.filter((field) => field !== name && field !== group));
    }
  }

  function submit(event) {
    setNativeErrorFields([]);
    setSaveErrorFields([]);
    return handleSubmit(actions.onSubmit, actions.onInvalid)(event);
  }

  if (!ui.id && cargando)
    return <p className="text-center text-muted">Cargando datos...</p>;

  if (!ui.id && errorLimite) {
    return <div className="alert alert-warning text-center mt-5">
      <p>{errorLimite}</p>
      <button className="btn btn-outline-dark" onClick={actualizarLimite}>Reintentar</button>
    </div>;
  }

  if (!ui.id && !puedeCrear) {
    return (
      <div className="alert alert-warning text-center mt-5">
        🚫 Has alcanzado el límite de <strong>{limitePermitido}</strong>{" "}
        productos en esta sucursal para tu plan. <br />
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
          <form onSubmit={submit} onInvalid={showNativeValidationError} onChange={clearCorrectedIndicators}>
            <fieldset disabled={isSubmitting} style={{ minWidth: 0 }}>
            {/* 1) Información del producto */}
            <AccordionSection title="🛒 Información del Producto" defaultOpen hasError={hasError("sku", "oe_number", "name", "price", "iva", "base_price", "costo_compra", "purchase_cost", "profit_factor")}>
              <ProductInfoSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                basePriceStr={ui.basePriceStr}
                onRecalculateBase={actions.handleRecalculateBase}
                isEdit={!!ui.id}
              />
            </AccordionSection>

            {/* 2) Inventario y Descuento */}
            <AccordionSection title="📦 Inventario y Descuento" hasError={hasError("stock", "discount", "offerEnd", "batch_tracking_enabled", "expiration_required", "unidad_medida_id", "unidad_medida_texto", "clave_producto_servicio", "clave_producto_sat", "clave_unidad", "clave_unidad_sat")}>
              <div className="mb-3">
                <label className="form-check">
                  <input type="checkbox" className="form-check-input" {...register("batch_tracking_enabled")} />
                  <span className="form-check-label">Controlar existencias por lote</span>
                </label>
                {watch("batch_tracking_enabled") && (
                  <>
                    <label className="form-check">
                      <input type="checkbox" className="form-check-input" {...register("expiration_required")} />
                      <span className="form-check-label">Exigir fecha exacta de caducidad en las entradas</span>
                    </label>
                    <p className="small mt-2 mb-0">
                      {ui.id ? "Si el producto ya tiene existencias, activa el control mediante Apertura conciliada en Administrar lotes."
                        : "El producto se crea con existencia cero. Registra el inventario desde Entradas de producto."}
                    </p>
                  </>
                )}
              </div>
              <InventoryDiscountSection
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                batchTrackingEnabled={ui.batchTrackingEnabled || watch("batch_tracking_enabled")}
                hasVariants={ui.hasVariants}
                isEdit={!!ui.id}
              />
            </AccordionSection>

            {/* 3) Variantes */}
            {!ui.batchTrackingEnabled && !(ui.id && watch("batch_tracking_enabled")) && <AccordionSection title="🧩 Variantes" hasError={hasError("variants")}>
              <VariantsSection
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                warehouses={ui.warehouses} // ✅ ahora warehouses
              />
            </AccordionSection>}

            {/* 4) Multi-almacenes (WAREHOUSES) */}
            {!ui.batchTrackingEnabled && !(ui.id && watch("batch_tracking_enabled")) && <AccordionSection title="🏬 Multi-almacenes (Almacenes)" hasError={hasError("warehouse_inventories", "use_warehouse_inventory")}>
              <LocationsProductSection
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                warehouses={ui.warehouses} // ✅ ahora warehouses
              />
            </AccordionSection>}

            <VehicleCompatibilitySection branchId={ui.branchId} watch={watch} setValue={setValue} isEdit={!!ui.id} hasError={hasError("vehicle_compatibilities")} />

            {/* 5) Sitio web */}
            <AccordionSection title="🌐 Sitio Web" hasError={hasError("rating", "new", "visible")}>
              <WebSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            </AccordionSection>

            {/* 6) Descripciones */}
            <AccordionSection title="📑 Descripciones" hasError={hasError("shortDescription", "fullDescription")}>
              <DescriptionsSection register={register} errors={errors} />
            </AccordionSection>

            {/* 7) Imágenes */}
            <AccordionSection title="🖼️ Imágenes del Producto" hasError={hasError("images")}>
              <ImagesSection
                id={ui.id}
                imageFiles={ui.imageFiles}
                setImageFiles={actions.setImageFiles}
              />
            </AccordionSection>

            {/* 8) Categorías */}
            <AccordionSection title="✅ Categorías" hasError={hasError("category", "categories")}>
              <CategoriesSection
                control={control}
                categoriesOptions={ui.categoriesOptions}
              />
            </AccordionSection>

            <button type="submit" className="btn btn-success w-100 mt-3">
              {isSubmitting ? "Guardando…" : ui.id ? "✏️ Actualizar Producto" : "✅ Guardar Producto"}
            </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
