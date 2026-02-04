// src/components/admin/productForm/VariantsEditor.jsx
import React, { useMemo, useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";

function HelpOverlay({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        background: "rgba(0,0,0,0.65)",
        zIndex: 2000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="bg-dark text-light shadow-lg"
        style={{
          maxWidth: 720,
          margin: "0 auto",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          maxHeight: "85vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="d-flex align-items-center justify-content-between p-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: 18 }}>📘</span>
            <strong>Cómo funcionan las variantes</strong>
          </div>

          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="p-3">
          <p className="mb-2 text-white">
            Usa <strong>Variantes</strong> cuando un mismo producto se vende en diferentes versiones.
            Por ejemplo: colores, tamaños, combos, sabores, presentaciones, etc.
          </p>

          <div className="mb-3">
            <strong>1) Stock de la variante</strong>
            <p className="mb-0 text-white">
              Cada variante tiene su propio stock total. Ese stock es el que se reparte (si aplica)
              entre los almacenes.
            </p>
          </div>

          <div className="mb-3">
            <strong>2) Inventario por almacén</strong>
            <p className="mb-0 text-white">
              Si activaste “inventario por almacén”, entonces para cada variante puedes repartir su stock
              entre los almacenes seleccionados. Así sabes cuánta existencia hay en cada lugar.
            </p>
          </div>

          <div className="mb-3">
            <strong>3) Mínimo / Máximo / Reorden</strong>
            <p className="mb-0 text-white">
              Sirven para alertas y control interno:
              <br />• <strong>Mínimo</strong>: cuando el stock baja de aquí, ya es “poco”.
              <br />• <strong>Máximo</strong>: referencia para no sobre-stockear.
              <br />• <strong>Reorden</strong>: punto sugerido para volver a surtir.
            </p>
          </div>

          <div className="mb-3">
            <strong>4) Ubicación (bin)</strong>
            <p className="mb-0 text-white">
              Es una nota para encontrar el producto dentro del almacén (pasillo, rack, caja, etc.).
            </p>
          </div>

          <div className="alert alert-info mb-0" style={{ borderRadius: 10 }}>
            Tip: Si ya seleccionaste almacenes en “Multi-almacén”, usa el botón{" "}
            <strong>“Crear filas con almacenes seleccionados”</strong> para que se generen las filas solas.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Atributos dinámicos: [{name,value}]
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
            <button type="button" className="btn btn-sm btn-danger w-100" onClick={() => remove(aIndex)}>
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inventario por almacén para una variante (tabla real warehouse_variant_stocks)
 * Campos: stock, min_stock, max_stock, reorder_point, location_bin
 */
