import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function GtmPageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.endsWith("/seguimiento") || new URLSearchParams(location.search).has("tracking_token")) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "pageview",
      page_path: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);

  return null;
}
