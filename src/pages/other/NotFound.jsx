import React, { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";

const NotFound = () => {
  let { pathname } = useLocation();

  return (
    <Fragment>
      <SEO
        titleTemplate="Not Found"
        description="404 of flone react minimalist eCommerce template."
      />
      {/* breadcrumb */}
      {/* <Breadcrumb 
        pages={[
          { label: "Home", path: "/" },
          { label: "404 page", path: pathname }
        ]} 
      /> */}
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-8 col-xl-6">
              <div className="error py-5 px-3">
                <h1 className="display-1 fw-bold">404</h1>
                <h2 className="mb-3">¡Ups! Página no encontrada</h2>
                <p className="mb-4">
                  Lo sentimos, pero la página que estás buscando no existe, ha
                  sido eliminada o está temporalmente fuera de servicio.
                </p>
                <form className="d-flex justify-content-center mb-4">
                  <input
                    type="text"
                    name="search"
                    id="error_search"
                    placeholder="Buscar..."
                    className="form-control w-50 me-2"
                  />
                  <button type="submit" className="btn btn-primary">
                    <i className="fa fa-search" />
                  </button>
                </form>
                <Link to="/" className="btn btn-outline-secondary">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default NotFound;
