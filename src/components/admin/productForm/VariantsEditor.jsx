import React from "react";
import { useFieldArray } from "react-hook-form";

/**
 * UI de atributos dinámicos por variante
 * attributes: [{ name:"Color", value:"Rojo" }, ...]
 */
function AttributesEditor({ control, register, vIndex }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${vIndex}.attributes`,
  });

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-info fw-bold">Atributos (dinámicos)</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          onClick={() => append({ name: "", value: "" })}
        >
          + Agregar atributo
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-muted mt-2 mb-0">
          Sin atributos. Ej: Color=Rojo, Tamaño=CH, Sabor=Piña…
        </p>
      )}

      {fields.map((f, aIndex) => (
        <div className="row mt-2" key={f.id}>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Nombre atributo (ej. Color)"
              {...register(`variants.${vIndex}.attributes.${aIndex}.name`)}
            />
          </div>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Valor (ej. Rojo)"
              {...register(`variants.${vIndex}.attributes.${aIndex}.value`)}
            />
          </div>
          <div className="col-md-2 d-flex align-items-center">
            <button
              type="button"
              className="btn btn-sm btn-danger w-100"
              onClick={() => remove(aIndex)}
            >
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VariantsEditor({ control, register, watch, setValue }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const variants = watch("variants") || [];

  const addVariant = () => {
    append({
      sku: "",
      name: "",
      price: "",
      purchase_cost: "",
      stock: 0,
      // 👇 aquí guardaremos:
      // - File (cuando subes uno)
      // - string (cuando vienes de API en edición)
      image: null,
      is_active: "true",
      attributes: [{ name: "", value: "" }],
    });
  };

  const sumStock = () => {
    const total = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    setValue("stock", String(total));
  };

  return (
    <div className="row mt-4">
      <div className="col-12">
        <h4 className="text-white fs-4 fw-bold border-bottom pb-2 mb-3">
          🧩 Variantes (libres)
        </h4>

        <div className="d-flex gap-2 flex-wrap mb-3">
          <button
            type="button"
            className="btn btn-outline-info"
            onClick={addVariant}
          >
            + Agregar variante
          </button>

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={sumStock}
          >
            Sumar stock a producto
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-muted">
            Si no agregas variantes, se usa el campo Stock normal del producto.
          </p>
        )}

        {fields.map((v, index) => {
          const currentImage = variants?.[index]?.image;

          // preview: si es File => URL.createObjectURL, si es string => úsalo directo
          const previewUrl =
            currentImage instanceof File
              ? URL.createObjectURL(currentImage)
              : typeof currentImage === "string" && currentImage.trim() !== ""
              ? currentImage
              : null;

          return (
            <div key={v.id} className="border rounded p-3 mb-3 bg-secondary">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="text-white mb-0">Variante #{index + 1}</h6>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => remove(index)}
                >
                  Eliminar
                </button>
              </div>

              <div className="row mt-3">
                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Nombre</label>
                  <input
                    className="form-control"
                    placeholder='Ej. "Rojo / 30ml" o "Combo 2x1"'
                    {...register(`variants.${index}.name`)}
                  />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">
                    SKU (opcional)
                  </label>
                  <input
                    className="form-control"
                    placeholder="SKU de la variante"
                    {...register(`variants.${index}.sku`)}
                  />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Stock</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="0"
                    {...register(`variants.${index}.stock`)}
                  />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">
                    Precio (opcional)
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Si vacío -> usa products.price"
                    {...register(`variants.${index}.price`)}
                  />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">
                    Costo compra (opcional)
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="purchase_cost"
                    {...register(`variants.${index}.purchase_cost`)}
                  />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Activo</label>
                  <select
                    className="form-control"
                    {...register(`variants.${index}.is_active`)}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* ✅ IMAGEN POR VARIANTE */}
                <div className="col-md-6 mb-2">
                  <label className="form-label text-white mb-1">
                    Imagen variante (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setValue(`variants.${index}.image`, file);
                    }}
                  />
                  <small className="text-light">
                    Si no subes nada, se mantiene la imagen actual (en edición)
                    o queda vacía.
                  </small>
                </div>

                {previewUrl && (
                  <div className="col-md-6 mb-2">
                    <label className="form-label text-white mb-1">Preview</label>
                    <div className="p-2 bg-dark rounded">
                      <img
                        src={previewUrl}
                        alt="preview"
                        style={{ width: "100%", maxHeight: 180, objectFit: "contain" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <AttributesEditor control={control} register={register} vIndex={index} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
