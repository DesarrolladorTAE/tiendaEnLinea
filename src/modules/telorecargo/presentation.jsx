import React, { useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import CellTowerRoundedIcon from "@mui/icons-material/CellTowerRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import "./telorecargo.css";
import { usableLogo, companyPriority } from "./companies";

// Add supplied local logo paths here. Until then use a neutral carrier icon;
// do not invent logos or guess provider CarrierIDs.
export const carrierBrands = [
  { key: "telcel", name: "Telcel", match: /telcel/i, color: "#0068b5", logo: null },
  { key: "movistar", name: "Movistar", match: /movistar/i, color: "#019fbb", logo: null },
  { key: "att", name: "AT&T", match: /at\s*&\s*t|\batt\b/i, color: "#0086bb", logo: null },
  { key: "unefon", name: "Unefon", match: /unefon/i, color: "#633ba3", logo: null },
  { key: "bait", name: "BAIT", match: /\bbait\b/i, color: "#b98900", logo: null },
  { key: "virgin", name: "Virgin Mobile", match: /virgin/i, color: "#d82836", logo: null },
];
export function carrierBrand(product = {}) {
  const text = [product.CarrierName, product.CarrierNombre, product.Compania, product.Nombre, product.Descripcion].filter(Boolean).join(" ");
  return carrierBrands.find((brand) => brand.match.test(text)) || { key: String(product.CarrierID || "unknown"), name: product.CarrierName || product.CarrierNombre || (product.CarrierID ? `Compañía ${product.CarrierID}` : "Recarga móvil"), color: "#1565c0", logo: null };
}
export function CarrierBadge({ product, company, compact = false, prominent = false }) {
  const brand = carrierBrand(company ? { CarrierName: company.Nombre } : product);
  const name = company?.Nombre || brand.name;
  const logo = usableLogo(company?.Logotipo ?? brand.logo);
  const [failedUrl, setFailedUrl] = useState(null);
  return <span className={`trc-carrier${compact ? " trc-carrier--compact" : ""}${prominent ? " trc-carrier--prominent" : ""}`} style={{ "--carrier-color": brand.color }}>
    <span className="trc-carrier-mark">{logo && failedUrl !== logo ? <img src={logo} alt={name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailedUrl(logo)} /> : <CellTowerRoundedIcon aria-hidden="true" />}</span><span className="trc-carrier-name">{name}</span>
  </span>;
}
export function CompanySelector({ companies, value, onChange, disabled }) {
  return <div className="trc-companies"><div className="trc-companies-heading"><span>Selecciona tu compañía</span><button type="button" className="trc-all-companies" disabled={disabled} aria-pressed={!value} onClick={() => onChange("")}>Ver todas</button></div>
    <div className="trc-company-grid">{companies.map((company) => <button className="trc-company-option" type="button" key={company.id} disabled={disabled} aria-pressed={String(value) === String(company.id)} onClick={() => onChange(String(company.id))}>
      {companyPriority(company) < 3 && <span className="trc-popular-label">Popular</span>}<CarrierBadge company={company} prominent />{String(value) === String(company.id) && <CheckCircleRoundedIcon className="trc-company-selected" aria-label="Seleccionada" />}
    </button>)}</div>
  </div>;
}
export function ModuleHeader({ mode, title, description, icon: Icon, status, statusColor = "default" }) {
  return <Box className="trc-heading"><Stack direction="row" spacing={2} alignItems="center"><Box className="trc-heading-icon"><Icon width={112} /></Box><Box sx={{ minWidth: 0 }}><Typography className="trc-eyebrow">{mode === "admin" ? "ADMINISTRACIÓN · INTEGRACIONES" : "PUNTO DE VENTA · CAJA DIGITAL"}</Typography><Typography component="h1" className="trc-title">{title}</Typography><Typography className="trc-description">{description}</Typography></Box></Stack>{status && <Chip className="trc-header-status" size="small" label={status} color={statusColor} variant="outlined" />}</Box>;
}
export function ProductOption({ product, company, selected, disabled, onClick, amount }) {
  return <button className={`trc-product${selected ? " is-selected" : ""}`} type="button" disabled={disabled} onClick={onClick} aria-pressed={selected}>
    <span className="trc-product-top"><CarrierBadge product={product} company={company} compact />{selected ? <CheckCircleRoundedIcon className="trc-product-check" /> : <ArrowOutwardRoundedIcon className="trc-product-arrow" />}</span>
    <span className="trc-product-amount">{amount}</span><span className="trc-product-name">{product.Nombre}</span>
    {product.Descripcion && <span className="trc-product-description">{product.Descripcion}</span>}
    <span className="trc-product-meta"><span>{product.Vigencia ? `Vigencia: ${product.Vigencia}` : "Recarga electrónica"}</span><span>{product.Codigo}</span></span>
  </button>;
}
