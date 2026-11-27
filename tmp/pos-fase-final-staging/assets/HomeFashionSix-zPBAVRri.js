import{R as e,u as y,r as s,a as N}from"./index-KOZlewp4.js";import{S}from"./seo-DWisZAHq.js";import{T as x,C as I}from"./TiendaNoDisponible-DeTNgfMO.js";import{B as T}from"./BlogFeatured-DyuvtwAc.js";import"./index.module-DaQ77f4a.js";import"./clsx.m-CH7BE6MN.js";import"./ChevronRight-CfNn6Egi.js";import"./ShareRounded-8n31BH3l.js";import"./StarRounded-C_kROTXr.js";import"./WarehouseRounded-9XSyMzaA.js";import"./TuneRounded-Zj4UJi9J.js";import"./StyleRounded-C-u4My5d.js";import"./TextField-B8llh2qg.js";import"./useFormControl-DXd6uwne.js";import"./isHostComponent-DVu5iVWx.js";import"./Popover-h9IHWpt2.js";import"./List-Dn7O9ofv.js";import"./FormControlLabel-BF-oRsQU.js";import"./Switch-7bd9H_fn.js";import"./SwitchBase-DhukiHwy.js";import"./Alert-m3_5z3dA.js";import"./Pagination-D6Ip_oAC.js";import"./LastPage-CoyFiHhQ.js";import"./MenuItem-DK1o70mi.js";import"./listItemTextClasses-D03Bj_m2.js";import"./Breadcrumb-C7RcBq1r.js";import"./index-CU3VQ1f9.js";import"./Storefront-D3k1g1Qa.js";import"./Search--fj54PFw.js";import"./InputAdornment-CKxWw4xs.js";import"./ListSubheader-ZDM_7Ch2.js";import"./Collapse-Cx_zw2ff.js";import"./ReceiptLong-BrvUE9wi.js";import"./InfoOutlined-DmkqbxgZ.js";import"./ShipmentFields-DHSa_VPl.js";import"./Checkbox-C4MFBpc4.js";import"./shipping-BaK5DG73.js";import"./shippingService-DYE2yOhV.js";import"./index-B5ZfcgPu.js";function C({visible:d=!0,coverImage:g="/assets/img/post/1.png",logoImage:f="/assets/img/logo/logo.png",storeName:r="MiTiendaEnLineaMX",phone:l="+52 55 1234 5678",email:i="contacto@mitiendaenlineamx.com.mx"}){return d?e.createElement("section",{className:"fb-cover-wrap"},e.createElement("div",{className:"fb-cover-bg",style:{backgroundImage:`url('${g}')`},"aria-hidden":"true"}),e.createElement("div",{className:"fb-cover-overlay","aria-hidden":"true"}),e.createElement("div",{className:"fb-profile-row"},e.createElement("div",{className:"fb-avatar-wrap"},e.createElement("img",{src:f,alt:`Logo de ${r}`,className:"fb-avatar"})),e.createElement("div",{className:"fb-info-card"},e.createElement("h1",{className:"fb-title"},r),e.createElement("div",{className:"fb-contact"},l&&e.createElement("a",{className:"fb-chip",href:`tel:${l}`},"📞 ",l),i&&e.createElement("a",{className:"fb-chip",href:`mailto:${i}`},"✉️ ",i)))),e.createElement("style",null,`
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
