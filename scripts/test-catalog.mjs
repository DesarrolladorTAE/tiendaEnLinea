import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import jsdom from 'jsdom';
import {publicCarrier,publicPackage,fetchPublicCarriers,fetchCarrierProducts} from '../src/utils/publicSeo.mjs';

const packageCarrier = publicCarrier({Nombre:'Paquetes BAIT',Categoria:'Paquetes',Logotipo:'https://example.invalid/bait.png'});
const airtimeCarrier = publicCarrier({Nombre:'Telcel',Categoria:'Tiempo Aire',Logotipo:'https://example.invalid/telcel.png'});
assert.equal(publicCarrier({Nombre:'Otro',Categoria:'Servicios'}),null);
const packageProduct = publicPackage({proID:1,Nombre:'Internet',Monto:100,Descripcion:'5 GB',Vigencia:'7 días'}, {Nombre:'Paquetes BAIT',Categoria:'Paquetes'});
const airtimeProduct = publicPackage({proID:2,Nombre:'EMPTY',Monto:20},{Nombre:'Telcel',Categoria:'Tiempo Aire'});
assert.equal(airtimeProduct.path,'');
assert.equal(airtimeProduct.name,'Recarga $20.00');
const apiCalls=[];
const fakeApi = async (url,options) => {
  apiCalls.push({url,options});
  return {ok:true,json:async()=>url.endsWith('/carriers') ? [{Nombre:'Telcel',Categoria:'Tiempo Aire'}] : [{Carrier:'Telcel',proID:2,Nombre:'EMPTY',Monto:20}]};
};
await fetchPublicCarriers('https://example.invalid/api',fakeApi);
assert.equal(apiCalls.length,1); // Primer nivel: no descarga montos de todas las compañías.
await fetchCarrierProducts(airtimeCarrier,'https://example.invalid/api',fakeApi);
assert.equal(apiCalls.length,2);
assert(apiCalls.every(call=>call.options.credentials==='omit' && !call.options.headers.Authorization));

const dom = new jsdom.JSDOM(`<div class="m-packages">
<input data-carrier-search><span data-carrier-count></span><p data-carrier-empty hidden></p>
<section class="carrier-section"><button data-carousel-prev>Anterior</button><button data-carousel-next>Siguiente</button><div data-carrier-track>
<a class="carrier-tile" href="${packageCarrier.path}" data-carrier-open data-kind="paquetes" data-slug="paquetes-bait" data-name="Paquetes BAIT"><img data-carrier-logo><span class="carrier-fallback" hidden>BAIT</span></a>
<a href="${airtimeCarrier.path}" data-carrier-open data-kind="recargas" data-slug="telcel" data-name="Telcel">Telcel</a>
</div></section>
<dialog data-carrier-dialog><h2 id="carrier-dialog-title"></h2><span data-dialog-kind></span><button data-dialog-close>Cerrar</button><div data-carrier-dialog-content></div><a data-company-page></a></dialog>
<button data-location-open>Ubicar</button><dialog data-location-dialog><button data-dialog-close>Cerrar</button><p>Búsqueda general de Maps</p></dialog>
<button data-share="https://example.com${packageProduct.path}" data-title="Internet">Compartir</button><span data-share-status></span>
</div>`,{url:'https://example.com/paquetes/',pretendToBeVisual:true});
const original=Object.fromEntries(['document','window','fetch','navigator'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
globalThis.document=dom.window.document; globalThis.window=dom.window;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async value=>{copied=value;}}}});
if (!window.Element.prototype.replaceChildren) window.Element.prototype.replaceChildren=function(...children){this.textContent='';for(const child of children)this.appendChild(child);};
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.showModal=function(){this.open=true;this.setAttribute('open','');};
  dialog.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
}
let copied=''; let nextStatus=200; const requests=[];
globalThis.fetch=async(url,options)=>{
  requests.push({url,options});
  const recargas=url.includes('tipo=recargas');
  return {ok:nextStatus===200,status:nextStatus,json:async()=>({carrier:recargas?airtimeCarrier:packageCarrier,data:[recargas?airtimeProduct:packageProduct]})};
};
const root=document.querySelector('.m-packages'); let dispose;
try {
  const module=await import('data:text/javascript;base64,'+Buffer.from(await fs.readFile('src/utils/catalogRuntime.mjs','utf8')).toString('base64'));
  dispose=module.mountCatalog(root);
  const links=[...root.querySelectorAll('[data-carrier-open]')];
  const click=element=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
  click(links[0]); await delay(0);
  const dialog=root.querySelector('[data-carrier-dialog]');
  assert(dialog.open);
  assert.equal(requests.length,1);
  assert(requests[0].url.includes('compania=paquetes-bait'));
  assert.equal(requests[0].options.credentials,'omit');
  assert(dialog.textContent.includes('$100.00'));
  assert(dialog.querySelector(`a[href="${packageProduct.path}"]`));
  click(dialog.querySelector('[data-dialog-close]')); assert(!dialog.open);
  click(links[1]); await delay(0);
  assert(dialog.textContent.includes('$20.00'));
  assert(!dialog.querySelector('.package-card-action'));
  assert(!dialog.querySelector('[data-share]'));
  assert.equal(new URL(dialog.querySelector('[data-company-page]').href).pathname,airtimeCarrier.path);
  dialog.close();
  const search=root.querySelector('[data-carrier-search]'); search.value='telcel';search.dispatchEvent(new window.Event('input'));
  assert(links[0].hidden); assert(!links[1].hidden); assert(root.querySelector('[data-carrier-count]').textContent.includes('1'));
  click(root.querySelector('[data-location-open]'));
  assert(root.querySelector('[data-location-dialog]').open);
  click(root.querySelector('[data-location-dialog] [data-dialog-close]'));
  assert(!document.documentElement.classList.contains('catalog-modal-open'));
  click(root.querySelector('[data-share]'));await delay(0);assert.equal(copied,'https://example.com'+packageProduct.path);
  nextStatus=429;click(links[0]);await delay(0);assert(dialog.textContent.includes('Espera un momento'));
  dialog.close();
  const image=links[0].querySelector('img');image.dispatchEvent(new window.Event('error'));
  assert(image.hidden);assert(!links[0].querySelector('.carrier-fallback').hidden);
  console.log('PASS: selección de compañía, modal, montos separados, enlace a ficha sólo para paquetes, búsqueda, ubicación, compartir, 429 y logos alternativos.');
} finally {
  dispose?.();
  for (const [key,descriptor] of Object.entries(original)) { if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]; }
  dom.window.close();
}
