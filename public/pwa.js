(() => {
  let promptEvent=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const sync=()=>document.querySelectorAll('[data-pwa-install]').forEach(button=>button.hidden=!promptEvent || standalone());
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;sync();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;sync();});
  document.addEventListener('DOMContentLoaded',sync);
  new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',async event=>{
    const button=event.target.closest?.('[data-pwa-install]');
    if(!button || !promptEvent || button.disabled)return;
    const current=promptEvent;promptEvent=null;button.disabled=true;
    try {await current.prompt();await current.userChoice;}catch(error){console.warn('No se pudo abrir la instalacion.',error);}
    finally {button.disabled=false;sync();}
  });
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')){
    const register=()=>navigator.serviceWorker.register('/sw.js').catch(error=>console.warn('No se pudo activar la aplicacion.',error));
    if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
  }
})();
