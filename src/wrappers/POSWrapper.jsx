import React, { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";
import POS from "../components/POS";
import POSLoginModal from "../components/POSLoginModal";

const POSWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("POS_TOKEN");

    if (!token) {
      setIsAuthenticated(false);
      setShowModal(true);
      return;
    }

    axiosClient.post("/pos/me")
      .then(res => {
        if (res.data.abilities?.includes("sell-only")) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setShowModal(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setShowModal(true);
      });
  }, []);

  if (isAuthenticated === null) {
    return <div>Cargando POS...</div>;
  }

  return (
    <>
      {isAuthenticated && <POS />}
      <POSLoginModal open={showModal} onLoginSuccess={() => {
        setIsAuthenticated(true);
        setShowModal(false);
      }} />
    </>
  );
};

export default POSWrapper;
