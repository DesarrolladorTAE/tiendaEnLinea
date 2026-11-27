import{R as e,u as y,r as s,a as N}from"./index-n4c3GYPs.js";import{S}from"./seo-DsX3djea.js";import{T as x,C as I}from"./TiendaNoDisponible-BlNTTW5o.js";import{B as T}from"./BlogFeatured-CEqWTKDA.js";import"./index.module-FD3UKRFV.js";import"./clsx.m-CH7BE6MN.js";import"./ChevronRight-Dben0rzF.js";import"./ShareRounded-KyS6aXXI.js";import"./StarRounded-CJCTeNSu.js";import"./WarehouseRounded-BbTET3R1.js";import"./TuneRounded-u3UUpr1a.js";import"./StyleRounded-DqtPGbaX.js";import"./TextField-PfxrsPQG.js";import"./useFormControl-KLyx92Yb.js";import"./isHostComponent-DVu5iVWx.js";import"./Popover-DnM0Ppx-.js";import"./List-Bx5lxUyF.js";import"./FormControlLabel-D2L0FThM.js";import"./Switch-Q9P4d0XH.js";import"./SwitchBase-vYYQfVE8.js";import"./Alert-1qIDxQCz.js";import"./Pagination-C7v1yK83.js";import"./LastPage-CtcaEcEf.js";import"./MenuItem-CwxX-_y7.js";import"./listItemTextClasses-CFDXzRln.js";import"./Breadcrumb-CXeILjM_.js";import"./index-5HzigljS.js";import"./Storefront-DFs__fsb.js";import"./Search-DvAYbefA.js";import"./InputAdornment-BeOoHyfQ.js";import"./ListSubheader-XZpdk7Fb.js";import"./Collapse-DjDZ9v43.js";import"./ReceiptLong-f_zpdjhG.js";import"./InfoOutlined-YOW3lTls.js";import"./ShipmentFields-jRpm1q2r.js";import"./Checkbox-DfGOstfD.js";import"./shipping-BaK5DG73.js";import"./shippingService-ngkj6J1p.js";import"./index-BmNfIM2q.js";function C({visible:d=!0,coverImage:g="/assets/img/post/1.png",logoImage:f="/assets/img/logo/logo.png",storeName:r="MiTiendaEnLineaMX",phone:l="+52 55 1234 5678",email:i="contacto@mitiendaenlineamx.com.mx"}){return d?e.createElement("section",{className:"fb-cover-wrap"},e.createElement("div",{className:"fb-cover-bg",style:{backgroundImage:`url('${g}')`},"aria-hidden":"true"}),e.createElement("div",{className:"fb-cover-overlay","aria-hidden":"true"}),e.createElement("div",{className:"fb-profile-row"},e.createElement("div",{className:"fb-avatar-wrap"},e.createElement("img",{src:f,alt:`Logo de ${r}`,className:"fb-avatar"})),e.createElement("div",{className:"fb-info-card"},e.createElement("h1",{className:"fb-title"},r),e.createElement("div",{className:"fb-contact"},l&&e.createElement("a",{className:"fb-chip",href:`tel:${l}`},"📞 ",l),i&&e.createElement("a",{className:"fb-chip",href:`mailto:${i}`},"✉️ ",i)))),e.createElement("style",null,`
        /* Contenedor general (portada) */
        .fb-cover-wrap {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          isolation: isolate;
          min-height: clamp(320px, 44vw, 640px); /* ↑ más alto */
          background: #111;
          margin-bottom: clamp(56px, 8vw, 84px);
        }
        .fb-cover-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transform: scale(1.02);
        }
        .fb-cover-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,
            rgba(0,0,0,.15) 0%,
            rgba(0,0,0,.35) 55%,
            rgba(0,0,0,.65) 100%);
        }

        /* Fila inferior estilo Facebook (avatar + info) */
        .fb-profile-row {
          position: absolute;
          left: clamp(12px, 4vw, 32px);
          right: clamp(12px, 4vw, 32px);
          bottom: clamp(14px, 2.8vw, 24px);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: clamp(14px, 2.2vw, 22px);
          align-items: end;
        }

        /* Avatar circular MÁS GRANDE */
        .fb-avatar-wrap {
          width: clamp(110px, 18vw, 190px); /* ↑ tamaño */
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background: #fff;
          padding: clamp(4px, .9vw, 6px);
          box-shadow: 0 10px 28px rgba(0,0,0,.35);
        }
        .fb-avatar {
          width: 100%; height: 100%;
          border-radius: 50%; object-fit: cover; display: block;
        }

        /* Tarjeta (recuadro) con blur para legibilidad */
        .fb-info-card {
          max-width: min(95%, 780px);
          color: #fff;
          background: rgba(0,0,0,.45);           /* recuadro visible */
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 16px;
          padding: clamp(12px, 2.4vw, 18px) clamp(14px, 2.6vw, 22px);
          box-shadow: 0 12px 28px rgba(0,0,0,.28);
        }

        .fb-title {
          margin: 0 0 8px 0;
          color: #fff;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: .2px;
          font-size: clamp(24px, 4.2vw, 48px); /* ↑ más grande */
        }

        .fb-contact {
          display: flex;
          gap: clamp(8px, 1.6vw, 14px);
          flex-wrap: wrap;
        }
        .fb-chip {
          display: inline-block;
          color: #fff; text-decoration: none;
          font-weight: 700;
          font-size: clamp(13px, 1.6vw, 16px);
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.35);
          background: rgba(0,0,0,.35);
          transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
        }
        .fb-chip:hover {
          background: rgba(0,0,0,.5);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,.3);
        }

        /* Responsive: en móvil centramos la tarjeta y el avatar arriba */
        @media (max-width: 768px) {
          .fb-profile-row {
            grid-template-columns: 1fr;
            align-items: center;
            justify-items: center;
            text-align: center;
            gap: clamp(12px, 3vw, 16px);
          }
          .fb-info-card {
            width: 100%;
          }
          .fb-cover-overlay {
            background: linear-gradient(180deg,
              rgba(0,0,0,.25) 0%,
              rgba(0,0,0,.6) 65%,
              rgba(0,0,0,.75) 100%);
          }
        }
      `)):null}const n={coverImage:"/assets/img/post/1.png",logoImage:"/assets/img/logo/logo.png",storeName:"MiTiendaEnLineaMX",phone:"+52 55 1234 5678",email:"contacto@mitiendaenlineamx.com.mx",titulo_1:"¡Conócenos!",descripcion:"Tu tienda en línea fácil, rápida y flexible."};function fe({storeSlug:d=null,storeId:g=null}){const{storeSlug:f}=y(),r=d||f,[l,i]=s.useState(!0),[t,c]=s.useState(null);if(s.useEffect(()=>{let p=!0;return r?(i(!0),c(null),N.get(`https://mitiendaenlineamx.com.mx/api/public/tienda/${encodeURIComponent(r)}/sitio`).then(({data:b})=>{p&&c(b)}).catch(b=>{p&&(console.error("Error cargando configuración de la tienda:",b),c(null))}).finally(()=>{p&&i(!1)}),()=>{p=!1}):(c(null),i(!1),()=>{p=!1})},[r]),l)return e.createElement("div",{style:{padding:16}},"Cargando…");if(!r)return e.createElement(x,null);if(t&&t.ok===!1&&t.expired)return e.createElement(x,null);const o=(t==null?void 0:t.store)||{},a=(t==null?void 0:t.sitio)||null,v=!!(a&&(a.logo||a.img_portada||a.titulo_1||a.descripcion)),h=(a==null?void 0:a.img_portada)||n.coverImage,w=(a==null?void 0:a.logo)||n.logoImage,m=(o==null?void 0:o.name)||n.storeName,u=(o==null?void 0:o.phone)||n.phone,E=(o==null?void 0:o.email)||n.email;a!=null&&a.titulo_1||n.titulo_1;const k=(a==null?void 0:a.descripcion)||n.descripcion;return e.createElement(s.Fragment,null,e.createElement(S,{titleTemplate:m,description:k}),e.createElement(C,{visible:v,coverImage:h,logoImage:w,storeName:m,phone:u,email:E}),e.createElement(I,{key:r,storeId:g,storeSlug:r,storeName:m,storePhone:u}),e.createElement(T,{storeName:m}))}export{fe as default};
