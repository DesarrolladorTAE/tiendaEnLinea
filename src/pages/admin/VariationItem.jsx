import React, { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Accordion, Card, Button, Form } from "react-bootstrap";

const VariationItem = ({
  control,
  register,
  variation,
  vIndex,
  removeVariation,
  isActive,
  setActiveVariationIndex,
}) => {
  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({
    control,
    name: `variations.${vIndex}.sizes`,
  });

  // Estado para manejar qué tamaño está abierto dentro de la variación actual
  const [activeSizeIndex, setActiveSizeIndex] = useState(null);

  return (
    <Accordion activeKey={isActive ? vIndex.toString() : null} className="mb-3">
      <Card className="bg-dark text-light border-secondary">
        <Accordion.Item eventKey={vIndex.toString()}>
          <div className="d-flex justify-content-between align-items-center">
            <Accordion.Header
              onClick={() => setActiveVariationIndex(isActive ? null : vIndex)}
              className="d-flex align-items-center w-100"
            >
              <span className="me-2">🎨</span>
              <strong>
                {" "}
                Color: {variation.color || `Variación ${vIndex + 1}`}
              </strong>
            </Accordion.Header>

            {/* Botón de eliminar fuera de Header */}
            <Button
              variant="danger"
              size="sm"
              className="ms-2"
              onClick={(e) => {
                e.stopPropagation(); // Evita que el acordeón se abra/cierre al hacer clic
                removeVariation(vIndex);
              }}
            >
              ❌
            </Button>
          </div>

          <Accordion.Body>
            <div className="row">
              <div className="col-md-6 mb-2">
                <Form.Label>Color</Form.Label>
                <Form.Control
                  {...register(`variations.${vIndex}.color`)}
                  className="bg-dark text-light border-secondary"
                />
              </div>

              <div className="col-md-6 mb-2">
                <Form.Label>Imagen</Form.Label>
                <Form.Control
                  type="file"
                  {...register(`variations.${vIndex}.image`)}
                  className="bg-dark text-light border-secondary"
                />
              </div>
            </div>

            {/* Sección de tamaños */}
            <Accordion>
              {sizeFields.map((size, sIndex) => (
                <Accordion.Item
                  eventKey={`size-${vIndex}-${sIndex}`}
                  key={size.id}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <Accordion.Header
                      onClick={() =>
                        setActiveSizeIndex(
                          activeSizeIndex === sIndex ? null : sIndex
                        )
                      }
                      className="w-100"
                    >
                      📏 Tamaño: {size.name || `Tamaño ${sIndex + 1}`}
                    </Accordion.Header>

                    {/* Botón de eliminar tamaño fuera de Header */}
                    <Button
                      variant="danger"
                      size="sm"
                      className="ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSize(sIndex);
                      }}
                    >
                      ❌
                    </Button>
                  </div>

                  <Accordion.Body>
                    <div className="row">
                      <div className="col-md-6">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                          {...register(
                            `variations.${vIndex}.sizes.${sIndex}.name`
                          )}
                          className="bg-dark text-light border-secondary"
                          placeholder="Ej: S, M, L, XL"
                        />
                      </div>
                      <div className="col-md-6">
                        <Form.Label>Stock</Form.Label>
                        <Form.Control
                          type="number"
                          {...register(
                            `variations.${vIndex}.sizes.${sIndex}.stock`
                          )}
                          className="bg-dark text-light border-secondary"
                          placeholder="Cantidad"
                        />
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}

              <Button
                variant="secondary"
                className="w-100 mt-2"
                onClick={() => appendSize({ name: "", stock: "" })}
              >
                ➕ Agregar Tamaño
              </Button>
            </Accordion>
          </Accordion.Body>
        </Accordion.Item>
      </Card>
    </Accordion>
  );
};

export default VariationItem;
