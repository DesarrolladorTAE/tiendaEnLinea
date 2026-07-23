import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import axiosClient from "../config/axiosClient";
import axiosClientPOS from "../config/axiosClientPOS";

import POSDashboard from "../components/POSDashboard";
import POSLoginModal from "../components/POSLoginModal";
import SupportTicketButton from "../components/SupportTicketButton";

const POSWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const [posName, setPosName] =
    useState("");

  const [posLocationId, setPosLocationId] =
    useState(null);

  const location = useLocation();

  const posDesdeAdmin =
    location.state?.pos || null;

  const setPosContext = (posMeOrPosObj) => {
    const id =
      Number(posMeOrPosObj?.id) ||
      Number(posMeOrPosObj?.pos_id) ||
      null;

    if (id) {
      localStorage.setItem(
        "POS_LOCATION_ID",
        String(id)
      );

      setPosLocationId(id);

      window.dispatchEvent(
        new Event("pos:changed")
      );
    } else {
      localStorage.removeItem(
        "POS_LOCATION_ID"
      );

      setPosLocationId(null);

      window.dispatchEvent(
        new Event("pos:changed")
      );
    }

    if (posMeOrPosObj?.branch_id) {
      localStorage.setItem(
        "BRANCH_ID",
        String(posMeOrPosObj.branch_id)
      );
    }
  };

  useEffect(() => {
    if (posDesdeAdmin) {
      axiosClient
        .post("/admin/pos-token", {
          pos_id: posDesdeAdmin.id,
        })
        .then((res) => {
          localStorage.setItem(
            "POS_TOKEN",
            res.data.token
          );

          setPosContext({
            id: posDesdeAdmin.id,
            branch_id:
              posDesdeAdmin.branch_id,
          });

          setIsAuthenticated(true);

          setPosName(
            posDesdeAdmin.name || "Sucursal"
          );
        })
        .catch((err) => {
          console.error(
            "Error generando token POS desde admin",
            err
          );

          setIsAuthenticated(false);
          setShowModal(true);
        });

      return;
    }

    const token =
      localStorage.getItem("POS_TOKEN");

    if (!token) {
      setIsAuthenticated(false);
      setShowModal(true);

      return;
    }

    axiosClientPOS
      .post("/pos/me")
      .then((res) => {
        if (
          res.data.abilities?.includes(
            "sell-only"
          )
        ) {
          setIsAuthenticated(true);
          setPosName(res.data.name || "");
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

    axiosClientPOS
      .post("/pos/me")
      .then((res) => {
        setPosName(res.data.name || "");
        setPosContext(res.data);
      });
  };

  return (
    <>
      {!posDesdeAdmin && (
        <POSLoginModal
          open={showModal}
          onLoginSuccess={
            handleLoginSuccess
          }
        />
      )}

      {isAuthenticated === true && (
        <>
          <POSDashboard
            posName={posName}
            posDesdeAdmin={!!posDesdeAdmin}
            posLocationId={posLocationId}
          />

          <SupportTicketButton />
        </>
      )}

      {isAuthenticated === null && (
        <p
          style={{
            textAlign: "center",
          }}
        >
          Cargando...
        </p>
      )}
    </>
  );
};

export default POSWrapper;