// src/components/branding/ConnectMega.jsx
import React from "react";
import PropTypes from "prop-types";

/* Utils */
function ensureHttp(url) {
  if (!url) return "";
  const u = String(url).trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("@")) return `https://instagram.com/${u.slice(1)}`;
  return `https://${u}`;
}
function onlyDigits(s = "") { return String(s).replace(/\D+/g, ""); }
function hasVal(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function waLink(phone, text = "") {
  let n = onlyDigits(phone);
  if (!n) return "";

  if (!n.startsWith("52")) {
    n = "52" + n;
  }

  const enc = encodeURIComponent(text);
  return `https://wa.me/${n}${enc ? `?text=${enc}` : ""}`;
}

/* SVGs */
const IconPhone = (p) => (<svg viewBox="0 0 24 24" width={p.size||24} height={p.size||24} fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.4 15.4 0 0 0 6.6 6.6l2.2-2.2a1.4 1.4 0 0 1 1.4-.34 9.2 9.2 0 0 0 2.9.46 1.4 1.4 0 0 1 1.4 1.4V20a1.4 1.4 0 0 1-1.4 1.4A18.6 18.6 0 0 1 3 7.4 1.4 1.4 0 0 1 4.4 6H7a1.4 1.4 0 0 1 1.4 1.4 9.2 9.2 0 0 0 .46 2.9 1.4 1.4 0 0 1-.26 1.5l-2 2Z"/></svg>);
const IconMail  = (p) => (<svg viewBox="0 0 24 24" width={p.size||24} height={p.size||24} fill="currentColor" aria-hidden="true"><path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11Zm2.2-.3 7.6 5.4 7.9-5.4H4.2Z"/></svg>);
const IconWA    = (p) => (<svg viewBox="0 0 24 24" width={p.size||24} height={p.size||24} fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A10 10 0 0 0 3.3 17.6L2 22l4.5-1.2A10 10 0 1 0 20.5 3.5Zm-8.3 15a8.3 8.3 0 0 1-4-.9l-.28-.14-2.7.72.71-2.63-.15-.28a8.32 8.32 0 1 1 6.42 3.25Zm4.39-5.2c-.24-.13-1.43-.79-1.65-.88-.22-.09-.39-.13-.56.13s-.64.76-.78.91-.29.2-.53.07a6.8 6.8 0 0 1-2-1.23 7.42 7.42 0 0 1-1.37-1.7c-.14-.24 0-.37.1-.5l.37-.43c.12-.14.17-.24.26-.4.08-.16.04-.3 0-.43l-.5-1.2c-.13-.31-.27-.27-.39-.27h-.33a.64.64 0 0 0-.46.22c-.16.17-.6.58-.6 1.42s.63 1.64.72 1.75a10.43 10.43 0 0 0 2.54 2.55 8.73 8.73 0 0 0 1.95.98c.27.1.52.09.72.05a1.98 1.98 0 0 0 1.3-.91c.16-.22.21-.4.16-.55-.06-.14-.22-.21-.46-.33Z"/></svg>);
const IconFB    = (p) => (<svg viewBox="0 0 24 24" width={p.size||28} height={p.size||28} fill="currentColor" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.65 9.13 8.42 9.95v-7.03H7.9v-2.92h2.38V9.41c0-2.35 1.4-3.64 3.55-3.64 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.54.72-1.54 1.45v1.74h2.63l-.42 2.92h-2.21V22c4.77-.82 8.42-4.96 8.42-9.93Z"/></svg>);
const IconIG    = (p) => (<svg viewBox="0 0 24 24" width={p.size||28} height={p.size||28} fill="currentColor" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2Zm5.65-1.9a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2Z"/></svg>);
const IconX     = (p) => (<svg viewBox="0 0 24 24" width={p.size||28} height={p.size||28} fill="currentColor" aria-hidden="true"><path d="M3 3h4.8l5.3 7.4L18.5 3H21l-7.2 9.9L21 21h-4.8l-5.6-7.8L5.5 21H3l7.4-10.1L3 3Z"/></svg>);
const IconTT    = (p) => (<svg viewBox="0 0 24 24" width={p.size||28} height={p.size||28} fill="currentColor" aria-hidden="true"><path d="M17.5 6.7a6.8 6.8 0 0 0 3.7 1.2V11a9 9 0 0 1-3.7-.9v5.1a5.9 5.9 0 1 1-5.9-5.9c.2 0 .4 0 .6.02V12a2.8 2.8 0 1 0 2 2.7V2h3.3v4.7Z"/></svg>);

export default function ConnectMega({
  storeName,
  phone,
  email,
  socials = {},
  subtitle = "Respuestas claras, soporte cercano y promociones antes que nadie.",
  spaceTopClass = "",
  spaceBottomClass = ""
}) {
  const telHref   = phone ? `tel:${onlyDigits(phone) || phone}` : "";
  const mailHref  = email ? `mailto:${email}` : "";
  const waHref    = phone ? waLink(phone, `Hola ${storeName || ""}, me gustaría recibir información.`) : "";

  // Sanitizar y normalizar: solo si traen valor, convierto a URL
 const fb  = hasVal(socials.facebook)  ? ensureHttp(socials.facebook)  : "";
  const ig  = hasVal(socials.instagram) ? ensureHttp(socials.instagram) : "";
  const xx  = hasVal(socials.twitter)   ? ensureHttp(socials.twitter)   : "";
  const tkt = hasVal(socials.tiktok)    ? ensureHttp(socials.tiktok)    : "";
  const hasSocials = Boolean(fb || ig || xx || tkt);

  return (
    <section className={`connect-mega ${spaceTopClass} ${spaceBottomClass}`}>
      <div className="cm-wrap">
        <div className="cm-bg" />
        <div className="container">
          <div className={`cm-grid ${hasSocials ? "has-socials" : "no-socials"}`}>
            {/* IZQUIERDA: overlay translúcido + texto con contraste */}
            <div className="cm-left">
              <span className="cm-kicker">Conecta con nosotros</span>
              <h3 className="cm-title">
                {storeName ? <><strong>{storeName}</strong></> : "Nuestro equipo"} <br/>
                a un mensaje de distancia
              </h3>
              <p className="cm-subtitle">{subtitle}</p>

              <div className="cm-ctas">
                {phone && (
                  <a className="cm-btn primary" href={telHref}>
                    <IconPhone size={20}/> <span>Llamar</span>
                  </a>
                )}
                {waHref && (
                  <a className="cm-btn ghost" href={waHref} target="_blank" rel="noopener noreferrer">
                    <IconWA size={20}/> <span>WhatsApp</span>
                  </a>
                )}
                {email && (
                  <a className="cm-btn ghost" href={mailHref}>
                    <IconMail size={20}/> <span>Correo</span>
                  </a>
                )}
              </div>

              <ul className="cm-trust">
                <li>Pagos seguros</li>
                <li>Soporte humano</li>
                <li>Envíos puntuales</li>
              </ul>
            </div>

            {/* DERECHA: tarjeta social */}
{/* DERECHA: tarjeta social (solo si hay al menos una red) */}
  {hasSocials && (
    <div className="cm-right">
      <div className="cm-card">
        <h4 className="cm-card-title">Síguenos</h4>
        <p className="cm-card-desc">Novedades, promociones y atención por mensaje.</p>
        <div className="cm-socials">
          {fb  && <a href={fb}  target="_blank" rel="noopener noreferrer" className="cm-social"><IconFB /><span>Facebook</span></a>}
          {ig  && <a href={ig}  target="_blank" rel="noopener noreferrer" className="cm-social"><IconIG /><span>Instagram</span></a>}
          {xx  && <a href={xx}  target="_blank" rel="noopener noreferrer" className="cm-social"><IconX  /><span>Twitter (X)</span></a>}
          {tkt && <a href={tkt} target="_blank" rel="noopener noreferrer" className="cm-social"><IconTT /><span>TikTok</span></a>}
        </div>
      </div>
    </div>
  )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .connect-mega { position: relative; }
        .cm-wrap { position: relative; overflow: hidden; border-radius: 22px; }
        .cm-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #6EC1E4 0%, #A777E3 50%, #56E39F 100%);
          opacity: 0.95;
        }
        .container { position: relative; z-index: 1; }
        .cm-grid {
          display: grid; gap: 48px;
          grid-template-columns: 1.1fr 0.9fr;
          padding: 84px 40px;
          color: #0f172a;
        }
        @media (max-width: 992px){
          .cm-grid { grid-template-columns: 1fr; padding: 64px 24px; }
          .cm-right { order: -1; }
        }

        /* LEFT overlay */
        .cm-left {
          background: rgba(255,255,255,.58);
          backdrop-filter: blur(6px);
          padding: 26px 26px 28px;
          border-radius: 18px;
          box-shadow: 0 6px 20px rgba(0,0,0,.08);
        }

        .cm-kicker { display:inline-block; letter-spacing:.14em; font-size:13px; text-transform:uppercase; opacity:.85; margin-bottom:10px }
        .cm-title { font-size: clamp(34px, 4.4vw, 52px); line-height:1.12; margin: 0 0 12px; color:#0f172a; text-shadow: 0 1px 3px rgba(0,0,0,.25); }
        .cm-subtitle { margin:0 0 24px; font-size:18px; color:#1e293b; text-shadow: 0 1px 2px rgba(0,0,0,.18); }

        .cm-ctas { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:22px }
        .cm-btn {
          display:inline-flex; align-items:center; gap:10px;
          padding: 14px 22px; border-radius: 14px; font-weight:700;
          border:1px solid rgba(0,0,0,.12); text-decoration:none;
          transition: transform .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
        }
        .cm-btn.primary { background: #fff; color:#0f172a; box-shadow: 0 2px 6px rgba(0,0,0,.2); }
        .cm-btn.ghost { background: rgba(255,255,255,.9); color:#0f172a; font-weight:600; }
        .cm-btn:hover { transform: translateY(-2px); background:#fff; border-color:#999; box-shadow: 0 6px 16px rgba(0,0,0,.18); }

        .cm-trust { display:flex; gap:24px; padding:0; margin:6px 0 0; list-style:none; opacity:.95; flex-wrap:wrap; font-size:14px; color:#0f172a; }
        .cm-trust li::before { content:"✓ "; color:#0f172a; font-weight:700 }

        .cm-card {
          background: rgba(255,255,255,.78); backdrop-filter: blur(12px);
          border-radius: 20px; padding: 28px;
          box-shadow: 0 10px 35px rgba(0,0,0,.15);
        }
        .cm-card-title { margin:0 0 8px; font-size:20px; color:#0f172a }
        .cm-card-desc { margin:0 0 18px; opacity:.9; font-size:15px; color:#1e293b }
        .cm-socials { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px }
        @media (max-width: 480px){ .cm-socials { grid-template-columns: 1fr } }
        .cm-social {
          display:flex; align-items:center; gap:12px;
          padding:14px 16px; border-radius:14px; text-decoration:none;
          color:#0f172a; font-weight:600; font-size:15px;
          border:1px solid rgba(0,0,0,.1); background: rgba(255,255,255,.92);
          transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
        }
        .cm-social:hover { transform: translateY(-2px); background:#fff; box-shadow: 0 6px 16px rgba(0,0,0,.12); }
        .cm-empty { opacity:.7 }
        .cm-grid.has-socials {
  grid-template-columns: 1.1fr 0.9fr;
}

.cm-grid.no-socials {
  grid-template-columns: 1fr;
}

      `}</style>
    </section>
  );
}

ConnectMega.propTypes = {
  storeName: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  socials: PropTypes.shape({
    facebook: PropTypes.string,
    instagram: PropTypes.string,
    twitter: PropTypes.string,
    tiktok: PropTypes.string,
  }),
  subtitle: PropTypes.string,
  spaceTopClass: PropTypes.string,
  spaceBottomClass: PropTypes.string
};
