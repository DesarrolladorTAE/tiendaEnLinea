import React from "react";
import PropTypes from "prop-types";
import { ensureHttp } from "../../utils/ensureHttp";

// Usa los SVGs del proyecto o Material Icons si prefieres.
// Aquí dejo SVGs livianos inline para no agregar dependencias.
const icons = {
  facebook: (props) => (
    <svg viewBox="0 0 24 24" width={props.size} height={props.size} aria-hidden="true">
      <path fill="currentColor" d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.65 9.13 8.42 9.95v-7.03H7.9v-2.92h2.38V9.41c0-2.35 1.4-3.64 3.55-3.64 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.54.72-1.54 1.45v1.74h2.63l-.42 2.92h-2.21V22c4.77-.82 8.42-4.96 8.42-9.93Z"/>
    </svg>
  ),
  instagram: (props) => (
    <svg viewBox="0 0 24 24" width={props.size} height={props.size} aria-hidden="true">
      <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2Zm5.65-1.9a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2Z"/>
    </svg>
  ),
  x: (props) => (
    <svg viewBox="0 0 24 24" width={props.size} height={props.size} aria-hidden="true">
      <path fill="currentColor" d="M3 3h4.8l5.3 7.4L18.5 3H21l-7.2 9.9L21 21h-4.8l-5.6-7.8L5.5 21H3l7.4-10.1L3 3Z"/>
    </svg>
  ),
  tiktok: (props) => (
    <svg viewBox="0 0 24 24" width={props.size} height={props.size} aria-hidden="true">
      <path fill="currentColor" d="M17.5 6.7a6.8 6.8 0 0 0 3.7 1.2V11a9 9 0 0 1-3.7-.9v5.1a5.9 5.9 0 1 1-5.9-5.9c.2 0 .4 0 .6.02V12a2.8 2.8 0 1 0 2 2.7V2h3.3v4.7Z"/>
    </svg>
  ),
};

function SocialIcon({ type, url, size = 28 }) {
  if (!url) return null;
  const href = ensureHttp(url);
  const Icon = icons[type];
  if (!Icon) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={type}
      className="inline-flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-500 transition px-2 py-2"
      style={{ color: "#222", textDecoration: "none" }}
    >
      <Icon size={size} />
    </a>
  );
}

export default function SocialLinks({ facebook, instagram, twitter, tiktok, size }) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      <SocialIcon type="facebook" url={facebook} size={size} />
      <SocialIcon type="instagram" url={instagram} size={size} />
      <SocialIcon type="x"         url={twitter}   size={size} />
      <SocialIcon type="tiktok"    url={tiktok}    size={size} />
    </div>
  );
}

SocialLinks.propTypes = {
  facebook: PropTypes.string,
  instagram: PropTypes.string,
  twitter: PropTypes.string,
  tiktok: PropTypes.string,
  size: PropTypes.number,
};
