import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

const ProductList = lazy(() => import("../pages/admin/ProductList"));
const ProductForm = lazy(() => import("../pages/admin/ProductForm"));
const ProductDetails = lazy(() => import("../pages/admin/ProductDetails"));
const ProductImages = lazy(() => import("../pages/admin/ProductImages"));
const TourBookingsPage = lazy(() => import("../pages/tours/TourBookingsPage.jsx"));
const TourBookingDetailPage = lazy(() => import("../pages/tours/TourBookingDetailPage.jsx"));
const TourDeparturesPage = lazy(() => import("../pages/tours/TourDeparturesPage.jsx"));
const ToursPage = lazy(() => import("../pages/tours/ToursPage.jsx"));
const ServiceListPage = lazy(() => import("../pages/admin/ServiceListPage.jsx"));
const ServiceFormPage = lazy(() => import("../pages/admin/ServiceFormPage.jsx"));
const ResourceListPage = lazy(() => import("../pages/admin/ResourceListPage.jsx"));
const SitioWeb = lazy(() => import("../pages/admin/SitioWeb.jsx"));

const Categorias = lazy(() => import("../pages/admin/ProductCategory"));
const Etiquetas = lazy(() => import("../pages/admin/ProductTags"));
const Inventario = lazy(() => import("../pages/admin/Inventario"));
const POS = lazy(() => import("../pages/admin/POS"));
const Ventas = lazy(() => import("../pages/admin/Ventas"));
const Entradas = lazy(() => import("../pages/admin/Entradas.jsx"));
const Ticket = lazy (()=>  import("../pages/admin/Ticket.jsx"));
const Membresia = lazy (() => import ("../pages/admin/Membresia.jsx"));
const MiCuenta = lazy (() => import ("../pages/admin/MiCuenta.jsx"));
const Reporte = lazy (() => import ("../pages/admin/Reporte.jsx"));
const ReporteVentas = lazy(() => import("../components/ventas/ReporteVentas.jsx"));
const POSHeader  = lazy(() => import("../wrappers/POSWrapper.jsx"));
const ReporteTipoVenta = lazy(() => import("../components/ventas/ReporteTipoVenta.jsx"));
const ReporteInventario = lazy(() => import("../pages/admin/ReporteInventario.jsx"));
const Complementos = lazy(() => import("../pages/admin/Complementos.jsx"));
const Sucursales = lazy(() => import("../pages/admin/Sucursales.jsx"));
const Almacenes = lazy(() => import("../pages/admin/Almacenes.jsx"));
const InventoryByWarehouse = lazy(() => import("../pages/admin/InventoryByWarehouse.jsx"));
const Promos = lazy(() => import("../pages/admin/Promos.jsx"));
const MarcaBlanca = lazy(() => import("../pages/admin/WhiteLabelSite.jsx"));
const AreasTrabajadores = lazy(() => import("../pages/admin/AreasWorkersPage.jsx"));


export const adminRouteConfig = [
  // ✅ default cuando entras a /admin
  { path: "", element: <Navigate to="sucursales" replace /> },

  // ✅ rutas reales (era "patch" por error)
  { path: "sucursales", element: <Sucursales /> },
  { path: "almacenes", element: <Almacenes /> },

  { path: "products", element: <ProductList /> },
  { path: "products/new", element: <ProductForm /> },
  { path: "products/edit/:id", element: <ProductForm /> },
  { path: "products/images/:id", element: <ProductImages /> },
  { path: "products/:id", element: <ProductDetails /> },

  { path: "tours", element: <ToursPage /> },
  { path: "branches/:branchId/tours", element: <ToursPage /> },
  { path: "branches/:branchId/tours/:serviceId/departures", element: <TourDeparturesPage /> },
  { path: "branches/:branchId/tours/:serviceId/departures/:departureId/bookings", element: <TourBookingsPage /> },
  { path: "branches/:branchId/tours/:serviceId/departures/:departureId/bookings/:bookingId", element: <TourBookingDetailPage /> },

  { path: "services", element: <ServiceListPage /> },
  { path: "services/new", element: <ServiceFormPage /> },
  { path: "services/edit/:id", element: <ServiceFormPage /> },
  { path: "services/resources", element: <ResourceListPage /> },

  { path: "categorias", element: <Categorias /> },
  { path: "mi-sitio", element: <SitioWeb /> },
  { path: "etiquetas", element: <Etiquetas /> },
  { path: "inventario", element: <InventoryByWarehouse /> },
  { path: "pos", element: <POS /> },
  { path: "ventas", element: <Ventas /> },
  { path: "compra", element: <Entradas /> },
  { path: "ticket", element: <Ticket /> },
  { path: "membresia", element: <Membresia /> },
  { path: "micuenta", element: <MiCuenta /> },
  { path: "reportes", element: <Reporte /> },
  { path: "reportes/ventas", element: <ReporteVentas /> },
  { path: "prueba/pos", element: <POSHeader /> },
  { path: "reportes/tipo-venta", element: <ReporteTipoVenta /> },
  { path: "reportes/inventario", element: <ReporteInventario /> },
  { path: "complementos", element: <Complementos /> },
  { path: "promociones", element: <Promos /> },
  { path: "marca-blanca", element: <MarcaBlanca/> },
  { path: "trabajadores-areas", element: <AreasTrabajadores/> },
  // { patch: "solicitudes-pago", element: <SolicitudesPago/> },

];


