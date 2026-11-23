import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import axiosClient from "../config/axiosClient";
import axiosClientPOS from "../config/axiosClientPOS";

import POSDashboard from "../components/POSDashboard";
import POSLoginModal from "../components/POSLoginModal";
// import SupportTicketButton from "../components/SupportTicketButton";

const POSWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const [posName, setPosName] =
    useState("");

  const [posLocationId, setPosLocationId] =
    useState(null);

  const [posBranchId, setPosBranchId] = useState(null);
  const [interfaceDesign, setInterfaceDesign] = useState("actual");

  const location = useLocation();

  const fromAdmin = location.pathname.startsWith("/admin/");
  const { id: adminPosId, branch_id: adminBranchId, name: adminPosName } = location.state?.pos ?? {};

  const setPosContext = (posMeOrPosObj) => {
    setPosBranchId(Number(posMeOrPosObj?.branch_id) || null);
    setInterfaceDesign(posMeOrPosObj?.interface_design === "clasico" ? "clasico" : "actual");
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
    if (fromAdmin && adminPosId) {
      axiosClient
        .post("/admin/pos-token", {
          pos_id: adminPosId,
        })
        .then((res) => {
          localStorage.setItem(
            "POS_TOKEN",
            res.data.token
          );

          setPosContext({
            id: adminPosId,
            branch_id: adminBranchId,
          });

          axiosClientPOS.post("/pos/me").then(({ data }) => { setPosName(data?.name || adminPosName || "Sucursal"); setPosContext({ ...data, id: data?.id ?? data?.pos_id ?? adminPosId, branch_id: data?.branch_id ?? adminBranchId }); }).catch(() => {});
          setIsAuthenticated(true);

          setPosName(
            adminPosName || "Sucursal"
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
  }, [fromAdmin, adminPosId, adminBranchId, adminPosName]);

  const handleLoginSuccess = (pos) => {
    if (pos?.id) {
      setPosContext(pos);
      setPosName(pos.name || "");
    }
    setShowModal(false);
    setIsAuthenticated(true);

    axiosClientPOS
      .post("/pos/me")
      .then((res) => {
        setPosName(res.data.name || pos?.name || "");
        setPosContext({ ...pos, ...res.data, id: pos?.id ?? res.data.id ?? res.data.pos_id });
      })
      .catch(() => {
        if (!pos?.id) {
          setIsAuthenticated(false);
          setShowModal(true);
        }
      });
  };

  return (
    <>
      {showModal && (
        <POSLoginModal
          onLoginSuccess={
            handleLoginSuccess
          }
            fromAdmin={fromAdmin}
        />
      )}

      {isAuthenticated === true && posLocationId && (
        <>
          <POSDashboard
            key={posLocationId}
            posName={posName}
            posDesdeAdmin={fromAdmin}
            posLocationId={posLocationId}
            posBranchId={posBranchId}
            interfaceDesign={interfaceDesign}
            onRefreshInterface={async () => { const { data } = await axiosClientPOS.post("/pos/me"); setPosContext({ ...data, id: data?.id ?? data?.pos_id ?? posLocationId, branch_id: data?.branch_id ?? posBranchId }); }}
          />

          {/* <SupportTicketButton /> */}
        </>
      )}

      {(isAuthenticated === null || (isAuthenticated && !posLocationId)) && (
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
