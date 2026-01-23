// src/components/admin/productForm/sections/LocationsProductSection.jsx
import React, { useMemo } from "react";
import { useFieldArray, useWatch } from "react-hook-form";

/**
 * Multi-almacén (punto de venta)
 *
 * defaultValues necesarios:
 *  use_location_inventory: false,
 *  location_inventories: [],
 *
 * Reglas:
 *  - SIN variantes: qty por sucursal DEBE sumar stock global
 *  - CON variantes: aquí solo seleccionas sucursales (sin qty),
 *    el stock/precio por sucursal va por variante (en VariantsEditor)
 */
export default function LocationsProductSection({
  control,
  register,
  watch,
  setValue,
  locations = [],
}) {
  const useLocations = watch("use_location_inventory");

  // ✅ re-render confiable
  const rows = useWatch({ control, name: "location_inventories" }) || [];
  const variants = useWatch({ control, name: "variants" }) || [];
  const hasVariants = variants.length > 0;

  const productStock = Number(watch("stock") || 0);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "location_inventories",
  });

  const addRow = () => {
    append({ pos_location_id: "", qty: "", price: "", purchase_cost: "" });
  };

  const sumQty = useMemo(() => {
    return (rows || []).reduce((acc, r) => acc + (Number(r?.qty) || 0), 0);
  }, [rows]);

  const validation = useMemo(() => {
    if (!useLocations) {
      return {
        level: "info",
        msg: "Multi-almacén desactivado: se usa stock/precio global.",
        ok: true,
      };
    }

    // validación base (sirve para ambos)
    if (!fields.length) {
      return {
        level: "error",
        msg: "Agrega al menos una sucursal.",
        ok: false,
      };
    }

    const idsAll = (rows || []).map((r) =>
      String(r?.pos_location_id ?? "").trim()
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

    // ✅ CON VARIANTES: aquí no validamos qty (porque irá por variante)
    if (hasVariants) {
      return {
        level: "info",
        msg:
          "Producto con VARIANTES: aquí seleccionas las sucursales que usarán inventario. " +
          "El stock/precio por sucursal se asigna dentro de cada variante (Variants).",
        ok: true,
      };
    }

    // ✅ SIN VARIANTES: validación estricta de cantidades
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

    if (!Number.isFinite(productStock) || productStock < 0) {
      return {
        level: "error",
        msg: "El stock global del producto no es válido.",
        ok: false,
      };
    }

    if (sumQty !== productStock) {
      const diff = +(productStock - sumQty).toFixed(3);
      return {
        level: "warning",
        msg:
          `La suma por sucursal (${sumQty}) NO coincide con el stock global (${productStock}). ` +
          (diff > 0 ? `Te faltan ${diff}.` : `Te sobran ${Math.abs(diff)}.`),
        ok: false, // bloquea (tu submit debe validar esto)
      };
    }

    return {
      level: "success",
      msg: `Correcto: ${productStock} = ${sumQty} (stock repartido).`,
      ok: true,
    };
  }, [useLocations, hasVariants, fields.length, rows, locations, productStock, sumQty]);

  const distributeEvenly = () => {
    const n = rows.length;
    if (!n) return;

    const total = Number(productStock || 0);
    if (!Number.isFinite(total) || total <= 0) return;

    // reparto en enteros
    const base = Math.floor(total / n);
    let remainder = total - base * n;

    rows.forEach((_, i) => {
      let q = base;
      if (remainder > 0) {
        q += 1;
        remainder -= 1;
      }
      setValue(`location_inventories.${i}.qty`, q, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
  };

  const alertClass =
    validation.level === "success"
      ? "alert alert-success"
      : validation.level === "warning"
      ? "alert alert-warning"
      : validation.level === "error"
      ? "alert alert-danger"
      : "alert alert-info";

  return (
    <div className="row">
      <div className="col-12 mb-2">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="useLocationInventory"
            {...register("use_location_inventory")}
          />
          <label className="form-check-label text-white" htmlFor="useLocationInventory">
            Usar inventario por punto de venta (multi-almacén)
          </label>
        </div>
        <small className="text-muted">
          Si no activas esto, se usa stock/precio global.
        </small>
      </div>

      {useLocations && (
        <div className="col-12 mt-2">
          <div className={alertClass} style={{ borderRadius: 10 }}>
            {validation.msg}
          </div>
        </div>
      )}

      {!useLocations ? null : (
        <>
          <div className="col-12 d-flex gap-2 flex-wrap mt-2 align-items-center">
            <button type="button" className="btn btn-outline-info" onClick={addRow}>
              + Agregar sucursal
            </button>

            {/* ✅ Solo para SIN variantes */}
            {!hasVariants && (
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={distributeEvenly}
                disabled={rows.length < 2 || !productStock}
                title="Reparte el stock global entre las filas"
              >
                Repartir en partes iguales
              </button>
            )}

            <div className="ms-auto text-light">
              {!hasVariants ? (
                <>
                  <small className="text-white">Total asignado:</small>{" "}
                  <strong>{sumQty}</strong>{" "}
                  <small className="text-white">/ Stock global:</small>{" "}
                  <strong>{productStock}</strong>
                </>
              ) : (
                <>
                  <small className="text-white">Sucursales activas:</small>{" "}
                  <strong>{fields.length}</strong>{" "}
                  <small className="text-white">/ Variantes:</small>{" "}
                  <strong>{variants.length}</strong>
                </>
              )}
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="col-12 mt-3">
              <p className="text-muted mb-0">
                Agrega al menos una sucursal para asignar inventario.
              </p>
            </div>
          ) : (
            <div className="col-12 mt-3">
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
                      <label className="form-label text-white">Punto de venta / Sucursal</label>
                      <select
                        className="form-control"
                        {...register(`location_inventories.${i}.pos_location_id`)}
                      >
                        <option value="">Selecciona...</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ✅ SOLO SIN VARIANTES mostramos qty/precio/costo */}
                    {!hasVariants && (
                      <>
                        <div className="col-md-3 mb-2">
                          <label className="form-label text-white">Stock en sucursal</label>
                          <input
                            className="form-control"
                            type="number"
                            step="1"
                            placeholder="0"
                            {...register(`location_inventories.${i}.qty`)}
                          />
                        </div>

                        <div className="col-md-2 mb-2">
                          <label className="form-label text-white">
                            Precio (opcional) <span title="Si vacío, usa el global">❓</span>
                          </label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            placeholder="si vacío: global"
                            {...register(`location_inventories.${i}.price`)}
                          />
                        </div>

                        <div className="col-md-2 mb-2">
                          <label className="form-label text-white">
                            Costo (opcional) <span title="Si vacío, usa el global">❓</span>
                          </label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            placeholder="purchase_cost"
                            {...register(`location_inventories.${i}.purchase_cost`)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {!hasVariants ? (
                    <small className="text-muted">
                      Si dejas precio/costo vacío, se usa el global.
                    </small>
                  ) : (
                    <small className="text-muted">
                      Con variantes: el stock/precio por sucursal se define dentro de cada variante.
                    </small>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
