// src/components/admin/productForm/VariantsEditor.jsx
import React, { useMemo } from "react";
import { useFieldArray, useWatch } from "react-hook-form";

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

/**
 * Sub-editor: Inventario por sucursal para una variante
 *
 * - Usa variants.{i}.location_stocks: [{pos_location_id, qty, price, purchase_cost}]
 * - Toma sucursales seleccionadas desde location_inventories (nivel producto).
 * - Estilo igual a LocationsProductSection (alertas, borders, botones)
 */
function VariantLocationsEditor({
  control,
  register,
  watch,
  setValue,
  vIndex,
  locations = [],
}) {
  const useLocations = watch("use_location_inventory");

  // ✅ re-render confiable (cuando cambian sucursales seleccionadas en sección Locations)
  const locationInventories =
    useWatch({ control, name: "location_inventories" }) || [];
  const selectedIds = useMemo(() => {
    return (locationInventories || [])
      .map((r) => String(r?.pos_location_id ?? "").trim())
      .filter(Boolean);
  }, [locationInventories]);

  // ✅ re-render confiable (cuando cambia stock de la variante)
  const variantStockRaw = useWatch({
    control,
    name: `variants.${vIndex}.stock`,
  });
  const variantStock = Number(variantStockRaw || 0);

  // fieldArray por variante
  const { fields, replace, remove } = useFieldArray({
    control,
    name: `variants.${vIndex}.location_stocks`,
  });

  // ✅ re-render confiable (cuando cambian qty/selección dentro de esta variante)
  const rows =
    useWatch({
      control,
      name: `variants.${vIndex}.location_stocks`,
    }) || [];

  const sumQty = useMemo(() => {
    return (rows || []).reduce((acc, r) => acc + (Number(r?.qty) || 0), 0);
  }, [rows]);

  const ensureRowsFromSelectedLocations = () => {
    if (!useLocations) return;
    if (!selectedIds.length) return;

    const current = rows || [];
    const map = new Map(current.map((r) => [String(r?.pos_location_id), r]));

    const next = selectedIds.map((id) => {
      const prev = map.get(String(id));
      return (
        prev || {
          pos_location_id: id,
          qty: "",
          price: "",
          purchase_cost: "",
        }
      );
    });

    replace(next);
  };

  const distributeEvenly = () => {
    ensureRowsFromSelectedLocations();

    const current = (watch(`variants.${vIndex}.location_stocks`) || []).slice();
    const n = current.length;
    if (!n) return;

    const total = Number(variantStock || 0);
    if (!Number.isFinite(total) || total < 0) return;

    // reparto enteros
    const base = Math.floor(total / n);
    let rem = total - base * n;

    current.forEach((_, i) => {
      let q = base;
      if (rem > 0) {
        q += 1;
        rem -= 1;
      }
      setValue(`variants.${vIndex}.location_stocks.${i}.qty`, q, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
  };

  const copyPriceToAll = () => {
    ensureRowsFromSelectedLocations();
    const price = watch(`variants.${vIndex}.price`) ?? "";
    const list = watch(`variants.${vIndex}.location_stocks`) || [];

    list.forEach((_, i) => {
      setValue(`variants.${vIndex}.location_stocks.${i}.price`, price, {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const copyCostToAll = () => {
    ensureRowsFromSelectedLocations();
    const cost = watch(`variants.${vIndex}.purchase_cost`) ?? "";
    const list = watch(`variants.${vIndex}.location_stocks`) || [];

    list.forEach((_, i) => {
      setValue(`variants.${vIndex}.location_stocks.${i}.purchase_cost`, cost, {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const validation = useMemo(() => {
    if (!useLocations) {
      return {
        level: "info",
        msg: "Multi-almacén desactivado: la variante usa stock global.",
        ok: true,
      };
    }

    if (!selectedIds.length) {
      return {
        level: "warning",
        msg: "Multi-almacén activo, pero no has seleccionado sucursales en la sección de Puntos de venta.",
        ok: false,
      };
    }

    if (!fields.length) {
      return {
        level: "warning",
        msg: "Aún no has asignado esta variante a sucursales. Usa “Crear filas con sucursales seleccionadas”.",
        ok: false,
      };
    }

    const idsAll = (rows || []).map((r) =>
      String(r?.pos_location_id ?? "").trim(),
    );
    const ids = idsAll.filter(Boolean);

    const missing = idsAll.some((x) => !x);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);

    if (missing) {
      return {
        level: "error",
        msg: "Hay filas sin sucursal seleccionada.",
        ok: false,
      };
    }

    if (dup) {
      const name =
        locations.find((l) => String(l.id) === String(dup))?.name || dup;
      return {
        level: "error",
        msg: `La sucursal "${name}" está repetida. Solo puedes ponerla una vez.`,
        ok: false,
      };
    }

    const invalidQty = (rows || []).some((r) => {
      const v = r?.qty;
      if (v === "" || v === null || v === undefined) return false;
      const n = Number(v);
      return !Number.isFinite(n) || n < 0;
    });

    if (invalidQty) {
      return {
        level: "error",
        msg: "Hay cantidades inválidas (deben ser números >= 0).",
        ok: false,
      };
    }

    if (!Number.isFinite(variantStock) || variantStock < 0) {
      return {
        level: "error",
        msg: "El stock global de la variante no es válido.",
        ok: false,
      };
    }

    if (sumQty !== variantStock) {
      const diff = variantStock - sumQty;
      return {
        level: "warning",
        msg:
          `La suma por sucursal (${sumQty}) NO coincide con el stock de la variante (${variantStock}). ` +
          (diff > 0 ? `Te faltan ${diff}.` : `Te sobran ${Math.abs(diff)}.`),
        ok: false,
      };
    }

    return {
      level: "success",
      msg: `Correcto: ${variantStock} = ${sumQty} (stock repartido por sucursal).`,
      ok: true,
    };
  }, [
    useLocations,
    selectedIds.length,
    fields.length,
    rows,
    sumQty,
    variantStock,
    locations,
  ]);

  const alertClass =
    validation.level === "success"
      ? "alert alert-success"
      : validation.level === "warning"
        ? "alert alert-warning"
        : validation.level === "error"
          ? "alert alert-danger"
          : "alert alert-info";

  if (!useLocations) return null;

  return (
    <div className="mt-3">
      <h6 className="text-white mb-2">
        🏬 Inventario por sucursal (esta variante)
      </h6>

      <div className={alertClass} style={{ borderRadius: 10 }}>
        {validation.msg}
      </div>

      <div className="d-flex gap-2 flex-wrap mt-2 align-items-center">
        <button
          type="button"
          className="btn btn-outline-info btn-sm"
          onClick={ensureRowsFromSelectedLocations}
          disabled={!selectedIds.length}
          title="Crea/actualiza filas con las sucursales seleccionadas"
        >
          Crear filas con sucursales seleccionadas
        </button>

        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={distributeEvenly}
          disabled={!fields.length || !Number(variantStock)}
          title="Reparte el stock global de la variante entre las sucursales"
        >
          Repartir en partes iguales
        </button>

        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={copyPriceToAll}
          disabled={!fields.length}
        >
          Copiar precio a sucursales
        </button>

        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={copyCostToAll}
          disabled={!fields.length}
        >
          Copiar costo a sucursales
        </button>

        <div className="ms-auto text-light">
          <small className="text-muted">Total asignado:</small>{" "}
          <strong>{sumQty}</strong>{" "}
          <small className="text-muted">/ Stock variante:</small>{" "}
          <strong>{variantStock}</strong>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="mt-3">
          <p className="text-muted mb-0">
            No hay filas. Usa “Crear filas con sucursales seleccionadas”.
          </p>
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
                <strong className="text-white">Sucursal #{i + 1}</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => remove(i)}
                >
                  Quitar
                </button>
              </div>

              <div className="row mt-2">
                <div className="col-md-5 mb-2">
                  <label className="form-label text-white">
                    Punto de venta / Sucursal
                  </label>

                  <select
                    className="form-control"
                    {...register(
                      `variants.${vIndex}.location_stocks.${i}.pos_location_id`,
                    )}
                  >
                    <option value="">Selecciona...</option>

                    {/* ✅ solo sucursales elegidas en LocationsProductSection, pero mostrando NAME */}
                    {selectedIds.map((id) => {
                      const loc = (locations || []).find(
                        (l) => String(l.id) === String(id),
                      );
                      const label =
                        loc?.name ||
                        loc?.nombre ||
                        loc?.title ||
                        `Sucursal ${id}`;

                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  <small className="text-muted">
                    (Lista basada en sucursales seleccionadas)
                  </small>
                </div>

                <div className="col-md-3 mb-2">
                  <label className="form-label text-white">
                    Stock en sucursal
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="1"
                    placeholder="0"
                    {...register(`variants.${vIndex}.location_stocks.${i}.qty`)}
                  />
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label text-white">
                    Precio (opcional){" "}
                    <span title="Si vacío, usa el precio de la variante">
                      ❓
                    </span>
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    placeholder="si vacío: variante"
                    {...register(
                      `variants.${vIndex}.location_stocks.${i}.price`,
                    )}
                  />
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label text-white">
                    Costo (opcional){" "}
                    <span title="Si vacío, usa el costo de la variante">
                      ❓
                    </span>
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    placeholder="purchase_cost"
                    {...register(
                      `variants.${vIndex}.location_stocks.${i}.purchase_cost`,
                    )}
                  />
                </div>
              </div>

              <small className="text-muted">
                Si dejas precio/costo vacío, se usa el valor global de la
                variante.
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VariantsEditor({
  control,
  register,
  watch,
  setValue,
  locations = [],
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

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
      location_stocks: [],
    });
  };

  const sumStock = () => {
    const total = (variants || []).reduce(
      (acc, v) => acc + (Number(v?.stock) || 0),
      0,
    );
    setValue("stock", String(total), { shouldDirty: true, shouldTouch: true });
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
                  <label className="form-label text-white mb-1">
                    Stock (global variante)
                  </label>
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
                      setValue(`variants.${index}.image`, file, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                  />
                  <small className="text-light">
                    Si no subes nada, se mantiene la imagen actual (en edición)
                    o queda vacía.
                  </small>
                </div>

                {previewUrl && (
                  <div className="col-md-6 mb-2">
                    <label className="form-label text-white mb-1">
                      Preview
                    </label>
                    <div className="p-2 bg-dark rounded">
                      <img
                        src={previewUrl}
                        alt="preview"
                        style={{
                          width: "100%",
                          maxHeight: 180,
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Multi-almacén por variante (mismo estilo que LocationsProductSection) */}
              <VariantLocationsEditor
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
                vIndex={index}
                locations={locations}
              />

              <AttributesEditor
                control={control}
                register={register}
                vIndex={index}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
