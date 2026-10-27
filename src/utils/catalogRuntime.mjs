const mounted = new WeakMap();
const money = value => Number(value).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
};

function productCard(product, carrier) {
  const article = node('article','package-card');
  article.dataset.package = `${product.name} ${product.description}`;
  const top = node('div','package-card-top');
  top.append(node('span','package-kind',carrier.kind === 'paquetes' ? 'PAQUETE' : 'RECARGA'),node('span','package-card-dot'));
  article.append(top,node('h2','',product.name));
  const price = node('div','price',money(product.price));
  price.append(node('span','currency','MXN'));
  const validity = node('div','validity');
  validity.append(node('span','','Vigencia'),node('strong','',product.validity || 'Consulta con tu proveedor'));
  article.append(price,node('div','package-card-rule'),validity,node('p','summary',product.description || 'Consulta los beneficios con tu proveedor.'));
  const actions = node('div','card-actions');
  if (carrier.kind === 'paquetes' && /^\/paquetes\/[a-z0-9-]+-[0-9]+\/$/.test(product.path || '')) {
    const link = node('a','btn package-card-action','Ver ficha completa ↗');
    link.href = product.path;
    actions.append(link);
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
      dialog.querySelector('#carrier-dialog-title').textContent = carrierLink.dataset.name;
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
