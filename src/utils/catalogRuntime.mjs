export function shareIcon(name) { const paths={"whatsapp":"<path d=\"M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l1.8-5.4A8.4 8.4 0 1 1 21 11.5Z\"/><path d=\"M8 7c0 4 3 7 7 7l1-2-3-1-1 1-2-2 1-1-1-2Z\"/>","facebook":"<path d=\"M14 21v-8h3l.5-4H14V7c0-1 .5-1.5 1.5-1.5H18V2h-3c-3 0-5 2-5 5v2H7v4h3v8\"/>","copy":"<rect x=\"8\" y=\"8\" width=\"12\" height=\"13\" rx=\"2\"/><path d=\"M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3\"/>"}; return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name] || paths.copy)+'</svg>'; }
const mounted = new WeakMap();
const money = value => Number(value).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
};

function carrierIdentity(name, logo) {
  const identity=node('div','carrier-identity');
  if(logo){const img=node('img','carrier-logo');img.src=logo;img.alt='Logo de '+name;img.width=96;img.height=56;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.setAttribute('data-carrier-logo','');identity.append(img);}
  identity.append(node('span','carrier',name));return identity;
}
function productCard(product, carrier) {
  const article = node('article','package-card');
  article.dataset.package = `${product.name} ${product.description}`;
  const top = node('div','package-card-top');
  top.append(node('span','package-kind',carrier.kind === 'paquetes' ? 'PAQUETE' : 'RECARGA'),node('span','package-card-dot'));
  article.append(top,carrierIdentity(product.carrier || carrier.name,product.logo || carrier.logo),node('h2','',product.name));
  const price = node('div','price',money(product.price));
  price.append(node('span','currency','MXN'));
  const validity = node('div','validity');
  validity.append(node('span','','Vigencia'),node('strong','',product.validity || 'Consulta con tu proveedor'));
  article.append(price,node('div','package-card-rule'),validity,node('p','summary',product.description || 'Consulta los beneficios con tu proveedor.'));
  const actions = node('div','card-actions');
  if (/^\/paquetes\/[a-z0-9-]+-[0-9]+\/$/.test(product.path || '')) {
    const link = node('a','btn package-card-action','Consultar detalles ↗');
    link.href = product.path;
    actions.append(link);
    const social=node('div','package-share-links');
    social.setAttribute('aria-label','Compartir paquete');
    const url=new URL(product.path,window.location.origin).href;
    for (const [label,href] of [['WhatsApp','https://wa.me/?text='+encodeURIComponent(product.name+' - '+url)],['Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)]]) {
      const a=node('a',label === 'WhatsApp' ? 'share-whatsapp' : 'share-facebook'); a.innerHTML=shareIcon(label === 'WhatsApp' ? 'whatsapp' : 'facebook'); a.append(node('span','',label)); a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; social.append(a);
    }
    const copy=node('button','share-copy'); copy.innerHTML=shareIcon('copy'); copy.append(node('span','','Copiar')); copy.setAttribute('aria-label','Copiar enlace del paquete'); copy.type='button'; copy.dataset.copy=url; social.append(copy);
    const status=node('span','share-status',''); status.setAttribute('data-share-status',''); status.setAttribute('role','status'); social.append(status);
    actions.append(social);
  } else actions.append(node('p','airtime-note','Solicita este monto en tu punto de recarga.'));
  article.append(actions);
  return article;
}

export function mountCatalog(root, { loadCompany } = {}) {
  if (!root) return () => {};
  if (mounted.has(root)) return mounted.get(root);
  const controller = new AbortController();
  const options = { signal:controller.signal };
  let request;
  const dialog = root.querySelector('[data-carrier-dialog]');
  const locationDialog = root.querySelector('[data-location-dialog]');
  const unlock = () => {
    if (!root.querySelector('dialog[open]')) document.documentElement.classList.remove('catalog-modal-open');
  };
  const openDialog = element => {
    if (!element) return;
    if (element.showModal) element.showModal();
    else element.setAttribute('open','');
    document.documentElement.classList.add('catalog-modal-open');
  };
  for (const element of root.querySelectorAll('dialog')) element.addEventListener('close', () => { request?.abort(); unlock(); }, options);
  root.addEventListener('error', event => {
    if (event.target.matches?.('[data-carrier-logo]')) {
      event.target.hidden = true;
      const fallback = event.target.closest('.carrier-tile')?.querySelector('.carrier-fallback');
      if (fallback) fallback.hidden = false;
    }
  }, { ...options, capture:true });
  root.addEventListener('click', async event => {
    const close = event.target.closest?.('[data-dialog-close]');
    if (close) {
      const element = close.closest('dialog');
      if (element.close) element.close(); else { element.removeAttribute('open'); request?.abort(); unlock(); }
      return;
    }
    if (event.target.closest?.('[data-location-open]')) { openDialog(locationDialog); return; }
    const carrierLink = event.target.closest?.('[data-carrier-open]');
    if (carrierLink && dialog?.showModal && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      request?.abort();
      const current = new AbortController(); request = current;
      const abort = () => current.abort(); controller.signal.addEventListener('abort',abort,{once:true});
      const content = dialog.querySelector('[data-carrier-dialog-content]');
      const dialogTitle=dialog.querySelector('#carrier-dialog-title');
      dialogTitle.replaceChildren(node('span','',carrierLink.dataset.name));
      const previewLogo=carrierLink.querySelector('[data-carrier-logo]');
      if(previewLogo && !previewLogo.hidden){const identity=carrierIdentity(carrierLink.dataset.name,previewLogo.getAttribute('src'));dialogTitle.replaceChildren(...identity.childNodes);}

      dialog.querySelector('[data-dialog-kind]').textContent = carrierLink.dataset.kind === 'paquetes' ? 'PAQUETES Y PRECIOS' : 'MONTOS DE RECARGA';
      dialog.querySelector('[data-company-page]').href = carrierLink.href;
      content.replaceChildren(node('p','catalog-loading','Consultando las opciones de esta compañía…'));
      content.setAttribute('aria-busy','true');
      if (!dialog.open) openDialog(dialog);
      try {
        const query = new URLSearchParams({tipo:carrierLink.dataset.kind,compania:carrierLink.dataset.slug});
        let payload;
        if (loadCompany) payload = await loadCompany(carrierLink.dataset.kind,carrierLink.dataset.slug);
        else {
          const response = await fetch(`/catalogo-companias.json?${query}`,{credentials:'omit',cache:'no-cache',headers:{Accept:'application/json'},signal:current.signal});
          if (!response.ok) throw new Error(response.status === 429 ? 'Espera un momento antes de volver a intentarlo.' : 'No pudimos cargar las opciones. Puedes abrir la página completa de la compañía.');
          payload = await response.json();
        }
        if (!Array.isArray(payload.data) || !payload.carrier) throw new Error('No se recibió un catálogo válido.');
        if (current.signal.aborted) return;
        const identity=carrierIdentity(payload.carrier.name,payload.carrier.logo);
        dialogTitle.replaceChildren(...identity.childNodes);
        const grid = node('div','grid company-modal-grid');
        for (const product of payload.data) grid.append(productCard(product,payload.carrier));
        content.replaceChildren(grid);
        if (!payload.data.length) content.append(node('p','note','No hay opciones disponibles por el momento.'));
      } catch (error) {
        if (error.name !== 'AbortError' && !current.signal.aborted) content.replaceChildren(node('p','catalog-error',error.message || 'No se pudo cargar el catálogo.'));
      } finally {
        controller.signal.removeEventListener('abort',abort);
        if (request === current) content.removeAttribute('aria-busy');
      }
      return;
    }
    const copy=event.target.closest?.('[data-copy]');
    if(copy){
      const status=copy.closest('.package-share-links')?.querySelector('[data-share-status]');
      try {await navigator.clipboard.writeText(new URL(copy.dataset.copy,window.location.origin).href); if(status) status.textContent='Enlace copiado.';}
      catch {if(status) status.textContent='Copia este enlace: '+new URL(copy.dataset.copy,window.location.origin).href;}
      return;
    }
    const share = event.target.closest?.('[data-share]');
    if (share && !share.disabled) {
      const status = root.querySelector('[data-share-status]');
      share.disabled = true;
      try {
        if (navigator.share) await navigator.share({title:share.dataset.title,url:share.dataset.share});
        else { await navigator.clipboard.writeText(share.dataset.share); if (status) status.textContent = 'Enlace copiado. Ya puedes compartirlo.'; }
      } catch (error) {
        if (error.name !== 'AbortError' && status) status.textContent = 'Usa WhatsApp o copia la dirección de esta página.';
      } finally { share.disabled = false; }
    }
  }, options);
  const companySearch = root.querySelector('[data-package-search]');
  companySearch?.addEventListener('input', () => {
    let count = 0;
    for (const card of root.querySelectorAll('[data-package]')) {
      card.hidden = !normalize(card.dataset.package).includes(normalize(companySearch.value.trim()));
      if (!card.hidden) count++;
    }
    root.querySelector('[data-result-count]').textContent = `${count} opciones disponibles`;
  }, options);
  const carrierSearch = root.querySelector('[data-carrier-search]');
  carrierSearch?.addEventListener('input', () => {
    let count = 0;
    for (const tile of root.querySelectorAll('[data-carrier-open]')) {
      tile.hidden = !normalize(tile.dataset.name).includes(normalize(carrierSearch.value.trim()));
      if (!tile.hidden) count++;
    }
    root.querySelector('[data-carrier-count]').textContent = `${count} compañías disponibles`;
    root.querySelector('[data-carrier-empty]').hidden = count !== 0;
  }, options);
  const timers = [];
  for (const track of root.querySelectorAll('[data-carrier-track]')) {
    const section = track.closest('.carrier-section');
    const advance = direction => {
      if (track.scrollWidth <= track.clientWidth) return;
      const first = [...track.children].find(child => !child.hidden);
      const step = (first?.getBoundingClientRect().width || 160) + 18;
      const end = track.scrollWidth - track.clientWidth;
      const target = direction > 0 && track.scrollLeft >= end-4 ? 0 : Math.max(0,Math.min(end,track.scrollLeft + step*direction));
      track.scrollTo({left:target,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    };
    section.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>advance(-1),options);
    section.querySelector('[data-carousel-next]')?.addEventListener('click',()=>advance(1),options);
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) timers.push(setInterval(() => {
      if (!document.hidden && !root.querySelector('dialog[open]') && !section.matches(':hover') && !section.contains(document.activeElement) && !carrierSearch?.value) advance(1);
    },5000));
  }
  const cleanup = () => {
    controller.abort(); request?.abort(); timers.forEach(clearInterval);
    document.documentElement.classList.remove('catalog-modal-open'); mounted.delete(root);
  };
  mounted.set(root,cleanup);
  return cleanup;
}
if (typeof document !== 'undefined') document.querySelectorAll('.m-packages').forEach(mountCatalog);
