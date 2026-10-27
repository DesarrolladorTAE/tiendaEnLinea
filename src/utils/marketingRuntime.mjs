const mounted = new WeakMap();
const legacySections = { '#home':'/', '#features':'/servicios', '#about':'/como-funciona', '#pricing':'/paquetes/', '#testimonials':'/nosotros', '#faqs':'/preguntas-frecuentes', '#contact':'/contacto' };

export function mountMarketing(root) {
  if (!root) return () => {};
  if (mounted.has(root)) return mounted.get(root);
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const menu = root.querySelector('.m-menu');
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  }, options);
  document.addEventListener('click', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; }, options);
  const form = root.querySelector('[data-contact-form]');
  let sending = false;
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const data = new FormData(form);
    const fields = Object.fromEntries(['nombre','email','telefono','mensaje'].map(key => [key, String(data.get(key) || '').trim()]));
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('button[type=submit]');
    const label = form.querySelector('[data-submit-label]');
    sending = true; button.disabled = true; label.textContent = 'Enviando…';
    form.setAttribute('aria-busy','true'); status.textContent = ''; delete status.dataset.state;
    try {
      const response = await fetch('/api/contacto', { method:'POST', headers:{ Accept:'application/json', 'Content-Type':'application/json' }, credentials:'omit', body:JSON.stringify(fields), signal:controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const problem = message => Object.assign(new Error(message), { publicMessage:true });
        if (response.status === 422) throw problem(Object.values(payload.errors || {}).flat().join(' ') || 'Revisa tus datos e inténtalo nuevamente.');
        if (response.status === 429) throw problem('Espera un momento antes de volver a enviar tu mensaje.');
        throw problem('No pudimos enviar tu mensaje. Inténtalo de nuevo o contáctanos por WhatsApp.');
      }
      status.dataset.state = 'success'; status.textContent = 'Mensaje enviado. Gracias por escribirnos; daremos seguimiento a tu consulta.';
      form.reset();
    } catch (error) {
      if (error.name !== 'AbortError') { status.dataset.state = 'error'; status.textContent = error.publicMessage ? error.message : 'No pudimos conectar con el servicio. Inténtalo de nuevo o escríbenos por WhatsApp.'; }
    } finally {
      sending = false;
      if (!controller.signal.aborted) { button.disabled = false; label.textContent = 'Enviar mensaje'; form.removeAttribute('aria-busy'); }
    }
  }, options);
  const cleanup = () => { controller.abort(); mounted.delete(root); };
  mounted.set(root, cleanup);
  return cleanup;
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-marketing]').forEach(mountMarketing);
  if (location.pathname === '/' && location.hash in legacySections && legacySections[location.hash] !== '/') location.replace(legacySections[location.hash]);
}
