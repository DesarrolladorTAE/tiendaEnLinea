import React, { useEffect, useState } from "react";
import { MdSupportAgent } from "react-icons/md";
import { useLocation } from "react-router-dom";

import axiosClient from "../config/axiosClient";
import axiosClientPOS from "../config/axiosClientPOS";

import SupportTicketModal from "./SupportTicketModal";

const SUPPORT_ERROR_EVENT =
  "support:http-error";

const containerStyle = {
  position: "fixed",
  bottom: "90px",
  right: "20px",
  zIndex: 9999,
  width: "60px",
  height: "60px",
};

const buttonStyle = {
  width: "60px",
  height: "60px",
  backgroundColor: "#23388B",
  color: "#ffffff",
  border: "none",
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  cursor: "pointer",
};

const badgeStyle = {
  position: "absolute",
  top: "-8px",
  right: "-8px",
  minWidth: "28px",
  height: "28px",
  padding: "0 6px",
  borderRadius: "14px",
  backgroundColor: "#d32f2f",
  color: "#ffffff",
  border: "2px solid #ffffff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1,
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
};

const iconWrapperStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const SupportTicketButton = () => {
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] =
    useState(0);

  const isPosContext =
    pathname.startsWith("/prueba/pos") ||
    pathname.startsWith("/pos");

  const isPrivateSupportRoute =
    pathname.startsWith("/admin") ||
    isPosContext;

  const supportApiClient = isPosContext
    ? axiosClientPOS
    : axiosClient;

  useEffect(() => {
    if (!isPrivateSupportRoute) {
      setPendingCount(0);
      return undefined;
    }

    let active = true;

    const loadPendingIncidents = async () => {
      try {
        const response =
          await supportApiClient.get(
            "the-business-ticket/incidents",
            {
              params: {
                limit: 20,
              },
            }
          );

        if (!active) {
          return;
        }

        const nextCount = Number(
          response?.data?.pending_count ?? 0
        );

        setPendingCount(
          Number.isFinite(nextCount)
            ? nextCount
            : 0
        );
      } catch (error) {
        console.warn(
          "No fue posible consultar los incidentes pendientes:",
          error
        );
      }
    };

    const handleSupportError = (event) => {
      const eventCount = Number(
        event?.detail?.pending_count
      );

      if (
        Number.isFinite(eventCount) &&
        eventCount >= 0
      ) {
        setPendingCount(eventCount);
        return;
      }

      loadPendingIncidents();
    };

    loadPendingIncidents();

    const intervalId = window.setInterval(
      loadPendingIncidents,
      60000
    );

    window.addEventListener(
      SUPPORT_ERROR_EVENT,
      handleSupportError
    );

    return () => {
      active = false;

      window.clearInterval(intervalId);

      window.removeEventListener(
        SUPPORT_ERROR_EVENT,
        handleSupportError
      );
    };
  }, [
    isPrivateSupportRoute,
    pathname,
    supportApiClient,
  ]);

  if (!isPrivateSupportRoute) {
    return null;
  }

  const badgeText =
    pendingCount > 99
      ? "99+"
      : String(pendingCount);

  const buttonTitle =
    pendingCount > 0
      ? `${pendingCount} incidente${
          pendingCount === 1 ? "" : "s"
        } pendiente${
          pendingCount === 1 ? "" : "s"
        }`
      : "Abrir centro de soporte";

  return (
    <>
      <style>
        {`
          @keyframes support-ticket-jump {
            0%, 65%, 100% {
              transform: translateY(0);
            }

            72% {
              transform: translateY(-8px);
            }

            79% {
              transform: translateY(0);
            }

            86% {
              transform: translateY(-4px);
            }

            93% {
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div style={containerStyle}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={buttonStyle}
          title={buttonTitle}
          aria-label={buttonTitle}
        >
          <span
            style={{
              ...iconWrapperStyle,
              animation:
                pendingCount > 0
                  ? "support-ticket-jump 1.8s ease-in-out infinite"
                  : "none",
            }}
          >
            <MdSupportAgent size={30} />
          </span>
        </button>

        {pendingCount > 0 && (
          <span
            style={badgeStyle}
            title={buttonTitle}
            aria-live="polite"
          >
            {badgeText}
          </span>
        )}
      </div>

      <SupportTicketModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default SupportTicketButton;