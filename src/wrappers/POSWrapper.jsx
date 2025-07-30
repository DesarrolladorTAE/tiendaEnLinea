import React, { useEffect, useState } from "react";
import axiosClientPOS from "../config/axiosClientPOS"; // 👈 cliente POS
import axiosClient from "../config/axiosClient"; // 👈 cliente admin
import POS from "../components/POS";
import POSDashboard from "../components/POSDashboard"; // Asegúrate que exista
import POSLoginModal from "../components/POSLoginModal";
import { useLocation } from "react-router-dom";

const POSWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [posName, setPosName] = useState("");
  const location = useLocation();

  const posDesdeAdmin = location.state?.pos || null;

  useEffect(() => {
    if (posDesdeAdmin) {
      axiosClient
        .post("/admin/pos-token", { pos_id: posDesdeAdmin.id })
        .then((res) => {
          localStorage.setItem("POS_TOKEN", res.data.token);
          setIsAuthenticated(true);
          setPosName(posDesdeAdmin.name || "Sucursal");
        })
        .catch((err) => {
          console.error("❌ Error generando token POS desde admin", err);
          setIsAuthenticated(false);
          setShowModal(true);
        });

      return;
    }

    const token = localStorage.getItem("POS_TOKEN");

    if (!token) {
      setIsAuthenticated(false);
      setShowModal(true);
      return;
    }

    axiosClientPOS
      .post("/pos/me")
      .then((res) => {
        if (res.data.abilities?.includes("sell-only")) {
          setIsAuthenticated(true);
          setPosName(res.data.name || "");
        } else {
          setIsAuthenticated(false);
          setShowModal(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setShowModal(true);
      });
  }, [posDesdeAdmin]);

  const handleLoginSuccess = () => {
    setShowModal(false);
    setIsAuthenticated(true);
    axiosClientPOS.post("/pos/me").then((res) => {
      setPosName(res.data.name || "");
    });
  };

  return (
    <>
      {!posDesdeAdmin && (
        <POSLoginModal open={showModal} onLoginSuccess={handleLoginSuccess} />
      )}
      {isAuthenticated === true && <POSDashboard posName={posName} posDesdeAdmin={!!posDesdeAdmin} />}

      {isAuthenticated === null && (
        <p style={{ textAlign: "center" }}>Cargando...</p>
      )}
    </>
  );
};

export default POSWrapper;
