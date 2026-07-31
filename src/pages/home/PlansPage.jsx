import React from "react";
import Plans from "./components/Plans";
import planes from "../../utils/planes";

export default function PlansPage() {
  return (
    <div className="landing-page landing-page--plans">
      <Plans planes={planes} />
    </div>
  );
}