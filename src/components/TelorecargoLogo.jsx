import React from "react";

// Keep the original artwork; the viewBox removes only its empty outer margin.
export default function TelorecargoLogo({ width = 20, decorative = true, fontSize }) {
  return <svg
    viewBox="15 110 482 295"
    width={width}
    height={fontSize === "small" ? 20 : width * 295 / 482}
    preserveAspectRatio="xMidYMid meet"
    role={decorative ? undefined : "img"}
    aria-hidden={decorative ? true : undefined}
    aria-label={decorative ? undefined : "Telorecargo"}
    focusable="false"
    style={{ display: "block", flexShrink: 0, maxWidth: "100%", objectFit: "contain" }}
  >
    <image href="/assets/telorecargo.png" width="512" height="512" />
  </svg>;
}
