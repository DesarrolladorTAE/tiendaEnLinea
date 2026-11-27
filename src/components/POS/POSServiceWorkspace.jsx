import React from "react";
import { Alert, Button, Card, CircularProgress, Stack, Typography } from "@mui/material";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import client from "../../config/axiosClientPOS";
import { POSOperationsContext } from "../../context/POSOperationsContext";
import usePOSTerminal from "../../hooks/POS/usePOSTerminal";
import { OperationsContext } from "../../pages/admin/ServiceOperationsPage";
import { VehicleRecordsView } from "../../pages/admin/VehicleRecordsPage";
import OrderFormCapture, { OrderFormList } from "../services/OrderFormCapture";
import { useVehicleRequest } from "../vehicles/VehicleRecordFields";
import { createDynamicForms } from "../../services/admin/dynamicForms";
import { createOperations, operationError, orderActions } from "../../services/admin/serviceOperations";
import { createServiceService } from "../../services/admin/serviceService";
import { createVehicleRecords, validVehicleId } from "../../services/admin/vehicleRecords";
import { isOperationalPOSModule } from "../../utils/posServices";

const services = {
  client,
  operations: createOperations(client),
  serviceService: createServiceService(client),
  vehicleRecords: createVehicleRecords(client),
  dynamicForms: createDynamicForms(client),
};

function active(row) {
  return row?.available === true && row.enabled === true && row.visible === true;
}

const serviceViews = [
  ["agenda", "Agenda"],
  ["bookings", "Citas"],
  ["orders", "Órdenes de servicio"],
  ["intake", "Recepción sin cita"],
  ["history", "Historial operativo"],
];

function POSOrderInspection({ access, forms, orderId, submissionId, historical, backUrl }) {
  const branchId = access.branch.id;
  const request = useVehicleRequest(async (signal) => {
    const { data: order } = await services.operations.order(branchId, orderId, signal);
    if (Number(order?.id) !== Number(orderId) || Number(order.branch_id) !== branchId ||
        Number(order.store_id) !== access.storeId) throw new Error("La orden no corresponde a la terminal autenticada.");
    return order;
  }, JSON.stringify([access.storeId, branchId, orderId]));
  if (request.loading) return <CircularProgress aria-label="Verificando orden" />;
  if (request.error) return <Alert severity="warning" action={<Button onClick={request.retry}>Reintentar</Button>}>
    {operationError(request.error)}
  </Alert>;
  if (!request.data) return null;
  const canCapture = forms.capture && orderActions(request.data.status?.code).edit;
  return <Stack spacing={2}>
    <Button component={Link} to={backUrl}>Volver a la orden</Button>
    {submissionId ? <OrderFormCapture branchId={branchId} orderId={orderId} submissionId={submissionId}
      canCapture={canCapture} historical={historical} /> :
      <OrderFormList branchId={branchId} orderId={orderId} canCapture={canCapture} />}
  </Stack>;
}

