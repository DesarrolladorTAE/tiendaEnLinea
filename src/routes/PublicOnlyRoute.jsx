import { Navigate } from "react-router-dom";

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // Asegúrate de que la clave sea EXACTA
  if (token) {
    return <Navigate to="/home-fashion-three" replace />;
  }
  return children;
};

export default PublicOnlyRoute;
