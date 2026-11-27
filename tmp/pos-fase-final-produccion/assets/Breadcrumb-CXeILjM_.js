import{r as i,k as m,R as u,L as R,P as p}from"./index-n4c3GYPs.js";import{c as y}from"./index-5HzigljS.js";import{S as D}from"./Storefront-DFs__fsb.js";const O=["xxl","xl","lg","md","sm","xs"],P="xs",h=i.createContext({prefixes:{},breakpoints:O,minBreakpoint:P}),{Consumer:W,Provider:z}=h;function w(e,t){const{prefixes:r}=i.useContext(h);return e||r[t]||t}function v(e){const t=i.useRef(e);return i.useEffect(()=>{t.current=e},[e]),t}function N(e){const t=v(e);return i.useCallback(function(...r){return t.current&&t.current(...r)},[t])}const C=["as","disabled"];function I(e,t){if(e==null)return{};var r={};for(var n in e)if({}.hasOwnProperty.call(e,n)){if(t.indexOf(n)>=0)continue;r[n]=e[n]}return r}function K(e){return!e||e.trim()==="#"}function E({tagName:e,disabled:t,href:r,target:n,rel:o,role:s,onClick:a,tabIndex:l=0,type:d}){e||(r!=null||n!=null||o!=null?e="a":e="button");const b={tagName:e};if(e==="button")return[{type:d||"button",disabled:t},b];const f=c=>{if((t||e==="a"&&K(r))&&c.preventDefault(),t){c.stopPropagation();return}a==null||a(c)},x=c=>{c.key===" "&&(c.preventDefault(),f(c))};return e==="a"&&(r||(r="#"),t&&(r=void 0)),[{role:s??"button",disabled:void 0,tabIndex:t?void 0:l,href:r,target:e==="a"?n:void 0,"aria-disabled":t||void 0,rel:e==="a"?o:void 0,onClick:f,onKeyDown:x},b]}const T=i.forwardRef((e,t)=>{let{as:r,disabled:n}=e,o=I(e,C);const[s,{tagName:a}]=E(Object.assign({tagName:r,disabled:n},o));return m.jsx(a,Object.assign({},o,s,{ref:t}))});T.displayName="Button";const A=["onKeyDown"];function F(e,t){if(e==null)return{};var r={};for(var n in e)if({}.hasOwnProperty.call(e,n)){if(t.indexOf(n)>=0)continue;r[n]=e[n]}return r}function L(e){return!e||e.trim()==="#"}const j=i.forwardRef((e,t)=>{let{onKeyDown:r}=e,n=F(e,A);const[o]=E(Object.assign({tagName:"a"},n)),s=N(a=>{o.onKeyDown(a),r==null||r(a)});return L(n.href)||n.role==="button"?m.jsx("a",Object.assign({ref:t},n,o,{onKeyDown:s})):m.jsx("a",Object.assign({ref:t},n,{onKeyDown:r}))});j.displayName="Anchor";const k=i.forwardRef(({bsPrefix:e,active:t=!1,children:r,className:n,as:o="li",linkAs:s=j,linkProps:a={},href:l,title:d,target:b,...f},x)=>{const c=w(e,"breadcrumb-item");return m.jsx(o,{ref:x,...f,className:y(c,n,{active:t}),"aria-current":t?"page":void 0,children:t?r:m.jsx(s,{...a,href:l,title:d,target:b,children:r})})});k.displayName="BreadcrumbItem";const B=i.forwardRef(({bsPrefix:e,className:t,listProps:r={},children:n,label:o="breadcrumb",as:s="nav",...a},l)=>{const d=w(e,"breadcrumb");return m.jsx(s,{"aria-label":o,className:t,ref:l,...a,children:m.jsx("ol",{...r,className:y(d,r==null?void 0:r.className),children:n})})});B.displayName="Breadcrumb";const g=Object.assign(B,{Item:k}),_=({pages:e})=>u.createElement("div",{className:"breadcrumb-area"},u.createElement("div",{className:"container"},u.createElement(g,{className:"custom-breadcrumb"},e==null?void 0:e.map(({path:t,label:r},n)=>n!==e.length-1?u.createElement(g.Item,{key:r,linkProps:{to:t},linkAs:R},n===0?u.createElement("span",{className:"crumb-home"},u.createElement(D,{fontSize:"small",sx:{mr:.5}}),r):r):u.createElement(g.Item,{key:r,active:!0},r)))),u.createElement("style",null,`
        .breadcrumb-area {
          padding: 10px 0;
          margin-bottom: 22px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(10,12,16,0.92) 0%, rgba(12,14,20,0.92) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 36px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03);
          backdrop-filter: blur(8px);
        }

        .custom-breadcrumb {
          margin: 0;
          padding: 0 8px;
          background: transparent;
        }

        .custom-breadcrumb .breadcrumb-item {
          font-weight: 600;
          font-size: 14px;
          color: rgba(255,255,255,0.72);
          letter-spacing: .3px;
          display: flex;
          align-items: center;
        }

        .custom-breadcrumb .breadcrumb-item a {
          color: #76E0FF; /* cyan */
          text-decoration: none;
          transition: color .2s ease;
          display: flex;
          align-items: center;
        }
        .custom-breadcrumb .breadcrumb-item a:hover {
          color: #7C4DFF; /* morado */
          text-shadow: 0 0 6px rgba(124,77,255,0.45);
        }

        .custom-breadcrumb .breadcrumb-item.active {
          color: #fff;
          font-weight: 800;
        }

        .custom-breadcrumb .breadcrumb-item + .breadcrumb-item::before {
          color: rgba(255,255,255,0.45);
          content: "›"; /* separador moderno */
          font-weight: 700;
        }

        .crumb-home {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `));_.propTypes={pages:p.arrayOf(p.shape({label:p.string.isRequired,path:p.string.isRequired})).isRequired};export{_ as B};
