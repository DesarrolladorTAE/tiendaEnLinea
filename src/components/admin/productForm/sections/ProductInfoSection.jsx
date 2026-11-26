// src/components/admin/productForm/sections/ProductInfoSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import ProductField from "../../../admin/ProductField";
import ProfitFactorControl from "../ProfitFactorControl";
import { inventoryFlag } from "../../../../utils/productInventory";

export default function ProductInfoSection({
  register,
  watch,
  setValue,
  errors,
  basePriceStr,
  onRecalculateBase,
  isEdit = false,
}) {
  const hasWarehouses = inventoryFlag(watch("use_warehouse_inventory"));
  const oeEnabled = watch("oe_enabled");
  const sku = watch("sku");
  return (
    <div className="row">
      <ProductField
        label="SKU"
        name="sku"
        register={register}
        errors={errors}
        validation={{ required: "El SKU es obligatorio." }}
      >
        <div className="border border-secondary rounded px-2 py-1 mt-2 small">
          <label className="form-check mb-0 d-flex align-items-center gap-2">
            <input
              type="checkbox"
              className="form-check-input mt-0"
              {...register("oe_enabled", {
                onChange: (event) => {
                  if (!event.target.checked) {
                    setValue("oe_number", "", { shouldDirty: true, shouldValidate: true });
                  }
                },
              })}
            />
            <span className="form-check-label">Número OE (opcional)</span>
          </label>
          {oeEnabled && (
            <div className="mt-2">
              <input
                type="text"
                aria-label="Número OE"
                aria-invalid={!!errors?.oe_number}
                aria-describedby={errors?.oe_number ? "oe-number-error" : undefined}
                className={`form-control form-control-sm bg-secondary text-light border-secondary${errors?.oe_number ? " is-invalid" : ""}`}
                maxLength={255}
                {...register("oe_number", {
                  maxLength: { value: 255, message: "El número OE admite hasta 255 caracteres." },
                })}
              />
              {errors?.oe_number && (
                <small id="oe-number-error" className="text-danger d-block">{errors.oe_number.message}</small>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-light mt-2"
                disabled={!sku?.trim() || sku.length > 255}
                onClick={() => setValue("oe_number", sku, { shouldDirty: true, shouldValidate: true })}
              >
                Usar el mismo SKU
              </button>
            </div>
          )}
        </div>
      </ProductField>

      <ProductField
        label="Nombre"
        name="name"
        register={register}
        validation={{ required: "El nombre es obligatorio" }}
        errors={errors}
      />

      <ProductField
        label={hasWarehouses ? "Precio general de respaldo (incluye IVA)" : watch("price_mode") === "factor" ? "Precio final calculado (incluye IVA)" : "Precio Final (incluye IVA)"}
        name="price"
        readOnly={watch("price_mode") === "factor"}
        helperText={hasWarehouses ? "Precio general del producto; cada almacén puede tener el suyo. El factor también recalcula este precio." : watch("price_mode") === "factor" ? "Calculado por factor. Desmarca la casilla para editarlo." : undefined}
        type="text"
        register={register}
        validation={{ required: watch("price_mode") === "factor" ? false : "El precio es obligatorio" }}
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
            onChange: () => { if (watch("price_mode") === "factor") setValue("factor_preview_enabled", true); },
          })}
        >
          <option value="">Selecciona una tasa</option>
          <option value="0.16">TASA 16%</option>
          <option value="0.08">TASA 8%</option>
          <option value="0">TASA 0%</option>
          <option value="null">EXENTO</option>
        </select>

        {errors?.iva && (
          <small className="text-danger">{errors.iva.message}</small>
        )}

        <input type="hidden" {...register("base_price")} />

        <div className="d-flex align-items-center justify-content-between mt-2">
          <p className="text-info mb-0">
            Precio Base (SIN IVA):{" "}
            <strong>${Number(basePriceStr || 0).toFixed(6)} MXN</strong>
          </p>

          <button
            type="button"
            className="btn btn-sm btn-outline-light ms-2"
            onClick={onRecalculateBase}
          >
            Recalcular base
          </button>
        </div>
      </div>

      <div className="col-md-4 mb-3">
        <label className="form-label" htmlFor="product-purchase-cost">{hasWarehouses ? "Costo general de respaldo" : "Costo de Compra"}</label>

        <input
          id="product-purchase-cost"
          type="text"
          className="form-control bg-secondary border-secondary text-light"
          placeholder={isEdit ? "Costo de compra (opcional)" : "Costo de compra"}
          aria-describedby={isEdit ? "product-purchase-cost-help" : undefined}
          {...register("costo_compra")}
        />

        {hasWarehouses && <small className="text-info d-block mt-1">El costo general es necesario para aplicar el factor y se usa como respaldo cuando un almacén no tiene costo propio.</small>}

        {isEdit && (
          <small id="product-purchase-cost-help" className="text-warning d-block mt-1">
            Si recibiste mercancía con un costo nuevo, te recomendamos registrarlo desde{" "}
            <Link to="/admin/compra" className="text-info fw-bold">Entradas de producto</Link>
            {" "}para mantener el historial de costos.
          </small>
        )}
      </div>
      <ProfitFactorControl watch={watch} setValue={setValue} />
    </div>
  );
}