function VariantWarehousesEditor({ control, register, watch, setValue, vIndex, warehouses = [] }) {
  const useWarehouses = watch("use_warehouse_inventory");

  const warehouseInventories = useWatch({ control, name: "warehouse_inventories" }) || [];
  const selectedIds = useMemo(() => {
    return (warehouseInventories || [])
      .map((r) => String(r?.warehouse_id ?? "").trim())
      .filter(Boolean);
  }, [warehouseInventories]);

  const variantStockRaw = useWatch({ control, name: `variants.${vIndex}.stock` });
  const variantStock = Number(variantStockRaw || 0);

  const { fields, replace, remove } = useFieldArray({
    control,
    name: `variants.${vIndex}.warehouse_stocks`,
  });

  const rows = useWatch({ control, name: `variants.${vIndex}.warehouse_stocks` }) || [];

  const sumStock = useMemo(() => {
    return (rows || []).reduce((acc, r) => acc + (Number(r?.stock) || 0), 0);
  }, [rows]);

  const ensureRowsFromSelectedWarehouses = () => {
    if (!useWarehouses) return;
    if (!selectedIds.length) return;

    const current = rows || [];
    const map = new Map(current.map((r) => [String(r?.warehouse_id), r]));

    const next = selectedIds.map((id) => {
      const prev = map.get(String(id));
      return (
        prev || {
          warehouse_id: id,
          stock: "",
          min_stock: "",
          max_stock: "",
          reorder_point: "",
          location_bin: "",
        }
      );
    });

    replace(next);
  };

  const distributeEvenly = () => {
    ensureRowsFromSelectedWarehouses();

    const current = (watch(`variants.${vIndex}.warehouse_stocks`) || []).slice();
    const n = current.length;
    if (!n) return;

    const total = Number(variantStock || 0);
    if (!Number.isFinite(total) || total < 0) return;

    const base = Math.floor(total / n);
    let rem = total - base * n;

    current.forEach((_, i) => {
      let q = base;
      if (rem > 0) {
        q += 1;
        rem -= 1;
      }
      setValue(`variants.${vIndex}.warehouse_stocks.${i}.stock`, q, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
  };

  const validation = useMemo(() => {
    if (!useWarehouses) {
      return { level: "info", msg: "Inventario por almacén desactivado: la variante usa stock global.", ok: true };
    }

    if (!selectedIds.length) {
      return {
        level: "warning",
        msg: "Inventario por almacén activo, pero no has seleccionado almacenes en la sección de Multi-almacén.",
        ok: false,
      };
    }

    if (!fields.length) {
      return {
        level: "warning",
        msg: "Aún no has asignado esta variante a almacenes. Usa “Crear filas con almacenes seleccionados”.",
        ok: false,
      };
    }

    const idsAll = (rows || []).map((r) => String(r?.warehouse_id ?? "").trim());
    const ids = idsAll.filter(Boolean);

    const missing = idsAll.some((x) => !x);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);

    if (missing) return { level: "error", msg: "Hay filas sin almacén seleccionado.", ok: false };

    if (dup) {
      const name = warehouses.find((w) => String(w.id) === String(dup))?.name || dup;
      return { level: "error", msg: `El almacén "${name}" está repetido.`, ok: false };
    }

    const invalidStock = (rows || []).some((r) => {
      const v = r?.stock;
      if (v === "" || v === null || v === undefined) return true;
      const n = Number(v);
      return !Number.isFinite(n) || n < 0;
    });

    if (invalidStock) return { level: "error", msg: "Hay stocks inválidos (deben ser números >= 0).", ok: false };

    if (!Number.isFinite(variantStock) || variantStock < 0) {
      return { level: "error", msg: "El stock global de la variante no es válido.", ok: false };
    }

    if (sumStock !== variantStock) {
      const diff = variantStock - sumStock;
      return {
        level: "warning",
        msg:
          `La suma por almacén (${sumStock}) NO coincide con el stock de la variante (${variantStock}). ` +
          (diff > 0 ? `Te faltan ${diff}.` : `Te sobran ${Math.abs(diff)}.`),
        ok: false,
      };
    }

    return { level: "success", msg: `Correcto: ${variantStock} = ${sumStock} (repartido por almacén).`, ok: true };
  }, [useWarehouses, selectedIds.length, fields.length, rows, sumStock, variantStock, warehouses]);

  const alertClass =
    validation.level === "success"
      ? "alert alert-success"
      : validation.level === "warning"
      ? "alert alert-warning"
      : validation.level === "error"
      ? "alert alert-danger"
      : "alert alert-info";

  if (!useWarehouses) return null;

  return (
    <div className="mt-3">
      <h6 className="text-white mb-2">🏬 Inventario por almacén (esta variante)</h6>

      <div className={alertClass} style={{ borderRadius: 10 }}>
        {validation.msg}
      </div>

      <div className="d-flex gap-2 flex-wrap mt-2 align-items-center">
        <button
          type="button"
          className="btn btn-outline-info btn-sm"
          onClick={ensureRowsFromSelectedWarehouses}
          disabled={!selectedIds.length}
          title="Crea/actualiza filas con los almacenes seleccionados"
        >
          Crear filas con almacenes seleccionados
        </button>

        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={distributeEvenly}
          disabled={!fields.length}
          title="Reparte el stock total entre almacenes"
        >
          Repartir en partes iguales
        </button>

        <div className="ms-auto text-light">
          <small className="text-muted">Total asignado:</small> <strong>{sumStock}</strong>{" "}
          <small className="text-muted">/ Stock variante:</small> <strong>{variantStock}</strong>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="mt-3">
          <p className="text-muted mb-0">No hay filas. Usa “Crear filas con almacenes seleccionados”.</p>
        </div>
      ) : (
        <div className="mt-3">
          {fields.map((f, i) => (
            <div
              key={f.id}
              className="border rounded p-3 mb-3"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <strong className="text-white">Almacén #{i + 1}</strong>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(i)}>
                  Quitar
                </button>
              </div>

              <div className="row mt-2">
                <div className="col-md-4 mb-2">
                  <label className="form-label text-white">Almacén</label>
                  <select
                    className="form-control"
                    {...register(`variants.${vIndex}.warehouse_stocks.${i}.warehouse_id`)}
                  >
                    <option value="">Selecciona...</option>
                    {selectedIds.map((id) => {
                      const w = (warehouses || []).find((x) => String(x.id) === String(id));
                      const label = w?.name || w?.nombre || `Almacén ${id}`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <small className="text-muted">(Lista basada en almacenes seleccionados)</small>
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label text-white">Stock</label>
                  <input
                    className="form-control"
                    type="number"
                    step="1"
                    placeholder="0"
                    {...register(`variants.${vIndex}.warehouse_stocks.${i}.stock`)}
                  />
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label text-white">Min</label>
                  <input
                    className="form-control"
                    type="number"
                    step="1"
                    placeholder="min"
                    {...register(`variants.${vIndex}.warehouse_stocks.${i}.min_stock`)}
                  />
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label text-white">Max</label>
                  <input
                    className="form-control"
                    type="number"
                    step="1"
                    placeholder="max"
                    {...register(`variants.${vIndex}.warehouse_stocks.${i}.max_stock`)}
                  />
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label text-white">Reorden</label>
                  <input
                    className="form-control"
                    type="number"
                    step="1"
                    placeholder="reorder"
                    {...register(`variants.${vIndex}.warehouse_stocks.${i}.reorder_point`)}
                  />
                </div>

                <div className="col-md-6 mb-2">
                  <label className="form-label text-white">Ubicación</label>
                  <input
                    className="form-control"
                    placeholder="Ej. Pasillo A / Rack 3"
                    {...register(`variants.${vIndex}.warehouse_stocks.${i}.location_bin`)}
                  />
                </div>
              </div>

              <small className="text-muted">
                Estos datos se guardan por almacén (control interno).
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VariantsEditor({ control, register, watch, setValue, warehouses = [] }) {
  const [helpOpen, setHelpOpen] = useState(false);

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const variants = useWatch({ control, name: "variants" }) || [];

  const addVariant = () => {
    append({
      sku: "",
      name: "",
      price: "",
      purchase_cost: "",
      stock: 0,
      image: null,
      is_active: "true",
      attributes: [{ name: "", value: "" }],
      warehouse_stocks: [],
    });
  };

  const sumStock = () => {
    const total = (variants || []).reduce((acc, v) => acc + (Number(v?.stock) || 0), 0);
    setValue("stock", String(total), { shouldDirty: true, shouldTouch: true });
  };

  return (
    <div className="row mt-4">
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />

      <div className="col-12">
        <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
          <h4 className="text-white fs-4 fw-bold mb-0">🧩 Variantes</h4>

          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => setHelpOpen(true)}
            title="Ayuda"
            style={{ borderRadius: 999 }}
          >
            ℹ️
          </button>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-3">
          <button type="button" className="btn btn-outline-info" onClick={addVariant}>
            + Agregar variante
          </button>

          <button type="button" className="btn btn-outline-light" onClick={sumStock}>
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
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(index)}>
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
                  <label className="form-label text-white mb-1">SKU (opcional)</label>
                  <input className="form-control" placeholder="SKU de la variante" {...register(`variants.${index}.sku`)} />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Stock (total variante)</label>
                  <input className="form-control" type="number" placeholder="0" {...register(`variants.${index}.stock`)} />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Precio (opcional)</label>
                  <input className="form-control" type="number" placeholder="Si vacío -> usa precio del producto" {...register(`variants.${index}.price`)} />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Costo compra (opcional)</label>
                  <input className="form-control" type="number" placeholder="purchase_cost" {...register(`variants.${index}.purchase_cost`)} />
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label text-white mb-1">Activo</label>
                  <select className="form-control" {...register(`variants.${index}.is_active`)}>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="col-md-6 mb-2">
                  <label className="form-label text-white mb-1">Imagen variante (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setValue(`variants.${index}.image`, file, { shouldDirty: true, shouldTouch: true });
                    }}
                  />
                  <small className="text-light">
                    Si no subes nada, se mantiene la imagen actual (en edición) o queda vacía.
                  </small>
                </div>

                {previewUrl && (
                  <div className="col-md-6 mb-2">
                    <label className="form-label text-white mb-1">Preview</label>
                    <div className="p-2 bg-dark rounded">
                      <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: 180, objectFit: "contain" }} />
                    </div>
                  </div>
                )}
              </div>

              <VariantWarehousesEditor
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                vIndex={index}
                warehouses={warehouses}
              />

              <AttributesEditor control={control} register={register} vIndex={index} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
