import React, { useEffect, useState } from "react";
import axiosClientPOS from "../config/axiosClientPOS"; // cliente POS
import axiosClient from "../config/axiosClient"; // cliente admin
import POSDashboard from "../components/POSDashboard";
import POSLoginModal from "../components/POSLoginModal";
import { useLocation } from "react-router-dom";

const POSWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [posName, setPosName] = useState("");
  const location = useLocation();

  const posDesdeAdmin = location.state?.pos || null;

  const setPosContext = (posMeOrPosObj) => {
    // ✅ Guardar ID del POS en localStorage (lo que tu POS.jsx necesita)
    // 1) Si vienes del admin, posDesdeAdmin.id existe.
    // 2) Si vienes normal, /pos/me debe traer id.
    const id =
      Number(posMeOrPosObj?.id) ||
      Number(posMeOrPosObj?.pos_id) ||
      null;

    if (id) {
      localStorage.setItem("POS_LOCATION_ID", String(id));
      // ✅ notifica a POS.jsx (misma pestaña)
      window.dispatchEvent(new Event("pos:changed"));
    } else {
      // si por algo no viene, al menos limpia
      localStorage.removeItem("POS_LOCATION_ID");
      window.dispatchEvent(new Event("pos:changed"));
    }

    // 🔥 opcional: si tu /pos/me trae branch_id y quieres guardarlo también
    if (posMeOrPosObj?.branch_id) {
      localStorage.setItem("BRANCH_ID", String(posMeOrPosObj.branch_id));
    }
  };

  useEffect(() => {
    // ✅ CASO 1: vienes desde admin y ya tienes el pos seleccionado
    if (posDesdeAdmin) {
      axiosClient
        .post("/admin/pos-token", { pos_id: posDesdeAdmin.id })
        .then((res) => {
          localStorage.setItem("POS_TOKEN", res.data.token);

          // ✅ aquí guardamos el POS_LOCATION_ID
          setPosContext({ id: posDesdeAdmin.id, branch_id: posDesdeAdmin.branch_id });

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

    // ✅ CASO 2: entrada normal
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

          // ✅ AQUÍ está la clave: guardar POS_LOCATION_ID con el id real del POS
          setPosContext(res.data);
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

      // ✅ al loguearte, vuelve a guardar POS_LOCATION_ID
      setPosContext(res.data);
    });
  };

  return (
    <>
      {!posDesdeAdmin && (
        <POSLoginModal open={showModal} onLoginSuccess={handleLoginSuccess} />
      )}

      {isAuthenticated === true && (
        <POSDashboard
          posName={posName}
          posDesdeAdmin={!!posDesdeAdmin}
        />
      )}

      {isAuthenticated === null && (
        <p style={{ textAlign: "center" }}>Cargando...</p>
      )}
    </>
  );
};

export default POSWrapper;
