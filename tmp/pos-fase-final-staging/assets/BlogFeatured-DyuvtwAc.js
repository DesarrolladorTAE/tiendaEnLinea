import{r as c,R as e,B as a,M as h,I as x,C as y,P as r}from"./index-KOZlewp4.js";import{S as w}from"./index-B5ZfcgPu.js";const E=({images:n=[],storeName:p=""})=>{const[o,d]=c.useState(null),l=c.useRef(0),i=n&&n.length>0,m=c.useMemo(()=>{if(!i)return"Conoce más sobre los productos de TAE";const t=(p||"").trim();return t?`Conoce más sobre ${t}`:"Conoce más"},[p,i]),b={dots:!1,arrows:!1,infinite:!0,autoplay:!0,autoplaySpeed:0,speed:5e3,cssEase:"linear",slidesToShow:4,slidesToScroll:1,pauseOnHover:!1,responsive:[{breakpoint:1200,settings:{slidesToShow:4}},{breakpoint:992,settings:{slidesToShow:3}},{breakpoint:768,settings:{slidesToShow:2}},{breakpoint:576,settings:{slidesToShow:1}}]},f=i?n:[{src:"/assets/img/post/1.png"},{src:"/assets/img/post/2.png"},{src:"/assets/img/post/3.png"},{src:"/assets/img/post/4.png"},{src:"/assets/img/post/5.png"},{src:"/assets/img/post/6.png"},{src:"/assets/img/post/7.png"},{src:"/assets/img/post/8.png"}],u=t=>{l.current=window.scrollY||window.pageYOffset||0;const s=document.body;s.style.position="fixed",s.style.top=`-${l.current}px`,s.style.left="0",s.style.right="0",s.style.width="100%",s.style.overflow="hidden",d(t)},g=()=>{const t=document.body;t.style.position="",t.style.top="",t.style.left="",t.style.right="",t.style.width="",t.style.overflow="",window.scrollTo(0,l.current),d(null)};return e.createElement(a,{sx:{py:8}},e.createElement("style",null,v),e.createElement("div",{className:"container"},e.createElement("div",{className:"b2-header"},e.createElement("h3",{className:"b2-title"},m),e.createElement("div",{className:"b2-legend"},"Galería")),e.createElement(w,{...b},f.map((t,s)=>e.createElement(a,{key:s,px:1},e.createElement("button",{type:"button",className:"b2-card-btn",onClick:()=>u(t),title:"Ver grande"},e.createElement("div",{className:"b2-card"},e.createElement("img",{src:t.src,alt:`Imagen ${s+1}`,loading:"lazy"})))))),e.createElement(h,{open:!!o,onClose:g,disableScrollLock:!0,sx:{display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)"}},e.createElement(a,{sx:{position:"relative",bgcolor:"#0f0f0f",borderRadius:2,maxWidth:"96vw",maxHeight:"92vh",p:2,outline:"none",boxShadow:24}},e.createElement(x,{onClick:g,"aria-label":"Cerrar",sx:{position:"absolute",top:8,right:8,color:"#fff",bgcolor:"rgba(255,255,255,.12)",zIndex:2,"&:hover":{bgcolor:"rgba(255,255,255,.18)"}}},e.createElement(y,null)),e.createElement(a,{component:"img",src:o==null?void 0:o.src,alt:"Imagen ampliada",sx:{width:"100%",height:"auto",maxHeight:"75vh",objectFit:"contain",borderRadius:1,boxShadow:"0 20px 60px rgba(0,0,0,.35)"}})))))},v=`
.b2-header{
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;
}
.b2-title{ margin:0; font-weight:800; letter-spacing:.2px; }
.b2-legend{ font-size:.9rem; opacity:.7 }
.b2-card-btn{
  width:100%; border:none; background:transparent; padding:0; cursor:pointer; text-align:initial;
}
.b2-card{
  border-radius:16px; overflow:hidden; background:#fff;
  box-shadow: 0 10px 25px rgba(0,0,0,.06);
  transition: transform .25s ease, box-shadow .25s ease;
  aspect-ratio: 16 / 10;
  display:flex; align-items:center; justify-content:center;
}
.b2-card:hover{ transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0,0,0,.10); }
.b2-card img{ width:100%; height:100%; object-fit:cover; }
`;E.propTypes={images:r.arrayOf(r.shape({src:r.string.isRequired})),storeName:r.string};export{E as B};