export default function POSServiceWorkspace({ section, posId, branchId, moduleKeys, session }) {
  const { pathname } = useLocation();
  const [query] = useSearchParams();
  const identity = usePOSTerminal(Boolean(session), posId, branchId, session);
  const terminal = identity.data;
  const permissions = useVehicleRequest(async (signal) => {
    const { data } = await client.get("/pos/modules", { signal });
    if (!Array.isArray(data?.data)) throw new Error("No se reconoció la configuración de módulos.");
    const enabled = (key) => {
      const row = data.data.find((entry) => entry.key === key);
      return moduleKeys.includes(key) &&
        (key === "service_sales" ? isOperationalPOSModule(row) : active(row));
    };
    const optional = ["vehicle_records", "vehicle_catalog", "service_forms"].some(enabled);
    let capabilities;
    let capabilityError;
    if (optional) {
      try {
        const result = await client.get(`/admin/branches/${terminal.branch_id}/catalog-settings`, { signal });
        const settings = result.data?.data;
        const scope = settings?.capabilities?.scope;
        if (Number(settings?.branch_id) !== terminal.branch_id || scope?.actor !== "pos" ||
            Number(scope.branch_id) !== terminal.branch_id || Number(scope.pos_location_id) !== terminal.id) {
          throw new Error("Las capacidades no corresponden a la terminal autenticada.");
        }
        capabilities = settings.capabilities;
      } catch (error) {
        if (error.response?.status === 401) throw error;
        capabilityError = error;
      }
    }
    const allowed = (key, action) =>
      enabled(key) && active(capabilities?.[key]) && capabilities[key].authorization?.[action] === true;
    const branch = { id: terminal.branch_id };
    const serviceSales = enabled("service_sales");
    return {
      capabilityError,
      serviceSales,
      canSell: enabled("sales"),
      canCreateCustomer: enabled("customers"),
      access: {
        storeId: terminal.store_id,
        branch,
        canRead: allowed("vehicle_records", "read"),
        canWrite: allowed("vehicle_records", "write"),
        canReadCatalog: allowed("vehicle_catalog", "read"),
        canManageStatus: false,
      },
      forms: { branch, read: serviceSales && allowed("service_forms", "read"),
        capture: serviceSales && allowed("service_forms", "capture") },
    };
  }, terminal ? JSON.stringify([terminal.id, terminal.store_id, terminal.branch_id, moduleKeys, session]) : null);

  if (!session) return <Alert severity="warning">Inicia sesión en la terminal.</Alert>;
  if (identity.loading || permissions.loading) return <CircularProgress aria-label="Verificando acceso operativo" />;
  const failure = identity.error ? identity : permissions;
  if (failure.error) return <Alert severity="warning" action={<Button onClick={failure.retry}>Reintentar</Button>}>
    {operationError(failure.error)}
  </Alert>;
  if (!terminal || !permissions.data) return null;

  const { access, forms, serviceSales, canSell, canCreateCustomer, capabilityError } = permissions.data;
  const route = (params) => `${pathname}?${new URLSearchParams(params)}`;
  const orderFormsUrl = (_, orderId, submissionId, historical) => route({
    seccion: "servicios", vista: "forms", id: orderId,
    ...(submissionId ? { captura: submissionId } : {}),
    ...(historical ? { history: "1" } : {}),
  });
  const vehicleRecordsUrl = (_, suffix = "") => {
    const [, id, mode] = suffix.split("/");
    if (id === "client") return route({ seccion: "expedientes", cliente: mode });
    return route({ seccion: "expedientes", ...(id === "new" ? { vista: "new" } :
      id ? { id, ...(mode === "edit" ? { vista: "edit" } : {}) } : {}) });
  };
  const operationUrl = (path) => {
    const [view, id, nested] = path.split("/");
    if (view === "vehicles") return vehicleRecordsUrl(null, `/${id}`);
    if (nested === "forms") return orderFormsUrl(null, id);
    return route({ seccion: "servicios", vista: view, ...(id ? { id } : {}) });
  };
  const context = { ...services, forms, canCreateCustomer, canSell, operationUrl, orderFormsUrl, vehicleRecordsUrl,
    saleUrl: route({ seccion: "venta" }) };
  const view = query.get("vista") || (section === "servicios" ? "home" : "view");
  const id = query.get("id");
  const submissionId = query.get("captura");
  const customerId = query.get("cliente");
  if ([id, submissionId, customerId].some((value) => value !== null && !validVehicleId(value))) {
    return <Alert severity="error">Identificador inválido.</Alert>;
  }
  return <POSOperationsContext.Provider value={context}>
    <Stack spacing={2}>
      {capabilityError && <Alert severity="error" action={<Button onClick={permissions.retry}>Reintentar</Button>}>
        No se pudieron comprobar las capacidades de expedientes e inspecciones.
      </Alert>}
      {section === "expedientes" ? (
        moduleKeys.includes("vehicle_records") && ["view", "new", "edit"].includes(view) ?
          <VehicleRecordsView mode={view} access={access} vehicleId={id} customerId={customerId} /> :
          <Alert severity="warning">Expedientes vehiculares no disponibles en esta terminal.</Alert>
      ) : !serviceSales || !["home", "forms", ...serviceViews.map(([key]) => key)].includes(view) ? (
        <Alert severity="warning">Operación de servicios no disponible en esta terminal.</Alert>
      ) : view === "home" ? (
        <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h4">Servicios</Typography>
            <Typography variant="body2">Sucursal #{access.branch.id}</Typography>
            <Stack component="nav" aria-label="Operación de servicios" direction={{ xs: "column", sm: "row" }}
              useFlexGap flexWrap="wrap" spacing={1}>
              {serviceViews.map(([key, label]) => <Button key={key} component={Link} variant="outlined" to={operationUrl(key)}>{label}</Button>)}
            </Stack>
          </Stack>
        </Card>
      ) : view === "forms" ? (
        !id || !forms.read ? <Alert severity="warning">Inspecciones no disponibles para esta orden.</Alert> :
          <POSOrderInspection access={access} forms={forms} orderId={id} submissionId={submissionId}
            historical={query.get("history") === "1"} backUrl={operationUrl(`orders/${id}`)} />
      ) : <OperationsContext key={JSON.stringify([view, id])} access={access} mode={view} id={id} forms={forms} />}
    </Stack>
  </POSOperationsContext.Provider>;
}
